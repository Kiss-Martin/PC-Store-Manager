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

  async createItem({ name, model, price, amount, warranty, category_id, brand_id }, userId) {
    const data = await run(
      supabase.from('items').insert({
        name,
        model,
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
        user_id: userId || null,
      })
    );
    return data;
  },

  async updateItem(id, updates) {
    // Only pass known columns to Supabase; convert empty-string FKs to null
    const allowed = ['name', 'model', 'price', 'amount', 'warranty', 'brand_id', 'category_id'];
    const clean = {};
    for (const key of allowed) {
      if (key in updates) {
        const val = updates[key];
        // Convert empty strings to null for UUID foreign key columns
        if ((key === 'brand_id' || key === 'category_id') && (val === '' || val === null)) {
          clean[key] = null;
        } else {
          clean[key] = val;
        }
      }
    }
    const data = await run(supabase.from('items').update(clean).eq('id', id).select().single());
    return data;
  },

  async deleteItem(id) {
    // Find all logs that reference this item
    const itemLogs = await run(
      supabase.from('logs').select('id').eq('item_id', id)
    ).catch(() => []);

    if (itemLogs && itemLogs.length > 0) {
      const logIds = itemLogs.map((l) => l.id);

      // Check if any of those orders have an active status (pending/processing)
      const activeStatuses = await run(
        supabase.from('orders_status')
          .select('log_id,status')
          .in('log_id', logIds)
          .in('status', ['pending', 'processing'])
      ).catch(() => []);

      if (activeStatuses && activeStatuses.length > 0) {
        const err = new Error('ACTIVE_ORDERS');
        err.code = 'ACTIVE_ORDERS';
        throw err;
      }

      // Delete orders_status entries referencing these logs first (FK: orders_status.log_id → logs.id)
      await run(supabase.from('orders_status').delete().in('log_id', logIds)).catch(() => null);
    }

    // Nullify item_id in logs; if that fails (NOT NULL constraint), delete the log rows
    try {
      await run(supabase.from('logs').update({ item_id: null }).eq('item_id', id));
    } catch {
      // orders_status rows already cleaned above, safe to delete logs
      await run(supabase.from('logs').delete().eq('item_id', id)).catch(() => null);
    }

    await run(supabase.from('items').delete().eq('id', id));
  },

  async getCategories() {
    const data = await run(supabase.from('categories').select('id,name').order('name', { ascending: true }));
    return data || [];
  },

  async getBrands() {
    const data = await run(supabase.from('brands').select('id,name').order('name', { ascending: true }));
    return data || [];
  },

  async createBrand(name) {
    // Check for duplicates (case-insensitive)
    const existing = await run(
      supabase.from('brands').select('id,name').ilike('name', name.trim())
    ).catch(() => []);
    if (existing && existing.length > 0) {
      const err = new Error('BRAND_DUPLICATE');
      err.code = 'BRAND_DUPLICATE';
      throw err;
    }
    const data = await run(
      supabase.from('brands').insert({ name: name.trim() }).select().single()
    );
    return data;
  },
};

export default ItemService;
