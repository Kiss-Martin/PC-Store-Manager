// Items routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as ItemController from '../controllers/item.controller.js';

const router = Router();

router.get('/', authMiddleware, asyncWrap(ItemController.getItems));
router.post('/', authMiddleware, requireRole('admin'), asyncWrap(ItemController.createItem));
router.patch('/:id', authMiddleware, requireRole('admin'), asyncWrap(ItemController.updateItem));
router.delete('/:id', authMiddleware, requireRole('admin'), asyncWrap(ItemController.deleteItem));

export default router;
