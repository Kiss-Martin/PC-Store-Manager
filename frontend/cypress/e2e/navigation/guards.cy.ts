describe('Auth Guards and Navigation', () => {
  beforeEach(() => {
    cy.stubBackendApi();
  });

  describe('Unauthenticated user', () => {
    beforeEach(() => {
      cy.clearAuth();
    });

    it('should redirect /dashboard to /login when not authenticated', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should redirect /products to /login when not authenticated', () => {
      cy.visit('/products');
      cy.url().should('include', '/login');
    });

    it('should redirect /orders to /login when not authenticated', () => {
      cy.visit('/orders');
      cy.url().should('include', '/login');
    });

    it('should redirect /analytics to /login when not authenticated', () => {
      cy.visit('/analytics');
      cy.url().should('include', '/login');
    });

    it('should redirect /profile to /login when not authenticated', () => {
      cy.visit('/profile');
      cy.url().should('include', '/login');
    });

    it('should allow access to /login', () => {
      cy.visit('/login');
      cy.url().should('include', '/login');
    });

    it('should allow access to /register', () => {
      cy.visit('/register');
      cy.url().should('include', '/register');
    });

    it('should allow access to /forgot', () => {
      cy.visit('/forgot');
      cy.url().should('include', '/forgot');
    });
  });

  describe('Authenticated user', () => {
    beforeEach(() => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake';
      const fakeUser = { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' };
      window.localStorage.setItem('pc_token', fakeToken);
      window.localStorage.setItem('token', fakeToken);
      window.localStorage.setItem('user', JSON.stringify(fakeUser));
      window.localStorage.setItem('pc_remember', 'true');
    });

    it('should redirect /login to /dashboard when authenticated (GuestGuard)', () => {
      cy.visit('/login');
      cy.url().should('include', '/dashboard');
    });

    it('should redirect /register to /dashboard when authenticated (GuestGuard)', () => {
      cy.visit('/register');
      cy.url().should('include', '/dashboard');
    });

    it('should allow access to /dashboard', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });

    it('should redirect unknown routes to /dashboard', () => {
      cy.visit('/nonexistent-route');
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Worker role (non-admin)', () => {
    beforeEach(() => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Indvcmtlci1pZCIsInJvbGUiOiJ3b3JrZXIiLCJleHAiOjk5OTk5OTk5OTl9.fake';
      const fakeUser = { id: 'worker-id', email: 'worker@test.com', username: 'worker', fullname: 'Worker User', role: 'worker' };
      window.localStorage.setItem('pc_token', fakeToken);
      window.localStorage.setItem('token', fakeToken);
      window.localStorage.setItem('user', JSON.stringify(fakeUser));
      window.localStorage.setItem('pc_remember', 'true');
    });

    it('should redirect /admin/sessions to /dashboard for workers', () => {
      cy.visit('/admin/sessions');
      cy.url().should('include', '/dashboard');
    });

    it('should redirect /admin/audit to /dashboard for workers', () => {
      cy.visit('/admin/audit');
      cy.url().should('include', '/dashboard');
    });
  });
});
