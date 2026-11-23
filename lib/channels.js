/** Provider cards. Phone channels take a code; the others open their own page. */

export const CHANNELS = [
  { id: 'codearts', name: 'CodeArts', org: '华为云', note: 'DeepSeek · GLM · openPangu，每日免费额度', accent: '#C7000B', login: 'browser', claim: true },
  { id: 'buddy', name: 'WorkBuddy 国内版', org: '腾讯 · copilot.tencent.com', note: 'CodeBuddy 同一端点：DeepSeek · Kimi · GLM 免费线，每日积分', accent: '#0A7AFF', login: 'browser', claim: true },
  { id: 'workbuddy', name: 'WorkBuddy 国际版', org: '腾讯 · workbuddy.ai', note: '国际版端点：独立账号与积分体系', accent: '#0B63CE', login: 'browser' },
  { id: 'lobsterai', name: 'LobsterAI', org: '有道', note: '每日签到积分', login: 'browser', claim: true },
  { id: 'qoder', name: 'Qoder', org: '阿里系', note: '每日 Credits', login: 'browser', claim: true },
  { id: 'qodercn', name: 'Qoder 中国版', org: '阿里系', note: '中国版模型池', login: 'browser', claim: true },
  { id: 'trae', name: 'TRAE', org: '字节', note: '手机号登录', login: 'phone', claim: true },
  { id: 'cline', name: 'Cline', org: 'Cline', note: '账号额度', login: 'browser' },
  { id: 'loomy', name: 'Loomy', org: '讯飞', note: '短信验证码', login: 'phone', claim: true },
  { id: 'raccoon', name: 'Raccoon', org: '商汤', note: '手机号登录', login: 'phone' },
  { id: 'minimax', name: 'MiniMax Code', org: 'MiniMax', note: '每日签到', login: 'browser', claim: true },
  { id: 'zcode', name: 'ZCode', org: '智谱', note: '浏览器登录', login: 'browser', claim: true },
  { id: 'gemini', name: 'Gemini', org: 'Google', note: '本地回调登录', login: 'browser' },
]

export function channelById(id) {
  return CHANNELS.find((c) => c.id === id) ?? null
}
