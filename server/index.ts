import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { fetchBoardPins, fetchUserBoards } from './pinterest.js'
import { generateAuthUrl, validateState, exchangeCode, isAuthenticated, clearSession, getToken } from './auth.js'

const app = express()
const port = process.env.PORT || 3001
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.get('/api/auth/status', (req, res) => {
  res.json({ authenticated: isAuthenticated(req) })
})

app.get('/api/auth/login', (_req, res) => {
  try {
    const url = generateAuthUrl()
    res.redirect(url)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

app.get('/api/auth/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string }
  if (!code || !state) {
    res.status(400).json({ error: 'Missing code or state' })
    return
  }
  if (!validateState(state)) {
    res.status(403).json({ error: 'Invalid state parameter' })
    return
  }
  try {
    await exchangeCode(code, res)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}?auth=success`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

app.post('/api/auth/logout', (_req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

app.get('/api/boards', async (req, res) => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  try {
    const token = await getToken(req, res)
    const { bookmark } = req.query as { bookmark?: string }
    const result = await fetchUserBoards(bookmark, token)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

app.get('/api/board', async (req, res) => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  const { url, bookmark, boardId } = req.query as { url?: string; bookmark?: string; boardId?: string }
  if (!url && !boardId) {
    res.status(400).json({ error: 'url or boardId required' })
    return
  }
  try {
    const token = await getToken(req, res)
    const result = await fetchBoardPins(url ?? '', bookmark, boardId, token)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(import.meta.dirname, '../../dist')))
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(import.meta.dirname, '../../dist/index.html')))
}

app.listen(port, () => console.log(`Server on :${port}`))
