// Analytics routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as AnalyticsController from '../controllers/analytics.controller.js';

const router = Router();

router.get('/', authMiddleware, asyncWrap(AnalyticsController.getAnalytics));
router.get('/export', authMiddleware, requireRole('admin'), asyncWrap(AnalyticsController.exportAnalytics));

export default router;
