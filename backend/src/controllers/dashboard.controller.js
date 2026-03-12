import AnalyticsService from '../services/analytics.service.js';

export const getDashboard = async (req, res) => {
  // Use analytics service to build dashboard payload
  const analytics = await AnalyticsService.getAnalytics(req.user, { period: '7days' });
  const summary = analytics.summary || {};
  const stats = {
    totalProducts: summary.totalProducts || 0,
    totalSales: `$${summary.totalRevenue || 0}`,
    activeOrders: summary.totalOrders || 0,
    customers: summary.customers || 0,
  };

  const activities = (analytics.recentTransactions || []).map((t) => ({
    id: t.id,
    description: `${t.product} — ${t.customer}`,
    timestamp: t.date || '',
    type: t.type || 'activity',
  }));

  res.json({ stats, activities });
};
