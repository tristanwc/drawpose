import crypto from 'node:crypto'

type UserSession = {
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix ms
}

let session: UserSession | null = null
let pendingState: string | null = null

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

export async function exchangeCode(code: string): Promise<void> {
  const redirectUri = process.env.PINTEREST_REDIRECT_URI
  if (!redirectUri) throw new Error('PINTEREST_REDIRECT_URI must be set in .env')

  const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
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
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Token exchange failed: ${res.status} ${body}`)
  }
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
  session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

async function refreshAccessToken(): Promise<void> {
  if (!session) throw new Error('No session to refresh')

  const res = await fetch('https://api.pinterest.com/v5/oauth/token', {
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
  if (!res.ok) {
    const body = await res.text()
    session = null
    throw new Error(`Token refresh failed: ${res.status} ${body}`)
  }
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
  session = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export async function getToken(): Promise<string> {
  if (!session) throw new Error('Not authenticated')

  // Auto-refresh if within 2 days of expiry
  if (Date.now() > session.expiresAt - 2 * 24 * 60 * 60 * 1000) {
    await refreshAccessToken()
  }
  return session!.accessToken
}

export function isAuthenticated(): boolean {
  return session !== null
}

export function clearSession(): void {
  session = null
}
