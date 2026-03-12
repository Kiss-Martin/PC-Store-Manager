// Orders controller: handles order-related endpoints
import OrderService from '../services/order.service.js';
import { generateCsvFromObjects } from '../utils/csv.util.js';
import { generatePdfReport } from '../utils/pdf.util.js';
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

export const deleteOrder = async (req, res) => {
  await OrderService.deleteOrder(req.params.id);
  res.json({ success: true });
};

export const exportOrders = async (req, res) => {
  const status = req.query.status || 'all';
  const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
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
  
  const dateStamp = new Date().toISOString().split('T')[0];

  if (format === 'pdf') {
    const pdf = await generatePdfReport({
      title: 'Orders Report',
      subtitle: `Generated on ${dateStamp}`,
      summary: [
        { label: 'Status Filter', value: status },
        { label: 'Orders Exported', value: filtered.length },
        {
          label: 'Total Revenue',
          value: `$${filtered.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0).toFixed(2)}`,
        },
      ],
      columns,
      rows: filtered,
    });
    const filename = `orders-${status}-${dateStamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(pdf);
  }

  const csv = generateCsvFromObjects(columns, filtered);
  const filename = `orders-${status}-${dateStamp}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
};
