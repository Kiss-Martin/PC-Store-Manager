// Customers controller: handles customer-related endpoints
import CustomerService from '../services/customer.service.js';

export const getCustomers = async (req, res) => {
  const customers = await CustomerService.getCustomers();
  res.json({ customers });
};

export const createCustomer = async (req, res) => {
  const customer = await CustomerService.createCustomer(req.body, req.lang);
  res.json({ success: true, customer });
};
