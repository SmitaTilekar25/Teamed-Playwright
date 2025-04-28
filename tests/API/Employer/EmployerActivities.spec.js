const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { google } = require('googleapis');
const employeedata = require('../../fixtures/createemployeedata.json');
const { adminLogin, createEmployee, sendWelcomeEmail, validateSalaries, validateJobTitles, createPassword, employerLogin, getEmailBody, extractActivationLink, createNewPasswordforEmployees, employeeLogin} = require('../helpers');
const testCases = require('../../fixtures/employeelogindata.json');
const { request } = require('http');
const employeeCredentials = require('../../fixtures/employeeCredentials.json');

const BASE_URL = 'https://tgapi-stage.teamed.global/v1';
let authToken = '';
let adminAuthToken = '';
let contractId = '';
let expectedGrossSalary = '';
let expectedEffectiveDate = '';
let jobTitle = '';
let employeeId = '';
let employeeEmail = '';
let oAuth2Client = null;
//Git Push Test


// Function to set up OAuth2 client
async function setupOAuth2Client() {
  if (oAuth2Client) {
    return oAuth2Client;
  }

  const credentials = JSON.parse(fs.readFileSync('./tests/credentials.json'));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    // First try to use existing refresh token from refresh_token.txt
    if (fs.existsSync('./tests/refresh_token.txt')) {
      const refreshToken = fs.readFileSync('./tests/refresh_token.txt', 'utf-8').trim();
      console.log('Found existing refresh token in refresh_token.txt');
      
      // Set up initial tokens object
      const tokens = {
        refresh_token: refreshToken,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        token_type: 'Bearer',
        expiry_date: 0
      };

      // Set credentials and let OAuth2 client handle token refresh
      oAuth2Client.setCredentials(tokens);
      
      // Force a token refresh to get a new access token
      try {
        await oAuth2Client.getAccessToken();
        console.log('Successfully refreshed access token');
        return oAuth2Client;
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        // If refresh fails, continue to new authorization
      }
    }

    // If no valid refresh token, start new authorization flow
    console.log('Starting new authorization flow...');
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent'  // Force consent screen to get new refresh token
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
    
    const code = process.env.AUTH_CODE || fs.readFileSync('./tests/auth_code.txt', 'utf-8').trim();
    if (!code || code.includes('PASTE YOUR AUTHORIZATION CODE HERE')) {
      throw new Error('Please complete the authorization flow and provide a fresh authorization code');
    }

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('Received new tokens from authorization');
    
    // Save refresh token for future use
    if (tokens.refresh_token) {
      fs.writeFileSync('./tests/refresh_token.txt', tokens.refresh_token);
      console.log('New refresh token saved to refresh_token.txt');
    }
    
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  } catch (error) {
    console.error('OAuth setup error:', error);
    throw error;
  }
}

// Function to generate a unique Gmail address
function generateUniqueGmail() {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
  const emailAddress = `smita+${uniqueId}@teamed.global`;
  console.log(`Generated Unique Gmail Address: ${emailAddress}`);
  return emailAddress;
}

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
      employeeEmail = requestBody.employee.email;

      // Save the employee details to the credentials file
      employeeCredentials.email = employeeEmail;
      employeeCredentials.contractId = contractId;
      employeeCredentials.employeeId = employeeId;
      fs.writeFileSync('./tests/fixtures/employeeCredentials.json', JSON.stringify(employeeCredentials, null, 2));
      console.log('Saved employee details to credentials file:', {
        email: employeeEmail,
        contractId: contractId,
        employeeId: employeeId
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

  test.describe('Employee Login Tests', () => {
   
    test('Attempting to login using incorrect password', async({request})=>{

      let employeePassword='test123';
      expect(employeeEmail).toBeDefined();
      console.log('Attempting to login using incorrect password: ${employeeEmail} and ${emplyeePassword}');
      const response=await employeeLogin(request,employeeEmail,employeePassword);
      expect(response.status).toBe(401);
      console.log('login failed as expected');
    });

    test('Attempting to login using correct password', async ({ request }) => {

      let employeePassword = 'test123456'; // Store the password
      // First ensure we have the employee email and password
      expect(employeeEmail).toBeDefined();
      console.log(`Attempting to login as employee: ${employeeEmail}`);
      
      // Try to login with the employee credentials - use the same password that was set during activation
      const employeeToken = await employeeLogin(request, employeeEmail, employeePassword);
      expect(employeeToken).toBeDefined();

    });
  });
  

 

});