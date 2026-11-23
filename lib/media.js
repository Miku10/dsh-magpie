/** Image and video generation through the provider the user picked. */

export async function generateImage(state, prompt, opts = {}) {
  const model = opts.model || state.media.imageModel
  if (!model) throw Object.assign(new Error('no image model selected'), { status: 400 })
  const slash = model.indexOf('/')
  const provider = state.providers.find((p) => p.id === model.slice(0, slash))
  if (!provider) throw Object.assign(new Error('image provider missing'), { status: 400 })
  const base = provider.baseURL.replace(/\/$/, '')
  const res = await fetch(`${base.endsWith('/v1') ? base : `${base}/v1`}/images/generations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${provider.apiKey ?? ''}` },
    body: JSON.stringify({ model: model.slice(slash + 1), prompt, size: opts.size || '1024x1024', response_format: 'b64_json' }),
    signal: opts.signal,
  })
  if (!res.ok) throw Object.assign(new Error(await res.text()), { status: res.status })
  return res.json()
}

export async function generateVideo(state, prompt, opts = {}) {
  const model = opts.model || state.media.videoModel
  if (!model) throw Object.assign(new Error('no video model selected'), { status: 400 })
  const slash = model.indexOf('/')
  const provider = state.providers.find((p) => p.id === model.slice(0, slash))
  if (!provider) throw Object.assign(new Error('video provider missing'), { status: 400 })
  const base = provider.baseURL.replace(/\/$/, '')
  const res = await fetch(`${base}/videos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${provider.apiKey ?? ''}` },
    body: JSON.stringify({ model: model.slice(slash + 1), prompt, ...opts.extra }),
    signal: opts.signal,
  })
  if (!res.ok) throw Object.assign(new Error(await res.text()), { status: res.status })
  return res.json()
}
