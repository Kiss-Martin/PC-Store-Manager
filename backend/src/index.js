import express from "express";
import cors from "cors";
import "dotenv/config";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import { createServer } from "http";
import { Server as IO } from "socket.io";
import supabase from "./db.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createItemSchema,
  createOrderSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./validators.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();

app.use(
  cors({
    origin: ["https://pc-store-manager.vercel.app", "http://localhost:4200"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  }),
);
app.use(express.json());

// Basic security headers
app.use(helmet());

// Basic rate limiter to mitigate brute-force and DoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Simple request sanitizer to remove suspicious payloads
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === "string") {
        // remove null-bytes and forbidden characters commonly used in injections
        obj[k] = v.replace(/\0/g, "").replace(/[<>$;]/g, "");
      } else if (typeof v === "object") sanitize(v);
    }
  };
  if (req.body) sanitize(req.body);
  next();
});

// Swagger/OpenAPI (minimal)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: { title: "PC Store Manager API", version: "1.0.0" },
  },
  apis: [],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (req, res) => res.json(swaggerSpec));

// Parse Accept-Language header into `req.lang`
app.use((req, res, next) => {
  const al = req.headers["accept-language"] || req.headers["Accept-Language"];
  if (al && typeof al === "string") {
    req.lang = al.split(",")[0].split("-")[0];
  } else {
    req.lang = "en";
  }
  next();
});

// Scrub sensitive fields from JSON responses (e.g., password_hash)
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    const scrub = (obj) => {
      if (!obj || typeof obj !== "object") return obj;
      if (Array.isArray(obj)) return obj.map(scrub);
      const out = {};
      for (const k of Object.keys(obj)) {
        if (k === "password_hash" || k === "password" || k === "supabaseKey") continue;
        const v = obj[k];
        out[k] = typeof v === "object" ? scrub(v) : v;
      }
      return out;
    };

    try {
      const cleaned = scrub(payload);
      return originalJson(cleaned);
    } catch (e) {
      return originalJson(payload);
    }
  };
  next();
});

// Async wrapper helper
const wrap = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Nodemailer transporter (fallback to log)
let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Make io available later
let io = null;

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

// Helpers
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "PC Store Manager API",
    status: "online",
    version: "1.0.0",
    endpoints: {
      health: "GET /api/health",
      auth: "POST /api/auth/login, POST /api/auth/register",
      items: "GET /api/items",
      dashboard: "GET /api/dashboard",
      orders: "GET /api/orders",
    },
  });
});

app.get("/health", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("id").limit(1);
    const isMissingRelation =
      error &&
      ((error.details && error.details.includes("relation")) ||
        (error.message && error.message.includes("relation")));
    if (isMissingRelation) {
      return res.json({
        status: "ok",
        supabase: "reachable",
        note: "table users missing",
      });
    }
    if (error)
      return res
        .status(502)
        .json({ status: "error", error: error.message || error });
    res.json({ status: "ok", supabase: "reachable" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", error: err.message || String(err) });
  }
});

app.post("/auth/register", wrap(async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });

  const { email, username, password, fullname, role } = parse.data;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        email,
        username,
        fullname: fullname || null,
        password_hash: hashed,
        role: role || "worker",
      })
      .select("id,email,username,fullname,role")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const token = generateToken({
      id: data.id,
      role: data.role,
    });

    res.json({ user: data, token });
  } catch (err) {
    throw err;
  }
}));

app.post("/auth/login", wrap(async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });

  const { email, username, password } = parse.data;

  let query = supabase.from("users").select("*");

  if (email) query = query.eq("email", email);
  else query = query.eq("username", username);

  const { data, error } = await query.single();

  if (error || !data)
    return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, data.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken({
    id: data.id,
    role: data.role,
  });

  res.json({
    user: {
      id: data.id,
      email: data.email,
      username: data.username,
      fullname: data.fullname,
      role: data.role,
    },
    token,
  });
}));

