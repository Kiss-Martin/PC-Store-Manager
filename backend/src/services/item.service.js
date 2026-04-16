// ItemService: handles business logic for items
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { mailTransporter, smtpConfig } from '../utils/mail.util.js';
import { renderStockUpdateNotification } from '../utils/email.template.js';

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
    // Convert warranty to JSON format if it's an object
    let warrantyData = warranty;
    if (typeof warranty === 'object' && warranty !== null && 'value' in warranty) {
      warrantyData = JSON.stringify(warranty);
      console.log('CREATE_ITEM: Warranty object converted to JSON -', warranty);
    }
    
    const data = await run(
      supabase.from('items').insert({
        name,
        model,
        price,
        amount,
        warranty: warrantyData,
        category_id,
        brand_id,
        date_added: new Date().toISOString().split('T')[0],
      }).select().single()
    );
    console.log('CREATE_ITEM: Item created -', { id: data.id, name: data.name, warranty: data.warranty });
    
    // log stock in (fire-and-forget; run will throw if log insert fails)
    await run(
      supabase.from('logs').insert({
        item_id: data.id,
        action: 'stock_in',
        details: `Added ${amount} unit${amount > 1 ? 's' : ''} - New item: ${name}`,
        timestamp: new Date().toISOString(),
        user_id: userId || null,
      })
    );
    return data;
  },

  async updateItem(id, updates) {
    // Get current item to track stock changes
    const currentItem = await run(supabase.from('items').select('amount,name').eq('id', id).single()).catch(() => null);
    console.log('UPDATE_ITEM: Current item -', currentItem ? { id: currentItem.id || id, name: currentItem.name, amount: currentItem.amount } : 'NOT_FOUND');
    
    // Only pass known columns to Supabase; convert empty-string FKs to null
    const allowed = ['name', 'model', 'price', 'amount', 'warranty', 'brand_id', 'category_id'];
    const clean = {};
    for (const key of allowed) {
      if (key in updates) {
        const val = updates[key];
        // Convert empty strings to null for UUID foreign key columns
        if ((key === 'brand_id' || key === 'category_id') && (val === '' || val === null)) {
          clean[key] = null;
        } else if (key === 'warranty') {
          // Convert warranty object to JSON if necessary
          if (typeof val === 'object' && val !== null && 'value' in val) {
            clean[key] = JSON.stringify(val);
            console.log('UPDATE_ITEM: Warranty object converted to JSON -', val);
          } else if (val === null || val === '') {
            clean[key] = null;
          } else {
            clean[key] = val;
          }
        } else {
          clean[key] = val;
        }
      }
    }
    console.log('UPDATE_ITEM: Applying updates -', clean);
    const data = await run(supabase.from('items').update(clean).eq('id', id).select().single());
    console.log('UPDATE_ITEM: Update completed -', { id: data.id, name: data.name, amount: data.amount });
    
    // Log stock changes if amount was updated
    if (currentItem && 'amount' in updates && currentItem.amount !== updates.amount) {
      const quantityChange = updates.amount - currentItem.amount;
      const action = quantityChange > 0 ? 'stock_in' : 'stock_out';
      const absChange = Math.abs(quantityChange);
      const logDetails = `${action === 'stock_in' ? 'Added' : 'Removed'} ${absChange} unit${absChange > 1 ? 's' : ''} - ${currentItem.name}`;
      
      console.log('UPDATE_ITEM: Stock change detected -', { productName: currentItem.name, oldAmount: currentItem.amount, newAmount: updates.amount, action, absChange });
      
      await run(
        supabase.from('logs').insert({
          item_id: id,
          action,
          details: logDetails,
          timestamp: new Date().toISOString(),
          user_id: null,
        })
      ).catch((err) => {
        console.error('UPDATE_ITEM: Failed to log stock change:', err && err.message ? err.message : err);
      });
      console.log('UPDATE_ITEM: Stock change logged successfully');

      // Send email notification to admins about stock change (fire-and-forget)
      if (mailTransporter) {
        try {
          // Get all admin emails
          const admins = await run(
            supabase.from('users').select('email').eq('role', 'admin').not('email', 'is', null)
          ).catch(() => []);

          if (admins && admins.length > 0) {
            const adminEmails = admins.map((a) => a.email).filter(Boolean);
            const emailTemplate = renderStockUpdateNotification({
              lang: 'en',
              productName: currentItem.name,
              oldQuantity: currentItem.amount,
              newQuantity: updates.amount,
            });

            // Send to all admins (parallel, non-blocking)
            adminEmails.forEach((adminEmail) => {
              mailTransporter.sendMail({
                to: adminEmail,
                from: smtpConfig.from,
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                html: emailTemplate.html,
              }).catch((err) => {
                console.warn(`Failed to send stock update email to ${adminEmail}:`, err && err.message ? err.message : err);
              });
            });
          }
        } catch (err) {
          console.warn('Error sending stock update notifications:', err && err.message ? err.message : err);
          // Do not throw - let the main request complete even if email fails
        }
      }
    }
    
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
