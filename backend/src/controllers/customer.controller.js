// Customers controller: handles customer-related endpoints
import CustomerService from '../services/customer.service.js';
import { localizeValidationErrors } from '../utils/i18n.util.js';
import { createCustomerSchema } from '../validators.js';

export const getCustomers = async (req, res) => {
  const customers = await CustomerService.getCustomers();
  res.json({ customers });
};

export const createCustomer = async (req, res) => {
  const parse = createCustomerSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const customer = await CustomerService.createCustomer(parse.data, req.lang);
  res.json({ success: true, customer });
};
