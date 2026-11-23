import { textOf, asArray } from './util.js'

/** Convert among OpenAI Chat, OpenAI Responses, Anthropic Messages, and Gemini. */

export function detectProtocol(pathname, body) {
  if (pathname.includes('/messages')) return 'anthropic'
  if (pathname.includes(':generateContent') || pathname.includes('/gemini')) return 'gemini'
  if (pathname.includes('/responses')) return 'openai-responses'
  if (body?.input != null && body?.messages == null) return 'openai-responses'
  return 'openai-chat'
}

export function toCanonical(protocol, body) {
  if (protocol === 'anthropic') return fromAnthropic(body)
  if (protocol === 'gemini') return fromGemini(body)
  if (protocol === 'openai-responses') return fromResponses(body)
  return fromChat(body)
}

export function fromCanonical(protocol, canonical) {
  if (protocol === 'anthropic') return toAnthropic(canonical)
  if (protocol === 'gemini') return toGemini(canonical)
  if (protocol === 'openai-responses') return toResponses(canonical)
  return toChat(canonical)
}

function fromChat(body) {
  const messages = (body.messages ?? []).map((m) => ({
    role: m.role === 'tool' ? 'tool' : m.role,
    content: textOf(m.content),
    parts: asArray(m.content),
    toolCalls: m.tool_calls,
    toolCallId: m.tool_call_id,
    name: m.name,
  }))
  return base(body, messages, body.tools)
}

function fromResponses(body) {
  const input = asArray(body.input ?? body.messages ?? [])
  const messages = []
  if (body.instructions) messages.push({ role: 'system', content: body.instructions, parts: [body.instructions] })
  for (const item of input) {
    if (typeof item === 'string') messages.push({ role: 'user', content: item, parts: [item] })
    else if (item.type === 'function_call') messages.push({ role: 'assistant', content: '', toolCalls: [{ id: item.call_id, type: 'function', function: { name: item.name, arguments: item.arguments } }] })
    else if (item.type === 'function_call_output') messages.push({ role: 'tool', content: textOf(item.output), toolCallId: item.call_id, parts: [textOf(item.output)] })
    else messages.push({ role: item.role ?? 'user', content: textOf(item.content ?? item.text), parts: asArray(item.content ?? item.text) })
  }
  return base(body, messages, body.tools)
}

function fromAnthropic(body) {
  const messages = []
  if (body.system) messages.push({ role: 'system', content: textOf(body.system), parts: asArray(body.system) })
  for (const m of body.messages ?? []) {
    const parts = asArray(m.content)
    const toolUses = parts.filter((p) => p?.type === 'tool_use')
    const toolResults = parts.filter((p) => p?.type === 'tool_result')
    if (toolResults.length) {
      for (const tr of toolResults) messages.push({ role: 'tool', content: textOf(tr.content), toolCallId: tr.tool_use_id, parts: [textOf(tr.content)] })
    } else {
      messages.push({
        role: m.role,
        content: textOf(parts.filter((p) => !p?.type || p.type === 'text')),
        parts,
        toolCalls: toolUses.map((t) => ({ id: t.id, type: 'function', function: { name: t.name, arguments: JSON.stringify(t.input ?? {}) } })),
      })
    }
  }
  const tools = (body.tools ?? []).map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }))
  return base(body, messages, tools, { maxTokens: body.max_tokens, thinking: body.thinking })
}

function fromGemini(body) {
  const messages = []
  if (body.systemInstruction) messages.push({ role: 'system', content: textOf(body.systemInstruction.parts ?? body.systemInstruction), parts: [] })
  for (const c of body.contents ?? []) {
    const role = c.role === 'model' ? 'assistant' : 'user'
    messages.push({ role, content: (c.parts ?? []).map((p) => p.text ?? '').join(''), parts: c.parts ?? [] })
  }
  const tools = (body.tools ?? []).flatMap((t) => (t.functionDeclarations ?? []).map((fn) => ({ type: 'function', function: { name: fn.name, description: fn.description, parameters: fn.parameters } })))
  return base(body, messages, tools)
}

function base(body, messages, tools, extra = {}) {
  return {
    model: body.model,
    messages,
    tools: tools ?? [],
    stream: !!body.stream,
    temperature: body.temperature,
    topP: body.top_p ?? body.topP,
    maxTokens: extra.maxTokens ?? body.max_tokens ?? body.max_completion_tokens ?? body.max_output_tokens,
    reasoning: body.reasoning_effort ?? body.reasoning?.effort ?? extra.thinking?.type,
    stop: body.stop,
    raw: body,
  }
}

function toChat(c) {
  return {
    model: c.upstreamModel ?? c.model,
    messages: c.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}),
      ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      ...(m.name ? { name: m.name } : {}),
    })),
    ...(c.tools?.length ? { tools: c.tools } : {}),
    stream: c.stream,
    ...(c.temperature != null ? { temperature: c.temperature } : {}),
    ...(c.maxTokens ? { max_tokens: c.maxTokens } : {}),
    ...(c.reasoning && c.reasoning !== 'off' ? { reasoning_effort: c.reasoning } : {}),
  }
}

