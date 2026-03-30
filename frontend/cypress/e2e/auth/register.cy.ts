describe('Register Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    cy.clearAuth();
    cy.visit('/register');
  });

  it('should display the registration form', () => {
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should register successfully and redirect to dashboard', () => {
    cy.get('input[name="email"]').type('new@test.com');
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="password"]').type('password123');
    // Optional fullname if present
    cy.get('input[name="fullname"]').then(($input) => {
      if ($input.length) {
        cy.wrap($input).type('New User');
      }
    });
    cy.get('button[type="submit"]').click();
    cy.wait('@registerApi');
    cy.url().should('include', '/dashboard');
  });

  it('should show validation errors on empty submit', () => {
    cy.get('button[type="submit"]').click();
    // Should show some form of error feedback
    cy.get('app-toast, [class*="toast"], [class*="error"]').should('exist');
  });

  it('should have link back to login', () => {
    cy.contains(/login|sign in/i).should('be.visible');
  });

  it('should display the buyer role option', () => {
    // The first step should show 3 role options including buyer
    cy.contains(/buyer|vásárló/i).should('be.visible');
  });

  it('should have three role selection buttons', () => {
    // Admin, Worker, and Buyer
    cy.get('button').filter(':contains("Admin"), :contains("Worker"), :contains("Buyer"), :contains("admin"), :contains("worker"), :contains("buyer")').should('have.length.at.least', 3);
  });
});
