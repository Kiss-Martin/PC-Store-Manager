import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from './db.js'

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

// Helpers
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })
  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Health check — attempt a light Supabase query; return reachable status
app.get('/health', async (req, res) => {
  try {
    // try selecting from a common table; if table doesn't exist, still confirm Supabase reachability
    const { data, error } = await supabase.from('users').select('id').limit(1)
    if (error && error.details && error.details.includes('relation') ) {
      return res.json({ status: 'ok', supabase: 'reachable', note: 'table users missing' })
    }
    if (error) return res.status(502).json({ status: 'error', error: error.message })
    res.json({ status: 'ok', supabase: 'reachable' })
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message })
  }
})

// Auth: register
app.post('/auth/register', async (req, res) => {
  const { email, password, username, fullName, role } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })
  try {
    const hashed = await bcrypt.hash(password, 10)
    const payload = { email, username, full_name: fullName || null, role: role || 'user', password_hash: hashed }
    const { data, error } = await supabase.from('users').insert(payload).select('*').single()
    if (error) return res.status(500).json({ error: error.message })
    const token = generateToken({ id: data.id, email: data.email, username: data.username, role: data.role })
    res.json({ user: { id: data.id, email: data.email, username: data.username, fullName: data.full_name, role: data.role }, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Auth: login
app.post('/auth/login', async (req, res) => {
  const { email, username, password } = req.body
  if ((!email && !username) || !password) return res.status(400).json({ error: 'email/username and password required' })
  try {
    let query = supabase.from('users').select('*')
    if (email) query = query.eq('email', email).limit(1)
    else query = query.eq('username', username).limit(1)
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    if (!data || data.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = data[0]
    const ok = await bcrypt.compare(password, user.password_hash || '')
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = generateToken({ id: user.id, email: user.email, username: user.username, role: user.role })
    res.json({ user: { id: user.id, email: user.email, username: user.username, fullName: user.full_name, role: user.role }, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get current profile
app.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id,email,username,full_name,role').eq('id', req.user.id).single()
    if (error) return res.status(500).json({ error: error.message })
    res.json({ user: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Products: list
app.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ products: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Products: create (protected)
app.post('/products', authMiddleware, async (req, res) => {
  try {
    const payload = req.body
    const { data, error } = await supabase.from('products').insert(payload).select('*').single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json({ product: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Orders: create
app.post('/orders', authMiddleware, async (req, res) => {
  try {
    const payload = { user_id: req.user.id, ...req.body }
    const { data, error } = await supabase.from('orders').insert(payload).select('*').single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json({ order: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Orders: list (admin can list all)
app.get('/orders', authMiddleware, async (req, res) => {
  try {
    let q = supabase.from('orders').select('*')
    if (req.user.role !== 'admin' && req.query.userId !== 'all') q = q.eq('user_id', req.user.id)
    const { data, error } = await q
    if (error) return res.status(500).json({ error: error.message })
    res.json({ orders: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Backend running: http://localhost:${PORT}/health`)
})
