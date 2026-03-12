// Auth controller: handles authentication-related endpoints
import AuthService from '../services/auth.service.js';
import { localizeValidationErrors } from '../utils/i18n.util.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators.js';

// Register a new user
export const register = async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const result = await AuthService.register(parse.data);
  res.json(result);
};

// Login
export const login = async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const result = await AuthService.login(parse.data, req.lang);
  res.json(result);
};

// Forgot password
export const forgotPassword = async (req, res) => {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const result = await AuthService.forgotPassword(parse.data.email, req.lang);
  // result may be undefined (user not found) or an object with send status
  if (!result) return res.json({ success: true });
  return res.json({ success: true, sent: !!result.sent, message: result.message });
};

// Reset password
export const resetPassword = async (req, res) => {
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  await AuthService.resetPassword(parse.data, req.lang);
  res.json({ success: true });
};
