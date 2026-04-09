describe('Login Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    cy.clearAuth();
    cy.visit('/login');
  });

  it('should display the login form', () => {
    cy.contains('PC Store').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show error toast when submitting empty form', () => {
    cy.get('button[type="submit"]').click();
    // Toast should appear with an error message
    cy.get('app-toast, [class*="toast"]').should('exist');
  });

  it('should login successfully with valid credentials', () => {
    cy.get('input[name="email"]').type('admin@test.com');
    cy.get('input[name="password"]').type('Secret123!');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginApi');
    // Should navigate to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should show error on failed login', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' },
    }).as('loginFail');

    cy.get('input[name="email"]').type('wrong@test.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginFail');
    // Should show error toast
    cy.get('app-toast, [class*="toast"]').should('exist');
    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should navigate to register page', () => {
    cy.contains('button', /create/i).click();
    cy.url().should('include', '/register');
  });

  it('should navigate to forgot password page', () => {
    cy.contains('button', /forgot/i).click();
    cy.url().should('include', '/forgot');
  });

  it('should have a remember me checkbox', () => {
    cy.get('input[name="rememberMe"]').should('exist');
  });

  it('should toggle password visibility', () => {
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    // Click the eye toggle button next to the password field
    cy.get('input[name="password"]').parent().find('button').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
    // Click again to hide
    cy.get('input[name="password"]').parent().find('button').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
  });

  it('should have theme toggle button', () => {
    cy.get('button[aria-label]').first().should('be.visible');
  });

  it('should open contact support modal', () => {
    cy.contains('button', /contact/i).click();
    cy.get('[role="dialog"]').should('be.visible');
  });

  it('should send contact support message', () => {
    cy.contains('button', /contact/i).click();
    cy.get('[role="dialog"]').should('be.visible');
    // Fill in the contact form
    cy.get('[role="dialog"]').find('input[name="contactName"]').type('Test User');
    cy.get('[role="dialog"]').find('input[name="contactEmail"]').type('test@example.com');
    cy.get('[role="dialog"]').find('textarea[name="contactMessage"], input[name="contactMessage"]').type('I need help');
    cy.get('[role="dialog"]').find('button[type="submit"]').click();
    cy.wait('@supportApi');
  });
});
