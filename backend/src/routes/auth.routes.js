// Auth routes: connects endpoints to controller
import { Router } from 'express';
import { asyncWrap } from '../utils/async.util.js';
import * as AuthController from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', asyncWrap(AuthController.register));
router.post('/login', asyncWrap(AuthController.login));
router.post('/forgot-password', asyncWrap(AuthController.forgotPassword));
router.post('/reset-password', asyncWrap(AuthController.resetPassword));

export default router;
