// Support routes: public endpoint for contact-support form submissions
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncWrap } from '../utils/async.util.js';
import { sendSupportEmail } from '../controllers/support.controller.js';

const router = Router();

// Strict rate limit for the contact endpoint: max 5 requests per 15 minutes per IP
const supportLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many support requests. Please wait and try again.' },
});

// POST /support/contact — no auth required
router.post('/contact', supportLimit, asyncWrap(sendSupportEmail));

export default router;
