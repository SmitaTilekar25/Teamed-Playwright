import { test, expect } from '@playwright/test';
import { EmployerPage } from './pages/EmployerPage';

test.describe('Employee Form Submission', () => {
    let employerPage: EmployerPage;

    test.beforeEach(async ({ page }) => {
        employerPage = new EmployerPage(page);
    });

    test('should successfully add a new employee', async ({ page }) => {
        // Navigate to login page
        await employerPage.navigateToLoginPage();
        
        // Pause to inspect the page
        await page.pause();
        
        // Login
        await employerPage.login();
        
        // Click on Add Employee button
        await employerPage.clickAddEmployerButton();
        
        // Fill the employee form
        await employerPage.fillEmployerForm();
        
        // Submit the form
        await employerPage.submitEmployerForm();
        
        // Add assertions based on success message or redirection
        await expect(page).toHaveURL(/.*employees/, { timeout: 30000 });
    });
}); 