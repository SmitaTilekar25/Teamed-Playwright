const { test, expect } = require('@playwright/test');

test('Add Employee', async ({ page }) => {
    // Navigate to the URL
    await page.goto("https://tgapp-staging.teamed.global/auth/activate/a1e7c108c2fb8d635b01033e099d09ca");

    // Fill in the password fields
    await page.fill("//input[@id='create_password.password']", 'test123456');
    await page.fill("//input[@id='create_password.password_again']", 'test123456');

    // Locate and interact with the checkbox for terms and conditions
    const termsCheckbox = page.locator("(//label[@for='accept_terms.terms'])[1]");
    await expect(termsCheckbox).toBeVisible();
    await termsCheckbox.check();

    // Locate and interact with the checkbox for privacy policy (if needed)
    const privacyCheckbox = page.locator("(//label[@for='accept_terms.privacy'])[1]");
    await expect(privacyCheckbox).toBeVisible();
    await privacyCheckbox.check();

    // Click the submit button
    await page.locator("//button[@type='submit']").click();

    // Optional: Add assertions to verify the result of the form submission
    await expect(page).toHaveURL(/success/); // Replace with the expected URL or condition
});