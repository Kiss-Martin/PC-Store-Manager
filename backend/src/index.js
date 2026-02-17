import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import supabase from './db.js'

const app = express()

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://pc-store-manager-80iz98a54-kiss-martins-projects.vercel.app", 
      "https://pc-store-manager.vercel.app", 
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
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

// Change password
app.patch('/me/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password required' })
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  try {
    // Get current user with password
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single()

    if (fetchErr || !user) {
      return res.status(500).json({ error: 'Failed to fetch user' })
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: hashed })
      .eq('id', req.user.id)

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message })
    }

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

app.get("/items", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        *,
        categories(name),
        brands(name)
      `,
      )
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const items = (data || []).map((item) => ({
      ...item,
      category: item.categories?.name,
      brand: item.brands?.name,
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
})

// Dashboard summary endpoint
app.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Get recent items
    const { data: itemsData, error: itemsErr } = await supabase
      .from('items')
      .select('id, name')
      .limit(10)
    
    if (itemsErr) return res.status(500).json({ error: itemsErr.message })

    // Get total products
    const { data: allItems, error: allItemsErr } = await supabase
      .from('items')
      .select('id')
    
    if (allItemsErr) return res.status(500).json({ error: allItemsErr.message })

    const totalProducts = Array.isArray(allItems) ? allItems.length : 0

    // ✅ Get real customer count
    const { data: customersData, error: customersErr } = await supabase
      .from('customers')
      .select('id')
    
    const customers = customersData ? customersData.length : 0

    // Get real sales data from logs
    const { data: salesLogs, error: salesErr } = await supabase
      .from('logs')
      .select('id, details, items(price)')
      .eq('action', 'stock_out')
    
    let totalSales = 0
    let activeOrders = 0
    
    if (!salesErr && salesLogs) {
      activeOrders = salesLogs.length
      
      salesLogs.forEach(log => {
        const quantityMatch = log.details?.match(/Sold (\d+) unit/)
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
        const price = log.items?.price || 0
        totalSales += price * quantity
      })
    }

    // Format total sales as currency
    const totalSalesFormatted = `$${Math.round(totalSales).toLocaleString()}`

    // Get recent activity from logs with customer info
    const { data: recentLogs, error: logsErr } = await supabase
      .from('logs')
      .select(`
        id, 
        action, 
        timestamp, 
        details, 
        items(name),
        customers(name)
      `)
      .order('timestamp', { ascending: false })
      .limit(10)
    
    const recent = (recentLogs || []).map(log => {
      let description = log.details || `${log.action}: ${log.items?.name || 'Unknown'}`
      
      // Add customer name to sales activities
      if (log.action === 'stock_out' && log.customers?.name) {
        const productName = log.items?.name || 'product'
        description = `${log.customers.name} purchased ${productName}`
      }
      
      return {
        id: log.id,
        description,
        timestamp: new Date(log.timestamp).toLocaleString(),
        type: log.action === 'stock_out' ? 'order' : 'inventory'
      }
    })

    res.json({ 
      stats: { 
        totalProducts, 
        totalSales: totalSalesFormatted, 
        activeOrders, 
        customers  // ✅ Now returns real count
      }, 
      activities: recent 
    })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Update item (admin only)
app.patch('/items/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' })

  const { id } = req.params
  const updates = {}
  const allowed = ['name', 'amount', 'model', 'specifications', 'warranty', 'brand_id', 'category_id']
  
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }

  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  res.json({ item: data })
})

// Delete item (admin only)
app.delete('/items/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' })

  const { id } = req.params

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ success: true })
})

// Analytics endpoint (requires auth) - Uses REAL data from logs
app.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { period = '7days' } = req.query

    // Calculate date range based on period
    let daysAgo = 7
    if (period === '30days') daysAgo = 30
    else if (period === '90days') daysAgo = 90

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get all items with stock and price info
    const { data: allItems, error: itemsErr } = await supabase
      .from('items')
      .select(`
        id,
        name,
        amount,
        price,
        categories(name),
        brands(name)
      `)

    if (itemsErr) return res.status(500).json({ error: itemsErr.message })

    // Get sales logs (stock_out actions) for the period
    const { data: salesLogs, error: logsErr } = await supabase
      .from('logs')
      .select(`
        id,
        item_id,
        action,
        timestamp,
        details,
        items(name, price)
      `)
      .eq('action', 'stock_out')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (logsErr) return res.status(500).json({ error: logsErr.message })

    // Calculate revenue from logs
    let totalRevenue = 0
    let totalOrders = 0
    const salesByProduct = {}
    const salesByDay = {}

    salesLogs.forEach(log => {
      // Parse quantity from details (e.g., "Sold 2 units - Order #1001")
      const quantityMatch = log.details?.match(/Sold (\d+) unit/)
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
      
      const price = log.items?.price || 0
      const revenue = price * quantity
      
      totalRevenue += revenue
      totalOrders++

      // Track sales by product
      const productName = log.items?.name || 'Unknown'
      if (!salesByProduct[productName]) {
        salesByProduct[productName] = { sales: 0, revenue: 0, name: productName }
      }
      salesByProduct[productName].sales += quantity
      salesByProduct[productName].revenue += revenue

      // Track sales by day for chart
      const day = new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
      salesByDay[day] = (salesByDay[day] || 0) + revenue
    })

    // Generate revenue chart based on period
    let revenueChart = {}
    if (period === '7days') {
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const data = labels.map(day => salesByDay[day] || 0)
      revenueChart = { labels, data }
    } else if (period === '30days') {
      // Group by week
      const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      const data = [0, 0, 0, 0]
      
      salesLogs.forEach(log => {
        const daysAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysAgo / 7)
        if (weekIndex < 4) {
          const quantityMatch = log.details?.match(/Sold (\d+) unit/)
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
          const revenue = (log.items?.price || 0) * quantity
          data[weekIndex] += revenue
        }
      })
      
      revenueChart = { labels, data: data.reverse() }
    } else if (period === '90days') {
      // Group by month
      const labels = ['Month 1', 'Month 2', 'Month 3']
      const data = [0, 0, 0]
      
      salesLogs.forEach(log => {
        const daysAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24))
        const monthIndex = Math.floor(daysAgo / 30)
        if (monthIndex < 3) {
          const quantityMatch = log.details?.match(/Sold (\d+) unit/)
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
          const revenue = (log.items?.price || 0) * quantity
          data[monthIndex] += revenue
        }
      })
      
      revenueChart = { labels, data: data.reverse() }
    }

    // Calculate category distribution
    const categoryCounts = {}
    allItems.forEach(item => {
      const categoryName = item.categories?.name || 'Uncategorized'
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1
    })

    const totalCategorized = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
    const categoryChart = {
      labels: Object.keys(categoryCounts),
      data: Object.values(categoryCounts).map(count => 
        totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0
      )
    }

    // Get top products from sales data
    const topProducts = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        name: product.name,
        sales: product.sales,
        revenue: Math.round(product.revenue * 100) / 100,
        trend: 'up' // You could calculate trend by comparing to previous period
      }))

    // Low stock items
    const lowStockItems = allItems.filter(item => item.amount < 10).length

    // Recent transactions (admin only)
let recentTransactions = [];
if (req.user.role === "admin") {
  // Get logs with customer info
  const { data: recentSalesLogs } = await supabase
    .from("logs")
    .select(
      `
      id,
      timestamp,
      details,
      items(name, price),
      customers(name)
    `,
    )
    .eq("action", "stock_out")
    .order("timestamp", { ascending: false })
    .limit(5);

  recentTransactions = (recentSalesLogs || []).map((log) => {
    const quantityMatch = log.details?.match(/Sold (\d+) unit/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    const amount = Math.round((log.items?.price || 0) * quantity * 100) / 100;

    // Extract order number from details
    const orderMatch = log.details?.match(/Order #(\d+)/);
    const orderId = orderMatch
      ? `TRX-${orderMatch[1]}`
      : `TRX-${log.id.substring(0, 6)}`;

    return {
      id: orderId,
      product: log.items?.name || "Unknown",
      customer: log.customers?.name || "Guest", // ✅ Real customer name
      amount,
      status: "completed",
      date: new Date(log.timestamp)
        .toISOString()
        .replace("T", " ")
        .substring(0, 16),
    };
  });
}

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate revenue growth (compare to previous period)
    const previousStartDate = new Date(startDate)
    previousStartDate.setDate(previousStartDate.getDate() - daysAgo)
    
    const { data: previousSalesLogs } = await supabase
      .from('logs')
      .select('id, details, items(price)')
      .eq('action', 'stock_out')
      .gte('timestamp', previousStartDate.toISOString())
      .lt('timestamp', startDate.toISOString())

    let previousRevenue = 0
    if (previousSalesLogs) {
      previousSalesLogs.forEach(log => {
        const quantityMatch = log.details?.match(/Sold (\d+) unit/)
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
        previousRevenue += (log.items?.price || 0) * quantity
      })
    }

    const revenueGrowth = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10
      : 0

    // Summary
    const summary = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topSellingProduct: topProducts[0]?.name || 'N/A',
      lowStockItems,
      revenueGrowth
    }

    res.json({
      summary,
      revenueChart,
      categoryChart,
      topProducts,
      recentTransactions
    })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Export analytics as CSV (admin only)
app.get('/analytics/export', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { period = '7days' } = req.query
    
    let daysAgo = 7
    if (period === '30days') daysAgo = 30
    else if (period === '90days') daysAgo = 90

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get sales logs with item details
    const { data: salesLogs, error: logsErr } = await supabase
      .from('logs')
      .select(`
        id,
        timestamp,
        details,
        items(name, price, brands(name), categories(name))
      `)
      .eq('action', 'stock_out')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (logsErr) return res.status(500).json({ error: logsErr.message })

    // Generate CSV
    let csv = 'Date,Product,Brand,Category,Quantity,Unit Price,Total,Order ID\n'
    
    salesLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      const product = (log.items?.name || 'Unknown').replace(/,/g, ';')
      const brand = (log.items?.brands?.name || 'N/A').replace(/,/g, ';')
      const category = (log.items?.categories?.name || 'N/A').replace(/,/g, ';')
      
      const quantityMatch = log.details?.match(/Sold (\d+) unit/)
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
      
      const unitPrice = log.items?.price || 0
      const total = unitPrice * quantity
      
      const orderMatch = log.details?.match(/Order #(\d+)/)
      const orderId = orderMatch ? orderMatch[1] : 'N/A'
      
      csv += `${date},${product},${brand},${category},${quantity},${unitPrice},${total},${orderId}\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Get all orders (from logs with customer info)
app.get('/orders', authMiddleware, async (req, res) => {
  try {
    // Get sales logs with item details, status, and customer info
    const { data: salesLogs, error: logsErr } = await supabase
      .from('logs')
      .select(`
        id,
        timestamp,
        details,
        action,
        items(id, name, price),
        orders_status(status, updated_at),
        customers(name, email)
      `)
      .eq('action', 'stock_out')
      .order('timestamp', { ascending: false })

    if (logsErr) return res.status(500).json({ error: logsErr.message })

    // Transform logs into orders
    const orders = salesLogs.map(log => {
      // Parse quantity from details
      const quantityMatch = log.details?.match(/Sold (\d+) unit/)
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
      
      // Extract order number
      const orderMatch = log.details?.match(/Order #(\d+)/)
      const orderNumber = orderMatch ? `#${orderMatch[1]}` : `#${log.id.substring(0, 8)}`
      
      const unitPrice = log.items?.price || 0
      const totalAmount = unitPrice * quantity
      
      // Get status from orders_status table, or default to completed
      const status = log.orders_status?.[0]?.status || 'completed'
      
      // ✅ Get real customer name
      const customer = log.customers?.name || 'Guest Customer'
      
      return {
        id: log.id,
        orderNumber,
        product: log.items?.name || 'Unknown Product',
        productId: log.items?.id || '',
        quantity,
        unitPrice,
        totalAmount: Math.round(totalAmount * 100) / 100,
        status,
        customer,  // ✅ Real customer name
        date: log.timestamp,
        timestamp: log.timestamp
      }
    })

    res.json({ orders })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Update order status (admin only) - PROPERLY PERSIST TO DATABASE
app.patch('/orders/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Check if status record exists
    const { data: existingStatus, error: checkErr } = await supabase
      .from('orders_status')
      .select('id')
      .eq('log_id', id)
      .single()

    let result

    if (existingStatus) {
      // Update existing status
      const { data, error } = await supabase
        .from('orders_status')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          updated_by: req.user.id
        })
        .eq('log_id', id)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      result = data
    } else {
      // Insert new status
      const { data, error } = await supabase
        .from('orders_status')
        .insert({ 
          log_id: id,
          status,
          updated_by: req.user.id
        })
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })
      result = data
    }

    res.json({ success: true, status: result })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Export orders as CSV (admin only) - Use actual status from DB
app.get('/orders/export', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { status = 'all' } = req.query

    // Get sales logs with status
    const { data: salesLogs, error: logsErr } = await supabase
      .from('logs')
      .select(`
        id,
        timestamp,
        details,
        items(name, price),
        orders_status(status)
      `)
      .eq('action', 'stock_out')
      .order('timestamp', { ascending: false })

    if (logsErr) return res.status(500).json({ error: logsErr.message })

    // Generate CSV
    let csv = 'Order Number,Date,Product,Quantity,Unit Price,Total Amount,Status\n'
    
    salesLogs.forEach(log => {
      const orderMatch = log.details?.match(/Order #(\d+)/)
      const orderNumber = orderMatch ? orderMatch[1] : log.id.substring(0, 8)
      
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      const product = (log.items?.name || 'Unknown').replace(/,/g, ';')
      
      const quantityMatch = log.details?.match(/Sold (\d+) unit/)
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
      
      const unitPrice = log.items?.price || 0
      const total = unitPrice * quantity
      
      const orderStatus = log.orders_status?.[0]?.status || 'completed'
      
      if (status === 'all' || orderStatus === status) {
        csv += `${orderNumber},${date},${product},${quantity},${unitPrice},${total},${orderStatus}\n`
      }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=orders-${status}-${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Update order status (admin only)
app.patch('/orders/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Update the log details to reflect status change
    const { data, error } = await supabase
      .from('logs')
      .update({ 
        details: `Status updated to ${status} - ${new Date().toISOString()}`
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    res.json({ success: true, order: data })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Export orders as CSV (admin only)
app.get('/orders/export', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { status = 'all' } = req.query

    // Get sales logs
    let query = supabase
      .from('logs')
      .select(`
        id,
        timestamp,
        details,
        items(name, price)
      `)
      .eq('action', 'stock_out')
      .order('timestamp', { ascending: false })

    const { data: salesLogs, error: logsErr } = await query

    if (logsErr) return res.status(500).json({ error: logsErr.message })

    // Generate CSV
    let csv = 'Order Number,Date,Product,Quantity,Unit Price,Total Amount,Status\n'
    
    salesLogs.forEach(log => {
      const orderMatch = log.details?.match(/Order #(\d+)/)
      const orderNumber = orderMatch ? orderMatch[1] : log.id.substring(0, 8)
      
      const date = new Date(log.timestamp).toISOString().split('T')[0]
      const product = (log.items?.name || 'Unknown').replace(/,/g, ';')
      
      const quantityMatch = log.details?.match(/Sold (\d+) unit/)
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
      
      const unitPrice = log.items?.price || 0
      const total = unitPrice * quantity
      
      const daysAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24))
      let orderStatus = 'completed'
      if (daysAgo < 1) orderStatus = 'processing'
      else if (daysAgo < 2) orderStatus = 'pending'
      
      if (status === 'all' || orderStatus === status) {
        csv += `${orderNumber},${date},${product},${quantity},${unitPrice},${total},${orderStatus}\n`
      }
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=orders-${status}-${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

app.get("/categories", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ categories: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Get brands
app.get("/brands", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ brands: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Get all items with category and brand names
app.get("/items", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("items")
      .select(
        `
        *,
        categories(name),
        brands(name)
      `,
      )
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    // Flatten the response
    const items = (data || []).map((item) => ({
      ...item,
      category: item.categories?.name,
      brand: item.brands?.name,
    }));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Create new item (admin only)
// Create item (admin only)
app.post('/items', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { name, model, specs, price, amount, warranty, category_id, brand_id } = req.body  // ✅ Add brand_id

    // ✅ Validate required fields
    if (!name || !price || !category_id || !brand_id) {
      return res.status(400).json({ error: 'Name, price, category, and brand are required' })
    }

    const { data, error } = await supabase
      .from('items')
      .insert({ 
        name, 
        model, 
        specs, 
        price, 
        amount, 
        warranty,
        category_id,
        brand_id,  // ✅ Add this
        date_added: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    await supabase.from('logs').insert({
      item_id: data.id,
      action: 'stock_in',
      details: `Added new item: ${name}`,
      timestamp: new Date().toISOString()
    })

    res.json({ success: true, item: data })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Update item (admin only)
app.patch("/items/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ item: data });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Delete item (admin only)
app.delete("/items/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { id } = req.params;

    const { error } = await supabase.from("items").delete().eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.get("/categories", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ categories: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Get all brands
app.get('/brands', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .order('name', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    res.json({ brands: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Get all customers (needed for order creation)
app.get('/customers', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .order('name', { ascending: true })

    if (error) return res.status(500).json({ error: error.message })

    res.json({ customers: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Create customer (if needed)
app.post('/customers', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { name, email, phone } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' })
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ name, email, phone })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    res.json({ success: true, customer: data })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Create manual order (admin only)
app.post('/orders', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' })
  }

  try {
    const { item_id, customer_id, quantity } = req.body

    if (!item_id || !customer_id || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Item, customer, and valid quantity are required' })
    }

    // Get item details and check stock
    const { data: item, error: itemErr } = await supabase
      .from('items')
      .select('id, name, price, amount')
      .eq('id', item_id)
      .single()

    if (itemErr || !item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    if (item.amount < quantity) {
      return res.status(400).json({ error: `Insufficient stock. Only ${item.amount} available` })
    }

    // Generate order number
    const orderNumber = Math.floor(1000 + Math.random() * 9000)

    // Update item stock
    const { error: updateErr } = await supabase
      .from('items')
      .update({ amount: item.amount - quantity })
      .eq('id', item_id)

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message })
    }

    // Create log entry
    const { data: log, error: logErr } = await supabase
      .from('logs')
      .insert({
        item_id: item_id,
        customer_id: customer_id,
        action: 'stock_out',
        details: `Sold ${quantity} unit${quantity > 1 ? 's' : ''} - Order #${orderNumber}`,
        timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (logErr) {
      return res.status(500).json({ error: logErr.message })
    }

    res.json({ 
      success: true, 
      order: {
        id: log.id,
        orderNumber: `#${orderNumber}`,
        product: item.name,
        quantity,
        totalAmount: item.price * quantity,
        status: 'completed'
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Backend running: http://localhost:${PORT}/health`)
})