// ItemService: handles business logic for items
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

const ItemService = {
  async getItems() {
    const data = await run(supabase.from('items').select(`*,categories(name),brands(name)`).order('name', { ascending: true }));
    return (data || []).map((item) => ({
      ...item,
      category: item.categories?.name,
      brand: item.brands?.name,
    }));
  },

  async createItem({ name, model, specs, price, amount, warranty, category_id, brand_id }) {
    const data = await run(
      supabase.from('items').insert({
        name,
        model,
        specs,
        price,
        amount,
        warranty,
        category_id,
        brand_id,
        date_added: new Date().toISOString().split('T')[0],
      }).select().single()
    );
    // log stock in (fire-and-forget; run will throw if log insert fails)
    await run(
      supabase.from('logs').insert({
        item_id: data.id,
        action: 'stock_in',
        details: `Added new item: ${name}`,
        timestamp: new Date().toISOString(),
      })
    );
    return data;
  },

  async updateItem(id, updates) {
    const data = await run(supabase.from('items').update(updates).eq('id', id).select().single());
    return data;
  },

  async deleteItem(id) {
    await run(supabase.from('items').delete().eq('id', id));
  },
};

export default ItemService;
