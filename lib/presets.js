/**
 * Built-in provider presets. A preset is a base URL, protocol, and how to
 * list models. Custom OpenAI/Anthropic/Gemini endpoints use protocol "custom".
 * Subscription presets are signed in through a browser or device flow and
 * then used like any other provider.
 */

export const PROTOCOLS = ['openai-chat', 'openai-responses', 'anthropic', 'gemini']

export const PRESETS = [
  { id: 'anthropic', name: 'Anthropic', protocol: 'anthropic', baseURL: 'https://api.anthropic.com', auth: 'x-api-key', modelsPath: '/v1/models' },
  { id: 'openai', name: 'OpenAI', protocol: 'openai-chat', baseURL: 'https://api.openai.com/v1', auth: 'bearer', modelsPath: '/models', responses: true },
  { id: 'google', name: 'Google Gemini', protocol: 'gemini', baseURL: 'https://generativelanguage.googleapis.com/v1beta', auth: 'query', modelsPath: '/models' },
  { id: 'deepseek', name: 'DeepSeek', protocol: 'openai-chat', baseURL: 'https://api.deepseek.com', auth: 'bearer', modelsPath: '/models', currency: 'USD' },
  { id: 'moonshot', name: 'Kimi', protocol: 'openai-chat', baseURL: 'https://api.moonshot.cn/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'zhipu', name: '智谱 GLM', protocol: 'openai-chat', baseURL: 'https://open.bigmodel.cn/api/paas/v4', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'minimax', name: 'MiniMax', protocol: 'openai-chat', baseURL: 'https://api.minimax.chat/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'stepfun', name: '阶跃星辰', protocol: 'openai-chat', baseURL: 'https://api.stepfun.com/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'longcat', name: 'LongCat', protocol: 'openai-chat', baseURL: 'https://api.longcat.chat/openai/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'qwen', name: '通义千问', protocol: 'openai-chat', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'qianfan', name: '百度千帆', protocol: 'openai-chat', baseURL: 'https://qianfan.baidubce.com/v2', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'tencent', name: '腾讯云', protocol: 'openai-chat', baseURL: 'https://api.lkeap.cloud.tencent.com/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'huawei', name: '华为云 MaaS', protocol: 'openai-chat', baseURL: 'https://api.modelarts-maas.com/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'volcengine', name: '火山方舟', protocol: 'openai-chat', baseURL: 'https://ark.cn-beijing.volces.com/api/v3', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'mistral', name: 'Mistral', protocol: 'openai-chat', baseURL: 'https://api.mistral.ai/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'groq', name: 'Groq', protocol: 'openai-chat', baseURL: 'https://api.groq.com/openai/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'xai', name: 'xAI', protocol: 'openai-chat', baseURL: 'https://api.x.ai/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'openrouter', name: 'OpenRouter', protocol: 'openai-chat', baseURL: 'https://openrouter.ai/api/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'together', name: 'Together', protocol: 'openai-chat', baseURL: 'https://api.together.xyz/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'fireworks', name: 'Fireworks', protocol: 'openai-chat', baseURL: 'https://api.fireworks.ai/inference/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'siliconflow', name: '硅基流动', protocol: 'openai-chat', baseURL: 'https://api.siliconflow.cn/v1', auth: 'bearer', modelsPath: '/models', currency: 'CNY' },
  { id: 'nvidia', name: 'NVIDIA NIM', protocol: 'openai-chat', baseURL: 'https://integrate.api.nvidia.com/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'modelscope', name: '魔搭', protocol: 'openai-chat', baseURL: 'https://api-inference.modelscope.cn/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'ollama', name: 'Ollama', protocol: 'openai-chat', baseURL: 'http://127.0.0.1:11434/v1', auth: 'none', modelsPath: '/models', local: true },
  { id: 'lmstudio', name: 'LM Studio', protocol: 'openai-chat', baseURL: 'http://127.0.0.1:1234/v1', auth: 'none', modelsPath: '/models', local: true },
  { id: 'voyage', name: 'Voyage AI', protocol: 'openai-chat', baseURL: 'https://api.voyageai.com/v1', auth: 'bearer', modelsPath: '/models', kind: 'embedding' },
  { id: 'bedrock', name: 'Amazon Bedrock', protocol: 'openai-chat', baseURL: 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'vercel', name: 'Vercel AI Gateway', protocol: 'openai-chat', baseURL: 'https://ai-gateway.vercel.sh/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'gmi', name: 'GMI Cloud', protocol: 'openai-chat', baseURL: 'https://api.gmi-serving.com/v1', auth: 'bearer', modelsPath: '/models' },
  { id: 'nous', name: 'Nous Portal', protocol: 'openai-chat', baseURL: 'https://inference-api.nousresearch.com/v1', auth: 'bearer', modelsPath: '/models' },
]

export const SUBSCRIPTIONS = [
  { id: 'claude', name: 'Claude', protocol: 'anthropic', hint: 'Sign in with the Claude account this computer already uses, or paste a session token from claude.ai.' },
  { id: 'codex', name: 'Codex / ChatGPT', protocol: 'openai-responses', hint: 'Sign in with the ChatGPT subscription. Its models become available to every agent.' },
  { id: 'copilot', name: 'GitHub Copilot', protocol: 'openai-chat', hint: 'Device-code sign-in against GitHub. The Copilot token is refreshed locally.' },
  { id: 'gemini', name: 'Gemini Code Assist', protocol: 'gemini', hint: 'Sign in with the Google account used by Gemini CLI / Code Assist.' },
  { id: 'grok', name: 'Grok', protocol: 'openai-chat', hint: 'Sign in with a SuperGrok subscription, or paste the session this computer already has.' },
  { id: 'antigravity', name: 'Antigravity', protocol: 'gemini', hint: 'Uses the agy CLI already signed in on this computer. No token is copied.' },
]

export const SEARCH_PROVIDERS = [
  { id: 'tavily', name: 'Tavily', baseURL: 'https://api.tavily.com/search' },
  { id: 'brave', name: 'Brave', baseURL: 'https://api.search.brave.com/res/v1/web/search' },
  { id: 'exa', name: 'Exa', baseURL: 'https://api.exa.ai/search' },
  { id: 'firecrawl', name: 'Firecrawl', baseURL: 'https://api.firecrawl.dev/v1/search' },
  { id: 'you', name: 'You.com', baseURL: 'https://api.ydc-index.io/search' },
  { id: 'deepseek', name: 'DeepSeek', baseURL: 'model' },
  { id: 'volcengine', name: '火山引擎豆包搜索', baseURL: 'model' },
  { id: 'tencent', name: '腾讯云元宝搜索', baseURL: 'model' },
  { id: 'tinyfish', name: 'TinyFish', baseURL: 'https://api.tinyfish.ai/search' },
  { id: 'searxng', name: 'SearXNG', baseURL: 'http://127.0.0.1:8080/search' },
]

export const AGENTS = [
  ['claude', 'Claude Code'], ['claude-desktop', 'Claude Desktop'], ['codex', 'Codex'],
  ['gemini', 'Gemini CLI'], ['opencode', 'OpenCode'], ['pi', 'Pi'], ['goose', 'Goose'],
  ['cursor', 'Cursor CLI'], ['zed', 'Zed'], ['vscode', 'VS Code Chat'], ['copilot', 'Copilot CLI'],
  ['crush', 'Crush'], ['dsh', 'DeepSeek Harness'], ['hermes', 'Hermes Agent'], ['kimi', 'Kimi Code'],
  ['qwen', 'Qwen Code'], ['cline', 'Cline'], ['droid', 'Droid'], ['openclaw', 'OpenClaw'],
  ['raycast', 'Raycast'], ['grok', 'Grok Build'], ['custom', 'Any base-URL client'],
].map(([id, name]) => ({ id, name }))

export function presetById(id) {
  return PRESETS.find((p) => p.id === id) ?? SUBSCRIPTIONS.find((p) => p.id === id) ?? null
}

export const DEFAULT_PRICES = {
  'deepseek-chat': { in: 0.27, out: 1.1, cacheRead: 0.07 },
  'deepseek-reasoner': { in: 0.55, out: 2.19, cacheRead: 0.14 },
  'gpt-4o': { in: 2.5, out: 10 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'claude-sonnet-4-5': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  'gemini-2.5-pro': { in: 1.25, out: 10 },
  'gemini-2.5-flash': { in: 0.15, out: 0.6 },
}

export function priceFor(modelId, custom) {
  if (custom && custom[modelId]) return custom[modelId]
  const key = Object.keys(DEFAULT_PRICES).find((k) => String(modelId).includes(k))
  return key ? DEFAULT_PRICES[key] : { in: 1, out: 2 }
}

export function estimateCost(modelId, usage, custom, currency = 'USD') {
  const p = priceFor(modelId, custom)
  const input = Number(usage?.inputTokens ?? usage?.prompt_tokens ?? 0)
  const output = Number(usage?.outputTokens ?? usage?.completion_tokens ?? 0)
  const cacheRead = Number(usage?.cacheReadTokens ?? usage?.cache_read_input_tokens ?? 0)
  const cacheWrite = Number(usage?.cacheWriteTokens ?? 0)
  const usd = (input * (p.in ?? 1) + output * (p.out ?? 2) + cacheRead * (p.cacheRead ?? 0) + cacheWrite * (p.cacheWrite ?? 0)) / 1_000_000
  return { usd, cny: usd * 7.2, currency, input, output, cacheRead, cacheWrite }
}
