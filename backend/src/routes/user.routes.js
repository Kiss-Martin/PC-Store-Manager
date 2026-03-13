// Users routes: connects endpoints to controller
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/auth.middleware.js';
import { asyncWrap } from '../utils/async.util.js';
import * as UserController from '../controllers/user.controller.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) { /* ignore */ }

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		// store as {userId}{ext} so each user has at most one avatar file
		const name = `${req.user?.id || 'unknown'}${ext}`;
		cb(null, name);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
	fileFilter: (req, file, cb) => {
		if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(new Error('Only images allowed'));
		cb(null, true);
	}
});

const router = Router();

router.get('/workers', authMiddleware, requireRole('admin'), asyncWrap(UserController.getWorkers));
router.get('/me', authMiddleware, asyncWrap(UserController.getProfile));
router.patch('/me', authMiddleware, asyncWrap(UserController.updateProfile));
router.patch('/me/password', authMiddleware, asyncWrap(UserController.changePassword));

// Avatar endpoints: only accessible to authenticated users and scoped to owner
router.post('/me/avatar', authMiddleware, upload.single('avatar'), asyncWrap(UserController.uploadAvatar));
router.get('/me/avatar', authMiddleware, asyncWrap(UserController.getMyAvatar));
router.delete('/me/avatar', authMiddleware, asyncWrap(UserController.deleteAvatar));
router.get('/:id/avatar', authMiddleware, asyncWrap(UserController.getAvatarById));

export default router;
