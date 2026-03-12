import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as DashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', authMiddleware, asyncWrap(DashboardController.getDashboard));

export default router;
