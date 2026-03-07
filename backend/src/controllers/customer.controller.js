// Customers controller: handles customer-related endpoints
import CustomerService from '../services/customer.service.js';

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await CustomerService.getCustomers();
    res.json({ customers });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const customer = await CustomerService.createCustomer(req.body);
    res.json({ success: true, customer });
  } catch (err) {
    next(err);
  }
};
