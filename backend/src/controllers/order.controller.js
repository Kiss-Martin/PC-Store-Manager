// Orders controller: handles order-related endpoints
import OrderService from '../services/order.service.js';
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
