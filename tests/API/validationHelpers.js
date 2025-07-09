const { expect } = require('@playwright/test');
const { BASE_URL } = require('./config');

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

module.exports = {
  validateSalaries,
  validateJobTitles
}; 