// Forgot password - sends token via email (or logs token if SMTP not configured)
app.post("/auth/forgot-password", wrap(async (req, res) => {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });

  const { email } = parse.data;

  // Find user
  const { data: user } = await supabase.from("users").select("id,email").eq("email", email).single();
  if (!user) return res.status(200).json({ success: true }); // don't reveal existence

  const token = crypto.randomBytes(24).toString("hex");
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await supabase.from("password_resets").insert({ user_id: user.id, token, expires_at });

  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:4200"}/reset-password?token=${token}`;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        to: email,
        from: process.env.SMTP_FROM || "noreply@pcstore.local",
        subject: "Password reset",
        text: `Reset your password: ${resetLink}`,
        html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
      });
    } catch (e) {
      console.warn("Failed to send reset email", e.message || e);
    }
  } else {
    console.log("Password reset token for", email, token, "link:", resetLink);
  }

  res.json({ success: true });
}));

// Reset password
app.post("/auth/reset-password", wrap(async (req, res) => {
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });

  const { token, newPassword } = parse.data;

  const { data: pr, error: prErr } = await supabase.from("password_resets").select("id,user_id,expires_at").eq("token", token).single();
  if (prErr || !pr) return res.status(400).json({ error: "Invalid or expired token" });

  if (new Date(pr.expires_at) < new Date()) {
    return res.status(400).json({ error: "Token expired" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const { error: updErr } = await supabase.from("users").update({ password_hash: hashed }).eq("id", pr.user_id);
  if (updErr) return res.status(500).json({ error: updErr.message });

  await supabase.from("password_resets").delete().eq("id", pr.id);

  res.json({ success: true });
}));

app.get("/me", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id,email,username,fullname,role")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ user: data });
});

app.patch("/me", authMiddleware, async (req, res) => {
  const updates = {};
  const allowed = ["email", "username", "fullname"];
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k];
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: "No valid fields to update" });

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.user.id)
    .select("id,email,username,fullname,role")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ user: data });
});

