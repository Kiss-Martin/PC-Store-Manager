describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    // Simulate authenticated state
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake';
    const fakeUser = { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/dashboard');
  });

  it('should display the dashboard page', () => {
    cy.url().should('include', '/dashboard');
  });

  it('should load and display dashboard statistics', () => {
    cy.wait('@dashboardApi');
    // Stats cards should be present
    cy.contains('42').should('be.visible');     // totalProducts
    cy.contains('$12500').should('be.visible'); // totalSales
  });

  it('should display recent activities', () => {
    cy.wait('@dashboardApi');
    cy.contains('RTX 4090').should('be.visible');
  });

  it('should have navigation elements', () => {
    // Navbar should be visible for authenticated users
    cy.get('nav, [class*="nav"], [class*="sidebar"]').should('exist');
  });

  it('should navigate to products page', () => {
    cy.contains(/product/i).first().click();
    cy.url().should('include', '/products');
  });

  it('should navigate to orders page', () => {
    cy.contains(/order/i).first().click();
    cy.url().should('include', '/orders');
  });
});

describe('Dashboard Page (Buyer)', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJ1eWVyLWlkIiwicm9sZSI6ImJ1eWVyIiwiZXhwIjo5OTk5OTk5OTk5fQ.fake';
    const fakeUser = { id: 'buyer-id', email: 'buyer@test.com', username: 'buyer', fullname: 'Buyer User', role: 'buyer' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/dashboard');
  });

  it('should display the dashboard for buyer', () => {
    cy.url().should('include', '/dashboard');
  });

  it('should not show Generate Report button for buyer', () => {
    cy.get('button').filter(':contains("Generate"), :contains("Report")').should('not.exist');
  });

  it('should not show Add Product quick action for buyer', () => {
    cy.contains(/add product/i).should('not.exist');
  });

  it('should not show Analytics/Reports quick action for buyer', () => {
    // The reports quick action should be hidden for buyer
    cy.get('button').filter(':contains("Reports"), :contains("Analytics")').should('not.exist');
  });

  it('should show place order quick action for buyer', () => {
    cy.contains(/place order/i).should('be.visible');
  });

  it('should show View Orders quick action for buyer', () => {
    cy.contains(/view orders|orders/i).should('exist');
  });
});
