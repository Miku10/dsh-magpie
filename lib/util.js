/** Shared helpers. No I/O. */

export function id(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function now() {
  return new Date().toISOString()
}

export function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

export function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value]
}

export function textOf(content) {
  if (content == null) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map(textOf).filter(Boolean).join('\n')
  if (typeof content === 'object') {
    if (typeof content.text === 'string') return content.text
    if (typeof content.content === 'string' || Array.isArray(content.content)) return textOf(content.content)
    if (typeof content.input_text === 'string') return content.input_text
  }
  return ''
}

export function hash32(text) {
  let h = 2166136261
  const s = String(text)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

export function maskPreview(value) {
  const s = String(value ?? '')
  if (s.length <= 8) return '•'.repeat(Math.max(4, s.length))
  return `${s.slice(0, 3)}…${s.slice(-2)}`
}

export function safeJson(text, fallback = null) {
  try { return JSON.parse(text) } catch { return fallback }
}

export function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function matchGlob(pattern, value) {
  const src = String(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${src}$`, 'i').test(String(value))
}

export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    const onAbort = () => {
      clearTimeout(t)
      const err = new Error('aborted')
      err.name = 'AbortError'
      reject(err)
    }
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function sseEncode(event, data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  return `${event ? `event: ${event}\n` : ''}data: ${payload}\n\n`
}

export function readBody(req, limit = 32 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(Object.assign(new Error('request body too large'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export const corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-private-network': 'true',
  'access-control-max-age': '600',
}

export function sendJson(res, status, body, extraHeaders) {
  const raw = Buffer.from(JSON.stringify(body))
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': raw.length,
    ...corsHeaders,
    ...extraHeaders,
  })
  res.end(raw)
}

export function sendText(res, status, text, type = 'text/plain; charset=utf-8') {
  const raw = Buffer.from(String(text))
  res.writeHead(status, {
    'content-type': type,
    'content-length': raw.length,
    'access-control-allow-origin': '*',
  })
  res.end(raw)
}

export function errorBody(message, type = 'invalid_request_error', status = 400, code) {
  return { status, body: { error: { message, type, code: code ?? null, param: null } } }
}
