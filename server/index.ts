import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fetchBoardPins } from './pinterest.js'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))

app.get('/api/board', async (req, res) => {
  const { url, bookmark } = req.query as { url?: string; bookmark?: string }
  if (!url) {
    res.status(400).json({ error: 'url required' })
    return
  }
  try {
    const result = await fetchBoardPins(url, bookmark)
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

app.listen(3001, () => console.log('Server on :3001'))
