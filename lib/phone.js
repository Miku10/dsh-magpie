/**
 * Phone sign-in for a provider that accepts a mobile number, and the daily
 * check-in those accounts can run. The verification code is sent to the
 * provider and is not stored. Check-in calls the provider's own check-in URL.
 */

const PHONE = /^\+?[0-9]{8,15}$/

export const PHONE_PROVIDERS = [
  { id: 'workbuddy', name: 'WorkBuddy', checkin: true },
  { id: 'trae', name: 'Trae CN', checkin: true },
  { id: 'minimax', name: 'MiniMax Code', checkin: true },
  { id: 'qoder', name: 'Qoder', checkin: true },
  { id: 'qoder-cn', name: 'Qoder CN', checkin: true },
]

export function normalizePhone(phone) {
  const digits = String(phone ?? '').replace(/[^\d+]/g, '')
  if (!PHONE.test(digits)) throw Object.assign(new Error('phone number looks wrong'), { status: 400 })
  return digits.startsWith('+') ? digits : `+86${digits.replace(/^86/, '')}`
}

export async function sendCode(provider, phone, signal) {
  if (!provider.smsURL) throw Object.assign(new Error(`${provider.name} has no SMS endpoint configured`), { status: 400 })
  const res = await fetch(provider.smsURL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(provider.headers ?? {}) },
    body: JSON.stringify({ phone, scene: 'login' }),
    signal,
  })
  if (!res.ok) throw Object.assign(new Error((await res.text()).slice(0, 240)), { status: res.status })
  return { sent: true, phone }
}

export async function verifyCode(provider, phone, code, signal) {
  if (!provider.verifyURL) throw Object.assign(new Error(`${provider.name} has no verify endpoint configured`), { status: 400 })
  if (!/^\d{4,8}$/.test(String(code ?? ''))) throw Object.assign(new Error('code looks wrong'), { status: 400 })
  const res = await fetch(provider.verifyURL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(provider.headers ?? {}) },
    body: JSON.stringify({ phone, otp: String(code) }),
    signal,
  })
  const text = await res.text()
  if (!res.ok) throw Object.assign(new Error(text.slice(0, 300)), { status: res.status })
  let json = {}
  try { json = JSON.parse(text) } catch { /* token may be the raw body */ }
  const token = json.token || json.access_token || json.data?.token || ''
  if (!token) throw Object.assign(new Error('provider did not return a token'), { status: 502 })
  return { token, user: json.user || json.data?.user || phone, models: json.models || [] }
}

export async function checkIn(account, signal) {
  if (!account.checkinURL) throw Object.assign(new Error('this account has no check-in endpoint'), { status: 400 })
  const res = await fetch(account.checkinURL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${account.token}` },
    body: JSON.stringify({ source: 'dsh-magpie' }),
    signal,
  })
  const text = await res.text()
  if (!res.ok) return { outcome: 'failed', message: text.slice(0, 240) }
  let json = {}
  try { json = JSON.parse(text) } catch { json = { message: text.slice(0, 180) } }
  const outcome = json.already || json.checked ? 'done' : json.eligible === false ? 'ineligible' : 'claimed'
  return { outcome, credit: json.credit ?? json.amount ?? null, message: json.message || json.msg || '' }
}
