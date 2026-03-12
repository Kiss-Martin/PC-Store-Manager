// OrderService: handles business logic for orders
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { ORDER_STATUSES } from '../utils/constants.js';
import { t } from '../utils/i18n.util.js';

const OrderService = {
  async getOrders(user, lang = 'en') {
    let query = supabase
      .from('logs')
      .select(`id,item_id,customer_id,details,timestamp,assigned_to,items(name,price),customers(name,email)`)
      .eq('action', 'stock_out')
      .order('timestamp', { ascending: false });
    if (user.role !== 'admin') {
      query = query.eq('assigned_to', user.id);
    }
    const data = await run(query);
    const logIds = (data || []).map((log) => log.id);
    const statuses = logIds.length > 0
      ? await run(
        supabase
          .from('orders_status')
          .select('log_id,status,updated_at')
          .in('log_id', logIds)
          .order('updated_at', { ascending: false })
      ).catch(() => [])
      : [];

    const statusByLogId = new Map();
    (statuses || []).forEach((row) => {
      if (!statusByLogId.has(row.log_id)) {
        statusByLogId.set(row.log_id, row.status);
      }
    });

    return (data || []).map((log) => {
      const orderMatch = log.details.match(/Order #(\d+)/);
      const quantityMatch = log.details.match(/Sold (\d+) unit/);
      return {
        id: log.id,
        orderNumber: orderMatch ? `#${orderMatch[1]}` : t(lang, 'common.na'),
        product: log.items?.name || t(lang, 'common.unknown'),
        productId: log.item_id,
        quantity: quantityMatch ? parseInt(quantityMatch[1]) : 0,
        unitPrice: log.items?.price || 0,
        totalAmount: (log.items?.price || 0) * (quantityMatch ? parseInt(quantityMatch[1]) : 0),
        status: statusByLogId.get(log.id) || 'completed',
        customer: log.customers?.name || t(lang, 'common.unknown'),
        date: new Date(log.timestamp).toLocaleDateString(lang === 'hu' ? 'hu-HU' : 'en-US'),
        timestamp: log.timestamp,
        assignedTo: log.assigned_to,
      };
    });
  },

  async createOrder(user, { item_id, customer_id, quantity, status = 'pending' }, lang = 'en') {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error(t(lang, 'order.invalidStatus'));
    }
    const item = await run(supabase.from('items').select('id, name, price, amount').eq('id', item_id).single()).catch(() => null);
    if (!item) throw new Error(t(lang, 'order.itemNotFound'));
    if (item.amount < quantity) throw new Error(t(lang, 'order.insufficientStock', { count: item.amount }));
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

  async updateOrderStatus(id, status, userId, lang = 'en') {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error(t(lang, 'order.invalidStatus'));
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

  async deleteOrder(id, lang = 'en') {
    const log = await run(
      supabase
        .from('logs')
        .select('id,item_id,details,items(amount)')
        .eq('id', id)
        .eq('action', 'stock_out')
        .single()
    ).catch(() => null);

    if (!log) {
      throw new Error(t(lang, 'order.notFound'));
    }

    const statusRow = await run(
      supabase
        .from('orders_status')
        .select('status')
        .eq('log_id', id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()
    ).catch(() => null);

    const quantityMatch = log.details?.match(/Sold (\d+) unit/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
    const status = statusRow?.status || 'completed';

    if ((status === 'completed' || status === 'processing') && log.item_id && quantity > 0) {
      const currentAmount = log.items?.amount || 0;
      await run(
        supabase.from('items').update({ amount: currentAmount + quantity }).eq('id', log.item_id)
      );
    }

    await run(supabase.from('orders_status').delete().eq('log_id', id)).catch(() => null);
    await run(supabase.from('logs').delete().eq('id', id));
  },
};

export default OrderService;
