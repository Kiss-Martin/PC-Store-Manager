import { Router } from 'express';
import { asyncWrap } from '../utils/async.util.js';
import * as DashboardController from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', asyncWrap(DashboardController.getDashboard));

export default router;
