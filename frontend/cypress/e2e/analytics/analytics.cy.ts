describe('Analytics Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake';
    const fakeUser = { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/analytics');
  });

  it('should display the analytics page', () => {
    cy.url().should('include', '/analytics');
  });

  it('should load analytics data', () => {
    cy.wait('@analyticsApi');
  });

  it('should display revenue information', () => {
    cy.wait('@analyticsApi');
    cy.contains(/revenue|12[,.]?500/i).should('exist');
  });

  it('should display top products', () => {
    cy.wait('@analyticsApi');
    cy.contains('RTX 4090').should('be.visible');
  });

  it('should have period selector', () => {
    // Look for period dropdown or buttons
    cy.get('select, [class*="period"], button').filter(':contains("7"), :contains("30"), :contains("90"), :contains("days"), :contains("Days")').should('exist');
  });

  it('should have export functionality', () => {
    cy.get('button').filter(':contains("Export"), :contains("export"), :contains("Report"), :contains("report")').should('exist');
  });
});

describe('Analytics Page (Buyer - blocked by StaffGuard)', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJ1eWVyLWlkIiwicm9sZSI6ImJ1eWVyIiwiZXhwIjo5OTk5OTk5OTk5fQ.fake';
    const fakeUser = { id: 'buyer-id', email: 'buyer@test.com', username: 'buyer', fullname: 'Buyer User', role: 'buyer' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
  });

  it('should redirect buyer away from /analytics to /dashboard', () => {
    cy.visit('/analytics');
    cy.url().should('include', '/dashboard');
  });
});
