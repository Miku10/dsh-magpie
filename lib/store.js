import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { dirname } from 'node:path'
import { clone, now } from './util.js'

const EMPTY = () => ({
  version: 1,
  updatedAt: now(),
  providers: [],
  accounts: [],
  groups: [],
  profiles: [],
  activeProfile: null,
  agents: {},
  favorites: {},
  hidden: {},
  onlyPicked: {},
  prices: {},
  masking: {
    enabled: false,
    secrets: true,
    personal: false,
    modelAssist: false,
    mode: 'mask',
    types: { apiKey: true, privateKey: true, token: true, email: true, card: true, idNumber: false, phone: false, iban: false, mac: false, publicIp: false },
    allow: [],
    denyWords: [],
    customRules: [],
  },
  search: { order: [], keys: {}, pick: 'rotate', disabled: [] },
  media: { imageModel: '', videoModel: '' },
  library: { instructions: [], mcp: [], skills: [], subagents: [] },
  plugins: [],
  middleware: [],
  clients: [],
  remote: { enabled: false, upstream: '' },
  sync: { target: 'file', webdav: null, s3: null },
  privacy: { telemetry: false, accountsDiscovery: true },
  gatewayKeys: [{ id: 'local', name: 'this computer', token: 'magpie', caps: null }],
  usage: [],
  sessions: [],
  decisions: [],
  masks: [],
  quotas: {},
  contextWindows: {},
})

export function createStore(file) {
  let state = EMPTY()
  let writing = Promise.resolve()
  const listeners = new Set()

  async function load() {
    try {
      const raw = await readFile(file, 'utf8')
      const parsed = JSON.parse(raw)
      state = { ...EMPTY(), ...parsed, masking: { ...EMPTY().masking, ...(parsed.masking ?? {}) } }
    } catch (err) {
      if (err?.code !== 'ENOENT') throw err
      state = EMPTY()
      await persist()
    }
    return state
  }

  async function persist() {
    state.updatedAt = now()
    const body = JSON.stringify(state, null, 2)
    writing = writing.then(async () => {
      await mkdir(dirname(file), { recursive: true })
      const tmp = `${file}.tmp`
      await writeFile(tmp, body, { mode: 0o600 })
      await rename(tmp, file)
    })
    await writing
    for (const fn of listeners) fn(state)
  }

  function update(mutator) {
    const draft = clone(state)
    const result = mutator(draft) ?? draft
    state = result
    return persist().then(() => state)
  }

  return {
    get file() { return file },
    get() { return state },
    load,
    update,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
  }
}
