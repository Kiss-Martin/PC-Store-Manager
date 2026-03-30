import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32),
  password: z.string().min(6),
  fullname: z.string().max(128).optional(),
  role: z.string().optional(),
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
  newPassword: z.string().min(6),
});

export const createItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  category_id: z.string().min(1),
  brand_id: z.string().min(1),
  amount: z.number().int().nonnegative().optional(),
  model: z.string().optional(),
  warranty: z.string().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().nonnegative().optional(),
  category_id: z.string().min(1).optional().nullable(),
  brand_id: z.string().min(1).optional().nullable(),
  amount: z.number().int().nonnegative().optional(),
  model: z.string().optional(),
  warranty: z.string().optional(),
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
  newPassword: z.string().min(6),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
});
