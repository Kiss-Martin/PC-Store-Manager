// Users routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

router.get('/workers', authMiddleware, UserController.getWorkers);
router.get('/me', authMiddleware, UserController.getProfile);
router.patch('/me', authMiddleware, UserController.updateProfile);
router.patch('/me/password', authMiddleware, UserController.changePassword);

export default router;
