/**
 * Magpie for DeepSeek Harness.
 * Developed from yetone/magpie (https://github.com/yetone/magpie), MIT,
 * Copyright (c) 2026 yetone. This file is an independent DSH plugin, not
 * Magpie's Go source. See NOTICE.md and LICENSE-MAGPIE.
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createStore } from './lib/store.js'
import { createApi } from './lib/api.js'
import { startGateway } from './lib/gateway.js'

export const name = 'dsh-magpie'
export const inject = ['tools', 'commands']

const DEFAULTS = { port: 3425, host: '127.0.0.1' }

const textOut = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: String(value) }],
}

export function apply(ctx, config = {}) {
  config = { ...DEFAULTS, ...config }
  const file = config.stateFile || join(process.env.DSH_HOME || join(homedir(), '.dsh'), 'magpie', 'state.json')
  const store = createStore(file)
  const api = createApi(store)
  let gateway = null
  let listenError = null

  ctx.effect(() => {
    let stopped = false
    const timer = setInterval(() => {
      const state = store.get()
      if (!state.checkin?.enabled) return
      const hour = new Date().getHours()
      const want = Number(String(state.checkin.at || '09:00').slice(0, 2))
      if (hour !== want) return
      const day = new Date().toISOString().slice(0, 10)
      if (state.checkin.lastDay === day) return
      void api.call('checkinNow', {}).then(() => store.update((s) => { s.checkin.lastDay = day })).catch((err) => ctx.logger?.error?.(`[magpie] check-in: ${err.message}`))
    }, 60_000)
    if (typeof timer.unref === 'function') timer.unref()
    void store.load().then(() => {
      if (stopped) return
      gateway = startGateway({
        store,
        api,
        host: config.host,
        port: config.port,
        onListen: ({ host, port }) => ctx.logger?.info?.(`[magpie] gateway http://${host}:${port}`),
      })
      gateway.server.on('error', (err) => {
        listenError = err
        ctx.logger?.error?.(`[magpie] gateway failed: ${err.message}`)
      })
    }).catch((err) => {
      listenError = err
      ctx.logger?.error?.(`[magpie] state failed: ${err.message}`)
    })
    return () => {
      stopped = true
      clearInterval(timer)
      gateway?.close()
    }
  })

  const prompt = typeof ctx.get === 'function' ? ctx.get('systemPrompt') : undefined
  prompt?.section?.({
    name: 'magpie',
    order: 80,
    text: [
      'Magpie is the local model gateway for this Harness.',
      `Gateway: http://${config.host}:${config.port}/v1 (OpenAI Chat and Responses), http://${config.host}:${config.port} (Anthropic), same host (Gemini).`,
      'Use the magpie tool or /magpie for providers, accounts, routing groups, profiles, masking, usage, search, image, video, library, plugins, clients, and sync.',
      'Do not ask the user to paste a raw API key into the chat. Tell them to save it in Settings → Magpie.',
    ].join('\n'),
  })

  ctx.tools.register({
    name: 'magpie',
    description: 'Operate the local Magpie gateway: providers, subscriptions, routing groups, agent models, profiles, masking, usage, search, media, library, plugins, sharing, and sync. action selects the operation; payload is that operation\'s fields.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Operation name. Use action "help" to list them.' },
        payload: { type: 'object', description: 'Fields for the operation. Omit for a read that takes none.', additionalProperties: true },
      },
      required: ['action'],
    },
    output: textOut,
    async execute(args) {
      if (args.action === 'help') return api.ops.join('\n')
      if (listenError && args.action !== 'snapshot') return `gateway is not listening: ${listenError.message}`
      try {
        const result = await api.call(args.action, args.payload ?? {})
        return JSON.stringify(result, null, 2)
      } catch (err) {
        return `magpie ${args.action} failed: ${err.message}`
      }
    },
  })

  ctx.commands.register({
    name: 'magpie',
    description: 'Show Magpie gateway status, or run one control-plane action.',
    input: { hint: 'status | <action> <json>' },
    async handler(invocation) {
      const line = invocation.rawInput.trim()
      if (!line || line === 'status') {
        const info = await api.call('gatewayInfo', { host: config.host, port: config.port }).catch((err) => ({ error: err.message }))
        return { kind: 'success', text: listenError ? `Magpie gateway is down: ${listenError.message}` : `Magpie gateway ${info.baseURL} · token magpie` }
      }
      const space = line.indexOf(' ')
      const action = space === -1 ? line : line.slice(0, space)
      const rest = space === -1 ? '{}' : line.slice(space + 1)
      let payload = {}
      try { payload = JSON.parse(rest) } catch { return { kind: 'error', text: 'payload must be JSON' } }
      try {
        const result = await api.call(action, payload)
        return { kind: 'success', text: JSON.stringify(result).slice(0, 4000) }
      } catch (err) {
        return { kind: 'error', text: err.message }
      }
    },
  })

  }
