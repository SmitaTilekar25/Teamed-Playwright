const { test, expect } = require('@playwright/test');
const testCases = require('../fixtures/employeelogindata.json');

const BASE_URL = 'https://tgapi-stage.teamed.global/v1';

test.describe('Employee Login Tests', () => {
    // Test each login case from the test data
    testCases.forEach(({ name, email, password, expectedStatus, expectToken }) => {
        test(`Login Test - ${name}`, async ({ request }) => {
            console.log(`Running test case: ${name}`);
            console.log(`Email: ${email}, Expected Status: ${expectedStatus}`);

            const response = await request.post(`${BASE_URL}/auth/login`, {
                data: {
                    email,
                    password
                }
            });

            // Verify the status code matches expected
            expect(response.status()).toBe(expectedStatus);
            
            const responseBody = await response.json();
            console.log(`Login Response for ${name}:`, responseBody);

            // Verify token presence/absence based on expectToken
            if (expectToken) {
                expect(responseBody.token).toBeDefined();
                expect(typeof responseBody.token).toBe('string');
                expect(responseBody.token.length).toBeGreaterThan(0);
            } else {
                // For failed login attempts, verify error response
                expect(responseBody.token).toBeUndefined();
                expect(responseBody.message).toBeDefined();
            }
        });
    });
}); 