describe('Orders Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake';
    const fakeUser = { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/orders');
  });

  it('should display the orders page', () => {
    cy.url().should('include', '/orders');
  });

  it('should load and display orders from the API', () => {
    cy.wait('@ordersApi');
    cy.contains('#1001').should('be.visible');
    cy.contains('RTX 4090').should('be.visible');
  });

  it('should display order details', () => {
    cy.wait('@ordersApi');
    cy.contains('John Doe').should('be.visible');
    cy.contains('1599.99').should('be.visible');
  });

  it('should display order status', () => {
    cy.wait('@ordersApi');
    cy.contains(/completed/i).should('be.visible');
  });

  it('should have a button to create a new order (admin)', () => {
    cy.get('button').filter(':contains("New"), :contains("new"), :contains("Add"), :contains("add"), :contains("Create"), :contains("+")').should('exist');
  });

  it('should allow opening the new order form', () => {
    cy.get('button').filter(':contains("New"), :contains("new"), :contains("Add"), :contains("add"), :contains("Create"), :contains("+")').first().click();
    // Modal or form should appear
    cy.get('[role="dialog"], form, [class*="modal"]').should('exist');
  });

  it('should have export functionality for admin', () => {
    // Look for export button
    cy.get('button').filter(':contains("Export"), :contains("export"), :contains("Download"), :contains("download")').should('exist');
  });
});
