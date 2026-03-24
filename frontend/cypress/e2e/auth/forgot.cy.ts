describe('Forgot Password Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    cy.clearAuth();
    cy.visit('/forgot');
  });

  it('should display the forgot password form', () => {
    cy.get('input[name="email"], input[type="email"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should submit a valid email and show success message', () => {
    cy.get('input[name="email"], input[type="email"]').type('admin@test.com');
    cy.get('button[type="submit"]').click();
    cy.wait('@forgotApi');
    // Success toast or message should appear
    cy.get('app-toast, [class*="toast"], [class*="success"]').should('exist');
  });

  it('should have a link back to login', () => {
    cy.contains(/login|sign in|back/i).should('be.visible');
  });
});
