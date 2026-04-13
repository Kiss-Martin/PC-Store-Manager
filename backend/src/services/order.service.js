// OrderService: handles business logic for orders
import crypto from 'crypto';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { ORDER_STATUSES } from '../utils/constants.js';
import { t } from '../utils/i18n.util.js';
import { getIO } from '../utils/socket.util.js';
import { mailTransporter, smtpConfig } from '../utils/mail.util.js';
import { renderNewOrderNotification, renderOrderStatusChangeNotification, renderBuyerOrderConfirmation } from '../utils/email.template.js';

const OrderService = {
  async getOrders(user, lang = 'en') {
    let query = supabase
      .from('logs')
      .select(`id,item_id,customer_id,details,timestamp,assigned_to,items(name,price),customers(name,email)`)
      .eq('action', 'stock_out')
      .order('timestamp', { ascending: false });
    if (user.role === 'buyer') {
      query = query.eq('user_id', user.id);
    } else if (user.role !== 'admin') {
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
    console.log(`[Order.createOrder] User auth info:`, { id: user?.id, role: user?.role, isBuyer: user?.role === 'buyer' }, `customerId received:`, customer_id);
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error(t(lang, 'order.invalidStatus'));
    }
    const resolvedCustomerId = await this._resolveCustomerIdForOrder(user, customer_id, lang);
    const item = await run(supabase.from('items').select('id, name, price, amount').eq('id', item_id).single()).catch(() => null);
    if (!item) throw new Error(t(lang, 'order.itemNotFound'));
    if (item.amount < quantity) throw new Error(t(lang, 'order.insufficientStock', { count: item.amount }));
    const orderNumber = crypto.randomInt(100000, 999999);
    if (status === 'completed' || status === 'processing') {
      await run(supabase.from('items').update({ amount: item.amount - quantity }).eq('id', item_id));
    }
    const log = await run(
      supabase.from('logs').insert({
        item_id,
        customer_id: resolvedCustomerId,
        action: 'stock_out',
        details: `Sold ${quantity} unit${quantity > 1 ? 's' : ''} - Order #${orderNumber}`,
        timestamp: new Date().toISOString(),
        user_id: user?.id || null,
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
    const result = {
      id: log.id,
      orderNumber: `#${orderNumber}`,
      product: item.name,
      quantity,
      totalAmount: Math.round((item.price || 0) * quantity * 100) / 100,
      status,
    };

    // Notify all workers via email
    this._notifyWorkersOfNewOrder(result, resolvedCustomerId, lang).catch((err) =>
      console.error('Failed to send new-order notifications:', err?.message || err)
    );

    // Notify buyer if this was created by a buyer
    if (user?.role === 'buyer' && user?.id) {
      this._notifyBuyerOfOrderCreation(result, user, lang).catch((err) =>
        console.error('Failed to send buyer order confirmation:', err?.message || err)
      );
    }

    return result;
  },

  async _resolveCustomerIdForOrder(user, customerId, lang = 'en') {
    const isBuyer = user?.role === 'buyer';
    console.log(`\n[Order._resolveCustomerIdForOrder] ===== STARTING CUSTOMER RESOLUTION =====`);
    console.log(`[Order._resolveCustomerIdForOrder] User: ${user?.username} (${user?.email}), Role: ${user?.role}`);
    
    // STAFF (admin/worker): requires customer_id parameter
    if (!isBuyer) {
      if (!customerId) {
        console.error(`[Order._resolveCustomerIdForOrder] ✗ FAILED: Non-buyer without customer_id`);
        throw new Error(t(lang, 'validation.customerRequired'));
      }
      console.log(`[Order._resolveCustomerIdForOrder] ✓ Staff member using provided customer_id: ${customerId}`);
      return customerId;
    }

    // BUYER: Must lookup or create customer
    console.log(`[Order._resolveCustomerIdForOrder] Processing BUYER customer resolution...`);
    
    if (!user?.email) {
      console.error(`[Order._resolveCustomerIdForOrder] ✗ FAILED: Buyer has no email in token`);
      throw new Error('Buyer profile missing email - corrupted token');
    }

    try {
      // Normalize email: lowercase, trim whitespace
      const normalizedEmail = (user.email || '').toLowerCase().trim();
      console.log(`[Order._resolveCustomerIdForOrder] Normalized buyer email: ${normalizedEmail}`);

      // Step 1: Query database for customer with this email
      console.log(`[Order._resolveCustomerIdForOrder] Step 1: Searching for existing customer in DB...`);
      const existingCustomers = await run(
        supabase.from('customers').select('id, name, email').eq('email', normalizedEmail)
      ).catch((err) => {
        console.error(`[Order._resolveCustomerIdForOrder] ✗ Query error:`, err?.message);
        throw err;
      });

      console.log(`[Order._resolveCustomerIdForOrder] Query returned ${existingCustomers?.length || 0} result(s)`);

      if (existingCustomers && existingCustomers.length > 0) {
        const customer = existingCustomers[0];
        console.log(`[Order._resolveCustomerIdForOrder] ✓ FOUND existing customer: ID=${customer.id}, Name=${customer.name}, Email=${customer.email}`);
        return customer.id;
      }

      // Step 2: Customer not found, create one now
      console.log(`[Order._resolveCustomerIdForOrder] Step 2: Customer not found, creating new one...`);
      const customerName = user.fullname || user.username || 'Unknown Buyer';
      console.log(`[Order._resolveCustomerIdForOrder] Creating with: name="${customerName}", email="${normalizedEmail}"`);

      const newCustomer = await run(
        supabase.from('customers').insert({
          name: customerName,
          email: normalizedEmail,
          phone: null,
        }).select('id, name, email').single()
      ).catch((err) => {
        console.error(`[Order._resolveCustomerIdForOrder] ✗ Insert error:`, err?.message);
        throw err;
      });

      if (!newCustomer || !newCustomer.id) {
        console.error(`[Order._resolveCustomerIdForOrder] ✗ Customer creation returned invalid result`);
        throw new Error('Customer creation returned invalid result');
      }

      console.log(`[Order._resolveCustomerIdForOrder] ✓ CREATED new customer: ID=${newCustomer.id}, Name=${newCustomer.name}, Email=${newCustomer.email}`);
      return newCustomer.id;
      
    } catch (error) {
      console.error(`[Order._resolveCustomerIdForOrder] ✗ FAILED with exception:`, error?.message || error);
      throw new Error(`Customer resolution failed: ${error?.message || 'Unknown error'}`);
    }
  },

  async _notifyWorkersOfNewOrder(order, customerId, lang = 'en') {
    if (!mailTransporter) return;
    // Fetch all workers
    const workers = await run(
      supabase.from('users').select('email').eq('role', 'worker')
    ).catch(() => []);
    if (!workers || workers.length === 0) return;

    // Get customer name
    const customer = await run(
      supabase.from('customers').select('name').eq('id', customerId).single()
    ).catch(() => null);

    const emailData = {
      lang,
      orderNumber: order.orderNumber,
      product: order.product,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      customer: customer?.name || 'Unknown',
      status: order.status,
    };
    const tpl = renderNewOrderNotification(emailData);

    await Promise.allSettled(
      workers.map((w) =>
        mailTransporter.sendMail({
          to: w.email,
          from: smtpConfig.from,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        })
      )
    );
  },

  async _notifyBuyerOfOrderCreation(order, user, lang = 'en') {
    if (!mailTransporter || !user?.email) return;

    try {
      const emailData = {
        lang,
        orderNumber: order.orderNumber,
        product: order.product,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
      };
      const tpl = renderBuyerOrderConfirmation(emailData);

      await mailTransporter.sendMail({
        to: user.email,
        from: smtpConfig.from,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });

      console.log(`[Order._notifyBuyerOfOrderCreation] ✓ Sent order confirmation email to ${user.email}`);
    } catch (err) {
      console.error('[Order._notifyBuyerOfOrderCreation] Error:', err?.message || err);
      // Don't throw - email notification failure shouldn't break the order creation
    }
  },

  async updateOrderStatus(id, status, userId, lang = 'en') {
    if (!ORDER_STATUSES.includes(status)) {
      throw new Error(t(lang, 'order.invalidStatus'));
    }
    let existingStatus = null;
    try {
      existingStatus = await run(supabase.from('orders_status').select('id').eq('log_id', id).single());
    } catch (_e) {
      existingStatus = null;
    }
    let result;
    if (existingStatus) {
      result = await run(
        supabase.from('orders_status').update({ status, updated_at: new Date().toISOString(), updated_by: userId }).eq('log_id', id).select().single()
      );
    } else {
      result = await run(
        supabase.from('orders_status').insert({ log_id: id, status, updated_by: userId, updated_at: new Date().toISOString() }).select().single()
      );
    }

    // Notify buyer if order belongs to a buyer
    this._notifyBuyerOfStatusChange(id, status, lang).catch((err) =>
      console.error('Failed to send status change notification:', err?.message || err)
    );

    return result;
  },

  async _notifyBuyerOfStatusChange(orderId, status, lang = 'en') {
    if (!mailTransporter) return;

    try {
      // Fetch the order details including buyer info
      const order = await run(
        supabase.from('logs').select('id, details, user_id, items(name)').eq('id', orderId).single()
      ).catch(() => null);

      if (!order || !order.user_id) return; // No buyer attached to this order

      // Fetch the buyer's email
      const buyer = await run(
        supabase.from('users').select('email').eq('id', order.user_id).single()
      ).catch(() => null);

      if (!buyer || !buyer.email) return; // No buyer email

      // Generate order number - extract from order details
      const orderNumberMatch = (order.details || '').match(/Order #(\d+)/);
      const orderNumber = orderNumberMatch ? `#${orderNumberMatch[1]}` : orderId;

      const emailData = {
        lang,
        orderNumber,
        product: order.items?.name || 'Unknown Product',
        newStatus: status,
      };
      const tpl = renderOrderStatusChangeNotification(emailData);

      await mailTransporter.sendMail({
        to: buyer.email,
        from: smtpConfig.from,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });

      console.log(`[Order._notifyBuyerOfStatusChange] ✓ Sent status change email to ${buyer.email}`);
    } catch (err) {
      console.error('[Order._notifyBuyerOfStatusChange] Error:', err?.message || err);
      // Don't throw - email notification failure shouldn't break the status update
    }
  },

  async assignOrder(id, assigned_to) {
    // Emit real-time notification to the assigned worker
    if (assigned_to) {
      const io = getIO();
      if (io) {
        // Fetch order details for the notification payload
        const log = await run(
          supabase.from('logs').select('id,details,items(name)').eq('id', id).single()
        ).catch(() => null);
        io.to(`user:${assigned_to}`).emit('order:assigned', {
          orderId: id,
          product: log?.items?.name || null,
          details: log?.details || null,
        });
      }
    }
    // Convert empty string to null for unassignment
    const value = assigned_to || null;
    const updated = await run(
      supabase.from('logs').update({ assigned_to: value }).eq('id', id).select('id,assigned_to').single()
    );
    return updated;
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
