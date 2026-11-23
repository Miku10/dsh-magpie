import { hash32 } from './util.js'

/**
 * Local redaction. Originals live only in the per-request map; the log keeps
 * type, length, and a short prefix. The same value always gets the same
 * placeholder so prompt caches and thinking signatures stay valid.
 */

const RULES = [
  { type: 'privateKey', re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g, flag: 'privateKey' },
  { type: 'apiKey', re: /\b(?:sk-[A-Za-z0-9_\-]{16,}|sk-ant-[A-Za-z0-9_\-]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_\-]{20,})\b/g, flag: 'apiKey' },
  { type: 'token', re: /\b(?:eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{6,}|Bearer\s+[A-Za-z0-9._\-]{12,})\b/g, flag: 'token' },
  { type: 'email', re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, flag: 'email' },
  { type: 'card', re: /\b(?:\d[ -]?){13,19}\b/g, flag: 'card', test: luhn },
  { type: 'idNumber', re: /\b[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g, flag: 'idNumber' },
  { type: 'phone', re: /\b(?:\+?\d{1,3}[- ]?)?(?:\(?\d{2,4}\)?[- ]?)?\d{3,4}[- ]?\d{4}\b/g, flag: 'phone' },
  { type: 'iban', re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g, flag: 'iban' },
  { type: 'mac', re: /\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, flag: 'mac' },
  { type: 'publicIp', re: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, flag: 'publicIp', test: (v) => !/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(v) },
]

function luhn(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function skippedEmail(value) {
  return /@(?:example\.com|example\.org|example\.net)$/i.test(value) || /\.(?:test|invalid)$/i.test(value.split('@')[1] ?? '')
}

export function createMasker(config) {
  const vault = new Map()
  function placeholder(type, value) {
    const key = `${type}:${value}`
    if (vault.has(key)) return vault.get(key).token
    const token = `{{${type.toUpperCase()}_${hash32(value).slice(0, 8)}}}`
    vault.set(key, { token, type, value, length: value.length, prefix: value.slice(0, 4) })
    vault.set(token, vault.get(key))
    return token
  }
  function enabled(rule) {
    if (!config?.enabled) return false
    if (rule.personal && !config.personal) return false
    if (!rule.personal && config.secrets === false) return false
    return config.types?.[rule.flag] !== false
  }
  function allowed(value) {
    return (config?.allow ?? []).some((w) => w && value.includes(w))
  }
  function scan(text) {
    if (!config?.enabled || typeof text !== 'string' || !text) return { text, hits: [] }
    const hits = []
    let out = text
    const rules = [...RULES]
    for (const custom of config.customRules ?? []) {
      if (!custom?.pattern) continue
      try { rules.push({ type: custom.type || 'custom', re: new RegExp(custom.pattern, custom.flags || 'g'), flag: custom.flag || 'token', personal: !!custom.personal }) } catch { /* skip bad rule */ }
    }
    for (const word of config.denyWords ?? []) {
      if (word) rules.push({ type: 'word', re: new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), flag: 'token', personal: true })
    }
    for (const rule of rules) {
      if (!enabled(rule) && rule.type !== 'word') continue
      if (rule.type === 'word' && !config.personal) continue
      out = out.replace(rule.re, (match) => {
        if (rule.test && !rule.test(match)) return match
        if (rule.type === 'email' && skippedEmail(match)) return match
        if (allowed(match)) return match
        const token = placeholder(rule.type, match)
        hits.push({ type: rule.type, length: match.length, prefix: match.slice(0, 4), token, action: config.mode || 'mask' })
        return config.mode === 'mask' ? token : match
      })
    }
    return { text: out, hits }
  }
  function restore(text) {
    if (typeof text !== 'string' || !text.includes('{{')) return text
    return text.replace(/\{\{[A-Z0-9_]+\}\}/g, (token) => vault.get(token)?.value ?? token)
  }
  function walk(value, fn) {
    if (typeof value === 'string') return fn(value)
    if (Array.isArray(value)) return value.map((v) => walk(v, fn))
    if (value && typeof value === 'object') {
      const out = {}
      for (const [k, v] of Object.entries(value)) out[k] = walk(v, fn)
      return out
    }
    return value
  }
  return {
    scan,
    restore,
    redact(value) {
      const hits = []
      const out = walk(value, (text) => {
        const r = scan(text)
        hits.push(...r.hits)
        return r.text
      })
      return { value: out, hits }
    },
    restoreValue(value) { return walk(value, restore) },
    record() {
      return [...vault.values()].filter((v) => v.value).map(({ type, length, prefix, token }) => ({ type, length, prefix, token }))
    },
  }
}
