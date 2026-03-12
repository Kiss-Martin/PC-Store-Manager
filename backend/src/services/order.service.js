// OrderService: handles business logic for orders
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { ORDER_STATUSES } from '../utils/constants.js';

const OrderService = {
  async getOrders(user) {
    let query = supabase
      .from('logs')
      .select(`id,item_id,customer_id,details,timestamp,assigned_to,items(name,price),customers(name,email)`)
      .eq('action', 'stock_out')
      .order('timestamp', { ascending: false });
    if (user.role !== 'admin') {
      query = query.eq('assigned_to', user.id);
    }
    const data = await run(query);
    return (data || []).map((log) => {
      const orderMatch = log.details.match(/Order #(\d+)/);
      const quantityMatch = log.details.match(/Sold (\d+) unit/);
      return {
        id: log.id,
        orderNumber: orderMatch ? `#${orderMatch[1]}` : 'N/A',
        product: log.items?.name || 'Unknown',
        productId: log.item_id,
        quantity: quantityMatch ? parseInt(quantityMatch[1]) : 0,
        unitPrice: log.items?.price || 0,
        totalAmount: (log.items?.price || 0) * (quantityMatch ? parseInt(quantityMatch[1]) : 0),
        status: 'completed',
        customer: log.customers?.name || 'Unknown',
        date: new Date(log.timestamp).toLocaleDateString(),
        timestamp: log.timestamp,
        assigned_to: log.assigned_to,
      };
    });
  },

  async createOrder(user, { item_id, customer_id, quantity, status = 'pending' }) {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error('Invalid status');
    }
    const item = await run(supabase.from('items').select('id, name, price, amount').eq('id', item_id).single()).catch(() => null);
    if (!item) throw new Error('Item not found');
    if (item.amount < quantity) throw new Error(`Insufficient stock. Only ${item.amount} available`);
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    if (status === 'completed' || status === 'processing') {
      await run(supabase.from('items').update({ amount: item.amount - quantity }).eq('id', item_id));
    }
    const log = await run(
      supabase.from('logs').insert({
        item_id,
        customer_id,
        action: 'stock_out',
        details: `Sold ${quantity} unit${quantity > 1 ? 's' : ''} - Order #${orderNumber}`,
        timestamp: new Date().toISOString(),
      }).select().single()
    );
    await run(
      supabase.from('orders_status').insert({
        log_id: log.id,
        status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
    );
    return {
      id: log.id,
      orderNumber: `#${orderNumber}`,
      product: item.name,
      quantity,
      totalAmount: Math.round((item.price || 0) * quantity * 100) / 100,
      status,
    };
  },

  async updateOrderStatus(id, status, userId) {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error('Invalid status');
    }
    const existingStatus = await run(supabase.from('orders_status').select('id').eq('log_id', id).single()).catch(() => null);
    let result;
    if (existingStatus) {
      result = await run(
        supabase.from('orders_status').update({ status, updated_at: new Date().toISOString(), updated_by: userId }).eq('log_id', id).select().single()
      );
    } else {
      result = await run(
        supabase.from('orders_status').insert({ log_id: id, status, updated_by: userId }).select().single()
      );
    }
    return result;
  },

  async assignOrder(id, assigned_to) {
    await run(supabase.from('logs').update({ assigned_to }).eq('id', id));
  },
};

export default OrderService;
