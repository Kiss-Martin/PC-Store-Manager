// Auth controller: handles authentication-related endpoints
import AuthService from '../services/auth.service.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators.js';

// Register a new user
export const register = async (req, res, next) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  try {
    const result = await AuthService.register(parse.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Login
export const login = async (req, res, next) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  try {
    const result = await AuthService.login(parse.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  try {
    await AuthService.forgotPassword(parse.data.email);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors.map((e) => e.message) });
  try {
    await AuthService.resetPassword(parse.data);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
