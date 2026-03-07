// OrderService: handles business logic for orders
import supabase from '../db.js';

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
    const { data, error } = await query;
    if (error) throw new Error(error.message);
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
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      throw new Error('Invalid status');
    }
    const { data: item, error: itemErr } = await supabase
      .from('items')
      .select('id, name, price, amount')
      .eq('id', item_id)
      .single();
    if (itemErr || !item) throw new Error('Item not found');
    if (item.amount < quantity) throw new Error(`Insufficient stock. Only ${item.amount} available`);
    const orderNumber = Math.floor(1000 + Math.random() * 9000);
    if (status === 'completed' || status === 'processing') {
      const { error: updateErr } = await supabase
        .from('items')
        .update({ amount: item.amount - quantity })
        .eq('id', item_id);
      if (updateErr) throw new Error(updateErr.message);
    }
    const { data: log, error: logErr } = await supabase
      .from('logs')
      .insert({
        item_id,
        customer_id,
        action: 'stock_out',
        details: `Sold ${quantity} unit${quantity > 1 ? 's' : ''} - Order #${orderNumber}`,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();
    if (logErr) throw new Error(logErr.message);
    const { error: statusErr } = await supabase.from('orders_status').insert({
      log_id: log.id,
      status,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (statusErr) throw new Error(statusErr.message);
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
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      throw new Error('Invalid status');
    }
    const { data: existingStatus } = await supabase
      .from('orders_status')
      .select('id')
      .eq('log_id', id)
      .single();
    let result;
    if (existingStatus) {
      const { data, error } = await supabase
        .from('orders_status')
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('log_id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = data;
    } else {
      const { data, error } = await supabase
        .from('orders_status')
        .insert({
          log_id: id,
          status,
          updated_by: userId,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      result = data;
    }
    return result;
  },

  async assignOrder(id, assigned_to) {
    const { error } = await supabase
      .from('logs')
      .update({ assigned_to })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export default OrderService;
