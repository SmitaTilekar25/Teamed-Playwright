const{test,expect}=require('@playwright/test');
const{employeeLogin}=require('../../api/index');
let employeeEmail = '';

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