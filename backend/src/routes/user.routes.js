// Users routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

router.get('/workers', authMiddleware, requireRole('admin'), asyncWrap(UserController.getWorkers));
router.get('/me', authMiddleware, asyncWrap(UserController.getProfile));
router.patch('/me', authMiddleware, asyncWrap(UserController.updateProfile));
router.patch('/me/password', authMiddleware, asyncWrap(UserController.changePassword));

export default router;
