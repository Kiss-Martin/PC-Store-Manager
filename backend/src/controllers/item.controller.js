// Items controller: handles item-related endpoints
import ItemService from '../services/item.service.js';
import { createItemSchema } from '../validators.js';

export const getItems = async (req, res) => {
  const items = await ItemService.getItems();
  res.json({ items });
};

export const createItem = async (req, res) => {
  const parse = createItemSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  const item = await ItemService.createItem(parse.data);
  res.json({ success: true, item });
};

export const updateItem = async (req, res) => {
  const item = await ItemService.updateItem(req.params.id, req.body);
  res.json({ item });
};

export const deleteItem = async (req, res) => {
  await ItemService.deleteItem(req.params.id);
  res.json({ success: true });
};
