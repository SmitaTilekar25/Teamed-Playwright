const { expect } = require('@playwright/test');
const axios = require('axios');
const { google } = require('googleapis');



const BASE_URL = 'https://tgapi-stage.teamed.global/v1';
const Admin_BASE_URL = 'https://tgapi-stage.teamed.global/admin/v1'; 


/*const BASE_URL = 'https://api.dev.teamed.global/v1';
const Admin_BASE_URL = 'https://api.dev.teamed.global/admin/v1'; */

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


async function createEmployee(request, authToken, requestBody, expectedStatus) {
  const response = await request.post(`${BASE_URL}/employers/contracts`, {
    data: requestBody,
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const responseBody = await response.json();
  console.log(`Create Employee Response:`, responseBody);

  if (response.status() !== expectedStatus) {
    console.log(`Expected Status: ${expectedStatus}, but received: ${response.status()}`);
    console.log(`Response Body:`, responseBody);
  }

  expect(response.status()).toBe(expectedStatus);

  let contractId = '';
  let expectedGrossSalary = '';
  let expectedEffectiveDate = '';
  let jobTitle = '';
  let employeeId = '';
  let emailId = '';
  if (responseBody.data && responseBody.data.id) {
    contractId = responseBody.data.id;
    expectedGrossSalary = responseBody.data.current_salary.gross_salary;
    expectedEffectiveDate = responseBody.data.current_salary.effective_date;
    jobTitle = responseBody.data.job_title;
    employeeId = responseBody.data.employee.id;
    emailId = responseBody.data.employee.user.email;
    console.log(`Created Contract ID: ${contractId}`);
    console.log(`Expected Gross Salary: ${expectedGrossSalary}`);
    console.log(`Expected Effective Date: ${expectedEffectiveDate}`);
    console.log(`Job Title: ${jobTitle}`);
    console.log(`Employee ID: ${employeeId}`);
  } else {
    console.log('Contract ID not found in response');
    console.log('Response Body:', responseBody);
  }

  return { contractId, expectedGrossSalary, expectedEffectiveDate, jobTitle, employeeId };
}

async function sendWelcomeEmail(request, authToken, employeeId, email) {
  console.log(`Sending Welcome Email to: ${email}`);
  const response = await request.fetch(`${Admin_BASE_URL}/employees/${employeeId}/send_welcome`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  let responseBody;
  const contentType = response.headers['content-type'];
  if (contentType && contentType.includes('application/json')) {
    responseBody = await response.json();
  } else {
    responseBody = await response.text();
  }
  console.log(`Send Welcome Email Response Status: ${response.status()}`);
  console.log(`Send Welcome Email Response Body:`, responseBody);

  expect(response.status()).toBe(200);
}

async function validateSalaries(request, authToken, contractId, expectedGrossSalary, expectedEffectiveDate) {
  const salaryResponse = await request.get(`${BASE_URL}/employees/${contractId}/salaries`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  console.log(`Get Salaries Response Status: ${salaryResponse.status()}`);
  const salaryResponseBody = await salaryResponse.json();
  console.log(`Get Salaries Response Body:`, salaryResponseBody);

  expect(salaryResponse.status()).toBe(200);

  const salaryData = salaryResponseBody.data.find(salary => salary.gross_salary === expectedGrossSalary && salary.effective_date === expectedEffectiveDate);
  expect(salaryData).toBeDefined();
  expect(salaryData.gross_salary).toBe(expectedGrossSalary);
  expect(salaryData.effective_date).toBe(expectedEffectiveDate);
}

async function validateJobTitles(request, authToken, contractId, jobTitle) {
  const jobTitlesResponse = await request.get(`${BASE_URL}/employers/${contractId}/job_titles`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  console.log(`Get Job Titles Response Status: ${jobTitlesResponse.status()}`);
  const jobTitlesResponseBody = await jobTitlesResponse.json();
  console.log(`Get Job Titles Response Body:`, jobTitlesResponseBody);

  expect(jobTitlesResponse.status()).toBe(200);

  const jobData = jobTitlesResponseBody.data.find(job => job.job_title === jobTitle);
  expect(jobData).toBeDefined();
  expect(jobData.job_title).toBe(jobTitle);
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

async function getEmailBody(gmail, recipientEmail) {
  const maxRetries = 5;
  const delayBetweenRetries = 5000; // 5 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt} of ${maxRetries} to fetch email for ${recipientEmail}`);
    
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `to:${recipientEmail}`,
      maxResults: 1,
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      if (attempt === maxRetries) {
        throw new Error('No emails found for the recipient after all retries.');
      }
      console.log(`No emails found yet, waiting ${delayBetweenRetries/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
      continue;
    }

    const messageId = res.data.messages[0].id;
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    let emailBody;
    const payload = message.data.payload;

    // Check if the email body is directly in the payload
    if (payload.body && payload.body.data) {
      emailBody = payload.body.data;
    } 
    // Check if the body is in parts
    else if (payload.parts) {
      // Try to find HTML part first
      const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        emailBody = htmlPart.body.data;
      } 
      // Fall back to plain text if no HTML
      else {
        const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          emailBody = textPart.body.data;
        }
      }
    }

    if (!emailBody) {
      throw new Error('Email body not found in any expected location.');
    }

    return Buffer.from(emailBody, 'base64').toString('utf-8');
  }
}

function extractActivationLink(emailBody) {
  const linkRegex = /href="(https:\/\/tgclient-stage\.teamed\.global\/auth\/activate\/[a-f0-9]+)"/;
  const match = emailBody.match(linkRegex);

  if (!match) {
    throw new Error('No activation link found in the email body.');
  }

  const fullUrl = match[1];
  console.log('Found activation URL:', fullUrl);
  
  const activationCode = fullUrl.split('/').pop(); // Get the last part after the final '/'
  console.log('Extracted activation code:', activationCode);
  
  if (!activationCode) {
    throw new Error('Could not extract activation code from URL.');
  }

  return activationCode;
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

async function employeeDetails(request,authToken,employeeId){
const response=await request.get(`${BASE_URL}/employees/${employeeId}`, {
  headers: {
    'Authorization': `Bearer ${authToken}`,
  }
});
const responsebody=await response.json();
let countryCode=responsebody.data.user.phone.country_code;
console.log('country code for ${employeeId} is: ${countryCode}');

return {
  status: response.status(),
  body: responsebody,
  countryCode: countryCode
};

}


async function customHolidays(request,authToken,countryCode) {
  const response=await request.get(`${BASE_URL}/custom_holidays?year=2025&country=${countryCode}`,
  {
    headers:{
      'Authorization': 'Bearer ${authToken}',
    }

});
return{
  status:response.status,
  body:response.body,
  countryCode:response.countryCode
}
}

async function calendarificAPI(request,year,authToken,countryCode,contractId){
const response=await request.get(`${BASE_URL}/calendarific?year=${year}&country=${countryCode}}&contract_id=${contractId}`,
{
  headers:{
    'Authorization': 'Bearer ${authToken}',
  }
});
return{
  status:response.sttaus,
  body:response.body
}

}

// Function to generate a unique Gmail address
function generateUniqueGmail() {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
  const emailAddress = `smita+${uniqueId}@teamed.global`;
  console.log(`Generated Unique Gmail Address: ${emailAddress}`);
  return emailAddress;
}

async function createPlanner(request,authToken,contractId)
{
  console.log(`Creating planner for contract Id: ${contractId}`);
  console.log(`Authorization Token: ${authToken}`);
  const response = await request.post(`${Admin_BASE_URL}/contracts/${contractId}/planners`,
  {
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    data: {
      "planner": {
        "public_holidays": [
          "2025-04-11",
          "2025-04-08",
          "2025-05-13"
        ],
         "year": 2025
        
      }
    }
  });
  expect(response.status()).toBe(201);
  const responseBody = await response.json();
  console.log(responseBody);
  const status=response.status();
  return status;
}



module.exports = {
  adminLogin,
  createEmployee,
  sendWelcomeEmail,
  validateSalaries,
  validateJobTitles,
  employerLogin,
  createPassword,
  getEmailBody,
  extractActivationLink,
  employeeLogin,
  createNewPasswordforEmployees,
  createPlanner,
  calendarificAPI,
  customHolidays,
  generateUniqueGmail,
};