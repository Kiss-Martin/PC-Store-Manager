// Orders controller: handles order-related endpoints
import OrderService from '../services/order.service.js';
import { generateCsvFromObjects } from '../utils/csv.util.js';
import { generatePdfReport } from '../utils/pdf.util.js';
import { localizedStatus, localizeValidationErrors, t } from '../utils/i18n.util.js';
import { createOrderSchema } from '../validators.js';

export const getOrders = async (req, res) => {
  const orders = await OrderService.getOrders(req.user, req.lang);
  res.json({ orders });
};

export const createOrder = async (req, res) => {
  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const order = await OrderService.createOrder(req.user, parse.data, req.lang);
  res.json({ success: true, order });
};

export const updateOrderStatus = async (req, res) => {
  const status = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.user.id, req.lang);
  res.json({ success: true, status });
};

export const assignOrder = async (req, res) => {
  await OrderService.assignOrder(req.params.id, req.body.assigned_to);
  res.json({ success: true });
};

export const deleteOrder = async (req, res) => {
  await OrderService.deleteOrder(req.params.id, req.lang);
  res.json({ success: true });
};

export const exportOrders = async (req, res) => {
  const status = req.query.status || 'all';
  const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
  const lang = req.lang;
  const orders = await OrderService.getOrders(req.user, req.lang);
  // filter by status if provided
  const filtered = status === 'all' ? orders : orders.filter((o) => o.status === status);

  const columns = [
      { key: 'id', label: t(lang, 'export.orders.id') },
      { key: 'orderNumber', label: t(lang, 'export.orders.number') },
      { key: 'product', label: t(lang, 'export.orders.product') },
      { key: 'quantity', label: t(lang, 'export.orders.quantity') },
      { key: 'unitPrice', label: t(lang, 'export.orders.unitPrice') },
      { key: 'totalAmount', label: t(lang, 'export.orders.totalAmount') },
      { key: 'status', label: t(lang, 'export.orders.status') },
      { key: 'customer', label: t(lang, 'export.orders.customer') },
      { key: 'date', label: t(lang, 'export.orders.date') },
    ];

  const localizedRows = filtered.map((order) => ({
    ...order,
    status: localizedStatus(lang, order.status),
  }));
  
  const dateStamp = new Date().toISOString().split('T')[0];

  if (format === 'pdf') {
    const pdf = await generatePdfReport({
      title: t(lang, 'export.orders.title'),
      subtitle: t(lang, 'export.orders.generatedOn', { date: dateStamp }),
      summary: [
        { label: t(lang, 'export.orders.statusFilter'), value: status === 'all' ? t(lang, 'common.all') : localizedStatus(lang, status) },
        { label: t(lang, 'export.orders.exported'), value: filtered.length },
        {
          label: t(lang, 'export.orders.totalRevenue'),
          value: `$${filtered.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0).toFixed(2)}`,
        },
      ],
      columns,
      rows: localizedRows,
      summaryTitle: t(lang, 'export.summary'),
    });
    const filename = `orders-${status}-${dateStamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.send(pdf);
  }

  const csv = generateCsvFromObjects(columns, localizedRows);
  const filename = `orders-${status}-${dateStamp}.csv`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
};
