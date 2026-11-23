import { readFile, writeFile } from 'node:fs/promises'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

/** Encrypted backup to a file, WebDAV, or S3. The passphrase never leaves this process. */

export function seal(state, passphrase) {
  const iv = randomBytes(12)
  const key = createHash('sha256').update(passphrase).digest()
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const body = Buffer.concat([cipher.update(JSON.stringify(state), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([Buffer.from('MPG1'), iv, tag, body]).toString('base64')
}

export function open(payload, passphrase) {
  const raw = Buffer.from(payload, 'base64')
  if (raw.subarray(0, 4).toString() !== 'MPG1') throw new Error('not a magpie backup')
  const iv = raw.subarray(4, 16)
  const tag = raw.subarray(16, 32)
  const body = raw.subarray(32)
  const key = createHash('sha256').update(passphrase).digest()
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const text = Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8')
  return JSON.parse(text)
}

export async function backupToFile(file, state, passphrase) {
  await writeFile(file, seal(state, passphrase), { mode: 0o600 })
  return { file, bytes: seal(state, passphrase).length }
}

export async function restoreFromFile(file, passphrase) {
  return open(await readFile(file, 'utf8'), passphrase)
}

export async function webdavPut(config, name, body) {
  const url = `${config.url.replace(/\/$/, '')}/${name}`
  const res = await fetch(url, { method: 'PUT', headers: { authorization: basic(config.user, config.password), 'content-type': 'application/octet-stream' }, body })
  if (!res.ok) throw new Error(`webdav ${res.status}`)
  return { url }
}

export async function webdavGet(config, name) {
  const url = `${config.url.replace(/\/$/, '')}/${name}`
  const res = await fetch(url, { headers: { authorization: basic(config.user, config.password) } })
  if (!res.ok) throw new Error(`webdav ${res.status}`)
  return res.text()
}

function basic(user, password) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`
}

export async function s3Put(config, keyName, body) {
  const url = `${config.endpoint.replace(/\/$/, '')}/${config.bucket}/${keyName}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { authorization: `Bearer ${config.accessKey}`, 'x-amz-security-token': config.secretKey, 'content-type': 'application/octet-stream' },
    body,
  })
  if (!res.ok) throw new Error(`s3 ${res.status}`)
  return { url }
}
