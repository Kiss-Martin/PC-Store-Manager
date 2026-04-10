// Cypress E2E support file
// Add custom commands and global hooks here

export {};

// Custom command: login via API (bypass UI for speed)
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/auth/login',
    body: { email, password },
    failOnStatusCode: false,
  }).then((res) => {
    if (res.status === 200 && res.body.accessToken) {
      window.localStorage.setItem('pc_token', res.body.accessToken);
      window.localStorage.setItem('token', res.body.accessToken);
      window.localStorage.setItem('pc_user', JSON.stringify(res.body.user));
      window.localStorage.setItem('pc_remember', 'true');
    }
  });
});

// Custom command: clear auth state
Cypress.Commands.add('clearAuth', () => {
  window.localStorage.removeItem('pc_token');
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('pc_user');
  window.localStorage.removeItem('user');
  window.localStorage.removeItem('pc_remember');
  window.sessionStorage.removeItem('pc_token');
  window.sessionStorage.removeItem('token');
  window.sessionStorage.removeItem('pc_user');
  window.sessionStorage.removeItem('user');
});

// Stub backend API calls for isolated testing
Cypress.Commands.add('stubBackendApi', () => {
  // Auth endpoints
  cy.intercept('POST', '**/auth/login', {
    statusCode: 200,
    body: {
      user: { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' },
      accessToken: 'fake-jwt-token.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake-sig',
    },
  }).as('loginApi');

  cy.intercept('POST', '**/auth/register', {
    statusCode: 200,
    body: {
      user: { id: 'new-id', email: 'new@test.com', username: 'newuser', role: 'worker' },
      accessToken: 'fake-jwt-token.eyJpZCI6Im5ldy1pZCIsInJvbGUiOiJ3b3JrZXIiLCJleHAiOjk5OTk5OTk5OTl9.fake-sig',
    },
  }).as('registerApi');

  cy.intercept('POST', '**/auth/refresh', {
    statusCode: 401,
    body: { error: 'No refresh token' },
  }).as('refreshApi');

  cy.intercept('POST', '**/auth/logout', {
    statusCode: 200,
    body: { success: true },
  }).as('logoutApi');

  cy.intercept('POST', '**/auth/forgot-password', {
    statusCode: 200,
    body: { success: true, message: 'If that email exists, a reset link has been sent.' },
  }).as('forgotApi');

  // Dashboard
  cy.intercept('GET', '**/dashboard', {
    statusCode: 200,
    body: {
      stats: { totalProducts: 42, totalSales: '$12500', activeOrders: 7, customers: 15 },
      activities: [
        { id: '1', description: 'RTX 4090 — John Doe', timestamp: '2026-03-20T10:00:00Z', type: 'activity' },
      ],
    },
  }).as('dashboardApi');

  // Items
  cy.intercept('GET', '**/items', {
    statusCode: 200,
    body: {
      items: [
        { id: 'item-1', name: 'RTX 4090', model: 'FE', price: 1599.99, amount: 5, warranty: 36, category_id: 'cat-1', brand_id: 'brand-1', category: 'GPU', brand: 'NVIDIA' },
        { id: 'item-2', name: 'Core i9-14900K', model: '', price: 599.99, amount: 12, warranty: 24, category_id: 'cat-2', brand_id: 'brand-2', category: 'CPU', brand: 'Intel' },
      ],
    },
  }).as('itemsApi');

  cy.intercept('GET', '**/items/categories', {
    statusCode: 200,
    body: { categories: [{ id: 'cat-1', name: 'GPU' }, { id: 'cat-2', name: 'CPU' }] },
  }).as('categoriesApi');

  cy.intercept('GET', '**/items/brands', {
    statusCode: 200,
    body: { brands: [{ id: 'brand-1', name: 'NVIDIA' }, { id: 'brand-2', name: 'Intel' }] },
  }).as('brandsApi');

  // Orders
  cy.intercept('GET', '**/orders', {
    statusCode: 200,
    body: {
      orders: [
        { id: 'ord-1', orderNumber: '#1001', product: 'RTX 4090', productId: 'item-1', quantity: 1, unitPrice: 1599.99, totalAmount: 1599.99, status: 'completed', customer: 'John Doe', date: '03/20/2026', timestamp: '2026-03-20T10:00:00Z', assignedTo: null },
      ],
    },
  }).as('ordersApi');

  // Customers
  cy.intercept('GET', '**/customers', {
    statusCode: 200,
    body: {
      customers: [
        { id: 'cust-1', name: 'John Doe', email: 'john@example.com', phone: '555-0100' },
      ],
    },
  }).as('customersApi');

  // Analytics
  cy.intercept('GET', '**/analytics**', {
    statusCode: 200,
    body: {
      summary: { totalRevenue: 12500, totalOrders: 30, averageOrderValue: 416.67, topSellingProduct: 'RTX 4090', lowStockItems: 3, revenueGrowth: 15.5 },
      revenueChart: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], data: [1200, 1800, 900, 2100, 1500, 2500, 2500] },
      categoryChart: { labels: ['GPU', 'CPU', 'RAM'], data: [40, 35, 25] },
      topProducts: [{ name: 'RTX 4090', sales: 15, revenue: 23999.85, trend: 'up' }],
      recentTransactions: [],
    },
  }).as('analyticsApi');

  // Users
  cy.intercept('GET', '**/users/me', {
    statusCode: 200,
    body: { user: { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' } },
  }).as('profileApi');

  cy.intercept('GET', '**/users/workers', {
    statusCode: 200,
    body: { users: [{ id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User' }] },
  }).as('workersApi');

  // Support
  cy.intercept('POST', '**/support/contact', {
    statusCode: 200,
    body: { success: true, message: 'Message sent successfully.' },
  }).as('supportApi');

  // Health
  cy.intercept('GET', '**/health', {
    statusCode: 200,
    body: { status: 'ok', supabase: 'reachable' },
  }).as('healthApi');
});

// Type augmentation for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      loginByApi(email: string, password: string): Chainable;
      clearAuth(): Chainable;
      stubBackendApi(): Chainable;
    }
  }
}
