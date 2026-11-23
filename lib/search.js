/**
 * Web search and page fetch. Providers run in the user's drag order. A
 * provider can be disabled without deleting its key. Multiple keys rotate
 * (or stay in order); a recently rejected key goes last.
 */

export async function webSearch(state, query, signal) {
  const order = state.search.order.length ? state.search.order : Object.keys(state.search.keys)
  const errors = []
  for (const providerId of order) {
    if (state.search.disabled?.includes(providerId)) continue
    const keys = keysFor(state, providerId)
    for (const key of keys) {
      try {
        const hits = await searchOne(providerId, key, query, signal)
        remember(state, providerId, key, true)
        return { providerId, hits }
      } catch (err) {
        remember(state, providerId, key, false)
        errors.push({ providerId, message: err.message })
      }
    }
  }
  if (!order.length) return { providerId: 'none', hits: [], note: 'no search provider configured' }
  return { providerId: null, hits: [], errors }
}

function keysFor(state, providerId) {
  const list = state.search.keys[providerId] ?? []
  const pick = state.search.pick || 'rotate'
  const live = [...list].sort((a, b) => (a.rejectedAt ?? 0) - (b.rejectedAt ?? 0))
  if (pick === 'order') return live
  if (!live.length) return []
  const i = (state.search._cursor?.[providerId] ?? 0) % live.length
  return [...live.slice(i), ...live.slice(0, i)]
}

function remember(state, providerId, key, ok) {
  state.search._cursor = state.search._cursor ?? {}
  const list = state.search.keys[providerId] ?? []
  const found = list.find((k) => k.id === key.id)
  if (found) found.rejectedAt = ok ? 0 : Date.now()
  if (ok) state.search._cursor[providerId] = ((state.search._cursor[providerId] ?? 0) + 1)
}

async function searchOne(providerId, key, query, signal) {
  if (providerId === 'searxng') {
    const url = new URL(key.baseURL || 'http://127.0.0.1:8080/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`searxng ${res.status}`)
    const json = await res.json()
    return (json.results ?? []).slice(0, 8).map((r) => ({ title: r.title, url: r.url, snippet: r.content }))
  }
  if (providerId === 'brave') {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, { headers: { 'X-Subscription-Token': key.value }, signal })
    if (!res.ok) throw new Error(`brave ${res.status}`)
    const json = await res.json()
    return (json.web?.results ?? []).slice(0, 8).map((r) => ({ title: r.title, url: r.url, snippet: r.description }))
  }
  if (providerId === 'tavily') {
    const res = await fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ api_key: key.value, query, max_results: 8 }), signal })
    if (!res.ok) throw new Error(`tavily ${res.status}`)
    const json = await res.json()
    key.usage = json.usage ?? key.usage
    return (json.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content }))
  }
  const endpoints = { exa: 'https://api.exa.ai/search', firecrawl: 'https://api.firecrawl.dev/v1/search', you: 'https://api.ydc-index.io/search', tinyfish: 'https://api.tinyfish.ai/search' }
  const url = endpoints[providerId]
  if (!url) throw new Error(`search provider ${providerId} needs a model with native search`)
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${key.value}` }, body: JSON.stringify({ query, q: query }), signal })
  if (!res.ok) throw new Error(`${providerId} ${res.status}`)
  const json = await res.json()
  const rows = json.results ?? json.hits ?? json.web?.results ?? []
  return rows.slice(0, 8).map((r) => ({ title: r.title ?? r.name, url: r.url ?? r.link, snippet: r.snippet ?? r.text ?? r.description ?? '' }))
}

export async function webFetch(url, signal) {
  const res = await fetch(url, { signal, headers: { 'user-agent': 'dsh-magpie' }, redirect: 'follow' })
  const type = res.headers.get('content-type') ?? ''
  const text = await res.text()
  const clipped = text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12_000)
  return { url, status: res.status, type, text: type.includes('html') ? clipped : text.slice(0, 12_000) }
}
