// Health routes: connects endpoints to controller
import { Router } from 'express';
import { asyncWrap } from '../utils/async.util.js';
import * as HealthController from '../controllers/health.controller.js';

const router = Router();

router.get('/', asyncWrap(HealthController.healthCheck));
// readiness probe: ensure DB (Supabase) is reachable
router.get('/ready', asyncWrap(HealthController.healthReady));

export default router;
