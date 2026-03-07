// ItemService: handles business logic for items
import supabase from '../db.js';

const ItemService = {
  async getItems() {
    const { data, error } = await supabase
      .from('items')
      .select(`*,categories(name),brands(name)`)
      .order('name', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((item) => ({
      ...item,
      category: item.categories?.name,
      brand: item.brands?.name,
    }));
  },

  async createItem({ name, model, specs, price, amount, warranty, category_id, brand_id }) {
    const { data, error } = await supabase
      .from('items')
      .insert({
        name,
        model,
        specs,
        price,
        amount,
        warranty,
        category_id,
        brand_id,
        date_added: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from('logs').insert({
      item_id: data.id,
      action: 'stock_in',
      details: `Added new item: ${name}`,
      timestamp: new Date().toISOString(),
    });
    return data;
  },

  async updateItem(id, updates) {
    const { data, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteItem(id) {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

export default ItemService;
