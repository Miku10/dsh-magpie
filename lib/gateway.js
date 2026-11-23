import { createServer } from 'node:http'
import { createMasker } from './mask.js'
import { detectProtocol, toCanonical, replyTo } from './translate.js'
import { resolveTarget, fallbackChain } from './route.js'
import { complete } from './upstream.js'
import { runHook, compileMiddleware } from './middleware.js'
import { webSearch, webFetch } from './search.js'
import { generateImage, generateVideo } from './media.js'
import { estimateCost } from './presets.js'
import { corsHeaders, errorBody, id, now, readBody, sendJson, sendText, sseEncode, textOf, safeJson } from './util.js'

/**
 * Local gateway. Speaks OpenAI Chat, OpenAI Responses, Anthropic Messages,
 * and Gemini on one port, translates between them, and fails over inside a
 * routing group without the agent seeing the error.
 */

export function startGateway({ store, host, port, api, onListen }) {
  const active = new Map()
  const server = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, corsHeaders)
        res.end()
        return
      }
      const url = new URL(req.url, `http://${host}:${port}`)
      if (req.method === 'GET' && (url.pathname === '/v1/models' || url.pathname === '/models')) { sendJson(res, 200, modelList(store.get())); return }
      if (req.method === 'GET' && url.pathname.startsWith('/v1/models/')) { sendJson(res, 200, oneModel(store.get(), decodeURIComponent(url.pathname.split('/').pop()))); return }
      if (req.method === 'GET' && url.pathname === '/v1/magpie/health') { sendJson(res, 200, { ok: true, active: active.size }); return }
      if (req.method === 'GET' && url.pathname === '/v1/magpie/snapshot') { sendJson(res, 200, await api.call('snapshot')); return }
      if (req.method === 'POST' && url.pathname === '/v1/magpie/call') {
        const body = safeJson((await readBody(req)).toString('utf8'), {})
        try { sendJson(res, 200, { ok: true, value: await api.call(String(body.action ?? 'snapshot'), body.payload ?? {}) }) }
        catch (err) { sendJson(res, err.status || 400, { ok: false, error: { message: err.message } }) }
        return
      }
      if (req.method === 'GET' && url.pathname === '/v1/magpie/quotas') { sendJson(res, 200, quotas(store.get())); return }
      if (req.method === 'GET' && url.pathname === '/v1/magpie/accounts') { sendJson(res, 200, accounts(store.get())); return }
      if (req.method === 'GET' && url.pathname === '/v1/magpie/concurrency') { sendJson(res, 200, { active: [...active.values()] }); return }
      if (url.pathname === '/v1/magpie/mcp') { await mcp(req, res, store); return }
      if (req.method === 'POST' && (url.pathname === '/v1/images/generations')) { await images(req, res, store); return }
      if (req.method === 'POST' && url.pathname === '/v1/videos') { await videos(req, res, store); return }
      if (req.method !== 'POST') { sendJson(res, 404, errorBody('not found', 'not_found', 404).body); return }
      await chat(req, res, url, store, active)
    } catch (err) {
      if (!res.headersSent) sendJson(res, err.status || 500, { error: { message: err.message, type: 'server_error' } })
    }
  })
  server.listen(port, host, () => onListen?.({ host, port }))
  return {
    server,
    close: () => new Promise((resolve) => server.close(resolve)),
    address: () => server.address(),
  }
}

function modelList(state) {
  const data = []
  for (const p of state.providers.filter((x) => !x.disabled)) {
    for (const m of p.models ?? []) {
      const mid = m.id ?? m
      if (hidden(state, mid, p.id)) continue
      data.push({ id: `${p.id}/${mid}`, object: 'model', owned_by: p.id, context_window: m.context ?? null })
      data.push({ id: mid, object: 'model', owned_by: p.id })
    }
  }
  for (const g of state.groups.filter((x) => !x.disabled)) {
    data.push({ id: `group/${g.id}`, object: 'model', owned_by: 'magpie' })
    data.push({ id: g.id, object: 'model', owned_by: 'magpie' })
  }
  return { object: 'list', data }
}

function oneModel(state, modelId) {
  const list = modelList(state).data
  return list.find((m) => m.id === modelId) ?? { id: modelId, object: 'model', owned_by: 'magpie' }
}

function hidden(state, modelId, providerId) {
  return Object.values(state.hidden ?? {}).some((list) => list?.includes(`${providerId}/${modelId}`) || list?.includes(modelId))
}

function quotas(state) {
  return { accounts: state.accounts.map((a) => ({ id: a.id, providerId: a.providerId, name: a.name, quota: a.quota })) }
}

function accounts(state) {
  return { accounts: state.accounts.map((a) => ({ id: a.id, providerId: a.providerId, name: a.name, kind: a.kind, disabled: a.disabled })) }
}

