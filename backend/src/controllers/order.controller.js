// Orders controller: handles order-related endpoints
import OrderService from '../services/order.service.js';
import { createOrderSchema } from '../validators.js';

export const getOrders = async (req, res, next) => {
  try {
    const orders = await OrderService.getOrders(req.user);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  try {
    const order = await OrderService.createOrder(req.user, parse.data);
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const status = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.user.id);
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

export const assignOrder = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    await OrderService.assignOrder(req.params.id, req.body.assigned_to);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
