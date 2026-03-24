describe('Products Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake';
    const fakeUser = { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/products');
  });

  it('should display the products page', () => {
    cy.url().should('include', '/products');
  });

  it('should load and display products from the API', () => {
    cy.wait('@itemsApi');
    cy.contains('RTX 4090').should('be.visible');
    cy.contains('Core i9-14900K').should('be.visible');
  });

  it('should display product prices', () => {
    cy.wait('@itemsApi');
    cy.contains('1599.99').should('be.visible');
    cy.contains('599.99').should('be.visible');
  });

  it('should display categories and brands', () => {
    cy.wait('@itemsApi');
    cy.contains('GPU').should('be.visible');
    cy.contains('NVIDIA').should('be.visible');
  });

  it('should have a button to add new product (admin only)', () => {
    // Admin should see an add button
    cy.get('button').filter(':contains("Add"), :contains("add"), :contains("New"), :contains("new"), :contains("+")').should('exist');
  });

  it('should open add product modal/form when add button is clicked', () => {
    cy.get('button').filter(':contains("Add"), :contains("add"), :contains("New"), :contains("new"), :contains("+")').first().click();
    // Either a modal appears or a form section
    cy.get('[role="dialog"], form, [class*="modal"]').should('exist');
  });
});
