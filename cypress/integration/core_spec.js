describe('CORE Platform Sanity Check', () => {
  it('loads the landing page', () => {
    cy.visit('http://localhost:8080');
    cy.contains('Welcome to CORE').should('exist');
  });

  it('registers a new company', () => {
    cy.visit('http://localhost:8080/register.html');
    cy.get('#companyName').type('FakeCorp Inc.');
    cy.get('#registerBtn').click();
  });

  it('shows error form works', () => {
    cy.visit('http://localhost:8080/report-error.html');
    cy.get('#errorDescription').type('Simulated bug report test.');
    cy.get('#submitErrorBtn').click();
  });
});

