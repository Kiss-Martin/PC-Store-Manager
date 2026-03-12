// Customers routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as CustomerController from '../controllers/customer.controller.js';

const router = Router();

router.get('/', authMiddleware, asyncWrap(CustomerController.getCustomers));
router.post('/', authMiddleware, requireRole('admin'), asyncWrap(CustomerController.createCustomer));

export default router;
