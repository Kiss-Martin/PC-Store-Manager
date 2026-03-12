// CustomerService: handles business logic for customers
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

const CustomerService = {
  async getCustomers() {
    const data = await run(supabase.from('customers').select('id, name, email, phone').order('name', { ascending: true }));
    return data || [];
  },

  async createCustomer({ name, email, phone }) {
    if (!name) throw new Error('Customer name is required');
    const data = await run(supabase.from('customers').insert({ name, email, phone }).select().single());
    return data;
  },
};

export default CustomerService;
