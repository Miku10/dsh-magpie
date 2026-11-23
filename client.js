window.__ModuleLoader__.load({
  id: '@local/dsh-magpie',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useState } = React

    function useMagpie() {
      const [data, setData] = useState(null)
      const [error, setError] = useState('')
      const [busy, setBusy] = useState(false)
      async function call(action, payload) {
        setBusy(true)
        setError('')
        try {
          const res = await fetch('http://127.0.0.1:3425/v1/magpie/call', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action, payload: payload ?? {} }),
          })
          const text = await res.text()
          if (!text) throw new Error(`empty response (HTTP ${res.status})`)
          let json
          try { json = JSON.parse(text) } catch { throw new Error(text.slice(0, 180) || `HTTP ${res.status}`) }
          if (!json.ok) throw new Error(json.error?.message || `HTTP ${res.status}`)
          if (action === 'snapshot' || json.value?.providers) setData(json.value)
          return json.value
        } catch (err) {
          setError(err.message)
          throw err
        } finally {
          setBusy(false)
        }
      }
      useEffect(() => { call('snapshot').catch(() => {}) }, [])
      return { data, error, busy, call, reload: () => call('snapshot') }
    }

    function Field({ label, children }) {
      return h('label', { style: rowStyle }, h('span', { style: labelStyle }, label), children)
    }
    function Input(props) {
      return h('input', { ...props, style: { ...inputStyle, ...props.style } })
    }
    function Button({ children, onClick, disabled }) {
      return h('button', { type: 'button', onClick, disabled, style: buttonStyle }, children)
    }
    function Card({ title, children }) {
      return h('section', { style: cardStyle }, h('h3', { style: h3Style }, title), children)
    }

    const COPY = {
      en: { loading: 'Loading Magpie…', down: 'Magpie is not connected: ', saving: 'Saving…', saved: 'Saved', gateway: 'Every agent, one gateway. 127.0.0.1:3425.', 'tab.providers': 'Providers', 'tab.groups': 'Routing', 'tab.agents': 'Agents', 'tab.privacy': 'Privacy', 'tab.usage': 'Usage', 'tab.search': 'Search', 'tab.library': 'Library', 'tab.share': 'Sharing' },
      zh: { loading: '正在读取 Magpie…', down: 'Magpie 没有连上：', saving: '保存中…', saved: '已保存', gateway: '所有 Agent 的模型，一处搞定。网关 127.0.0.1:3425。', 'tab.providers': '服务商', 'tab.groups': '路由', 'tab.agents': 'Agent', 'tab.privacy': '隐私', 'tab.usage': '用量', 'tab.search': '搜索', 'tab.library': '资料库', 'tab.share': '共享' },
      ja: { loading: 'Magpie を読み込み中…', down: 'Magpie に接続できません：', saving: '保存中…', saved: '保存しました', gateway: 'すべてのエージェントを一つのゲートウェイへ。127.0.0.1:3425。', 'tab.providers': 'プロバイダ', 'tab.groups': 'ルーティング', 'tab.agents': 'エージェント', 'tab.privacy': 'プライバシー', 'tab.usage': '使用量', 'tab.search': '検索', 'tab.library': 'ライブラリ', 'tab.share': '共有' },
      de: { loading: 'Magpie wird geladen…', down: 'Magpie ist nicht verbunden: ', saving: 'Speichern…', saved: 'Gespeichert', gateway: 'Jeder Agent, ein Gateway. 127.0.0.1:3425.', 'tab.providers': 'Anbieter', 'tab.groups': 'Routing', 'tab.agents': 'Agenten', 'tab.privacy': 'Datenschutz', 'tab.usage': 'Verbrauch', 'tab.search': 'Suche', 'tab.library': 'Bibliothek', 'tab.share': 'Freigabe' },
      es: { loading: 'Cargando Magpie…', down: 'Magpie no está conectado: ', saving: 'Guardando…', saved: 'Guardado', gateway: 'Todos los agentes, una pasarela. 127.0.0.1:3425.', 'tab.providers': 'Proveedores', 'tab.groups': 'Enrutado', 'tab.agents': 'Agentes', 'tab.privacy': 'Privacidad', 'tab.usage': 'Uso', 'tab.search': 'Búsqueda', 'tab.library': 'Biblioteca', 'tab.share': 'Compartir' },
      fr: { loading: 'Chargement de Magpie…', down: 'Magpie n’est pas connecté : ', saving: 'Enregistrement…', saved: 'Enregistré', gateway: 'Tous les agents, une passerelle. 127.0.0.1:3425.', 'tab.providers': 'Fournisseurs', 'tab.groups': 'Routage', 'tab.agents': 'Agents', 'tab.privacy': 'Confidentialité', 'tab.usage': 'Usage', 'tab.search': 'Recherche', 'tab.library': 'Bibliothèque', 'tab.share': 'Partage' },
      pt: { loading: 'Carregando Magpie…', down: 'Magpie não está ligado: ', saving: 'Salvando…', saved: 'Salvo', gateway: 'Todos os agentes, um gateway. 127.0.0.1:3425.', 'tab.providers': 'Provedores', 'tab.groups': 'Roteamento', 'tab.agents': 'Agentes', 'tab.privacy': 'Privacidade', 'tab.usage': 'Uso', 'tab.search': 'Busca', 'tab.library': 'Biblioteca', 'tab.share': 'Partilha' },
      ru: { loading: 'Загрузка Magpie…', down: 'Magpie не подключён: ', saving: 'Сохранение…', saved: 'Сохранено', gateway: 'Все агенты, один шлюз. 127.0.0.1:3425.', 'tab.providers': 'Провайдеры', 'tab.groups': 'Маршруты', 'tab.agents': 'Агенты', 'tab.privacy': 'Конфиденциальность', 'tab.usage': 'Учёт', 'tab.search': 'Поиск', 'tab.library': 'Библиотека', 'tab.share': 'Доступ' },
    }

    function localeCopy() {
      const lang = (document.documentElement.lang || navigator.language || 'en').toLowerCase()
      const key = lang.startsWith('zh') ? 'zh' : lang.slice(0, 2)
      return COPY[key] || COPY.en
    }

    function MagpiePage() {
      const t = localeCopy()
      const { data, error, busy, call, reload } = useMagpie()
      const [tab, setTab] = useState('providers')
      const [notice, setNotice] = useState('')
      async function run(action, payload) {
        const value = await call(action, payload)
        setNotice(t.saved)
        await reload()
        return value
      }
      if (!data) return h('div', { style: pageStyle }, error ? `${t.down}${error}` : t.loading)
      const tabs = [
        ['providers', t['tab.providers']], ['groups', t['tab.groups']], ['agents', t['tab.agents']], ['privacy', t['tab.privacy']],
        ['usage', t['tab.usage']], ['search', t['tab.search']], ['library', t['tab.library']], ['share', t['tab.share']],
      ]
      return h('div', { style: pageStyle },
        h('header', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' } },
          h('div', null, h('h2', { style: { margin: 0, fontSize: 18 } }, 'Magpie'), h('p', { style: muted }, t.gateway)),
          h('span', { style: muted }, busy ? t.saving : notice)),
        error ? h('p', { style: { color: 'var(--dsw-alias-status-error, #d35b5b)' } }, error) : null,
        h('nav', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } }, tabs.map(([id, label]) => h('button', {
          key: id, type: 'button', onClick: () => setTab(id),
          style: { ...buttonStyle, background: tab === id ? 'var(--dsw-alias-bg-module-platform, Highlight)' : 'transparent', borderColor: tab === id ? 'var(--dsw-alias-border-selected, Highlight)' : 'var(--dsw-alias-border-l4, GrayText)', fontWeight: tab === id ? 600 : 400 },
        }, label))),
        tab === 'providers' ? h(Providers, { data, run }) : null,
        tab === 'groups' ? h(Groups, { data, run }) : null,
        tab === 'agents' ? h(Agents, { data, run }) : null,
        tab === 'privacy' ? h(Privacy, { data, run }) : null,
        tab === 'usage' ? h(Usage, { data, run }) : null,
        tab === 'search' ? h(SearchPane, { data, run }) : null,
        tab === 'library' ? h(Library, { data, run }) : null,
        tab === 'share' ? h(Share, { data, run }) : null,
      )
    }

    function Providers({ data, run }) {
      const [preset, setPreset] = useState('deepseek')
      const [apiKey, setApiKey] = useState('')
      const [baseURL, setBaseURL] = useState('')
      return h(Card, { title: '服务商与订阅' },
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('select', { value: preset, onChange: (e) => setPreset(e.target.value), style: inputStyle },
            data.presets.map((p) => h('option', { key: p.id, value: p.id }, p.name)),
            data.subscriptions.map((p) => h('option', { key: p.id, value: p.id }, `订阅 · ${p.name}`))),
          h(Input, { placeholder: 'API key 或订阅 token', value: apiKey, onChange: (e) => setApiKey(e.target.value), type: 'password' }),
          h(Input, { placeholder: '自定义 base URL（可空）', value: baseURL, onChange: (e) => setBaseURL(e.target.value) }),
          h(Button, { onClick: () => run(data.subscriptions.some((s) => s.id === preset) ? 'subscriptionStart' : 'providerAdd', { preset, id: preset, apiKey, token: apiKey, baseURL: baseURL || undefined }).then(() => setApiKey('')) }, '添加')),
        data.providers.map((p) => h('div', { key: p.id, style: lineStyle },
          h('strong', null, p.name),
          h('span', { style: muted }, `${p.protocol} · ${(p.models ?? []).length} 个模型 · ${p.apiKeySet ? '已有密钥' : '无密钥'}`),
          h(Button, { onClick: () => run('providerModels', { id: p.id }) }, '刷新模型'),
          h(Button, { onClick: () => run('providerRemove', { id: p.id }) }, '移除'))),
      )
    }

    function Groups({ data, run }) {
      const [name, setName] = useState('')
      const [members, setMembers] = useState('')
      const [mode, setMode] = useState('smart')
      return h(Card, { title: '路由组' },
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h(Input, { placeholder: '名称', value: name, onChange: (e) => setName(e.target.value) }),
          h(Input, { placeholder: 'provider/model, provider/model', value: members, onChange: (e) => setMembers(e.target.value), style: { minWidth: 280 } }),
          h('select', { value: mode, onChange: (e) => setMode(e.target.value), style: inputStyle }, ['smart', 'order', 'rotate', 'usage', 'pace'].map((m) => h('option', { key: m, value: m }, m))),
          h(Button, { onClick: () => run('groupAdd', { name, mode, members: members.split(',').map((s) => s.trim()).filter(Boolean) }) }, '新建')),
        data.groups.map((g) => h('div', { key: g.id, style: lineStyle },
          h('strong', null, `group/${g.id}`),
          h('span', { style: muted }, `${g.mode} · ${(g.members ?? []).map((m) => m.ref).join(' → ') || '空'}`),
          h(Button, { onClick: () => run('groupUpdate', { id: g.id, patch: { intent: !g.intent } }) }, g.intent ? '意图路由开' : '意图路由关'),
          h(Button, { onClick: () => run('groupRemove', { id: g.id }) }, '删除'))))
    }

    function Agents({ data, run }) {
      const models = data.providers.flatMap((p) => (p.models ?? []).map((m) => `${p.id}/${m.id || m}`))
      const [profile, setProfile] = useState('')
      return h(Card, { title: '每个 Agent 的模型' },
        data.agents.map((a) => h('div', { key: a.id, style: lineStyle },
          h('span', { style: { width: 140 } }, a.name),
          h('select', { value: a.model, onChange: (e) => run('agentSet', { agentId: a.id, model: e.target.value }), style: inputStyle },
            h('option', { value: '' }, '未连接'),
            models.map((m) => h('option', { key: m, value: m }, m)),
            data.groups.map((g) => h('option', { key: g.id, value: `group/${g.id}` }, `group/${g.id}`))))),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          h(Input, { placeholder: '方案名称', value: profile, onChange: (e) => setProfile(e.target.value) }),
          h(Button, { onClick: () => run('profileSave', { name: profile }) }, '保存方案')),
        data.profiles.map((p) => h('div', { key: p.id, style: lineStyle },
          h('span', null, p.name), h('span', { style: muted }, data.activeProfile === p.id ? '使用中' : ''),
          h(Button, { onClick: () => run('profileUse', { id: p.id }) }, '切换'),
          h(Button, { onClick: () => run('profileRemove', { id: p.id }) }, '删除'))))
    }

    function Privacy({ data, run }) {
      const m = data.masking
      const [sample, setSample] = useState('')
      const [preview, setPreview] = useState('')
      return h(Card, { title: '隐私脱敏' },
        h('p', { style: muted }, '默认关闭。打开后，密钥在离开这台电脑前换成占位符，回复里再换回来。原值只在内存里。'),
        h(Button, { onClick: () => run('maskingSet', { patch: { enabled: !m.enabled } }) }, m.enabled ? '脱敏已开' : '脱敏已关'),
        h(Button, { onClick: () => run('maskingSet', { patch: { mode: m.mode === 'mask' ? 'block' : 'mask' } }) }, m.mode === 'block' ? '遇到就拦截' : '遇到就脱敏'),
        h('textarea', { value: sample, onChange: (e) => setSample(e.target.value), style: { ...inputStyle, minHeight: 72, width: '100%' }, placeholder: '贴一段文字，看它会变成什么' }),
        h(Button, { onClick: () => run('maskingTry', { text: sample }).then((r) => setPreview(r.text)) }, '试一试'),
        preview ? h('pre', { style: preStyle }, preview) : null)
    }

    function Usage({ data, run }) {
      const [report, setReport] = useState(null)
      useEffect(() => { run('usage', {}).then(setReport).catch(() => {}) }, [])
      return h(Card, { title: '用量和花费' },
        report ? h('p', null, `${report.totals.calls} 次调用 · $${report.totals.usd.toFixed(4)} · 输入 ${report.totals.input} · 输出 ${report.totals.output}`) : '读取中…',
        h('pre', { style: preStyle }, JSON.stringify((report?.rows ?? []).slice(-8), null, 2)))
    }

    function SearchPane({ data, run }) {
      const [providerId, setProviderId] = useState('tavily')
      const [value, setValue] = useState('')
      const [query, setQuery] = useState('')
      const [hits, setHits] = useState(null)
      return h(Card, { title: '联网搜索' },
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('select', { value: providerId, onChange: (e) => setProviderId(e.target.value), style: inputStyle }, data.searchProviders.map((p) => h('option', { key: p.id, value: p.id }, p.name))),
          h(Input, { placeholder: '密钥', value, onChange: (e) => setValue(e.target.value), type: 'password' }),
          h(Button, { onClick: () => run('searchAddKey', { providerId, value }).then(() => setValue('')) }, '添加密钥')),
        h('div', { style: { display: 'flex', gap: 8 } },
          h(Input, { placeholder: '搜索', value: query, onChange: (e) => setQuery(e.target.value) }),
          h(Button, { onClick: () => run('search', { query }).then(setHits) }, '搜索')),
        hits ? h('pre', { style: preStyle }, JSON.stringify(hits.hits ?? hits, null, 2)) : null)
    }

    function Library({ data, run }) {
      const [text, setText] = useState('')
      return h(Card, { title: '资料库' },
        h('p', { style: muted }, '指令、MCP、技能和子代理只写一次。渲染结果只包含 Magpie 自己写的片段。'),
        h('textarea', { value: text, onChange: (e) => setText(e.target.value), style: { ...inputStyle, minHeight: 72, width: '100%' }, placeholder: '一条指令' }),
        h(Button, { onClick: () => run('libraryAdd', { kind: 'instructions', item: { text, agents: ['*'] } }).then(() => setText('')) }, '添加指令'),
        (data.library.instructions ?? []).map((i) => h('div', { key: i.id, style: lineStyle }, h('span', null, i.text.slice(0, 80)), h(Button, { onClick: () => run('libraryRemove', { kind: 'instructions', id: i.id }) }, '删除'))))
    }

    function Share({ data, run }) {
      const [name, setName] = useState('')
      return h(Card, { title: '共享、远程和同步' },
        h('p', { style: muted }, `局域网客户端使用网关密钥。远程上游：${data.remote.upstream || '未设置'}。`),
        h('div', { style: { display: 'flex', gap: 8 } },
          h(Input, { placeholder: '客户端名称', value: name, onChange: (e) => setName(e.target.value) }),
          h(Button, { onClick: () => run('clientAdd', { name, caps: { window: 'day', tokens: 1000000 } }) }, '发一把密钥')),
        data.clients.map((c) => h('div', { key: c.id, style: lineStyle }, h('span', null, c.name), h('span', { style: muted }, c.token))),
        h(Button, { onClick: () => run('remoteSet', { enabled: !data.remote.enabled, upstream: data.remote.upstream }) }, data.remote.enabled ? '远程已开' : '远程已关'))
    }

    const pageStyle = { display: 'flex', flexDirection: 'column', gap: 12, padding: 4, color: 'var(--dsw-alias-label-primary, CanvasText)', font: '13px/1.5 var(--dsw-alias-font-sans, sans-serif)', colorScheme: 'light dark' }
    const cardStyle = { display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--dsw-alias-border-l2, CanvasText)', borderRadius: 12, background: 'var(--dsw-alias-bg-module-platform, Canvas)' }
    const h3Style = { margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary, CanvasText)' }
    const muted = { color: 'var(--dsw-alias-label-secondary, GrayText)', fontSize: 12 }
    const lineStyle = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--dsw-alias-border-l4, GrayText)' }
    const inputStyle = { border: '1px solid var(--dsw-alias-border-l2, CanvasText)', background: 'var(--dsw-alias-bg-input, Field)', color: 'var(--dsw-alias-label-primary, CanvasText)', borderRadius: 8, padding: '6px 8px', font: 'inherit', minHeight: 32 }
    const buttonStyle = { border: '1px solid var(--dsw-alias-border-l2, CanvasText)', background: 'var(--dsw-alias-interactive-bg-hover, ButtonFace)', color: 'var(--dsw-alias-label-primary, ButtonText)', borderRadius: 8, padding: '6px 10px', font: 'inherit', cursor: 'pointer' }
    const labelStyle = { width: 88, fontSize: 12 }
    const rowStyle = { display: 'flex', gap: 8, alignItems: 'center' }
    const preStyle = { margin: 0, whiteSpace: 'pre-wrap', fontSize: 12, maxHeight: 220, overflow: 'auto', color: 'var(--dsw-alias-label-primary, CanvasText)', background: 'var(--dsw-alias-bg-input, Canvas)', borderRadius: 8, padding: 8 }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'magpie', order: 45, label: 'Magpie',
        }, MagpiePage))
        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon', id: 'magpie', order: 45,
        }, function MagpieIcon({ size }) {
          return h('svg', { width: size, height: size, viewBox: '0 0 36 36', 'aria-hidden': true },
            h('path', { d: 'M18 7c.6 2.2 1.4 3.8 2.8 5.2 1.4 1.4 3 2.2 5.2 2.8-2.2.6-3.8 1.4-5.2 2.8-1.4 1.4-2.2 3-2.8 5.2-.6-2.2-1.4-3.8-2.8-5.2-1.4-1.4-3-2.2-5.2-2.8 2.2-.6 3.8-1.4 5.2-2.8 1.4-1.4 2.2-3 2.8-5.2Z', fill: 'currentColor' }))
        }))
      },
    }
  },
})
