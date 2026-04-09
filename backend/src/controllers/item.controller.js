// Items controller: handles item-related endpoints
import ItemService from '../services/item.service.js';
import { localizeValidationErrors, t } from '../utils/i18n.util.js';
import { createItemSchema, updateItemSchema, createBrandSchema } from '../validators.js';

export const getItems = async (req, res) => {
  const items = await ItemService.getItems();
  res.json({ items });
};

export const createItem = async (req, res) => {
  const parse = createItemSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const item = await ItemService.createItem(parse.data, req.user?.id);
  res.json({ success: true, item });
};

export const updateItem = async (req, res) => {
  const parse = updateItemSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const item = await ItemService.updateItem(req.params.id, parse.data);
  res.json({ item });
};

export const deleteItem = async (req, res) => {
  try {
    await ItemService.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    const msg = err?.message || '';
    const code = err?.code || '';
    if (code === 'ACTIVE_ORDERS') {
      return res.status(409).json({ error: t(req.lang, 'item.deleteActiveOrders') });
    }
    if (msg.includes('foreign key') || msg.includes('violates') || msg.includes('referenced')) {
      return res.status(409).json({ error: t(req.lang, 'item.deleteFkError') });
    }
    throw err;
  }
};

export const getCategories = async (req, res) => {
  const categories = await ItemService.getCategories();
  res.json({ categories });
};

export const getBrands = async (req, res) => {
  const brands = await ItemService.getBrands();
  res.json({ brands });
};

export const createBrand = async (req, res) => {
  const parse = createBrandSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  try {
    const brand = await ItemService.createBrand(parse.data.name);
    res.json({ success: true, brand });
  } catch (err) {
    if (err?.code === 'BRAND_DUPLICATE') {
      return res.status(409).json({ error: t(req.lang, 'brand.duplicate') });
    }
    if (err?.message?.includes('brandNoQuantityPrefix') || err?.message?.includes('brandStartsWithLetter')) {
      return res.status(400).json({ error: t(req.lang, 'brand.invalidName') });
    }
    throw err;
  }
};
