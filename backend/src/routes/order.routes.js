// Orders routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as OrderController from '../controllers/order.controller.js';

const router = Router();

router.get('/', authMiddleware, OrderController.getOrders);
router.post('/', authMiddleware, OrderController.createOrder);
router.patch('/:id/status', authMiddleware, OrderController.updateOrderStatus);
router.patch('/:id/assign', authMiddleware, OrderController.assignOrder);

export default router;
