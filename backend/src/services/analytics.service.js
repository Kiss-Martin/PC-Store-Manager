// AnalyticsService: handles business logic for analytics
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

const AnalyticsService = {

  /**
   * Get analytics summary for dashboard.
   * - Calculates revenue, orders, top products, category distribution, and recent transactions.
   * - Handles different periods (7, 30, 90 days) and formats data for charts.
   * - Uses logs and items tables for real sales data.
   */
  async getAnalytics(user, { period = '7days' }) {
    // TODO: Port full logic from original endpoint here.
    // Example: Fetch items, logs, calculate revenue, group by period, etc.
    // See original /analytics endpoint for reference.
    // Add comments to each calculation step for maintainability.
      // Calculate date range based on period
      let daysAgo = 7;
      if (period === '30days') daysAgo = 30;
      else if (period === '90days') daysAgo = 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get all items with stock and price info
      const allItems = await run(supabase.from('items').select('id, name, amount, price, categories(name), brands(name)'));

      // Get sales logs (stock_out actions) for the period
      const salesLogs = await run(
        supabase
          .from('logs')
          .select('id, item_id, action, timestamp, details, items(name,price)')
          .eq('action', 'stock_out')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false })
      );

      // --- Revenue, Orders, Sales by Product/Day ---
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
        const productName = log.items?.name || 'Unknown';
        if (!salesByProduct[productName]) {
          salesByProduct[productName] = { sales: 0, revenue: 0, name: productName };
        }
        salesByProduct[productName].sales += quantity;
        salesByProduct[productName].revenue += revenue;
        // Track sales by day for chart
        const day = new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
        salesByDay[day] = (salesByDay[day] || 0) + revenue;
      });

      // --- Revenue Chart ---
      let revenueChart = {};
      if (period === '7days') {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = labels.map((day) => salesByDay[day] || 0);
        revenueChart = { labels, data };
      } else if (period === '30days') {
        // Group by week
        const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const data = [0, 0, 0, 0];
        salesLogs.forEach((log) => {
          const daysAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(daysAgo / 7);
          if (weekIndex < 4) {
            const quantityMatch = log.details?.match(/Sold (\d+) unit/);
            const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
            const revenue = (log.items?.price || 0) * quantity;
            data[weekIndex] += revenue;
          }
        });
        revenueChart = { labels, data: data.reverse() };
      } else if (period === '90days') {
        // Group by month
        const labels = ['Month 1', 'Month 2', 'Month 3'];
        const data = [0, 0, 0];
        salesLogs.forEach((log) => {
          const daysAgo = Math.floor((Date.now() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24));
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

      // --- Category Distribution Chart ---
      const categoryCounts = {};
      allItems.forEach((item) => {
        const categoryName = item.categories?.name || 'Uncategorized';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      const totalCategorized = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
      const categoryChart = {
        labels: Object.keys(categoryCounts),
        data: Object.values(categoryCounts).map((count) =>
          totalCategorized > 0 ? Math.round((count / totalCategorized) * 100) : 0
        ),
      };

      // --- Top Products ---
      const topProducts = Object.values(salesByProduct)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((product) => ({
          name: product.name,
          sales: product.sales,
          revenue: Math.round(product.revenue * 100) / 100,
          trend: 'up', // Could calculate trend by comparing to previous period
        }));

      // --- Low Stock Items ---
      const lowStockItems = allItems.filter((item) => item.amount < 10).length;

      // --- Recent Transactions (admin only) ---
      let recentTransactions = [];
      if (user.role === 'admin') {
        const recentSalesLogs = await run(
          supabase
            .from('logs')
            .select('id, timestamp, details, items(name, price), customers(name)')
            .eq('action', 'stock_out')
            .order('timestamp', { ascending: false })
            .limit(5)
        );
        recentTransactions = (recentSalesLogs || []).map((log) => {
          const quantityMatch = log.details?.match(/Sold (\d+) unit/);
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          const amount = Math.round((log.items?.price || 0) * quantity * 100) / 100;
          const orderMatch = log.details?.match(/Order #(\d+)/);
          const orderId = orderMatch ? `TRX-${orderMatch[1]}` : `TRX-${log.id.substring(0, 6)}`;
          return {
            id: orderId,
            product: log.items?.name || 'Unknown',
            customer: log.customers?.name || 'Guest',
            amount,
            status: 'completed',
            date: new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 16),
          };
        });
      }

      // --- Average Order Value ---
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // --- Revenue Growth (compare to previous period) ---
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - daysAgo);
      const previousSalesLogs = await run(
        supabase
          .from('logs')
          .select('id, details, items(price)')
          .eq('action', 'stock_out')
          .gte('timestamp', previousStartDate.toISOString())
          .lt('timestamp', startDate.toISOString())
      );
      let previousRevenue = 0;
      if (previousSalesLogs) {
        previousSalesLogs.forEach((log) => {
          const quantityMatch = log.details?.match(/Sold (\d+) unit/);
          const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
          previousRevenue += (log.items?.price || 0) * quantity;
        });
      }
      const revenueGrowth = previousRevenue > 0
        ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100 * 10) / 10
        : 0;

      // --- Summary ---
      const summary = {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        topSellingProduct: topProducts[0]?.name || 'N/A',
        lowStockItems,
        revenueGrowth,
      };

      return {
        summary,
        revenueChart,
        categoryChart,
        topProducts,
        recentTransactions,
      };
    },

    /**
     * Export analytics as CSV for the given period.
     * @param {object} query - Query params (period)
     * @returns {object} - { csv, filename }
     */
    async exportAnalytics({ period = '7days' }) {
      let daysAgo = 7;
      if (period === '30days') daysAgo = 30;
      else if (period === '90days') daysAgo = 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      // Get sales logs with item details
      const salesLogs = await run(
        supabase
          .from('logs')
          .select('id, timestamp, details, items(name, price, brands(name), categories(name))')
          .eq('action', 'stock_out')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false })
      );
      // Generate CSV
      let csv = 'Date,Product,Brand,Category,Quantity,Unit Price,Total,Order ID\n';
      salesLogs.forEach((log) => {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        const product = (log.items?.name || 'Unknown').replace(/,/g, ';');
        const brand = (log.items?.brands?.name || 'N/A').replace(/,/g, ';');
        const category = (log.items?.categories?.name || 'N/A').replace(/,/g, ';');
        const quantityMatch = log.details?.match(/Sold (\d+) unit/);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
        const unitPrice = log.items?.price || 0;
        const total = unitPrice * quantity;
        const orderMatch = log.details?.match(/Order #(\d+)/);
        const orderId = orderMatch ? orderMatch[1] : 'N/A';
        csv += `${date},${product},${brand},${category},${quantity},${unitPrice},${total},${orderId}\n`;
      });

      const filename = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      return { csv, filename };
    }
};

export default AnalyticsService;
