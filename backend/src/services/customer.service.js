// CustomerService: handles business logic for customers
import supabase from '../db.js';

const CustomerService = {
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async createCustomer({ name, email, phone }) {
    if (!name) throw new Error('Customer name is required');
    const { data, error } = await supabase
      .from('customers')
      .insert({ name, email, phone })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};

export default CustomerService;
