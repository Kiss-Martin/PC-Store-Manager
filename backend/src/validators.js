import { z } from "zod";

// Reusable strong-password rule: min 8 chars, uppercase, lowercase, digit, special character
const strongPassword = z.string()
  .min(8)
  .regex(/[A-Z]/, 'passwordUppercase')
  .regex(/[a-z]/, 'passwordLowercase')
  .regex(/[0-9]/, 'passwordDigit')
  .regex(/[^A-Za-z0-9]/, 'passwordSpecial');

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string()
    .min(3).max(32)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'usernameChars')
    .refine((val) => !/[\u0300-\u036f\u0483-\u0489\u064b-\u0652]/.test(val), 'usernameNoZalgo'),
  password: strongPassword,
  fullname: z.string().max(128).optional(),
  role: z.enum(['admin', 'worker', 'buyer']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
}).refine((data) => data.email || data.username, {
  message: "email or username required",
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  username: z.string()
    .min(3).max(32)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'usernameChars')
    .refine((val) => !/[\u0300-\u036f\u0483-\u0489\u064b-\u0652]/.test(val), 'usernameNoZalgo')
    .optional(),
  fullname: z.string().max(128).optional(),
});

export const createItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  category_id: z.string().min(1),
  brand_id: z.string().min(1),
  amount: z.number().int().nonnegative().optional(),
  model: z.string().optional(),
  warranty: z.union([
    z.number().int().nonnegative(),
    z.object({
      value: z.number().int().nonnegative(),
      unit: z.enum(['days', 'months', 'years']),
    }),
  ]).optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  category_id: z.string().min(1).optional().nullable(),
  brand_id: z.string().min(1).optional().nullable(),
  amount: z.number().int().nonnegative().optional(),
  model: z.string().optional(),
  warranty: z.union([
    z.number().int().nonnegative(),
    z.object({
      value: z.number().int().nonnegative(),
      unit: z.enum(['days', 'months', 'years']),
    }),
  ]).optional(),
});

export const createOrderSchema = z.object({
  item_id: z.string().min(1),
  customer_id: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  status: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: strongPassword,
});

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1).max(30),
});

// Brand name: must start with a letter, no quantity-like prefixes (e.g. "2x"), 1-100 chars
export const createBrandSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[A-Za-zÀ-ÿ]/, 'brandStartsWithLetter')
    .refine((v) => !/^\d+[xX]\s/.test(v), { message: 'brandNoQuantityPrefix' }),
});