function toResponses(c) {
  return {
    model: c.upstreamModel ?? c.model,
    input: c.messages.filter((m) => m.role !== 'system').map((m) => {
      if (m.toolCalls?.length) return m.toolCalls.map((t) => ({ type: 'function_call', call_id: t.id, name: t.function.name, arguments: t.function.arguments }))
      if (m.role === 'tool') return { type: 'function_call_output', call_id: m.toolCallId, output: m.content }
      return { role: m.role, content: m.content }
    }).flat(),
    ...(c.messages.find((m) => m.role === 'system') ? { instructions: c.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n') } : {}),
    ...(c.tools?.length ? { tools: c.tools.map((t) => ({ type: 'function', name: t.function?.name ?? t.name, description: t.function?.description, parameters: t.function?.parameters })) } : {}),
    stream: c.stream,
    ...(c.maxTokens ? { max_output_tokens: c.maxTokens } : {}),
    ...(c.reasoning && c.reasoning !== 'off' ? { reasoning: { effort: c.reasoning } } : {}),
  }
}

function toAnthropic(c) {
  const system = c.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  const messages = []
  for (const m of c.messages.filter((x) => x.role !== 'system')) {
    if (m.role === 'tool') {
      messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }] })
    } else if (m.toolCalls?.length) {
      messages.push({ role: 'assistant', content: [...(m.content ? [{ type: 'text', text: m.content }] : []), ...m.toolCalls.map((t) => ({ type: 'tool_use', id: t.id, name: t.function.name, input: safe(t.function.arguments) }))] })
    } else messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })
  }
  return {
    model: c.upstreamModel ?? c.model,
    max_tokens: c.maxTokens || 4096,
    ...(system ? { system } : {}),
    messages,
    ...(c.tools?.length ? { tools: c.tools.map((t) => ({ name: t.function?.name ?? t.name, description: t.function?.description ?? '', input_schema: t.function?.parameters ?? { type: 'object' } })) } : {}),
    stream: c.stream,
  }
}

function toGemini(c) {
  const system = c.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n')
  return {
    contents: c.messages.filter((m) => m.role !== 'system' && m.role !== 'tool').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    ...(c.tools?.length ? { tools: [{ functionDeclarations: c.tools.map((t) => ({ name: t.function?.name ?? t.name, description: t.function?.description, parameters: t.function?.parameters })) }] } : {}),
    generationConfig: { ...(c.temperature != null ? { temperature: c.temperature } : {}), ...(c.maxTokens ? { maxOutputTokens: c.maxTokens } : {}) },
  }
}

function safe(text) {
  try { return JSON.parse(text) } catch { return { raw: text } }
}

export function canonicalReply({ text = '', reasoning = '', toolCalls = [], usage = {}, finish = 'stop', model = '' }) {
  return { text, reasoning, toolCalls, usage, finish, model }
}

export function replyTo(protocol, reply, id) {
  if (protocol === 'anthropic') {
    return {
      id: `msg_${id}`,
      type: 'message',
      role: 'assistant',
      model: reply.model,
      content: [
        ...(reply.reasoning ? [{ type: 'thinking', thinking: reply.reasoning }] : []),
        ...(reply.text ? [{ type: 'text', text: reply.text }] : []),
        ...reply.toolCalls.map((t) => ({ type: 'tool_use', id: t.id, name: t.name, input: safe(t.arguments) })),
      ],
      stop_reason: reply.toolCalls.length ? 'tool_use' : 'end_turn',
      usage: { input_tokens: reply.usage.inputTokens ?? 0, output_tokens: reply.usage.outputTokens ?? 0 },
    }
  }
  if (protocol === 'gemini') {
    return {
      candidates: [{ content: { role: 'model', parts: [{ text: reply.text }] }, finishReason: 'STOP' }],
      usageMetadata: { promptTokenCount: reply.usage.inputTokens ?? 0, candidatesTokenCount: reply.usage.outputTokens ?? 0 },
    }
  }
  if (protocol === 'openai-responses') {
    return {
      id: `resp_${id}`,
      object: 'response',
      model: reply.model,
      output: [
        ...(reply.text ? [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: reply.text }] }] : []),
        ...reply.toolCalls.map((t) => ({ type: 'function_call', call_id: t.id, name: t.name, arguments: t.arguments })),
      ],
      usage: { input_tokens: reply.usage.inputTokens ?? 0, output_tokens: reply.usage.outputTokens ?? 0 },
    }
  }
  return {
    id: `chatcmpl-${id}`,
    object: 'chat.completion',
    model: reply.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: reply.text || null,
        ...(reply.reasoning ? { reasoning_content: reply.reasoning } : {}),
        ...(reply.toolCalls.length ? { tool_calls: reply.toolCalls.map((t) => ({ id: t.id, type: 'function', function: { name: t.name, arguments: t.arguments } })) } : {}),
      },
      finish_reason: reply.toolCalls.length ? 'tool_calls' : 'stop',
    }],
    usage: { prompt_tokens: reply.usage.inputTokens ?? 0, completion_tokens: reply.usage.outputTokens ?? 0, total_tokens: (reply.usage.inputTokens ?? 0) + (reply.usage.outputTokens ?? 0) },
  }
}
