import AnalyticsService from '../services/analytics.service.js';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

export const getDashboard = async (req, res) => {
  // Use analytics service to build dashboard payload
  const analytics = await AnalyticsService.getAnalytics(req.user, { period: '7days' });
  const summary = analytics.summary || {};

  let stats = {
    totalProducts: summary.totalProducts || 0,
    totalSales: `$${summary.totalRevenue || 0}`,
    activeOrders: summary.totalOrders || 0,
    customers: summary.customers || 0,
  };

  // For buyers, show buyer-specific stats
  if (req.user.role === 'buyer') {
    // Get buyer's orders count and total spent
    const buyerOrders = await run(
      supabase.from('logs').select('id, details, items(price)').eq('action', 'stock_out').eq('user_id', req.user.id)
    ).catch(() => []);

    let buyerTotalSpent = 0;
    let buyerActiveOrders = 0;
    buyerOrders.forEach((log) => {
      const quantityMatch = log.details?.match(/Sold (\d+) unit/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      const price = log.items?.price || 0;
      buyerTotalSpent += price * quantity;
    });

    // Get active (pending/processing) orders for buyer
    const buyerActiveOrderData = await run(
      supabase.from('logs').select('id, orders_status(status)').eq('user_id', req.user.id).eq('action', 'stock_out')
    ).catch(() => []);

    buyerActiveOrders = buyerActiveOrderData.filter((log) => {
      const status = log.orders_status?.[0]?.status || 'pending';
      return status === 'pending' || status === 'processing';
    }).length;

    stats = {
      buyerOrdersCount: buyerOrders.length,
      buyerTotalSpent: `$${Math.round(buyerTotalSpent * 100) / 100}`,
      buyerActiveOrders,
    };
  }

  const activities = (analytics.recentTransactions || []).map((t) => ({
    id: t.id,
    description: `${t.product} — ${t.customer}`,
    timestamp: t.date || '',
    type: t.type || 'activity',
  }));

  res.json({ stats, activities });
};
