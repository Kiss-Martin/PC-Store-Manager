// Orders routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as OrderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', authMiddleware, asyncWrap(OrderController.getOrders));
router.get('/export', authMiddleware, requireRole('admin'), asyncWrap(OrderController.exportOrders));
router.post('/', authMiddleware, requireRole('admin'), asyncWrap(OrderController.createOrder));
router.patch('/:id/status', authMiddleware, requireRole('admin'), asyncWrap(OrderController.updateOrderStatus));
router.patch('/:id/assign', authMiddleware, requireRole('admin'), asyncWrap(OrderController.assignOrder));
router.delete('/:id', authMiddleware, requireRole('admin'), asyncWrap(OrderController.deleteOrder));

export default router;
