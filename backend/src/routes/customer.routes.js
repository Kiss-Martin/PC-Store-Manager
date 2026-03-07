// Customers routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as CustomerController from '../controllers/customer.controller.js';

const router = Router();

router.get('/', authMiddleware, CustomerController.getCustomers);
router.post('/', authMiddleware, CustomerController.createCustomer);

export default router;
