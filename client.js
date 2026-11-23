window.__ModuleLoader__.load({
  id: 'dsh-relay',
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
      return h('input', { ...props, style: { ...inputStyle, ...(props.style ?? {}) } })
    }
    function Button({ children, onClick, disabled }) {
      return h('button', { type: 'button', onClick, disabled, style: buttonStyle }, children)
    }
    function Card({ title, children }) {
      return h('section', { style: cardStyle }, h('h3', { style: h3Style }, title), children)
    }

    const COPY = {
      en: { loading: 'Loading Magpie…', down: 'Magpie is not connected: ', saving: 'Saving…', saved: 'Saved', gateway: 'Every agent, one gateway. 127.0.0.1:3425.', 'tab.providers': 'Providers', 'tab.accounts': 'Accounts', 'tab.groups': 'Routing', 'tab.agents': 'Agents', 'tab.privacy': 'Privacy', 'tab.usage': 'Usage', 'tab.search': 'Search', 'tab.media': 'Media', 'tab.library': 'Library', 'tab.plugins': 'Plugins', 'tab.checkin': 'Check-in', 'tab.share': 'Sharing' },
      zh: { loading: '正在读取 Magpie…', down: 'Magpie 没有连上：', saving: '保存中…', saved: '已保存', gateway: '所有 Agent 的模型，一处搞定。网关 127.0.0.1:3425。', 'tab.providers': '服务商', 'tab.accounts': '账号', 'tab.groups': '路由', 'tab.agents': 'Agent', 'tab.privacy': '隐私', 'tab.usage': '用量', 'tab.search': '搜索', 'tab.media': '媒体', 'tab.library': '资料库', 'tab.plugins': '插件', 'tab.checkin': '签到', 'tab.share': '共享' },
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
      const [tab, setTab] = useState('accounts')
      const [notice, setNotice] = useState('')
      async function run(action, payload) {
        const value = await call(action, payload)
        setNotice(t.saved)
        await reload()
        return value
      }
      const view = data ?? { providers: [], accounts: [], groups: [], agents: [], channels: [], presets: [], profiles: [], masking: { types: {} }, media: {}, library: { instructions: [] }, plugins: [], clients: [], remote: {}, searchProviders: [], usage: [] }
      if (!data && !error) return h('div', { style: pageStyle }, t.loading)
      const tabs = [
        ['usage', '用量看板'], ['routing', '调度看板'], ['accounts', '账号'], ['providers', '服务商'], ['agents', 'Agent'],
      ]
      return h('div', { style: pageStyle },
        h('header', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' } },
          h('div', null, h('h2', { style: { margin: 0, fontSize: 18 } }, '中继'), h('p', { style: muted }, t.gateway)),
          h('span', { style: muted }, busy ? t.saving : notice)),
        error ? h('p', { style: { color: 'var(--dsw-alias-status-error, #d35b5b)' } }, error) : null,
        h('nav', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } }, tabs.map(([id, label]) => h('button', {
          key: id, type: 'button', onClick: () => setTab(id),
          style: { ...buttonStyle, background: tab === id ? 'var(--dsw-alias-bg-module-platform, Highlight)' : 'transparent', borderColor: tab === id ? 'var(--dsw-alias-border-selected, Highlight)' : 'var(--dsw-alias-border-l4, GrayText)', fontWeight: tab === id ? 600 : 400 },
        }, label))),
        tab === 'usage' ? h(UsageBoard, { data: view, run }) : null,
        tab === 'routing' ? h(RoutingBoard, { data: view, run }) : null,
        tab === 'accounts' ? h(ChannelGrid, { data: view, run }) : null,
        tab === 'providers' ? h(Providers, { data: view, run }) : null,
        tab === 'agents' ? h(Agents, { data: view, run }) : null,
        tab === 'search' ? h(SearchPane, { data, run }) : null,
        tab === 'media' ? h(Media, { data, run }) : null,
        tab === 'library' ? h(Library, { data, run }) : null,
        tab === 'plugins' ? h(Plugins, { data, run }) : null,
        tab === 'share' ? h(Share, { data, run }) : null,
      )
    }

    function Providers({ data, run }) {
      const [preset, setPreset] = useState('deepseek')
      const [apiKey, setApiKey] = useState('')
      const [baseURL, setBaseURL] = useState('')
      const [drafts, setDrafts] = useState({})
      return h(Card, { title: '服务商' },
        h('p', { style: muted }, 'API Key 只保存在本机状态文件。保存后这里只显示脱敏预览，不能回看原文。'),
        h('div', { style: formRow },
          h('select', { value: preset, onChange: (e) => setPreset(e.target.value), style: inputStyle },
            data.presets.map((p) => h('option', { key: p.id, value: p.id }, p.name))),
          h(Input, { placeholder: 'API Key', value: apiKey, onChange: (e) => setApiKey(e.target.value), type: 'password', autoComplete: 'off' }),
          h(Input, { placeholder: 'Base URL，可留空', value: baseURL, onChange: (e) => setBaseURL(e.target.value) }),
          h(Button, { onClick: () => run('providerAdd', { preset, apiKey, baseURL: baseURL || undefined }).then(() => setApiKey('')) }, '添加')),
        data.providers.map((p) => h('div', { key: p.id, style: accountRow },
          h('div', { style: { minWidth: 0, flex: '1 1 180px' } },
            h('strong', null, p.name),
            h('div', { style: muted }, `${p.protocol} · ${p.baseURL || '默认地址'} · ${p.apiKeySet ? `已保存 ${p.apiKey}` : '未配置 API Key'}`)),
          h('div', { style: formRow },
            h(Input, { placeholder: p.apiKeySet ? '输入新 Key 以替换' : '粘贴 API Key', type: 'password', autoComplete: 'off', value: drafts[p.id] ?? '', onChange: (e) => setDrafts({ ...drafts, [p.id]: e.target.value }) }),
            h(Button, { onClick: () => run('providerUpdate', { id: p.id, patch: { apiKey: drafts[p.id] || '' } }).then(() => setDrafts({ ...drafts, [p.id]: '' })) }, '保存 Key'),
            p.apiKeySet ? h(Button, { onClick: () => run('providerUpdate', { id: p.id, patch: { apiKey: '' } }) }, '清除') : null,
            h(Button, { onClick: () => run('providerRemove', { id: p.id }) }, '移除')))))
    }

    function UsageBoard({ data, run }) {
      const [report, setReport] = useState(null)
      useEffect(() => { run('usage', {}).then(setReport).catch(() => {}) }, [])
      const totals = report?.totals ?? { calls: 0, usd: 0, input: 0, output: 0 }
      const byModel = {}
      for (const row of report?.rows ?? []) {
        const key = row.model || 'unknown'
        byModel[key] = byModel[key] ?? { calls: 0, usd: 0 }
        byModel[key].calls += 1
        byModel[key].usd += row.cost?.usd ?? 0
      }
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 } },
        h('div', { style: gridStyle },
          [['调用', totals.calls], ['花费', `$${Number(totals.usd).toFixed(4)}`], ['输入', totals.input], ['输出', totals.output]].map(([label, value]) => h('div', { key: label, style: cardStyle }, h('div', { style: muted }, label), h('strong', { style: { fontSize: 20 } }, String(value))))),
        h(Card, { title: '按模型' }, Object.entries(byModel).slice(-8).map(([model, row]) => h('div', { key: model, style: accountRow }, h('span', null, model), h('span', { style: muted }, `${row.calls} 次 · $${row.usd.toFixed(4)}`)))),
        h(Card, { title: '最近请求' }, (report?.rows ?? []).slice(-8).reverse().map((row, i) => h('div', { key: i, style: accountRow }, h('span', null, row.model), h('span', { style: muted }, row.at)))))
    }

    function RoutingBoard({ data, run }) {
      const [rows, setRows] = useState([])
      const [name, setName] = useState('')
      const [members, setMembers] = useState('')
      const [mode, setMode] = useState('smart')
      const [hours, setHours] = useState('09:00-18:00')
      useEffect(() => { run('decisions', {}).then((r) => setRows(r.decisions ?? [])).catch(() => {}) }, [])
      const modes = [['smart', '智能'], ['order', '顺序'], ['rotate', '轮换'], ['usage', '用量'], ['pace', '节奏']]
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 } },
        h(Card, { title: '新建调度规则' },
          h('div', { style: formRow },
            h(Input, { placeholder: '规则名称', value: name, onChange: (e) => setName(e.target.value) }),
            h('select', { value: mode, onChange: (e) => setMode(e.target.value), style: inputStyle }, modes.map(([id, label]) => h('option', { key: id, value: id }, label))),
            h(Input, { placeholder: '成员：provider/model, provider/model', value: members, onChange: (e) => setMembers(e.target.value) }),
            h(Input, { placeholder: '时段 09:00-18:00', value: hours, onChange: (e) => setHours(e.target.value), style: { maxWidth: 150 } }),
            h(Button, { onClick: () => run('groupAdd', { name, mode, members: members.split(',').map((s) => s.trim()).filter(Boolean), hours }).then(() => { setName(''); setMembers('') }) }, '添加规则'))),
        h(Card, { title: '已有规则' },
          data.groups.length ? data.groups.map((g) => h('div', { key: g.id, style: accountRow },
            h('div', { style: { minWidth: 0, flex: '1 1 180px' } },
              h('strong', null, g.name),
              h('div', { style: muted }, `${modes.find((m) => m[0] === g.mode)?.[1] || g.mode} · ${(g.members ?? []).map((m) => m.ref).join(' → ') || '还没有成员'} · ${g.hours || '全天'}`)),
            h('div', { style: formRow },
              h('select', { value: g.mode, onChange: (e) => run('groupUpdate', { id: g.id, patch: { mode: e.target.value } }), style: { ...inputStyle, maxWidth: 120 } }, modes.map(([id, label]) => h('option', { key: id, value: id }, label))),
              h(Button, { onClick: () => run('groupUpdate', { id: g.id, patch: { intent: !g.intent } }) }, g.intent ? '意图开' : '意图关'),
              h(Button, { onClick: () => run('groupRemove', { id: g.id }) }, '删除')))) : h('p', { style: muted }, '还没有调度规则。上面添加后，Agent 可以选 group/名称。')),
        h(Card, { title: '最近调度' }, rows.length ? rows.slice(0, 12).map((row, i) => h('div', { key: i, style: accountRow }, h('span', null, row.member || row.groupId), h('span', { style: muted }, `${row.reason || row.mode || 'order'} · ${row.at}`))) : h('p', { style: muted }, '还没有调度记录。')))
    }

    const DEFAULT_CHANNELS = [
      { id: 'codearts', name: 'CodeArts', org: '华为云', note: 'DeepSeek · GLM · openPangu，每日免费额度', accent: '#C7000B', login: 'browser', claim: true },
      { id: 'buddy', name: 'WorkBuddy 国内版', org: '腾讯 · copilot.tencent.com', note: 'CodeBuddy 同一端点：DeepSeek · Kimi · GLM 免费线，每日积分', accent: '#0A7AFF', login: 'browser', claim: true },
      { id: 'workbuddy', name: 'WorkBuddy 国际版', org: '腾讯 · workbuddy.ai', note: '国际版端点：独立账号与积分体系', accent: '#0B63CE', login: 'browser' },
      { id: 'lobsterai', name: 'LobsterAI', org: '有道', note: '每日签到积分', accent: '#FF6A00', login: 'browser', claim: true },
      { id: 'qoder', name: 'Qoder', org: '阿里系', note: '每日 Credits', accent: '#615CED', login: 'browser', claim: true },
      { id: 'qodercn', name: 'Qoder 中国版', org: '阿里系', note: '中国版端点与模型池', accent: '#7A6CF0', login: 'browser', claim: true },
      { id: 'trae', name: 'TRAE', org: '字节', note: '手机号登录', accent: '#00BFA6', login: 'phone', claim: true },
      { id: 'cline', name: 'Cline', org: 'Cline', note: '账号额度', accent: '#5B5BD6', login: 'browser' },
      { id: 'loomy', name: 'Loomy', org: '讯飞', note: '短信验证码', accent: '#2F6BFF', login: 'phone', claim: true },
      { id: 'raccoon', name: 'Raccoon', org: '商汤', note: '手机号登录', accent: '#00A6A6', login: 'phone' },
      { id: 'minimax', name: 'MiniMax Code', org: 'MiniMax', note: '每日签到', accent: '#E4007F', login: 'browser', claim: true },
      { id: 'zcode', name: 'ZCode', org: '智谱', note: '浏览器登录', accent: '#3B6EF6', login: 'browser', claim: true },
      { id: 'gemini', name: 'Gemini', org: 'Google', note: '本地回调登录', accent: '#4285F4', login: 'browser' },
    ]

    function ChannelCard({ channel, accounts, run, onNote }) {
      const [fold, setFold] = useState('')
      const [phone, setPhone] = useState('')
      const [code, setCode] = useState('')
      const connected = accounts.some((a) => a.tokenSet)
      const models = accounts.reduce((n, a) => n + (a.models?.length ?? 0), 0)
      const mark = channel.name.slice(0, 1)
      return h('article', { style: { ...chanStyle, borderColor: connected ? 'var(--dsw-alias-state-business-primary, #4C8DFF)' : 'var(--dsw-alias-border-l2, GrayText)' } },
        h('div', { style: { height: 2, margin: '-14px -14px 10px', borderRadius: '14px 14px 0 0', background: channel.accent || 'var(--dsw-alias-state-business-primary, #4C8DFF)' } }),
        h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 } },
          h('span', { style: { ...logoStyle, background: channel.accent || '#4C8DFF' } }, mark),
          h('div', { style: { minWidth: 0, flex: 1 } },
            h('strong', null, channel.name),
            h('div', { style: muted }, channel.org)),
          h('span', { style: stateStyle }, h('span', { style: { width: 7, height: 7, borderRadius: 99, background: connected ? '#3ECFA0' : '#8b93a7', display: 'inline-block' } }), connected ? '已接入' : '未接入')),
        h('p', { style: { ...muted, margin: '8px 0' } }, channel.note),
        h('div', { style: metaStyle },
          h('span', null, '账号 ', h('b', null, `${accounts.filter((a) => a.tokenSet).length}/${accounts.length}`)),
          h('span', null, '模型 ', h('b', null, models || '—')),
          h('span', null, '剩余积分 ', h('b', null, '—'))),
        h('div', { style: formRow },
          h('button', { type: 'button', style: actStyle, onClick: () => setFold(fold === 'add' ? '' : 'add') }, '添加账号'),
          h('button', { type: 'button', style: actStyle, onClick: () => run('providerModels', { id: channel.id }).then(() => onNote('余额已刷新')).catch((err) => onNote(err.message)) }, '刷新余额'),
          channel.claim ? h('button', { type: 'button', style: actStyle, onClick: () => run('checkinNow', { providerId: channel.id }).then((r) => onNote(r.results?.[0]?.message || '已领取')).catch((err) => onNote(err.message)) }, '一键领取') : null,
          h('button', { type: 'button', style: foldStyle, onClick: () => setFold(fold === 'accounts' ? '' : 'accounts') }, `${fold === 'accounts' ? '▼' : '▶'} 账号`),
          h('button', { type: 'button', style: foldStyle, onClick: () => setFold(fold === 'models' ? '' : 'models') }, `${fold === 'models' ? '▼' : '▶'} 模型`)),
        fold === 'add' ? h('div', { style: formRow },
          channel.login === 'phone'
            ? h(Fragment, null,
              h(Input, { placeholder: '手机号', value: phone, onChange: (e) => setPhone(e.target.value) }),
              h('button', { type: 'button', style: actStyle, onClick: () => run('phoneSend', { providerId: channel.id, phone }).then(() => onNote('验证码已发送')).catch((err) => onNote(err.message)) }, '发送验证码'),
              h(Input, { placeholder: '验证码', value: code, onChange: (e) => setCode(e.target.value), style: { maxWidth: 110 } }),
              h('button', { type: 'button', style: actStyle, onClick: () => run('phoneVerify', { providerId: channel.id, phone, code }).then(() => onNote('已登录')).catch((err) => onNote(err.message)) }, '登录'))
            : h('button', { type: 'button', style: actStyle, onClick: () => run('channelLogin', { providerId: channel.id }).then((r) => { if (r.url) window.open(r.url, '_blank', 'noopener'); onNote(r.message || '登录页已打开') }).catch((err) => onNote(err.message)) }, '打开登录页')) : null,
        fold === 'accounts' ? h('div', null, accounts.length ? accounts.map((a) => h('div', { key: a.id, style: accountRow },
          h('div', null, h('div', null, a.name || a.phone), h('div', { style: muted }, a.lastCheckin?.outcome || '今天还没签到')),
          h('button', { type: 'button', style: actStyle, onClick: () => run('accountRemove', { id: a.id }) }, '移除'))) : h('p', { style: muted }, '还没有账号')) : null,
        fold === 'models' ? h('p', { style: muted }, models ? accounts.flatMap((a) => a.models ?? []).map((m) => m.id || m).join(' · ') : '登录后刷新模型') : null)
    }

    function ChannelGrid({ data, run }) {
      const [note, setNote] = useState('')
      const c = data.checkin ?? { enabled: false, at: '09:00', last: '' }
      const channels = data.channels?.length ? data.channels : DEFAULT_CHANNELS
      const joined = channels.filter((channel) => data.accounts.some((a) => a.providerId === channel.id && a.tokenSet)).length
      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, width: '100%' } },
        h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' } },
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('button', { type: 'button', role: 'switch', 'aria-checked': !!c.enabled, onClick: () => run('checkinSet', { patch: { enabled: !c.enabled } }), style: { ...switchStyle, background: c.enabled ? 'var(--dsw-alias-state-business-primary, #4C8DFF)' : 'var(--dsw-alias-bg-layer-1, #333)' } }, h('span', { style: { ...knobStyle, transform: c.enabled ? 'translateX(16px)' : 'none' } }), '每日自动签到'),
            h('span', { style: stateStyle }, h('span', { style: { width: 7, height: 7, borderRadius: 99, background: c.last ? '#3ECFA0' : '#8b93a7', display: 'inline-block' } }), c.last ? '今日已自动签到' : '今日尚未签到')),
          h('div', { style: { display: 'flex', gap: 8 } },
            h('span', { style: stateStyle }, `${joined}/${channels.length} 已接入`),
            h('span', { style: stateStyle }, `账号 ${data.accounts.length}`))),
        c.last ? h('p', { style: muted }, `上次结果：${c.last}`) : null,
        note ? h('p', { style: { color: 'var(--dsw-alias-status-error, #d35b5b)', margin: 0 } }, note) : null,
        channels.map((channel) => h(ChannelCard, { key: channel.id, channel, accounts: data.accounts.filter((a) => a.providerId === channel.id), run, onNote: setNote })))
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
          h(Button, { onClick: () => run('groupUpdate', { id: g.id, patch: { sticky: g.sticky === false } }) }, g.sticky === false ? '不粘会话' : '粘住会话'),
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
        h('p', { style: muted }, '只显示这台电脑上会用到的 Agent。常用模型、隐藏模型和“只显示我勾选的”按 Agent 保存，方案会一起带走。'),
        data.agents.filter((a) => a.model).map((a) => h('div', { key: `${a.id}-extra`, style: lineStyle },
          h('span', { style: { width: 140 } }, a.name),
          h(Button, { onClick: () => run('agentFavorites', { agentId: a.id, models: a.model ? [a.model] : [] }) }, '设为常用'),
          h(Button, { onClick: () => run('agentHidden', { agentId: a.id, models: a.hidden, onlyPicked: !a.onlyPicked }) }, a.onlyPicked ? '只显示已选' : '显示新模型')))),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          h(Input, { placeholder: '方案名称', value: profile, onChange: (e) => setProfile(e.target.value) }),
          h(Button, { onClick: () => run('profileSave', { name: profile }) }, '保存方案')),
        data.profiles.map((p) => h('div', { key: p.id, style: lineStyle },
          h('span', null, p.name), h('span', { style: muted }, data.activeProfile === p.id ? '使用中' : ''),
          h(Button, { onClick: () => run('profileUse', { id: p.id }) }, '切换'),
          h(Button, { onClick: () => run('profileRemove', { id: p.id }) }, '删除')))
    }

    function Privacy({ data, run }) {
      const m = data.masking
      const [sample, setSample] = useState('')
      const [preview, setPreview] = useState('')
      return h(Card, { title: '隐私脱敏' },
        h('p', { style: muted }, '默认关闭。打开后，密钥在离开这台电脑前换成占位符，回复里再换回来。原值只在内存里。'),
        h(Button, { onClick: () => run('maskingSet', { patch: { enabled: !m.enabled } }) }, m.enabled ? '脱敏已开' : '脱敏已关'),
        h(Button, { onClick: () => run('maskingSet', { patch: { secrets: !m.secrets } }) }, m.secrets ? '机密开' : '机密关'),
        h(Button, { onClick: () => run('maskingSet', { patch: { personal: !m.personal } }) }, m.personal ? '个人信息开' : '个人信息关'),
        h(Button, { onClick: () => run('maskingSet', { patch: { mode: m.mode === 'block' ? 'warn' : m.mode === 'warn' ? 'mask' : 'block' } }) }, m.mode === 'block' ? '拦截' : m.mode === 'warn' ? '只提醒' : '脱敏'),
        h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } }, Object.keys(m.types).map((key) => h(Button, { key, onClick: () => run('maskingSet', { patch: { types: { [key]: !m.types[key] } } }) }, `${m.types[key] ? '开' : '关'} ${key}`))),
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
        h(Button, { onClick: () => run('remoteSet', { enabled: !data.remote.enabled, upstream: data.remote.upstream }) }, data.remote.enabled ? '远程已开' : '远程已关'),
        h('p', { style: muted }, '同步可备份到文件、WebDAV 或 S3。密钥用口令加密，口令不离开这台电脑。'))
    }

    function Media({ data, run }) {
      const models = data.providers.flatMap((p) => (p.models ?? []).map((m) => `${p.id}/${m.id || m}`))
      return h(Card, { title: '图片和视频' },
        h('div', { style: lineStyle }, h('span', null, '生图模型'), h('select', { value: data.media.imageModel, onChange: (e) => run('mediaSet', { imageModel: e.target.value }), style: inputStyle }, h('option', { value: '' }, '未选'), models.map((m) => h('option', { key: m, value: m }, m)))),
        h('div', { style: lineStyle }, h('span', null, '视频模型'), h('select', { value: data.media.videoModel, onChange: (e) => run('mediaSet', { videoModel: e.target.value }), style: inputStyle }, h('option', { value: '' }, '未选'), models.map((m) => h('option', { key: `v-${m}`, value: m }, m)))),
        h('p', { style: muted }, '网关提供 /v1/images/generations 和 /v1/videos，MCP 也提供 generate_image。'))
    }

    function Plugins({ data, run }) {
      const [name, setName] = useState('')
      const [source, setSource] = useState('function onRequest(body) { if (body.model === "fast") return { ...body, model: "deepseek/deepseek-chat" } }')
      return h(Card, { title: '插件与中间件' },
        h('p', { style: muted }, '中间件能看到每个请求和回复。钩子抛错或超时，请求原样放行。'),
        h(Input, { placeholder: '名称', value: name, onChange: (e) => setName(e.target.value) }),
        h('textarea', { value: source, onChange: (e) => setSource(e.target.value), style: { ...inputStyle, minHeight: 88, width: '100%' } }),
        h(Button, { onClick: () => run('pluginAdd', { name, source, kind: 'middleware' }) }, '添加中间件'),
        data.plugins.map((p) => h('div', { key: p.id, style: lineStyle },
          h('strong', null, p.name), h('span', { style: muted }, p.kind),
          h(Button, { onClick: () => run('pluginSet', { id: p.id, enabled: !p.enabled }) }, p.enabled ? '已开' : '已关'),
          h(Button, { onClick: () => run('pluginRemove', { id: p.id }) }, '移除'))))
    }

    const pageStyle = { display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden', padding: '4px 2px 24px', color: 'var(--dsw-alias-label-primary, CanvasText)', font: '13px/1.5 var(--dsw-alias-font-sans, sans-serif)', colorScheme: 'light dark' }
    const cardStyle = { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box', overflow: 'hidden', padding: 12, border: '1px solid var(--dsw-alias-border-l2, CanvasText)', borderRadius: 12, background: 'var(--dsw-alias-bg-module-platform, Canvas)' }
    const h3Style = { margin: 0, fontSize: 14, fontWeight: 520, color: 'var(--dsw-alias-label-primary, CanvasText)' }
    const muted = { color: 'var(--dsw-alias-label-secondary, GrayText)', fontSize: 12, overflowWrap: 'anywhere' }
    const lineStyle = { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '8px 0', borderBottom: '1px solid var(--dsw-alias-border-l4, GrayText)' }
    const inputStyle = { border: '1px solid var(--dsw-alias-border-l2, CanvasText)', background: 'var(--dsw-alias-bg-input, Field)', color: 'var(--dsw-alias-label-primary, CanvasText)', borderRadius: 8, padding: '6px 8px', font: 'inherit', minHeight: 32, width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }
    const buttonStyle = { border: '1px solid var(--dsw-alias-border-l2, CanvasText)', background: 'var(--dsw-alias-interactive-bg-hover, ButtonFace)', color: 'var(--dsw-alias-label-primary, ButtonText)', borderRadius: 8, padding: '6px 10px', font: 'inherit', cursor: 'pointer', maxWidth: '100%', whiteSpace: 'nowrap' }
    const labelStyle = { width: 88, fontSize: 12 }
    const pill = { border: '1px solid var(--dsw-alias-border-l4, GrayText)', borderRadius: 999, padding: '2px 8px', color: 'var(--dsw-alias-label-secondary, GrayText)', fontSize: 12 }
    const rowStyle = { display: 'flex', gap: 8, alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }
    const formRow = { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', width: '100%', minWidth: 0 }
    const vendorHead = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', width: '100%', border: 0, background: 'transparent', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0, textAlign: 'left' }
    const accountRow = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%', minWidth: 0, padding: '8px 0', borderTop: '1px solid var(--dsw-alias-border-l4, GrayText)' }
    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, width: '100%', minWidth: 0 }
    const chanStyle = { ...cardStyle, borderRadius: 16, padding: 14, background: 'var(--dsw-alias-bg-layer-2, Canvas)' }
    const logoStyle = { width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, flex: '0 0 auto' }
    const stateStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 10px', background: 'var(--dsw-alias-bg-layer-1, ButtonFace)', color: 'var(--dsw-alias-label-secondary, GrayText)', fontSize: 12 }
    const metaStyle = { display: 'flex', gap: 14, flexWrap: 'wrap', color: 'var(--dsw-alias-label-secondary, GrayText)', fontSize: 13 }
    const actStyle = { ...buttonStyle, borderRadius: 10, background: 'var(--dsw-alias-bg-layer-1, ButtonFace)' }
    const foldStyle = { ...buttonStyle, border: 0, background: 'transparent', color: 'var(--dsw-alias-label-secondary, GrayText)' }
    const switchStyle = { display: 'inline-flex', alignItems: 'center', gap: 8, border: 0, borderRadius: 999, padding: '4px 12px 4px 4px', color: '#fff', font: 'inherit', cursor: 'pointer' }
    const knobStyle = { width: 18, height: 18, borderRadius: 99, background: '#fff', display: 'inline-block', transition: 'transform .18s ease' }
    const Fragment = React.Fragment
    const preStyle = { margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12, maxHeight: 220, maxWidth: '100%', overflow: 'auto', color: 'var(--dsw-alias-label-primary, CanvasText)', background: 'var(--dsw-alias-bg-input, Canvas)', borderRadius: 8, padding: 8, boxSizing: 'border-box' }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'relay', order: 45, label: '中继',
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
