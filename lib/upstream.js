import { presetById } from './presets.js'
import { fromCanonical } from './translate.js'
import { id as newId } from './util.js'

/**
 * One upstream call. Protocol, auth header, proxy, and body shape come from
 * the provider. Streaming is parsed into canonical text/reasoning/tool deltas.
 */

export async function listModels(provider, signal) {
  if (provider.models?.length && provider.modelsManual) return provider.models
  const preset = presetById(provider.preset) ?? {}
  const base = (provider.baseURL || preset.baseURL || '').replace(/\/$/, '')
  if (!base) return provider.models ?? []
  const path = provider.modelsPath || preset.modelsPath || '/models'
  const url = new URL(path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`)
  const headers = authHeaders(provider, preset)
  if ((provider.protocol || preset.protocol) === 'gemini' && provider.apiKey) url.searchParams.set('key', provider.apiKey)
  const res = await fetch(url, { headers, signal, dispatcher: undefined })
  if (!res.ok) {
    const err = new Error(`model list ${res.status}`)
    err.status = res.status
    throw err
  }
  const json = await res.json()
  const raw = json.data ?? json.models ?? json.list ?? []
  return raw.map((m) => ({
    id: m.id ?? String(m.name ?? '').replace(/^models\//, ''),
    name: m.display_name ?? m.name ?? m.id,
    context: m.context_window ?? m.contextWindow ?? null,
    reasoning: !!(m.reasoning || /reason|think|r1|pro/i.test(m.id ?? '')),
  })).filter((m) => m.id)
}

export function authHeaders(provider, preset = {}) {
  const headers = { 'content-type': 'application/json', 'user-agent': 'dsh-magpie' }
  const auth = provider.auth || preset.auth || 'bearer'
  const key = provider.apiKey || ''
  if (auth === 'x-api-key') {
    headers['x-api-key'] = key
    headers['anthropic-version'] = '2023-06-01'
  } else if (auth === 'bearer' && key) headers.authorization = `Bearer ${key}`
  else if (auth === 'header' && provider.headerName) headers[provider.headerName] = key
  for (const [k, v] of Object.entries(provider.headers ?? {})) headers[k] = v
  return headers
}

export async function complete(provider, canonical, signal) {
  const preset = presetById(provider.preset) ?? {}
  const protocol = provider.protocol || preset.protocol || 'openai-chat'
  const base = (provider.baseURL || preset.baseURL || '').replace(/\/$/, '')
  if (!base && !provider.fetch) throw Object.assign(new Error('provider has no base URL'), { status: 400 })
  const body = fromCanonical(protocol, { ...canonical, upstreamModel: canonical.modelId })
  const path = protocol === 'anthropic' ? '/v1/messages' : protocol === 'openai-responses' ? '/responses' : protocol === 'gemini' ? `/models/${canonical.modelId}:streamGenerateContent?alt=sse` : '/chat/completions'
  const url = provider.fetch ? null : join(base, path, protocol)
  const headers = authHeaders(provider, preset)
  if (protocol === 'gemini' && provider.apiKey) {
    const u = new URL(url)
    u.searchParams.set('key', provider.apiKey)
    return readUpstream(await fetch(u, { method: 'POST', headers, body: JSON.stringify(body), signal }), protocol, canonical.stream, signal)
  }
  const res = provider.fetch
    ? await provider.fetch({ protocol, body, headers, signal, model: canonical.modelId })
    : await fetch(url, { method: 'POST', headers, body: JSON.stringify({ ...body, model: canonical.modelId, stream: !!canonical.stream }), signal })
  return readUpstream(res, protocol, canonical.stream, signal)
}

function join(base, path, protocol) {
  if (protocol === 'openai-chat' || protocol === 'openai-responses') {
    const root = base.endsWith('/v1') || base.endsWith('/v1/') ? base.replace(/\/$/, '') : `${base.replace(/\/$/, '')}/v1`
    return `${root}${path}`
  }
  if (protocol === 'anthropic') return `${base.replace(/\/v1$/, '')}${path}`
  return `${base.replace(/\/$/, '')}${path}`
}

async function readUpstream(res, protocol, stream, signal) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw Object.assign(new Error(text.slice(0, 500) || `upstream ${res.status}`), { status: res.status, body: text })
  }
  if (!stream) {
    const json = await res.json()
    return { stream: false, reply: parseFull(protocol, json) }
  }
  return { stream: true, events: parseSSE(res.body, protocol, signal) }
}

function parseFull(protocol, json) {
  if (protocol === 'anthropic') {
    const blocks = json.content ?? []
    return {
      text: blocks.filter((b) => b.type === 'text').map((b) => b.text).join(''),
      reasoning: blocks.filter((b) => b.type === 'thinking').map((b) => b.thinking).join(''),
      toolCalls: blocks.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, arguments: JSON.stringify(b.input ?? {}) })),
      usage: { inputTokens: json.usage?.input_tokens ?? 0, outputTokens: json.usage?.output_tokens ?? 0 },
      model: json.model,
    }
  }
  if (protocol === 'gemini') {
    const parts = json.candidates?.[0]?.content?.parts ?? []
    return { text: parts.map((p) => p.text ?? '').join(''), reasoning: '', toolCalls: [], usage: { inputTokens: json.usageMetadata?.promptTokenCount ?? 0, outputTokens: json.usageMetadata?.candidatesTokenCount ?? 0 }, model: '' }
  }
  if (protocol === 'openai-responses') {
    const out = json.output ?? []
    return {
      text: out.flatMap((o) => o.content ?? []).map((c) => c.text ?? '').join(''),
      reasoning: '',
      toolCalls: out.filter((o) => o.type === 'function_call').map((o) => ({ id: o.call_id, name: o.name, arguments: o.arguments })),
      usage: { inputTokens: json.usage?.input_tokens ?? 0, outputTokens: json.usage?.output_tokens ?? 0 },
      model: json.model,
    }
  }
  const msg = json.choices?.[0]?.message ?? {}
  return {
    text: msg.content ?? '',
    reasoning: msg.reasoning_content ?? '',
    toolCalls: (msg.tool_calls ?? []).map((t) => ({ id: t.id, name: t.function?.name, arguments: t.function?.arguments ?? '{}' })),
    usage: { inputTokens: json.usage?.prompt_tokens ?? 0, outputTokens: json.usage?.completion_tokens ?? 0 },
    model: json.model,
    finish: json.choices?.[0]?.finish_reason,
  }
}

async function* parseSSE(body, protocol, signal) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let acc = ''
  let reasoning = ''
  const tools = new Map()
  try {
    while (true) {
      if (signal?.aborted) break
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''
      for (const part of parts) {
        const data = part.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n')
        if (!data || data === '[DONE]') continue
        let json
        try { json = JSON.parse(data) } catch { continue }
        const delta = extractDelta(protocol, json)
        if (delta.text) { acc += delta.text; yield { type: 'text', text: delta.text } }
        if (delta.reasoning) { reasoning += delta.reasoning; yield { type: 'reasoning', text: delta.reasoning } }
        if (delta.tool) {
          const cur = tools.get(delta.tool.index) ?? { id: delta.tool.id || `call_${newId('t')}`, name: '', arguments: '' }
          if (delta.tool.id) cur.id = delta.tool.id
          if (delta.tool.name) cur.name += delta.tool.name
          if (delta.tool.arguments) cur.arguments += delta.tool.arguments
          tools.set(delta.tool.index, cur)
          yield { type: 'tool', tool: cur }
        }
        if (delta.usage) yield { type: 'usage', usage: delta.usage }
      }
    }
  } finally {
    reader.releaseLock?.()
  }
  yield { type: 'done', reply: { text: acc, reasoning, toolCalls: [...tools.values()], usage: {} } }
}

function extractDelta(protocol, json) {
  if (protocol === 'anthropic') {
    const d = json.delta ?? {}
    if (json.type === 'content_block_delta' && d.type === 'text_delta') return { text: d.text }
    if (json.type === 'content_block_delta' && d.type === 'thinking_delta') return { reasoning: d.thinking }
    if (json.type === 'content_block_start' && json.content_block?.type === 'tool_use') return { tool: { index: json.index ?? 0, id: json.content_block.id, name: json.content_block.name, arguments: '' } }
    if (json.type === 'content_block_delta' && d.type === 'input_json_delta') return { tool: { index: json.index ?? 0, arguments: d.partial_json } }
    if (json.type === 'message_delta') return { usage: { outputTokens: json.usage?.output_tokens ?? 0 } }
    return {}
  }
  if (protocol === 'gemini') {
    const parts = json.candidates?.[0]?.content?.parts ?? []
    return { text: parts.map((p) => p.text ?? '').join('') }
  }
  const choice = json.choices?.[0] ?? {}
  const d = choice.delta ?? {}
  const tool = d.tool_calls?.[0]
  return {
    text: d.content ?? '',
    reasoning: d.reasoning_content ?? '',
    ...(tool ? { tool: { index: tool.index ?? 0, id: tool.id, name: tool.function?.name ?? '', arguments: tool.function?.arguments ?? '' } } : {}),
    ...(json.usage ? { usage: { inputTokens: json.usage.prompt_tokens, outputTokens: json.usage.completion_tokens } } : {}),
  }
}