async function chat(req, res, url, store, active) {
  const state = store.get()
  const gate = gateKey(state, req)
  if (!gate.ok) { sendJson(res, 401, { error: { message: gate.message, type: 'auth_error' } }); return }
  if (gate.cap && capExceeded(state, gate.client)) { sendJson(res, 429, { error: { message: 'client cap reached', type: 'rate_limit' } }); return }
  const raw = (await readBody(req)).toString('utf8')
  let body = safeJson(raw, null)
  if (!body) { sendJson(res, 400, errorBody('invalid json').body); return }
  const protocol = detectProtocol(url.pathname, body)
  const hooks = liveHooks(state)
  const hooked = await runHook(hooks, 'onRequest', body, { protocol, path: url.pathname })
  if (hooked.rejected) { sendJson(res, hooked.status, errorBody(hooked.message, 'rejected', hooked.status).body); return }
  body = hooked.value
  const masking = state.masking
  let masker = null
  if (masking.enabled) {
    masker = createMasker(masking)
    const redacted = masker.redact(body)
    if (masking.mode === 'block' && redacted.hits.length) { sendJson(res, 403, errorBody('blocked by masking policy', 'blocked', 403).body); return }
    if (!masker && masking.enabled) { sendJson(res, 503, errorBody('masking failed closed', 'masking', 503).body); return }
    body = redacted.value
    if (redacted.hits.length) {
      await store.update((s) => { s.masks.push({ at: now(), model: body.model, hits: redacted.hits.map(({ type, length, prefix, token }) => ({ type, length, prefix, token })), mode: masking.mode }); s.masks = s.masks.slice(-1000) })
    }
  }
  const canonical = toCanonical(protocol, body)
  const sessionKey = req.headers['x-magpie-session'] || hashSession(canonical)
  let target = resolveTarget(state, canonical.model, sessionKey)
  if (canonical.model?.startsWith('group/') && state.groups.find((g) => `group/${g.id}` === canonical.model && g.intent)) {
    const text = canonical.messages.filter((m) => m.role === 'user').map((m) => m.content).pop()
    const group = state.groups.find((g) => `group/${g.id}` === canonical.model)
    const decision = routeByIntent(group, classify(text))
    if (decision.member) target = resolveTarget(state, decision.member.ref, sessionKey) ?? target
    await store.update((s) => { s.decisions.unshift({ at: now(), groupId: group.id, reason: decision.reason, member: decision.member?.ref }); s.decisions = s.decisions.slice(0, 200) })
  }
  if (!target) { sendJson(res, 404, errorBody(`unknown model ${canonical.model}`, 'model_not_found', 404).body); return }
  const chain = fallbackChain(state, target)
  const callId = id('call')
  active.set(callId, { model: canonical.model, at: now(), protocol })
  let lastError = null
  try {
    for (const hop of chain) {
      try {
        const provider = withAccount(state, hop.provider)
        const result = await complete(provider, { ...canonical, modelId: hop.modelId, stream: !!canonical.stream }, req.signal ?? undefined)
        await rememberSession(store, sessionKey, hop)
        if (!result.stream) {
          let reply = result.reply
          if (masker) reply = { ...reply, text: masker.restore(reply.text), reasoning: masker.restore(reply.reasoning), toolCalls: reply.toolCalls.map((t) => ({ ...t, arguments: masker.restore(t.arguments) })) }
          const finished = await runHook(hooks, 'onResponse', reply, { protocol })
          reply = finished.value ?? reply
          await record(store, { model: `${hop.provider.id}/${hop.modelId}`, member: hop.member, usage: reply.usage, agentId: gate.client?.name, protocol })
          sendJson(res, 200, replyTo(protocol, { ...reply, model: canonical.model }, callId))
          return
        }
        await streamOut(res, protocol, result.events, canonical, masker, hooks, store, hop, gate, callId)
        return
      } catch (err) {
        lastError = err
        if (err.status && err.status < 500 && err.status !== 429) break
      }
    }
    sendJson(res, lastError?.status || 502, errorBody(lastError?.message || 'no upstream answered', 'upstream', lastError?.status || 502).body)
  } finally {
    active.delete(callId)
  }
}

async function streamOut(res, protocol, events, canonical, masker, hooks, store, hop, gate, callId) {
  res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache', connection: 'keep-alive', 'access-control-allow-origin': '*' })
  let reply = null
  for await (const ev of events) {
    const shown = masker && ev.text ? { ...ev, text: masker.restore(ev.text) } : ev
    await runHook(hooks, 'onEvent', shown, { protocol })
    if (ev.type === 'done') reply = ev.reply
    else res.write(sseEncode(null, wireDelta(protocol, shown, canonical.model, callId)))
  }
  if (reply) await record(store, { model: `${hop.provider.id}/${hop.modelId}`, member: hop.member, usage: reply.usage, agentId: gate.client?.name, protocol })
  res.write('data: [DONE]\n\n')
  res.end()
}

function wireDelta(protocol, ev, model, callId) {
  if (protocol === 'anthropic') {
    if (ev.type === 'text') return { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: ev.text } }
    if (ev.type === 'reasoning') return { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: ev.text } }
    return { type: 'ping' }
  }
  return { id: `chatcmpl-${callId}`, object: 'chat.completion.chunk', model, choices: [{ index: 0, delta: ev.type === 'reasoning' ? { reasoning_content: ev.text } : ev.type === 'tool' ? { tool_calls: [{ index: 0, id: ev.tool.id, function: { name: ev.tool.name, arguments: ev.tool.arguments } }] } : { content: ev.text }, finish_reason: null }] }
}

