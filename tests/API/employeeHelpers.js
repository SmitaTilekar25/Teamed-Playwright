const { expect } = require('@playwright/test');

const BASE_URL = 'https://tgapi-stage.teamed.global/v1';
const Admin_BASE_URL = 'https://tgapi-stage.teamed.global/admin/v1';

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

// Function to generate a unique Gmail address
function generateUniqueGmail() {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
  const emailAddress = `smita+${uniqueId}@teamed.global`;
  console.log(`Generated Unique Gmail Address: ${emailAddress}`);
  return emailAddress;
}

// Function to modify employee data with unique emails
function prepareEmployeeDataWithUniqueEmails(employeedata) {
  for (const data of employeedata) {
    if (data.requestBody && data.requestBody.employee.email === "") {
      data.requestBody.employee.email = generateUniqueGmail();
      console.log(`Generated Email for ${data.name}: ${data.requestBody.employee.email}`);
    }
  }
  return employeedata;
}

module.exports = {
  createEmployee,
  sendWelcomeEmail,
  employeeDetails,
  generateUniqueGmail,
  prepareEmployeeDataWithUniqueEmails
}; 