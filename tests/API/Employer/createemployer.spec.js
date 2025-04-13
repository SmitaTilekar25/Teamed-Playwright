// Import Playwright Test Library
const { test, expect } = require('@playwright/test');
const testCases = require('../../fixtures/employerdata.json'); 


const BASE_URL = 'https://tgapi-staging.teamed.global/admin/v1';
let authToken = '';


test.describe('Login as Admin_Create Employer_Add Employees', () => {
  
  // Login as Admin
  test('Login as an Admin', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/auth/login`, {
      data: {
        email: 'smita@teamed.global',
        password: 'test123456'
      }
    });

    expect(response.status()).toBe(201);
    const responseBody = await response.json(); // Parse response in JSON format
    console.log(responseBody);
    authToken = responseBody.token;
    expect(authToken).toBeDefined(); // Ensure token is received
  });

  

  // Function to Create Employer
  async function createEmployer(request, requestBody) {
    return await request.post(`${BASE_URL}/employers`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`, 
        'Content-Type': 'application/json' 
      },
      data: requestBody
    });
  }

  // Loop through test cases and create employers dynamically
  for (const { name, requestBody, expectedStatus } of testCases) {
    test(name, async ({ request }) => {

      const response = await createEmployer(request, requestBody);
      console.log("Request Body:", JSON.stringify(requestBody, null, 2));
      console.log("Response Body:", await response.text());
      expect(response.status()).toBe(expectedStatus);
    });
  }



});