function withAccount(state, provider) {
  const accounts = state.accounts.filter((a) => a.providerId === provider.id && !a.disabled && (a.cooldownUntil ?? 0) < Date.now())
  if (!accounts.length) return provider
  const account = [...accounts].sort((a, b) => (a.quota?.remaining ?? 1) - (b.quota?.remaining ?? 0))[0] ?? accounts[0]
  return { ...provider, apiKey: account.token || provider.apiKey, accountId: account.id }
}

function gateKey(state, req) {
  const header = req.headers.authorization || req.headers['x-api-key'] || ''
  const token = String(header).replace(/^Bearer\s+/i, '')
  if (!token || token === 'magpie') return { ok: true, client: null }
  const client = state.gatewayKeys.find((k) => k.token === token) || state.clients.find((c) => c.token === token)
  if (!client) return { ok: false, message: 'unknown gateway key' }
  return { ok: true, client, cap: client.caps }
}

function capExceeded(state, client) {
  if (!client?.caps) return false
  const since = Date.now() - windowMs(client.caps.window || 'day')
  const rows = state.usage.filter((u) => u.agentId === client.name && Date.parse(u.at) >= since)
  const tokens = rows.reduce((s, u) => s + (u.cost?.input ?? 0) + (u.cost?.output ?? 0), 0)
  const usd = rows.reduce((s, u) => s + (u.cost?.usd ?? 0), 0)
  if (client.caps.tokens && tokens >= client.caps.tokens) return true
  if (client.caps.usd && usd >= client.caps.usd) return true
  return false
}

function windowMs(window) {
  if (window === 'week') return 7 * 86400_000
  if (window === 'month') return 30 * 86400_000
  return 86400_000
}

function hashSession(canonical) {
  return textOf(canonical.messages?.[0]?.content).slice(0, 80)
}

async function rememberSession(store, key, hop) {
  if (!key) return
  await store.update((s) => {
    const row = s.sessions.find((x) => x.key === key)
    if (row) { row.member = hop.member; row.model = `${hop.provider.id}/${hop.modelId}`; row.at = now() }
    else s.sessions.push({ key, member: hop.member, model: `${hop.provider.id}/${hop.modelId}`, at: now(), title: key.slice(0, 48) })
    s.sessions = s.sessions.slice(-500)
  })
}

async function record(store, row) {
  await store.update((s) => {
    const cost = estimateCost(row.model, row.usage, s.prices)
    s.usage.push({ ...row, cost, at: now() })
    if (s.usage.length > 5000) s.usage = s.usage.slice(-5000)
  })
}

function liveHooks(state) {
  return (state.middleware ?? []).filter((m) => m.enabled !== false).map((m) => {
    try { return compileMiddleware(m.source, m.id) } catch { return null }
  }).filter(Boolean)
}

async function images(req, res, store) {
  const body = safeJson((await readBody(req)).toString('utf8'), {})
  try { sendJson(res, 200, await generateImage(store.get(), body.prompt, body)) }
  catch (err) { sendJson(res, err.status || 502, errorBody(err.message, 'image', err.status || 502).body) }
}

async function videos(req, res, store) {
  const body = safeJson((await readBody(req)).toString('utf8'), {})
  try { sendJson(res, 200, await generateVideo(store.get(), body.prompt, body)) }
  catch (err) { sendJson(res, err.status || 502, errorBody(err.message, 'video', err.status || 502).body) }
}

async function mcp(req, res, store) {
  const body = safeJson((await readBody(req)).toString('utf8'), {})
  const tools = [
    { name: 'web_search', description: 'Search the web with the providers configured in Magpie.', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    { name: 'web_fetch', description: 'Fetch a URL and return readable text.', inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] } },
    { name: 'generate_image', description: 'Generate an image with the selected image model.', inputSchema: { type: 'object', properties: { prompt: { type: 'string' } }, required: ['prompt'] } },
  ]
  if (body.method === 'tools/list' || body.method === 'initialize') {
    sendJson(res, 200, { jsonrpc: '2.0', id: body.id ?? null, result: body.method === 'initialize' ? { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'magpie', version: '1.0.0' } } : { tools } })
    return
  }
  if (body.method === 'tools/call') {
    const name = body.params?.name
    const args = body.params?.arguments ?? {}
    let text = ''
    if (name === 'web_search') text = JSON.stringify(await webSearch(store.get(), args.query))
    else if (name === 'web_fetch') text = JSON.stringify(await webFetch(args.url))
    else if (name === 'generate_image') text = JSON.stringify(await generateImage(store.get(), args.prompt, args))
    else { sendJson(res, 200, { jsonrpc: '2.0', id: body.id, error: { code: -32601, message: 'unknown tool' } }); return }
    sendJson(res, 200, { jsonrpc: '2.0', id: body.id, result: { content: [{ type: 'text', text }] } })
    return
  }
  sendJson(res, 200, { jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'unknown method' } })
}
