// CustomerService: handles business logic for customers
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { t } from '../utils/i18n.util.js';

const CustomerService = {
  async getCustomers() {
    const data = await run(supabase.from('customers').select('id, name, email, phone').order('name', { ascending: true }));
    return data || [];
  },

  async createCustomer({ name, email, phone }, lang = 'en') {
    if (!name) throw new Error(t(lang, 'customer.nameRequired'));
    const data = await run(supabase.from('customers').insert({ name, email, phone }).select().single());
    return data;
  },
};

export default CustomerService;
