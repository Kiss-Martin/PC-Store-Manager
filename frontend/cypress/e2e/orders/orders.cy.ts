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

describe('Orders Page (Buyer)', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJ1eWVyLWlkIiwicm9sZSI6ImJ1eWVyIiwiZXhwIjo5OTk5OTk5OTk5fQ.fake';
    const fakeUser = { id: 'buyer-id', email: 'buyer@test.com', username: 'buyer', fullname: 'Buyer User', role: 'buyer' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/orders');
  });

  it('should display the orders page for buyer', () => {
    cy.url().should('include', '/orders');
  });

  it('should have a place order button for buyer', () => {
    cy.get('button').filter(':contains("Place"), :contains("place"), :contains("Order"), :contains("order")').should('exist');
  });

  it('should allow buyer to open the new order form', () => {
    cy.get('button').filter(':contains("Place"), :contains("place")').first().click();
    cy.get('[role="dialog"], form, [class*="modal"]').should('exist');
  });

  it('should not show assigned-to column for buyer', () => {
    cy.wait('@ordersApi');
    cy.get('th').filter(':contains("Assigned")').should('not.exist');
  });

  it('should not show admin edit/delete buttons for buyer', () => {
    cy.wait('@ordersApi');
    cy.get('button[aria-label="Edit"]').should('not.exist');
    cy.get('button[aria-label="Delete"]').should('not.exist');
  });

  it('should have export functionality for buyer', () => {
    cy.get('button').filter(':contains("Export"), :contains("export"), :contains("Download"), :contains("download")').should('exist');
  });
});
