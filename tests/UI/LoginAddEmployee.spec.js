const { test, expect } = require('@playwright/test');

test('Login and navigate to Add Employee', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://tgclient-stage.teamed.global/auth/login');
    
    // Fill in login credentials
    await page.fill("input[type='email']", 'smita+awss@teamed.global');
    await page.fill("input[type='password']", 'test123456');
    
    // Click login button
    await page.click("button[type='submit']");
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    
    // Click on Add Employee
    await page.click("text=Add Employee");
    
    // Verify we're on the Add Employee page
    await expect(page).toHaveURL(/.*\/add-employee/);
}); 