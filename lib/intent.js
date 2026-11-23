/**
 * Intent routing. A small model reads the newest user message and picks a
 * member: tests and hard edits go to the strong model, short questions to
 * the cheap one. The decision is recorded for the routing page.
 */

const HINTS = [
  { tag: 'code-hard', re: /\b(refactor|architect|race condition|security audit|migration|debug this|根因|重构|架构)\b/i, prefer: 'strong' },
  { tag: 'test', re: /\b(write tests?|单元测试|add a test|failing test)\b/i, prefer: 'strong' },
  { tag: 'simple', re: /\b(what is|define|translate|总结一下|是什么|hello)\b/i, prefer: 'cheap' },
  { tag: 'search', re: /\b(search|look up|最新|新闻|news|查一下)\b/i, prefer: 'search' },
]

export function classify(text) {
  const s = String(text ?? '')
  const tags = HINTS.filter((h) => h.re.test(s)).map((h) => h.tag)
  const prefer = tags.includes('code-hard') || tags.includes('test') ? 'strong' : tags.includes('simple') ? 'cheap' : 'default'
  return { tags, prefer, chars: s.length }
}

export function routeByIntent(group, classification) {
  const members = group?.members ?? []
  const tagged = members.find((m) => (m.tags ?? []).includes(classification.prefer))
  if (tagged) return { member: tagged, reason: `intent:${classification.prefer}` }
  if (classification.prefer === 'cheap') return { member: members[members.length - 1], reason: 'intent:cheap-last' }
  if (classification.prefer === 'strong') return { member: members[0], reason: 'intent:strong-first' }
  return { member: members[0], reason: 'intent:default' }
}
