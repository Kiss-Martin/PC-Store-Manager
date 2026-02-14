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

app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1)
    const isMissingRelation = error && ((error.details && error.details.includes('relation')) || (error.message && error.message.includes('relation')))
    if (isMissingRelation) {
      return res.json({ status: 'ok', supabase: 'reachable', note: 'table users missing' })
    }
    if (error) return res.status(502).json({ status: 'error', error: error.message || error })
    res.json({ status: 'ok', supabase: 'reachable' })
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message || String(err) })
  }
})

app.post('/auth/register', async (req, res) => {
  const { email, username, password, fullname, role } = req.body

  if (!email || !username || !password)
    return res.status(400).json({ error: 'email, username and password required' })

  try {
    const hashed = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        username,
        fullname: fullname || null,
        password_hash: hashed,
        role: role || 'worker'
      })
      .select('id,email,username,fullname,role')
      .single()

    if (error) return res.status(500).json({ error: error.message })

    const token = generateToken({
      id: data.id,
      role: data.role
    })

    res.json({ user: data, token })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/auth/login', async (req, res) => {
  const { email, username, password } = req.body

  if ((!email && !username) || !password)
    return res.status(400).json({ error: 'email/username and password required' })

  try {
    let query = supabase.from('users').select('*')

    if (email) query = query.eq('email', email)
    else query = query.eq('username', username)

    const { data, error } = await query.single()

    if (error || !data)
      return res.status(401).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, data.password_hash)
    if (!ok)
      return res.status(401).json({ error: 'Invalid credentials' })

    const token = generateToken({
      id: data.id,
      role: data.role
    })

    res.json({
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        fullname: data.fullname,
        role: data.role
      },
      token
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/me', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id,email,username,fullname,role')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ user: data })
})

app.patch('/me', authMiddleware, async (req, res) => {
  const updates = {}
  const allowed = ['email', 'username', 'fullname']
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k]
  }

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' })

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select('id,email,username,fullname,role')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ user: data })
})

app.get('/items', async (req, res) => {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      brands(name),
      categories(name)
    `)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ items: data })
})

// Dashboard summary endpoint
app.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // total products
    const { data: itemsData, error: itemsErr } = await supabase
      .from('items')
      .select('id, name')  // ✅ Removed created_at
      .limit(10)
    
    if (itemsErr) return res.status(500).json({ error: itemsErr.message })

    const { data: allItems, error: allItemsErr } = await supabase
      .from('items')
      .select('id')
    
    if (allItemsErr) return res.status(500).json({ error: allItemsErr.message })

    const totalProducts = Array.isArray(allItems) ? allItems.length : 0

    // For now we don't have sales/orders tables; return zeros for those metrics
    const totalSales = 0
    const activeOrders = 0
    const customers = 0

    // Recent activities: use recent items as a proxy
    const recent = (itemsData || []).map((it, idx) => ({
      id: it.id,
      description: `Item in stock: ${it.name || 'Unnamed'}`,
      timestamp: `Item #${idx + 1}`,  // ✅ Simple placeholder since no created_at
      type: 'inventory'
    }))

    res.json({ stats: { totalProducts, totalSales, activeOrders, customers }, activities: recent })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

app.post('/items', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' })

  const { data, error } = await supabase
    .from('items')
    .insert(req.body)
    .select('*')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.status(201).json({ item: data })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Backend running: http://localhost:${PORT}/health`)
})