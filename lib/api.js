import { id, now, maskPreview, clone } from './util.js'
import { PRESETS, SUBSCRIPTIONS, SEARCH_PROVIDERS, AGENTS, estimateCost } from './presets.js'
import { listModels } from './upstream.js'
import { createMasker } from './mask.js'
import { renderForAgent, stripOwned } from './library.js'
import { webSearch, webFetch } from './search.js'
import { generateImage, generateVideo } from './media.js'
import { compileMiddleware } from './middleware.js'
import { backupToFile, restoreFromFile, seal, open, webdavPut, webdavGet, s3Put } from './sync.js'
import { classify, routeByIntent } from './intent.js'

/**
 * Control plane. Every mutation the settings page, the agent tool, and the
 * /magpie command can make goes through one of these operations.
 */

export function createApi(store) {
  function snap() {
    const s = store.get()
    return {
      ...publicState(s),
      presets: PRESETS,
      subscriptions: SUBSCRIPTIONS,
      searchProviders: SEARCH_PROVIDERS,
      agents: AGENTS.map((a) => ({ ...a, model: s.agents[a.id]?.model ?? '', favorites: s.favorites[a.id] ?? [], hidden: s.hidden[a.id] ?? [], onlyPicked: !!s.onlyPicked[a.id] })),
    }
  }

  const ops = {
    snapshot: async () => snap(),
    presetList: async () => ({ presets: PRESETS, subscriptions: SUBSCRIPTIONS, searchProviders: SEARCH_PROVIDERS, agents: AGENTS }),

    providerAdd: async ({ preset, name, apiKey, baseURL, protocol, models }) => store.update((s) => {
      const known = PRESETS.find((p) => p.id === preset)
      s.providers.push({
        id: name ? slug(name) : `${preset || 'custom'}-${id('p').slice(-4)}`,
        preset: preset || 'custom',
        name: name || known?.name || 'Custom',
        protocol: protocol || known?.protocol || 'openai-chat',
        baseURL: baseURL || known?.baseURL || '',
        auth: known?.auth || 'bearer',
        apiKey: apiKey || '',
        models: models ?? [],
        createdAt: now(),
        local: !!known?.local,
      })
    }).then(snap),

    providerUpdate: async ({ id: pid, patch }) => store.update((s) => {
      const p = s.providers.find((x) => x.id === pid)
      if (!p) throw notFound('provider')
      const allowed = ['name', 'apiKey', 'baseURL', 'protocol', 'headers', 'proxy', 'disabled', 'models', 'modelsManual', 'currency']
      for (const key of allowed) if (patch[key] !== undefined) p[key] = patch[key]
    }).then(snap),

    providerRemove: async ({ id: pid }) => store.update((s) => {
      s.providers = s.providers.filter((p) => p.id !== pid)
      s.accounts = s.accounts.filter((a) => a.providerId !== pid)
    }).then(snap),

    providerModels: async ({ id: pid }) => {
      const p = store.get().providers.find((x) => x.id === pid)
      if (!p) throw notFound('provider')
      const models = await listModels(p)
      await store.update((s) => {
        const row = s.providers.find((x) => x.id === pid)
        if (row && !row.modelsManual) row.models = models
        row.modelsFetchedAt = now()
      })
      return { models }
    },

    providerImport: async ({ source, text }) => store.update((s) => {
      const parsed = parseImport(source, text)
      for (const row of parsed) {
        if (!s.providers.some((p) => p.id === row.id)) s.providers.push(row)
      }
    }).then(snap),

    accountAdd: async ({ providerId, name, token, kind }) => store.update((s) => {
      s.accounts.push({ id: id('acct'), providerId, name: name || 'account', token: token || '', kind: kind || 'api', createdAt: now(), quota: null, disabled: false })
    }).then(snap),

    accountUpdate: async ({ id: aid, patch }) => store.update((s) => {
      const a = s.accounts.find((x) => x.id === aid)
      if (!a) throw notFound('account')
      for (const key of ['name', 'token', 'disabled', 'proxy', 'quota']) if (patch[key] !== undefined) a[key] = patch[key]
    }).then(snap),

    accountRemove: async ({ id: aid }) => store.update((s) => { s.accounts = s.accounts.filter((a) => a.id !== aid) }).then(snap),

    subscriptionStart: async ({ id: sub, token }) => store.update((s) => {
      const known = SUBSCRIPTIONS.find((x) => x.id === sub)
      if (!known) throw notFound('subscription')
      if (!s.providers.some((p) => p.id === sub)) {
        s.providers.push({ id: sub, preset: sub, name: known.name, protocol: known.protocol, baseURL: '', auth: 'bearer', apiKey: token || '', subscription: true, models: [], createdAt: now() })
      }
      s.accounts.push({ id: id('acct'), providerId: sub, name: known.name, token: token || '', kind: 'subscription', createdAt: now() })
    }).then(snap),

    groupAdd: async ({ name, members, mode, routing }) => store.update((s) => {
      const gid = slug(name || 'group')
      s.groups.push({ id: gid, name: name || gid, mode: mode || routing || 'smart', members: (members ?? []).map(normalizeMember), sticky: true, intent: false, createdAt: now() })
    }).then(snap),

    groupUpdate: async ({ id: gid, patch }) => store.update((s) => {
      const g = s.groups.find((x) => x.id === gid)
      if (!g) throw notFound('group')
      for (const key of ['name', 'mode', 'members', 'sticky', 'intent', 'disabled']) if (patch[key] !== undefined) g[key] = patch[key]
      if (patch.members) g.members = patch.members.map(normalizeMember)
    }).then(snap),

    groupRemove: async ({ id: gid }) => store.update((s) => { s.groups = s.groups.filter((g) => g.id !== gid) }).then(snap),

    groupIntent: async ({ id: gid, text }) => {
      const g = store.get().groups.find((x) => x.id === gid)
      if (!g) throw notFound('group')
      const classification = classify(text)
      const decision = routeByIntent(g, classification)
      await store.update((s) => { s.decisions.unshift({ at: now(), groupId: gid, text: String(text).slice(0, 240), classification, member: decision.member?.ref, reason: decision.reason }); s.decisions = s.decisions.slice(0, 200) })
      return { classification, decision }
    },

    agentSet: async ({ agentId, model }) => store.update((s) => { s.agents[agentId] = { ...(s.agents[agentId] ?? {}), model, at: now() } }).then(snap),
    agentFavorites: async ({ agentId, models }) => store.update((s) => { s.favorites[agentId] = models }).then(snap),
    agentHidden: async ({ agentId, models, onlyPicked }) => store.update((s) => { s.hidden[agentId] = models ?? s.hidden[agentId] ?? []; if (onlyPicked != null) s.onlyPicked[agentId] = !!onlyPicked }).then(snap),

    profileSave: async ({ name }) => store.update((s) => {
      const snapAgents = clone(s.agents)
      const pid = slug(name)
      const row = { id: pid, name, agents: snapAgents, favorites: clone(s.favorites), at: now() }
      const i = s.profiles.findIndex((p) => p.id === pid)
      if (i >= 0) s.profiles[i] = row
      else s.profiles.push(row)
      s.activeProfile = pid
    }).then(snap),

    profileUse: async ({ id: pid }) => store.update((s) => {
      const p = s.profiles.find((x) => x.id === pid)
      if (!p) throw notFound('profile')
      s.agents = clone(p.agents)
      s.favorites = clone(p.favorites ?? {})
      s.activeProfile = pid
    }).then(snap),

    profileRemove: async ({ id: pid }) => store.update((s) => { s.profiles = s.profiles.filter((p) => p.id !== pid); if (s.activeProfile === pid) s.activeProfile = null }).then(snap),

    maskingSet: async ({ patch }) => store.update((s) => { s.masking = { ...s.masking, ...patch, types: { ...s.masking.types, ...(patch.types ?? {}) } } }).then(snap),
    maskingTry: async ({ text }) => {
      const masker = createMasker(store.get().masking.enabled ? store.get().masking : { ...store.get().masking, enabled: true })
      return masker.scan(text)
    },

    searchSet: async ({ patch }) => store.update((s) => { s.search = { ...s.search, ...patch, keys: { ...s.search.keys, ...(patch.keys ?? {}) } } }).then(snap),
    searchAddKey: async ({ providerId, value, baseURL }) => store.update((s) => {
      s.search.keys[providerId] = s.search.keys[providerId] ?? []
      s.search.keys[providerId].push({ id: id('sk'), value, baseURL: baseURL || '', rejectedAt: 0 })
      if (!s.search.order.includes(providerId)) s.search.order.push(providerId)
    }).then(snap),
    search: async ({ query }) => webSearch(store.get(), query),
    fetch: async ({ url }) => webFetch(url),

    mediaSet: async ({ imageModel, videoModel }) => store.update((s) => { if (imageModel != null) s.media.imageModel = imageModel; if (videoModel != null) s.media.videoModel = videoModel }).then(snap),
    image: async (opts) => generateImage(store.get(), opts.prompt, opts),
    video: async (opts) => generateVideo(store.get(), opts.prompt, opts),

    libraryAdd: async ({ kind, item }) => store.update((s) => { s.library[kind] = s.library[kind] ?? []; s.library[kind].push({ id: id(kind.slice(0, 3)), ...item, createdAt: now() }) }).then(snap),
    libraryRemove: async ({ kind, id: iid }) => store.update((s) => { s.library[kind] = (s.library[kind] ?? []).filter((x) => x.id !== iid) }).then(snap),
    libraryRender: async ({ agentId }) => renderForAgent(agentId, store.get().library),
    libraryStrip: async ({ text, id: iid }) => ({ text: stripOwned(text, iid) }),

    pluginAdd: async ({ name, source, kind }) => store.update((s) => {
      let hooks = {}
      if (kind === 'middleware' && source) hooks = compileMiddleware(source, slug(name))
      s.plugins.push({ id: slug(name), name, kind: kind || 'provider', source: source || '', enabled: true, package: name, createdAt: now(), hooks: kind === 'middleware' })
      if (kind === 'middleware') s.middleware.push({ id: slug(name), enabled: true, source })
    }).then(snap),
    pluginOptions: async ({ id: pid, options }) => store.update((s) => { const p = s.plugins.find((x) => x.id === pid); if (!p) throw notFound('plugin'); p.options = options }).then(snap),
    pluginSet: async ({ id: pid, enabled }) => store.update((s) => { const p = s.plugins.find((x) => x.id === pid); if (p) p.enabled = enabled }).then(snap),
    pluginRemove: async ({ id: pid }) => store.update((s) => { s.plugins = s.plugins.filter((p) => p.id !== pid); s.middleware = s.middleware.filter((m) => m.id !== pid) }).then(snap),

    clientAdd: async ({ name, caps }) => store.update((s) => {
      const token = `mgk_${id('k')}`
      s.clients.push({ id: id('cli'), name, token, caps: caps ?? null, createdAt: now() })
      s.gatewayKeys.push({ id: id('gk'), name, token, caps: caps ?? null })
    }).then(snap),

    remoteSet: async ({ enabled, upstream }) => store.update((s) => { s.remote = { enabled: !!enabled, upstream: upstream || '' } }).then(snap),

    priceSet: async ({ model, price }) => store.update((s) => { s.prices[model] = price }).then(snap),
    quotaSet: async ({ accountId, quota }) => store.update((s) => { const a = s.accounts.find((x) => x.id === accountId); if (a) a.quota = quota; s.quotas[accountId] = quota }).then(snap),

    usage: async ({ since, agentId } = {}) => {
      const rows = store.get().usage.filter((u) => (!since || u.at >= since) && (!agentId || u.agentId === agentId))
      const totals = rows.reduce((acc, u) => { acc.usd += u.cost?.usd ?? 0; acc.input += u.cost?.input ?? 0; acc.output += u.cost?.output ?? 0; acc.calls += 1; return acc }, { usd: 0, input: 0, output: 0, calls: 0 })
      return { totals, rows: rows.slice(-200) }
    },
    sessions: async () => ({ sessions: store.get().sessions.slice(-100) }),
    decisions: async () => ({ decisions: store.get().decisions.slice(0, 50) }),
    masks: async () => ({ masks: store.get().masks.slice(-100) }),

    privacySet: async ({ patch }) => store.update((s) => { s.privacy = { ...s.privacy, ...patch } }).then(snap),
    contextSet: async ({ agentId, model, window }) => store.update((s) => { s.contextWindows[`${agentId}:${model}`] = window }).then(snap),

    syncBackup: async ({ file, passphrase, target }) => {
      const state = store.get()
      if (target === 'webdav') return webdavPut(state.sync.webdav, 'magpie.bak', seal(state, passphrase))
      if (target === 's3') return s3Put(state.sync.s3, 'magpie.bak', seal(state, passphrase))
      return backupToFile(file, state, passphrase)
    },
    syncRestore: async ({ file, passphrase, payload }) => {
      const next = payload ? open(payload, passphrase) : file ? await restoreFromFile(file, passphrase) : await webdavGet(store.get().sync.webdav, 'magpie.bak').then((p) => open(p, passphrase))
      await store.update(() => next)
      return snap()
    },
    syncConfig: async ({ patch }) => store.update((s) => { s.sync = { ...s.sync, ...patch } }).then(snap),

    gatewayInfo: async ({ port, host }) => ({
      baseURL: `http://${host}:${port}/v1`,
      anthropic: `http://${host}:${port}`,
      gemini: `http://${host}:${port}`,
      token: 'magpie',
      protocols: ['openai-chat', 'openai-responses', 'anthropic', 'gemini'],
    }),

    recordUsage: async (row) => store.update((s) => {
      const cost = estimateCost(row.model, row.usage, s.prices)
      s.usage.push({ ...row, cost, at: now() })
      if (s.usage.length > 5000) s.usage = s.usage.slice(-5000)
    }),
  }

  async function call(action, payload = {}) {
    const fn = ops[action]
    if (!fn) throw Object.assign(new Error(`unknown action ${action}`), { status: 404 })
    return fn(payload)
  }

  return { call, snap, ops: Object.keys(ops) }
}

