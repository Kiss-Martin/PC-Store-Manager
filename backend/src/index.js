import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import sql from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

// teszt végpont
app.get('/health', async (req, res) => {
  try {
    const result = await sql`SELECT 1`
    res.json({ status: 'ok', db: 'connected' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`🚀 Backend fut: http://localhost:${PORT}/health`)
})
