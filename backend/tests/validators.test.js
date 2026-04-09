// Tests for Zod validation schemas
import { jest } from '@jest/globals';

import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  createItemSchema,
  updateItemSchema,
  createOrderSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/validators.js';

describe('registerSchema', () => {
  it('should accept valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Secret123!',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional fullname and role', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Secret123!',
      fullname: 'Test User',
      role: 'admin',
    });
    expect(result.success).toBe(true);
    expect(result.data.fullname).toBe('Test User');
    expect(result.data.role).toBe('admin');
  });

  it('should accept worker role', () => {
    const result = registerSchema.safeParse({
      email: 'worker@example.com',
      username: 'workeruser',
      password: 'Secret123!',
      role: 'worker',
    });
    expect(result.success).toBe(true);
    expect(result.data.role).toBe('worker');
  });

  it('should reject buyer as explicit role (buyer is default, not in enum)', () => {
    const result = registerSchema.safeParse({
      email: 'buyer@example.com',
      username: 'buyeruser',
      password: 'Secret123!',
      role: 'buyer',
    });
    expect(result.success).toBe(false);
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
      password: 'Secret123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject username longer than 32 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'a'.repeat(33),
      password: 'Secret123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Sh0rt!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'secret123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without lowercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'SECRET123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without digit', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Secretpass!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without special character', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Secret1234',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = registerSchema.safeParse({
      username: 'testuser',
      password: 'Secret123!',
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
      newPassword: 'NewPass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'NewPass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak new password (no uppercase)', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject new password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'Sh0rt!',
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
      warranty: 36,
      warranty_unit: 'months',
    });
    expect(result.success).toBe(true);
    expect(result.data.amount).toBe(10);
    expect(result.data.model).toBe('Founders Edition');
    expect(result.data.warranty).toBe(36);
    expect(result.data.warranty_unit).toBe('months');
  });

  it('should accept all warranty_unit enum values', () => {
    for (const unit of ['days', 'weeks', 'months', 'years']) {
      const result = createItemSchema.safeParse({
        name: 'GPU',
        price: 100,
        category_id: 'cat-uuid-1',
        brand_id: 'brand-uuid-1',
        warranty: 3,
        warranty_unit: unit,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid warranty_unit', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
      warranty: 3,
      warranty_unit: 'centuries',
    });
    expect(result.success).toBe(false);
  });

  it('should reject string warranty (must be number)', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
      warranty: '3 years',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative warranty', () => {
    const result = createItemSchema.safeParse({
      name: 'GPU',
      price: 100,
      category_id: 'cat-uuid-1',
      brand_id: 'brand-uuid-1',
      warranty: -1,
    });
    expect(result.success).toBe(false);
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

  it('should allow missing customer_id (optional for buyers)', () => {
    const result = createOrderSchema.safeParse({
      item_id: 'item-uuid-1',
      quantity: 1,
    });
    expect(result.success).toBe(true);
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
      newPassword: 'NewPass123!',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      newPassword: 'NewPass123!',
    });
    expect(result.success).toBe(false);
  });

  it('should reject weak new password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-token',
      newPassword: 'weakpass',
    });
    expect(result.success).toBe(false);
  });

  it('should reject short new password', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'some-token',
      newPassword: 'Sh0rt!',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateItemSchema', () => {
  it('should accept partial updates', () => {
    const result = updateItemSchema.safeParse({
      name: 'Updated GPU',
      price: 1299.99,
    });
    expect(result.success).toBe(true);
  });

  it('should accept warranty number with unit', () => {
    const result = updateItemSchema.safeParse({
      warranty: 24,
      warranty_unit: 'months',
    });
    expect(result.success).toBe(true);
  });

  it('should accept nullable category_id and brand_id', () => {
    const result = updateItemSchema.safeParse({
      category_id: null,
      brand_id: null,
    });
    expect(result.success).toBe(true);
  });

  it('should accept an empty object (all fields optional)', () => {
    const result = updateItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should reject invalid warranty_unit', () => {
    const result = updateItemSchema.safeParse({
      warranty_unit: 'decades',
    });
    expect(result.success).toBe(false);
  });

  it('should reject string warranty', () => {
    const result = updateItemSchema.safeParse({
      warranty: '2 years',
    });
    expect(result.success).toBe(false);
  });
});
