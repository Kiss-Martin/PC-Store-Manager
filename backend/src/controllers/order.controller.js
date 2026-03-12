// Orders controller: handles order-related endpoints
import OrderService from '../services/order.service.js';
import { generateCsvFromObjects } from '../utils/csv.util.js';
import { createOrderSchema } from '../validators.js';

export const getOrders = async (req, res) => {
  const orders = await OrderService.getOrders(req.user);
  res.json({ orders });
};

export const createOrder = async (req, res) => {
  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  const order = await OrderService.createOrder(req.user, parse.data);
  res.json({ success: true, order });
};

export const updateOrderStatus = async (req, res) => {
  const status = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.user.id);
  res.json({ success: true, status });
};

export const assignOrder = async (req, res) => {
  await OrderService.assignOrder(req.params.id, req.body.assigned_to);
  res.json({ success: true });
};

export const exportOrders = async (req, res) => {
  const status = req.query.status || 'all';
  const orders = await OrderService.getOrders(req.user);
  // filter by status if provided
  const filtered = status === 'all' ? orders : orders.filter((o) => o.status === status);

  const columns = [
      { key: 'id', label: 'Order ID' },
      { key: 'orderNumber', label: 'Order Number' },
      { key: 'product', label: 'Product' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'unitPrice', label: 'Unit Price' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'status', label: 'Status' },
      { key: 'customer', label: 'Customer' },
      { key: 'date', label: 'Date' },
    ];
  
    const csv = generateCsvFromObjects(columns, filtered);
  const filename = `orders-${status}-${new Date().toISOString().split('T')[0]}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
};
