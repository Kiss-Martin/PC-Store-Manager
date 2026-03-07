// Analytics routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as AnalyticsController from '../controllers/analytics.controller.js';

const router = Router();

router.get('/', authMiddleware, AnalyticsController.getAnalytics);
router.get('/export', authMiddleware, AnalyticsController.exportAnalytics);

export default router;
