const { expect } = require('@playwright/test');

const BASE_URL = 'https://tgapi-stage.teamed.global/v1';


// Function to set up OAuth2 client
async function setupOAuth2Client() {
  if (oAuth2Client) {
    return oAuth2Client;
  }

  const credentials = JSON.parse(fs.readFileSync('./tests/fixtures/credentials.json'));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    // First try to use existing refresh token from refresh_token.txt
    if (fs.existsSync('./tests/fixtures/refresh_token.txt')) {
      const refreshToken = fs.readFileSync('./tests/fixtures/refresh_token.txt', 'utf-8').trim();
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
    
    const code = process.env.AUTH_CODE || fs.readFileSync('./tests/fixtures/auth_code.txt', 'utf-8').trim();
    if (!code || code.includes('PASTE YOUR AUTHORIZATION CODE HERE')) {
      throw new Error('Please complete the authorization flow and provide a fresh authorization code');
    }

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('Received new tokens from authorization');
    
    // Save refresh token for future use
    if (tokens.refresh_token) {
      fs.writeFileSync('./tests/fixtures/refresh_token.txt', tokens.refresh_token);
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
async function generateUniqueGmail() {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
  const emailAddress = `smita+${uniqueId}@teamed.global`;
  console.log(`Generated Unique Gmail Address: ${emailAddress}`);
  return emailAddress;
}

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
      email: 'smita@teamed.global',
      password: 'test123456'
    }
  });

  expect(response.status()).toBe(201);
  const responseBody = await response.json();
  console.log(responseBody);
  const authToken = responseBody.token;
  expect(authToken).toBeDefined();

  return authToken;
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

module.exports = {
  employerLogin,
  adminLogin,
  createPassword,
  createNewPasswordforEmployees,
  employeeLogin,
  setupOAuth2Client,
  generateUniqueGmail
    
}; 