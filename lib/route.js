import { hash32 } from './util.js'

/**
 * Routing groups. A group is selected as one model (`group/<id>`). Members
 * can be provider/model or nested groups. A conversation stays on the account
 * that answered it while that account's prompt cache is worth keeping.
 */

export const MODES = ['smart', 'order', 'rotate', 'usage', 'pace']

export function resolveTarget(state, model, sessionKey) {
  const asked = String(model ?? '')
  if (asked.startsWith('group/')) return pickGroup(state, asked.slice(6), sessionKey, new Set())
  const slash = asked.indexOf('/')
  if (slash > 0) {
    const providerId = asked.slice(0, slash)
    const modelId = asked.slice(slash + 1)
    const provider = state.providers.find((p) => p.id === providerId)
    if (provider) return { provider, modelId, via: null, chain: [providerId] }
  }
  const only = state.providers.find((p) => (p.models ?? []).some((m) => (m.id ?? m) === asked))
  if (only) return { provider: only, modelId: asked, via: 'bare', chain: [only.id] }
  return null
}

function pickGroup(state, groupId, sessionKey, seen) {
  if (seen.has(groupId)) return null
  seen.add(groupId)
  const group = state.groups.find((g) => g.id === groupId)
  if (!group) return null
  const members = (group.members ?? []).filter((m) => memberAlive(state, m))
  if (!members.length) return null
  const sticky = sessionKey && group.sticky !== false ? state.sessions.find((s) => s.key === sessionKey && members.some((m) => m.ref === s.member)) : null
  const chosen = sticky ? members.find((m) => m.ref === sticky.member) : choose(state, group, members, sessionKey)
  if (!chosen) return null
  if (chosen.ref.startsWith('group/')) return pickGroup(state, chosen.ref.slice(6), sessionKey, seen)
  const slash = chosen.ref.indexOf('/')
  const provider = state.providers.find((p) => p.id === chosen.ref.slice(0, slash))
  if (!provider) return null
  return { provider, modelId: chosen.ref.slice(slash + 1), via: group, chain: [group.id, provider.id], member: chosen.ref }
}

function memberAlive(state, member) {
  if (member.disabled) return false
  if (member.ref.startsWith('group/')) return state.groups.some((g) => g.id === member.ref.slice(6))
  const id = member.ref.slice(0, member.ref.indexOf('/'))
  const provider = state.providers.find((p) => p.id === id)
  if (!provider || provider.disabled) return false
  return accountOk(state, provider)
}

function accountOk(state, provider) {
  const accounts = state.accounts.filter((a) => a.providerId === provider.id && !a.disabled)
  if (!accounts.length) return !!(provider.apiKey || provider.local || provider.subscription)
  return accounts.some((a) => (a.cooldownUntil ?? 0) < Date.now())
}

function choose(state, group, members, sessionKey) {
  const mode = group.mode || 'order'
  if (mode === 'order') return members[0]
  if (mode === 'rotate') {
    const n = Math.abs(hash32(`${group.id}:${sessionKey ?? ''}:${state.usage.length}`) % members.length)
    return members[n]
  }
  if (mode === 'usage') {
    return [...members].sort((a, b) => spent(state, a.ref) - spent(state, b.ref))[0]
  }
  if (mode === 'pace' || mode === 'smart') {
    return [...members].sort((a, b) => score(state, b) - score(state, a))[0]
  }
  return members[0]
}

function spent(state, ref) {
  return state.usage.filter((u) => u.member === ref || u.model === ref).reduce((s, u) => s + (u.cost?.usd ?? 0), 0)
}

function score(state, member) {
  const id = member.ref.slice(0, member.ref.indexOf('/'))
  const accounts = state.accounts.filter((a) => a.providerId === id && !a.disabled)
  if (!accounts.length) return 1
  return Math.max(...accounts.map((a) => {
    const left = a.quota?.remaining ?? 1
    const hours = Math.max(1, ((a.quota?.resetsAt ?? Date.now() + 3600_000) - Date.now()) / 3600_000)
    return left / hours
  }))
}

export function fallbackChain(state, target) {
  if (!target?.via) return [target].filter(Boolean)
  const members = target.via.members ?? []
  const start = Math.max(0, members.findIndex((m) => m.ref === target.member))
  const chain = []
  for (let i = 0; i < members.length; i++) {
    const member = members[(start + i) % members.length]
    const resolved = member.ref.startsWith('group/')
      ? pickGroup(state, member.ref.slice(6), null, new Set([target.via.id]))
      : resolveTarget(state, member.ref, null)
    if (resolved) chain.push({ ...resolved, member: member.ref })
  }
  return chain.length ? chain : [target]
}
