import crypto from 'node:crypto'
import type { Request, Response } from 'express'

type UserSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix ms
}

let pendingState: string | null = null

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'
const SESSION_KEY = crypto.scryptSync(SESSION_SECRET, 'croquis-session-salt', 32)
const isProduction = process.env.NODE_ENV === 'production'

function encryptSession(data: UserSession): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', SESSION_KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), ciphertext.toString('hex')].join('.')
}

function decryptSession(cookie: string): UserSession | null {
  try {
    const [ivHex, tagHex, ciphertextHex] = cookie.split('.')
    if (!ivHex || !tagHex || !ciphertextHex) return null
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const ciphertext = Buffer.from(ciphertextHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', SESSION_KEY, iv)
    decipher.setAuthTag(tag)
    const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return JSON.parse(plain.toString('utf8')) as UserSession
  } catch {
    return null
  }
}

function setSessionCookie(res: Response, data: UserSession): void {
  res.cookie('session', encryptSession(data), {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
}

function getCredentials(): string {
  const clientId = process.env.PINTEREST_CLIENT_ID
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('PINTEREST_CLIENT_ID and PINTEREST_CLIENT_SECRET must be set in .env')
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

export function generateAuthUrl(): string {
  const clientId = process.env.PINTEREST_CLIENT_ID
  const redirectUri = process.env.PINTEREST_REDIRECT_URI
  if (!clientId || !redirectUri) {
    throw new Error('PINTEREST_CLIENT_ID and PINTEREST_REDIRECT_URI must be set in .env')
  }
  pendingState = crypto.randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'boards:read,pins:read',
    state: pendingState,
  })
  return `https://www.pinterest.com/oauth/?${params}`
}

export function validateState(state: string): boolean {
  if (!pendingState || state !== pendingState) return false
  pendingState = null
  return true
}

export async function exchangeCode(code: string, res: Response): Promise<void> {
  const redirectUri = process.env.PINTEREST_REDIRECT_URI
  if (!redirectUri) throw new Error('PINTEREST_REDIRECT_URI must be set in .env')

  const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${getCredentials()}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    throw new Error(`Token exchange failed: ${tokenRes.status} ${body}`)
  }
  const data = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number }
  setSessionCookie(res, {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  })
}

async function refreshAccessToken(session: UserSession, res: Response): Promise<UserSession> {
  const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${getCredentials()}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }),
  })
  if (!tokenRes.ok) {
    const body = await tokenRes.text()
    throw new Error(`Token refresh failed: ${tokenRes.status} ${body}`)
  }
  const data = await tokenRes.json() as { access_token: string; refresh_token: string; expires_in: number }
  const updated: UserSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  setSessionCookie(res, updated)
  return updated
}

export async function getToken(req: Request, res: Response): Promise<string> {
  let session = decryptSession(req.cookies?.session ?? '')
  if (!session) throw new Error('Not authenticated')

  // Auto-refresh if within 2 days of expiry
  if (Date.now() > session.expiresAt - 2 * 24 * 60 * 60 * 1000) {
    session = await refreshAccessToken(session, res)
  }
  return session.accessToken
}

export function isAuthenticated(req: Request): boolean {
  return decryptSession(req.cookies?.session ?? '') !== null
}

export function clearSession(res: Response): void {
  res.clearCookie('session')
}
