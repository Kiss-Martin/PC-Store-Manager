// Tests for Zod validation schemas
import { jest } from '@jest/globals';

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createItemSchema,
  createOrderSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/validators.js';

describe('registerSchema', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional fullname and role', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'secret123',
      fullname: 'Test User',
      role: 'admin',
    });
    expect(result.success).toBe(true);
    expect(result.data.fullname).toBe('Test User');
    expect(result.data.role).toBe('admin');
  });

  it('should accept buyer role', () => {
    const result = registerSchema.safeParse({
      email: 'buyer@example.com',
      username: 'buyeruser',
      password: 'secret123',
      role: 'buyer',
    });
    expect(result.success).toBe(true);
    expect(result.data.role).toBe('buyer');
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      username: 'testuser',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject username shorter than 3 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'ab',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject username longer than 32 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'a'.repeat(33),
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept email + password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'secret',
    });
    expect(result.success).toBe(true);
  });

  it('should accept username + password', () => {
    const result = loginSchema.safeParse({
      username: 'testuser',
      password: 'secret',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional rememberMe', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'secret',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
    expect(result.data.rememberMe).toBe(true);
  });

  it('should reject when neither email nor username is provided', () => {
    const result = loginSchema.safeParse({
      password: 'secret',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('should accept valid password change data', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'newpass123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject new password shorter than 6 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: '12345',
    });
    expect(result.success).toBe(false);
  });
});

describe('createItemSchema', () => {
  it('should accept valid item data', () => {
    const result = createItemSchema.safeParse({
      name: 'RTX 4090',
      price: 1599.99,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional fields', () => {
    const result = createItemSchema.safeParse({
      name: 'RTX 4090',
      price: 1599.99,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
      amount: 10,
      model: 'Founders Edition',
      warranty: '3 years',
    });
    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(10);
    expect(result.data.model).toBe('Founders Edition');
  });

  it('should reject negative price', () => {
    const result = createItemSchema.safeParse({
      name: 'RTX 4090',
      price: -100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
    });
    expect(result.success).toBe(false);
  });

  it('should accept zero price', () => {
    const result = createItemSchema.safeParse({
      name: 'Free Item',
      price: 0,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = createItemSchema.safeParse({
      name: '',
      price: 100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing category_id', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      brand_id: 'brand-uuid-1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing brand_id', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      category_id: 'cat-uuid-1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
      amount: -5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer amount', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
      amount: 5.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  it('should accept valid order data', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      customer_id: 'cust-uuid-1',
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional status', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      customer_id: 'cust-uuid-1',
      quantity: 1,
      status: 'pending',
    });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('pending');
  });

  it('should reject quantity of zero', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      customer_id: 'cust-uuid-1',
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative quantity', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      customer_id: 'cust-uuid-1',
      quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing item_id', () => {
    const result = createOrderSchema.safeParse({
      customer_id: 'cust-uuid-1',
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing customer_id', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer quantity', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      customer_id: 'cust-uuid-1',
      quantity: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'not-valid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('should accept valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-reset-token',
      newPassword: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      newPassword: 'newpass123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short new password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-token',
      newPassword: '12345',
    });
    expect(result.success).toBe(false);
  });
});