// Change password
app.patch("/me/password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current password and new password required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  }

  try {
    // Get current user with password
    const { data: user, error: fetchErr } = await supabase
      .from("users")
      .select("password_hash")
      .eq("id", req.user.id)
      .single();

    if (fetchErr || !user) {
      return res.status(500).json({ error: "Failed to fetch user" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateErr } = await supabase
      .from("users")
      .update({ password_hash: hashed })
      .eq("id", req.user.id);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

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
});

// Dashboard summary endpoint
app.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    // Get recent items
    const { data: itemsData, error: itemsErr } = await supabase
      .from("items")
      .select("id, name")
      .limit(10);

    if (itemsErr) return res.status(500).json({ error: itemsErr.message });

    // Get total products
    const { data: allItems, error: allItemsErr } = await supabase
      .from("items")
      .select("id");

    if (allItemsErr)
      return res.status(500).json({ error: allItemsErr.message });

    const totalProducts = Array.isArray(allItems) ? allItems.length : 0;

    // ✅ Get real customer count
    const { data: customersData, error: customersErr } = await supabase
      .from("customers")
      .select("id");

    const customers = customersData ? customersData.length : 0;

    // Get real sales data from logs
    const { data: salesLogs, error: salesErr } = await supabase
      .from("logs")
      .select("id, details, items(price)")
      .eq("action", "stock_out");

    let totalSales = 0;
    let activeOrders = 0;

    if (!salesErr && salesLogs) {
      activeOrders = salesLogs.length;

      salesLogs.forEach((log) => {
        const quantityMatch = log.details?.match(/Sold (\d+) unit/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
        const price = log.items?.price || 0;
        totalSales += price * quantity;
      });
    }

    // Format total sales as currency
    const totalSalesFormatted = `$${Math.round(totalSales).toLocaleString()}`;

    // Get recent activity from logs with customer info
    const { data: recentLogs, error: logsErr } = await supabase
      .from("logs")
      .select(
        `
        id, 
        action, 
        timestamp, 
        details, 
        items(name),
        customers(name)
      `,
      )
      .order("timestamp", { ascending: false })
      .limit(10);

    const recent = (recentLogs || []).map((log) => {
      let description =
        log.details || `${log.action}: ${log.items?.name || "Unknown"}`;

      // Add customer name to sales activities
      if (log.action === "stock_out" && log.customers?.name) {
        const productName = log.items?.name || "product";
        description = `${log.customers.name} purchased ${productName}`;
      }

      return {
        id: log.id,
        description,
        timestamp: new Date(log.timestamp).toLocaleString(),
        type: log.action === "stock_out" ? "order" : "inventory",
      };
    });

    res.json({
      stats: {
        totalProducts,
        totalSales: totalSalesFormatted,
        activeOrders,
        customers, // ✅ Now returns real count
      },
      activities: recent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Duplicate item update/delete handlers removed — consolidated later in file

// Analytics endpoint (requires auth) - Uses REAL data from logs
app.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const { period = "7days" } = req.query;

    // Calculate date range based on period
    let daysAgo = 7;
    if (period === "30days") daysAgo = 30;
    else if (period === "90days") daysAgo = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all items with stock and price info
    const { data: allItems, error: itemsErr } = await supabase.from("items")
      .select(`
        id,
        name,
        amount,
        price,
        categories(name),
        brands(name)
      `);

    if (itemsErr) return res.status(500).json({ error: itemsErr.message });

    // Get sales logs (stock_out actions) for the period
    const { data: salesLogs, error: logsErr } = await supabase
      .from("logs")
      .select(
        `
        id,
        item_id,
        action,
        timestamp,
        details,
        items(name, price)
      `,
      )
      .eq("action", "stock_out")
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: false });

    if (logsErr) return res.status(500).json({ error: logsErr.message });

    // Calculate revenue from logs
    let totalRevenue = 0;
    let totalOrders = 0;
    const salesByProduct = {};
    const salesByDay = {};

    salesLogs.forEach((log) => {
      // Parse quantity from details (e.g., "Sold 2 units - Order #1001")
      const quantityMatch = log.details?.match(/Sold (\d+) unit/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

      const price = log.items?.price || 0;
      const revenue = price * quantity;

      totalRevenue += revenue;
      totalOrders++;

      // Track sales by product
      const productName = log.items?.name || "Unknown";
      if (!salesByProduct[productName]) {
        salesByProduct[productName] = {
          sales: 0,
          revenue: 0,
          name: productName,
        };
      }
      salesByProduct[productName].sales += quantity;
      salesByProduct[productName].revenue += revenue;

      // Track sales by day for chart
      const day = new Date(log.timestamp).toLocaleDateString("en-US", {
        weekday: "short",
      });
      salesByDay[day] = (salesByDay[day] || 0) + revenue;
    });

    // Generate revenue chart based on period
    let revenueChart = {};
    if (period === "7days") {
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const data = labels.map((day) => salesByDay[day] || 0);
      revenueChart = { labels, data };
    } else if (period === "30days") {
      // Group by week
      const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const data = [0, 0, 0, 0];

      salesLogs.forEach((log) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(log.timestamp).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const weekIndex = Math.floor(daysAgo / 7);
        if (weekIndex < 4) {
          const quantityMatch = log.details?.match(/Sold (\d+) unit/);
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          const revenue = (log.items?.price || 0) * quantity;
          data[weekIndex] += revenue;
        }
      });

      revenueChart = { labels, data: data.reverse() };
    } else if (period === "90days") {
      // Group by month
      const labels = ["Month 1", "Month 2", "Month 3"];
      const data = [0, 0, 0];

      salesLogs.forEach((log) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(log.timestamp).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const monthIndex = Math.floor(daysAgo / 30);
        if (monthIndex < 3) {
          const quantityMatch = log.details?.match(/Sold (\d+) unit/);
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          const revenue = (log.items?.price || 0) * quantity;
          data[monthIndex] += revenue;
        }
      });

      revenueChart = { labels, data: data.reverse() };
    }

    // Calculate category distribution
    const categoryCounts = {};
    allItems.forEach((item) => {
      const categoryName = item.categories?.name || "Uncategorized";
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    const totalCategorized = Object.values(categoryCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    const categoryChart = {
      labels: Object.keys(categoryCounts),
      data: Object.values(categoryCounts).map((count) =>
        totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0,
      ),
    };

    // Get top products from sales data
    const topProducts = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        sales: product.sales,
        revenue: Math.round(product.revenue * 100) / 100,
        trend: "up", // You could calculate trend by comparing to previous period
      }));

    // Low stock items
    const lowStockItems = allItems.filter((item) => item.amount < 10).length;

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
        const amount =
          Math.round((log.items?.price || 0) * quantity * 100) / 100;

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
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate revenue growth (compare to previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysAgo);

    const { data: previousSalesLogs } = await supabase
      .from("logs")
      .select("id, details, items(price)")
      .eq("action", "stock_out")
      .gte("timestamp", previousStartDate.toISOString())
      .lt("timestamp", startDate.toISOString());

    let previousRevenue = 0;
    if (previousSalesLogs) {
      previousSalesLogs.forEach((log) => {
        const quantityMatch = log.details?.match(/Sold (\d+) unit/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
        previousRevenue += (log.items?.price || 0) * quantity;
      });
    }

    const revenueGrowth =
      previousRevenue > 0
        ? Math.round(
            ((totalRevenue - previousRevenue) / previousRevenue) * 100 * 10,
          ) / 10
        : 0;

    // Summary
    const summary = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topSellingProduct: topProducts[0]?.name || "N/A",
      lowStockItems,
      revenueGrowth,
    };

    res.json({
      summary,
      revenueChart,
      categoryChart,
      topProducts,
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Export analytics as CSV (admin only)
app.get("/analytics/export", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { period = "7days" } = req.query;

    let daysAgo = 7;
    if (period === "30days") daysAgo = 30;
    else if (period === "90days") daysAgo = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get sales logs with item details
    const { data: salesLogs, error: logsErr } = await supabase
      .from("logs")
      .select(
        `
        id,
        timestamp,
        details,
        items(name, price, brands(name), categories(name))
      `,
      )
      .eq("action", "stock_out")
      .gte("timestamp", startDate.toISOString())
      .order("timestamp", { ascending: false });

    if (logsErr) return res.status(500).json({ error: logsErr.message });

    // Generate CSV
    let csv =
      "Date,Product,Brand,Category,Quantity,Unit Price,Total,Order ID\n";

    salesLogs.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      const product = (log.items?.name || "Unknown").replace(/,/g, ";");
      const brand = (log.items?.brands?.name || "N/A").replace(/,/g, ";");
      const category = (log.items?.categories?.name || "N/A").replace(
        /,/g,
        ";",
      );

      const quantityMatch = log.details?.match(/Sold (\d+) unit/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

      const unitPrice = log.items?.price || 0;
      const total = unitPrice * quantity;

      const orderMatch = log.details?.match(/Order #(\d+)/);
      const orderId = orderMatch ? orderMatch[1] : "N/A";

      csv += `${date},${product},${brand},${category},${quantity},${unitPrice},${total},${orderId}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sales-report-${period}-${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Orders endpoint consolidated later includes assignment filtering and admin view

// Export orders as CSV (admin only) - Use actual status from DB
app.get("/orders/export", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { status = "all" } = req.query;

    // Get sales logs with status
    const { data: salesLogs, error: logsErr } = await supabase
      .from("logs")
      .select(
        `
        id,
        timestamp,
        details,
        items(name, price),
        orders_status(status)
      `,
      )
      .eq("action", "stock_out")
      .order("timestamp", { ascending: false });

    if (logsErr) return res.status(500).json({ error: logsErr.message });

    // Generate CSV
    let csv =
      "Order Number,Date,Product,Quantity,Unit Price,Total Amount,Status\n";

    salesLogs.forEach((log) => {
      const orderMatch = log.details?.match(/Order #(\d+)/);
      const orderNumber = orderMatch ? orderMatch[1] : log.id.substring(0, 8);

      const date = new Date(log.timestamp).toISOString().split("T")[0];
      const product = (log.items?.name || "Unknown").replace(/,/g, ";");

      const quantityMatch = log.details?.match(/Sold (\d+) unit/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

      const unitPrice = log.items?.price || 0;
      const total = unitPrice * quantity;

      const orderStatus = log.orders_status?.[0]?.status || "completed";

      if (status === "all" || orderStatus === status) {
        csv += `${orderNumber},${date},${product},${quantity},${unitPrice},${total},${orderStatus}\n`;
      }
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=orders-${status}-${new Date().toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Update order status (admin only) - PROPERLY PERSIST TO DATABASE
app.patch("/orders/:id/status", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "processing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Check if status record exists
    const { data: existingStatus, error: checkErr } = await supabase
      .from("orders_status")
      .select("id")
      .eq("log_id", id)
      .single();

    let result;

    if (existingStatus) {
      // Update existing status
      const { data, error } = await supabase
        .from("orders_status")
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: req.user.id,
        })
        .eq("log_id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      result = data;
    } else {
      // Insert new status
      const { data, error } = await supabase
        .from("orders_status")
        .insert({
          log_id: id,
          status,
          updated_by: req.user.id,
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      result = data;
    }

    res.json({ success: true, status: result });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Create new item (admin only)
// Create item (admin only)
app.post("/items", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const {
      name,
      model,
      specs,
      price,
      amount,
      warranty,
      category_id,
      brand_id,
    } = req.body; // ✅ Add brand_id

    // ✅ Validate required fields
    if (!name || !price || !category_id || !brand_id) {
      return res
        .status(400)
        .json({ error: "Name, price, category, and brand are required" });
    }

    const { data, error } = await supabase
      .from("items")
      .insert({
        name,
        model,
        specs,
        price,
        amount,
        warranty,
        category_id,
        brand_id, // ✅ Add this
        date_added: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await supabase.from("logs").insert({
      item_id: data.id,
      action: "stock_in",
      details: `Added new item: ${name}`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, item: data });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

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

// Get all brands
app.get("/brands", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ brands: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Get all customers (needed for order creation)
app.get("/customers", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, email, phone")
      .order("name", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ customers: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Create customer (if needed)
app.post("/customers", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { name, email, phone } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Customer name is required" });
    }

    const { data, error } = await supabase
      .from("customers")
      .insert({ name, email, phone })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, customer: data });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Create manual order (admin only)
app.post("/orders", authMiddleware, wrap(async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });

  const { item_id, customer_id, quantity, status = "pending" } = parse.data;

  if (!["pending", "processing", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  // Get item details and check stock
  const { data: item, error: itemErr } = await supabase
    .from("items")
    .select("id, name, price, amount")
    .eq("id", item_id)
    .single();

  if (itemErr || !item) {
    return res.status(404).json({ error: "Item not found" });
  }

  if (item.amount < quantity) {
    return res.status(400).json({ error: `Insufficient stock. Only ${item.amount} available` });
  }

  // Generate order number
  const orderNumber = Math.floor(1000 + Math.random() * 9000);

  // Update item stock (only if status is completed or processing)
  if (status === "completed" || status === "processing") {
    const { error: updateErr } = await supabase
      .from("items")
      .update({ amount: item.amount - quantity })
      .eq("id", item_id);

    if (updateErr) {
      throw new Error(updateErr.message);
    }
  }

  // Create log entry
  const { data: log, error: logErr } = await supabase
    .from("logs")
    .insert({
      item_id: item_id,
      customer_id: customer_id,
      action: "stock_out",
      details: `Sold ${quantity} unit${quantity > 1 ? "s" : ""} - Order #${orderNumber}`,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (logErr) {
    throw new Error(logErr.message);
  }

  // Create order status record
  const { error: statusErr } = await supabase.from("orders_status").insert({
    log_id: log.id,
    status: status,
    updated_by: req.user.id,
    updated_at: new Date().toISOString(),
  });

  if (statusErr) {
    throw new Error(statusErr.message);
  }

  const responseOrder = {
    id: log.id,
    orderNumber: `#${orderNumber}`,
    product: item.name,
    quantity,
    totalAmount: Math.round((item.price || 0) * quantity * 100) / 100,
    status: status,
  };

  // Emit real-time event if socket available
  try {
    if (io) io.emit("order_created", responseOrder);
  } catch (e) {
    console.warn("Socket emit failed", e.message || e);
  }

  res.json({ success: true, order: responseOrder });
}));

// Get workers (admin only)
app.get("/users/workers", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, fullname")
      .in("role", ["admin", "worker"])
      .order("username", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ users: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Assign order to worker (admin only)
app.patch("/orders/:id/assign", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  const { id } = req.params;
  const { assigned_to } = req.body;

  try {
    const { error } = await supabase
      .from("logs")
      .update({ assigned_to })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Update GET /orders to include assignment info and filtering
app.get("/orders", authMiddleware, async (req, res) => {
  try {
    let query = supabase
      .from("logs")
      .select(
        `
        id,
        item_id,
        customer_id,
        details,
        timestamp,
        assigned_to,
        items(name, price),
        customers(name, email)
      `,
      )
      .eq("action", "stock_out")
      .order("timestamp", { ascending: false });

    if (req.user.role !== "admin") {
      query = query.eq("assigned_to", req.user.id);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    const orders = (data || []).map((log) => {
      const orderMatch = log.details.match(/Order #(\d+)/);
      const quantityMatch = log.details.match(/Sold (\d+) unit/);

      return {
        id: log.id,
        orderNumber: orderMatch ? `#${orderMatch[1]}` : "N/A",
        product: log.items?.name || "Unknown",
        productId: log.item_id,
        quantity: quantityMatch ? parseInt(quantityMatch[1]) : 0,
        unitPrice: log.items?.price || 0,
        totalAmount:
          (log.items?.price || 0) *
          (quantityMatch ? parseInt(quantityMatch[1]) : 0),
        status: "completed",
        customer: log.customers?.name || "Unknown",
        date: new Date(log.timestamp).toLocaleDateString(),
        timestamp: log.timestamp,
        assigned_to: log.assigned_to,
      };
    });

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Generate business report
app.get("/reports/business", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  const { period = "7days" } = req.query;

  try {
    let startDate = new Date();
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "month":
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(startDate.getFullYear(), 0, 1);
        break;
    }

    const { data: orders } = await supabase
      .from("logs")
      .select(
        `
        id,
        details,
        timestamp,
        items(name, price)
      `,
      )
      .eq("action", "stock_out")
      .gte("timestamp", startDate.toISOString());

    let csv = "Business Report\n";
    csv += `Period: ${period}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    csv += "Order Summary\n";
    csv += "Order Number,Product,Quantity,Unit Price,Total,Date\n";

    let totalRevenue = 0;

    orders?.forEach((order) => {
      const orderMatch = order.details.match(/Order #(\d+)/);
      const quantityMatch = order.details.match(/Sold (\d+) unit/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
      const price = order.items?.price || 0;
      const total = price * quantity;
      totalRevenue += total;

      csv += `#${orderMatch?.[1] || "N/A"},${order.items?.name || "Unknown"},${quantity},${price},${total},${new Date(order.timestamp).toLocaleDateString()}\n`;
    });

    csv += `\nTotal Revenue: $${totalRevenue.toFixed(2)}\n`;
    csv += `Total Orders: ${orders?.length || 0}\n`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=business-report-${period}.csv`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Central error handler (consistent JSON responses)
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

export default app;

// Create HTTP server and attach socket.io
const PORT = process.env.PORT || 3000;
const server = createServer(app);
io = new IO(server, {
  cors: {
    origin: ["https://pc-store-manager.vercel.app", "http://localhost:4200"],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Websocket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected", socket.id));
});

server.listen(PORT, () => {
  console.log(`🚀 Backend running: http://localhost:${PORT}/health`);
});