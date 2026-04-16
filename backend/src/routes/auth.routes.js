// Auth routes: connects endpoints to controller
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncWrap } from '../utils/async.util.js';
import * as AuthController from '../controllers/auth.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Rate limiter for sensitive auth endpoints
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 15, // max 15 login/register attempts per 15 min per IP
	standardHeaders: true,
	legacyHeaders: false,
});

const refreshLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 10, // max 10 refresh attempts per minute per IP
	standardHeaders: true,
	legacyHeaders: false,
});

router.post('/register', authLimiter, asyncWrap(AuthController.register));
router.post('/login', authLimiter, asyncWrap(AuthController.login));
router.post('/forgot-password', authLimiter, asyncWrap(AuthController.forgotPassword));
router.post('/reset-password', asyncWrap(AuthController.resetPassword));
router.post('/refresh', refreshLimiter, asyncWrap(AuthController.refresh));
router.post('/logout', asyncWrap(AuthController.logout));

// Sessions: list and revoke
router.get('/tokens', authMiddleware, asyncWrap(AuthController.listTokens));
router.delete('/tokens/:id', authMiddleware, asyncWrap(AuthController.revokeToken));

// Admin-only: list all sessions
router.get('/admin/sessions', authMiddleware, requireRole('admin'), asyncWrap(AuthController.listAllSessions));
router.get('/admin/audit', authMiddleware, requireRole('admin'), asyncWrap(AuthController.listAuditLogs));
router.delete('/admin/revoked/cleanup', authMiddleware, requireRole('admin'), asyncWrap(AuthController.cleanupRevoked));

// Admin approvals
router.get('/admin/pending-admins', authMiddleware, requireRole('admin'), asyncWrap(AuthController.listPendingAdmins));
router.post('/admin/pending-admins/:id/approve', authMiddleware, requireRole('admin'), asyncWrap(AuthController.approveAdmin));
router.post('/admin/pending-admins/:id/reject', authMiddleware, requireRole('admin'), asyncWrap(AuthController.rejectAdmin));
router.get('/admin/pending-admins/:id/approve/oneclick', asyncWrap(AuthController.approveAdminOneClick));
router.get('/admin/pending-admins/:id/reject/oneclick', asyncWrap(AuthController.rejectAdminOneClick));

// Worker approvals
router.get('/admin/pending-workers', authMiddleware, requireRole('admin'), asyncWrap(AuthController.listPendingWorkers));
router.post('/admin/pending-workers/:id/approve', authMiddleware, requireRole('admin'), asyncWrap(AuthController.approveWorker));
router.post('/admin/pending-workers/:id/reject', authMiddleware, requireRole('admin'), asyncWrap(AuthController.rejectWorker));
router.get('/admin/pending-workers/:id/approve/oneclick', asyncWrap(AuthController.approveWorkerOneClick));
router.get('/admin/pending-workers/:id/reject/oneclick', asyncWrap(AuthController.rejectWorkerOneClick));

export default router;