function publicState(s) {
  return {
    ...s,
    providers: s.providers.map((p) => ({ ...p, apiKey: p.apiKey ? maskPreview(p.apiKey) : '', apiKeySet: !!p.apiKey })),
    accounts: s.accounts.map((a) => ({ ...a, token: a.token ? maskPreview(a.token) : '', tokenSet: !!a.token })),
    gatewayKeys: s.gatewayKeys.map((k) => ({ ...k, token: maskPreview(k.token) })),
    clients: s.clients.map((c) => ({ ...c, token: maskPreview(c.token) })),
    search: { ...s.search, keys: Object.fromEntries(Object.entries(s.search.keys).map(([k, v]) => [k, v.map((key) => ({ ...key, value: maskPreview(key.value) }))])) },
  }
}

function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || id('n')
}

function normalizeMember(m) {
  if (typeof m === 'string') return { ref: m, tags: [] }
  return { ref: m.ref, tags: m.tags ?? [], disabled: !!m.disabled }
}

function notFound(what) {
  return Object.assign(new Error(`${what} not found`), { status: 404 })
}

function parseImport(source, text) {
  let json
  try { json = JSON.parse(text) } catch { json = null }
  const rows = []
  if (source === 'claude' && json?.env) {
    rows.push({ id: 'imported-claude', preset: 'anthropic', name: 'Imported Claude', protocol: 'anthropic', baseURL: json.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com', apiKey: json.env.ANTHROPIC_API_KEY || '', models: [], createdAt: now() })
  } else if (json?.providers) {
    for (const [pid, p] of Object.entries(json.providers)) {
      rows.push({ id: pid, preset: 'custom', name: p.name || pid, protocol: p.api || 'openai-chat', baseURL: p.baseURL || p.base_url || '', apiKey: p.apiKey || '', models: p.models ?? [], createdAt: now() })
    }
  } else if (json?.provider) {
    rows.push({ id: slug(json.provider.name || 'import'), preset: 'custom', name: json.provider.name || 'Imported', protocol: json.provider.protocol || 'openai-chat', baseURL: json.provider.baseURL || '', apiKey: json.provider.apiKey || '', models: [], createdAt: now() })
  }
  return rows
}
