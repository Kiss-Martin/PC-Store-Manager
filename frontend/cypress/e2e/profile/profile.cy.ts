describe('Profile Page', () => {
  beforeEach(() => {
    cy.stubBackendApi();
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtaWQiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.fake';
    const fakeUser = { id: 'test-id', email: 'admin@test.com', username: 'admin', fullname: 'Admin User', role: 'admin' };
    window.localStorage.setItem('pc_token', fakeToken);
    window.localStorage.setItem('token', fakeToken);
    window.localStorage.setItem('user', JSON.stringify(fakeUser));
    window.localStorage.setItem('pc_remember', 'true');
    cy.visit('/profile');
  });

  it('should display the profile page', () => {
    cy.url().should('include', '/profile');
  });

  it('should load and display user profile data', () => {
    cy.wait('@profileApi');
    cy.contains('admin@test.com').should('be.visible');
    cy.contains('admin').should('be.visible');
  });

  it('should display the username', () => {
    cy.wait('@profileApi');
    cy.contains('admin').should('be.visible');
  });

  it('should have editable profile fields', () => {
    cy.wait('@profileApi');
    // Profile page should have input fields or edit buttons
    cy.get('input, button').filter(':contains("Edit"), :contains("edit"), :contains("Save"), :contains("save"), [name="email"], [name="username"], [name="fullname"]').should('exist');
  });

  it('should have password change section', () => {
    cy.contains(/password/i).should('exist');
  });

  it('should have logout functionality', () => {
    cy.get('button').filter(':contains("Logout"), :contains("logout"), :contains("Sign out"), :contains("sign out")').should('exist');
  });
});
