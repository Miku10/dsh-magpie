/**
 * Library: instructions, MCP servers, skills, and subagents written once.
 * Each agent gets only the fragment magpie itself wrote, so removal never
 * touches the user's own lines.
 */

export function renderForAgent(agentId, library) {
  const instructions = (library.instructions ?? []).filter((i) => applies(i, agentId))
  const mcp = (library.mcp ?? []).filter((i) => applies(i, agentId))
  const skills = (library.skills ?? []).filter((i) => applies(i, agentId))
  const subagents = (library.subagents ?? []).filter((i) => applies(i, agentId))
  return {
    agentId,
    claude: {
      settings: { mcpServers: Object.fromEntries(mcp.map((s) => [s.name, s.config])) },
      claudeMd: instructions.map((i) => `<!-- magpie:${i.id} -->\n${i.text}\n<!-- /magpie:${i.id} -->`).join('\n'),
    },
    codex: {
      configToml: mcp.map((s) => `# magpie:${s.id}\n[mcp_servers.${s.name}]\ncommand = ${JSON.stringify(s.config?.command ?? '')}\n`).join('\n'),
      agentsMd: instructions.map((i) => i.text).join('\n\n'),
    },
    mcp, skills, subagents, instructions,
  }
}

function applies(item, agentId) {
  if (!item || item.disabled) return false
  if (!item.agents?.length || item.agents.includes('*')) return true
  return item.agents.includes(agentId)
}

export function stripOwned(text, id) {
  const re = new RegExp(`<!-- magpie:${id} -->[\\s\\S]*?<!-- /magpie:${id} -->\\n?`, 'g')
  return String(text ?? '').replace(re, '')
}
