// Health routes: connects endpoints to controller
import { Router } from 'express';
import * as HealthController from '../controllers/health.controller.js';

const router = Router();

router.get('/', HealthController.healthCheck);

export default router;
