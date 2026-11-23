/**
 * Gateway middleware. A hook may rewrite or reject a request, observe each
 * stream event, and see the finished reply. A thrown or timed-out hook lets
 * the request through unchanged — same contract as magpie's middleware.
 */

export async function runHook(plugins, name, arg, ctx, timeoutMs = 1500) {
  let current = arg
  const notes = []
  for (const plugin of plugins.filter((p) => p.enabled !== false && typeof p[name] === 'function')) {
    try {
      const result = await Promise.race([
        Promise.resolve(plugin[name](current, ctx)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('middleware timeout')), timeoutMs)),
      ])
      if (result && result.reject) return { rejected: true, status: result.status ?? 400, message: result.message ?? 'rejected by middleware', notes }
      if (result !== undefined) current = result
      notes.push({ plugin: plugin.id, hook: name, changed: result !== undefined })
    } catch (err) {
      notes.push({ plugin: plugin.id, hook: name, error: err.message })
    }
  }
  return { value: current, notes }
}

export function compileMiddleware(source, id) {
  const fn = new Function('exports', `${source}\nreturn { onRequest: typeof onRequest==='function'?onRequest:undefined, onEvent: typeof onEvent==='function'?onEvent:undefined, onResponse: typeof onResponse==='function'?onResponse:undefined }`)
  const api = fn({})
  return { id, enabled: true, ...api, source }
}
