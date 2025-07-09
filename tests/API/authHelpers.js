const { expect } = require('@playwright/test');
const { BASE_URL, ADMIN_CREDENTIALS } = require('./config');

async function employerLogin(request, email, password, expectedStatus, expectToken) {
  const response = await request.post(`${BASE_URL}/auth/login`, {
    data: { email, password }
  });

  // Validate response status
  expect(response.status()).toBe(expectedStatus);

  const responseBody = await response.json();
  console.log(`Login Response:`, responseBody);

  // Validate token presence if expected
  let authToken = '';
  if (expectToken) {
    expect(responseBody.token).toBeDefined();
    authToken = responseBody.token;
    console.log(`Auth Token Set: ${authToken}`);
  } else {
    expect(responseBody.token).toBeUndefined();
  }

  return authToken;
}

async function adminLogin(request) {
  const response = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    }
  });

  expect(response.status()).toBe(201);
  const responseBody = await response.json();
  console.log(responseBody);
  const authToken = responseBody.token;
  expect(authToken).toBeDefined();

  return authToken;
}

async function employeeLogin(request, emailId, password) {
  console.log(`Attempting employee login with email: ${emailId}`);
  const response = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      email: emailId,
      password: password
    }
  });

  const responseBody = await response.json();
  console.log(`Employee Login Response Status: ${response.status()}`);
  console.log(`Employee Login Response Body:`, responseBody);

  // Check for both 200 and 201 as valid status codes
 
  //expect(responseBody).toHaveProperty('token');
  
  return {
    status: response.status(),
    body: responseBody,
    token: responseBody.token
  };
}

async function createPassword(request, activationLink, password) {
  const activationCode = activationLink.split('/').pop();
  console.log(`Extracted Activation Code: ${activationCode}`);

  const response = await request.fetch(`${BASE_URL}/auth/activate/${activationCode}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      password: password,
      password_again: password,
    },
  });

  console.log(`Create Password Response Status: ${response.status()}`);
  const responseBody = await response.json();
  console.log(`Create Password Response Body:`, responseBody);

  expect(response.status()).toBe(200);

  return responseBody;
}

async function createNewPasswordforEmployees(request, activationCode, password, password_again) {
  console.log('Creating new password for employee with:', {
    activationCode,
    password,
    password_again,
    url: `${BASE_URL}/auth/activate/${activationCode}`
  });

  const response = await request.fetch(`${BASE_URL}/auth/activate/${activationCode}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
      password: password,
      password_again: password_again
    }
  });
  
  const responseBody = await response.json();
  console.log('Response status:', response.status());
  console.log('Response body:', responseBody);
  
  return {
    status: response.status(),
    body: responseBody
  };
}

module.exports = {
  employerLogin,
  adminLogin,
  employeeLogin,
  createPassword,
  createNewPasswordforEmployees
}; 