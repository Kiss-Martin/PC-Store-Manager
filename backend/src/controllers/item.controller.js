// Items controller: handles item-related endpoints
import ItemService from '../services/item.service.js';
import { createItemSchema } from '../validators.js';

export const getItems = async (req, res, next) => {
  try {
    const items = await ItemService.getItems();
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

export const createItem = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  const parse = createItemSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  try {
    const item = await ItemService.createItem(parse.data);
    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const item = await ItemService.updateItem(req.params.id, req.body);
    res.json({ item });
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    await ItemService.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
