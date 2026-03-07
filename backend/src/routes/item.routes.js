// Items routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as ItemController from '../controllers/item.controller.js';

const router = Router();

router.get('/', authMiddleware, ItemController.getItems);
router.post('/', authMiddleware, ItemController.createItem);
router.patch('/:id', authMiddleware, ItemController.updateItem);
router.delete('/:id', authMiddleware, ItemController.deleteItem);

export default router;
