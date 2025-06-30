const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { google } = require('googleapis');
const employeedata = require('../../fixtures/createemployeedata.json');
const { adminLogin, createEmployee, sendWelcomeEmail, validateSalaries, validateJobTitles, createPassword, employerLogin, getEmailBody, extractActivationLink, createNewPasswordforEmployees, employeeLogin,setupOAuth2Client,generateUniqueGmail} = require('../../api/index');
const testCases = require('../../fixtures/employeelogindata.json');
const { request } = require('http');

const BASE_URL = 'https://tgapi-stage.teamed.global/v1';
let authToken = '';
let adminAuthToken = '';
let contractId = '';
let expectedGrossSalary = '';
let expectedEffectiveDate = '';
let jobTitle = '';
let employeeId = '';
let oAuth2Client = null;



// Login Test - Ensure authToken is set
test.describe.serial('Employer Authentication Tests', () => {
  test.beforeAll(async ({ request }) => {
    // Set up OAuth2 client once at the start
    await setupOAuth2Client();
  });

  for (const testCase of testCases) {
    test(`Login Test - ${testCase.name}`, async ({ request }) => {
      const response = await request.post(`${BASE_URL}/auth/login`, {
        data: {
          email: testCase.email,
          password: testCase.password,
        },
      });

      expect(response.status()).toBe(testCase.expectedStatus);
      const responseBody = await response.json();
      console.log(`Login Response for ${testCase.name}:`, responseBody);

      if (testCase.expectToken) {
        authToken = responseBody.token;
        expect(authToken).toBeDefined();
      } else {
        expect(responseBody.token).toBeUndefined();
      }
    });
  }
}); 



// Employee Creation Tests (Run After Authentication)
test.describe.serial('Create Employee and login as Employee Tests', () => {
  test('Genertae Unque Email', async({request}) =>{
  test.beforeAll(async ({ request }) => {
    // Perform login before all tests in this suite
    const loginDetails = testCases.find(tc => tc.name === 'Valid Login'); // Adjust this to match your valid login test case
    authToken = await employerLogin(request, loginDetails.email, loginDetails.password, loginDetails.expectedStatus, loginDetails.expectToken);
    if (!authToken) {
      throw new Error('Auth token is missing. Ensure login tests run first.');
    }
    console.log(`Auth Token: ${authToken}`);

    // Perform admin login
    adminAuthToken = await adminLogin(request);
    if (!adminAuthToken) {
      throw new Error('Admin auth token is missing. Ensure admin login is successful.');
    }
    console.log(`Admin Auth Token: ${adminAuthToken}`);
  });

  // Modify employee data before creating employees (Dynamic email generation)
  test.beforeAll(async () => {
    for (const data of employeedata) {
      if (data.requestBody && data.requestBody.employee.email === "") {
        data.requestBody.employee.email = generateUniqueGmail(); // Generate a unique email for each test case
        console.log(`Generated Email for ${data.name}: ${data.requestBody.employee.email}`);
      }
    }
  });

  // Employee creation tests
  employeedata.forEach(({ name, requestBody, expectedStatus }) => {
    test(`Create Employee Test - ${name}`, async ({ request }) => {
      console.log(`Creating Employee with Email: ${requestBody.employee.email}`);
      if (!requestBody.employee.email) {
        throw new Error(`Email is missing for employee: ${name}`);
      }
      const result = await createEmployee(request, authToken, requestBody, expectedStatus);
      contractId = result.contractId;
      expectedGrossSalary = result.expectedGrossSalary;
      expectedEffectiveDate = result.expectedEffectiveDate;
      jobTitle = result.jobTitle;
      employeeId = result.employeeId;
      employeeEmail = requestBody.employee.email; // Capture the email used for this employee
    });
  });
});


  test('Get Employee Salaries', async ({ request }) => {
    await validateSalaries(request, authToken, contractId, expectedGrossSalary, expectedEffectiveDate);
  });

  // Get Job Titles Test
  test('Get Job Titles', async ({ request }) => {
    await validateJobTitles(request, authToken, contractId, jobTitle);
  });
  // Send Welcome Email Test
  let activationCode; // Define at a scope accessible to all tests

  test('Send Welcome Email and Retrieve Activation Link', async ({ request }) => {
    test.setTimeout(300000); // Increase timeout to 5 minutes

    console.time('Send Welcome Email');
    await sendWelcomeEmail(request, adminAuthToken, employeeId, employeeEmail);
    console.timeEnd('Send Welcome Email');

    // Access Gmail and retrieve the email body
    console.time('Retrieve Email Body');
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const emailBody = await getEmailBody(gmail, employeeEmail);
    console.log(`Email Body: ${emailBody}`);
    console.timeEnd('Retrieve Email Body');

    // Extract the activation link from the email body
    const linkRegex = /href="(https:\/\/tgclient-stage\.teamed\.global\/auth\/activate\/[a-f0-9]+)">/;
    const match = emailBody.match(linkRegex);
    if (!match) {
      throw new Error('Activation URL not found in email body');
    }
    const activationUrl = match[1];
    activationCode = activationUrl.split('/').pop(); // Get the last part of the URL which is the activation code
    console.log(`Extracted Activation URL: ${activationUrl}`);
    console.log(`Extracted Activation Code: ${activationCode}`);
  });



  test.describe.serial('Employee Password creation test', () => {
    function validatePasswords(password, password_again) {
      if (password !== password_again) {
        throw new Error('Passwords do not match');
      }
      return true;
    }

    test('validate mismatched passwords - should fail locally', async({ request }) => {
      const password = 'test123456';
      const password_again = 'test123457';
      
      try {
        validatePasswords(password, password_again);
        throw new Error('Should have failed validation');
      } catch (error) {
        expect(error.message).toBe('Passwords do not match');
      }
    });

    test('create password with matching passwords - should succeed', async({ request }) => {
      const password = 'test123456';
      const password_again = 'test123456';
      
      // Validate first, like frontend does
      validatePasswords(password, password_again);
      
      // Only make API call if validation passes
      const response = await createNewPasswordforEmployees(request, activationCode, password, password_again);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  test.describe('Employee Time Off Request and Approval by Employer', () => {
    let employeePassword = 'test123456'; // Store the password

    test('Employee Login', async ({ request }) => {
      // First ensure we have the employee email and password
      expect(employeeEmail).toBeDefined();
      console.log(`Attempting to login as employee: ${employeeEmail}`);
      
      // Try to login with the employee credentials - use the same password that was set during activation
      const employeeToken = await employeeLogin(request, employeeEmail, employeePassword);
      expect(employeeToken).toBeDefined();
    });
  });
  



  

});