const{test,expect}=require('@playwright/test');
const{adminLogin,createPlanner,employeeLogin,createEmployee,getEmployeeCredentials,generateUniqueGmail,saveEmployeeCredentials,employerLogin, editPlanner}=require('../../api');
const employeedata = require('../../fixtures/createemployeedata.json');
const testCases = require('../../fixtures/employeelogindata.json');
const plannerData=require('../../fixtures/plannerData.json');

let adminAuthToken="";
let authToken="";
let contractId="";
let employeeId="";
let employeeEmail="";
let plannerId="";

test.describe.serial('Employee Time Off Request and Approval by Employer', () => {

  test('Create Employee and Save Credentials', async ({ request }) => {
    // Login as employer
    const loginDetails = testCases.find(tc => tc.name === 'Valid Login');
    authToken = await employerLogin(request, loginDetails.email, loginDetails.password, loginDetails.expectedStatus, loginDetails.expectToken);
    
    // Login as admin
    adminAuthToken = await adminLogin(request);
    
    // Generate unique email for employee
    const testData = employeedata[0]; // Use first test case "All Fields Filled"
    testData.requestBody.employee.email = generateUniqueGmail();
    
    // Create employee
    const result = await createEmployee(request, authToken, testData.requestBody, testData.expectedStatus);
    contractId = result.contractId;
    employeeId = result.employeeId;
    employeeEmail = testData.requestBody.employee.email;
    
    // Save credentials to JSON file
    const employeePassword = "test123456";
    saveEmployeeCredentials(employeeEmail, employeePassword, contractId, employeeId);
    
    console.log(`Employee created and credentials saved - Contract ID: ${contractId}`);
  });

  test('Create a planner ', async({request})=>{
    for (const scenarioName in plannerData.scenarios) {
      const response = await createPlanner(request, adminAuthToken, contractId, scenarioName);

      console.log(`Scenario: ${scenarioName}, Status: ${response.status}`);
      if (response.plannerId) {
        console.log(`Planner id created: ${response.plannerId}`);
        // Set the plannerId for use in subsequent tests
        if (!plannerId) {
          plannerId = response.plannerId;
        }
      } else {
        console.log(`No planner ID returned for scenario: ${scenarioName}`);
      }
      console.log(response.body);
     
    }
    
    // Add debug logging to see the final plannerId value
    console.log(`Final plannerId for edit test: '${plannerId}'`);
    console.log(`plannerId type: ${typeof plannerId}`);
    console.log(`plannerId length: ${plannerId.length}`);
  });

   
  test('Edit a planner', async ({request})=>{
    console.log(`About to edit planner with ID: '${plannerId}'`);
    console.log(`Contract ID: '${contractId}'`);
    console.log(`Admin token exists: ${!!adminAuthToken}`);
    
    // Check if plannerId is valid before proceeding
    if (!plannerId || plannerId.trim() === '') {
      console.log('ERROR: plannerId is empty or undefined. Cannot edit planner.');
      console.log('This might be due to createPlanner not returning a valid plannerId');
      console.log('The API might have a bug where it returns 201 but no planner data');
      
      // Fail the test with a meaningful error message
      expect(plannerId).toBeTruthy();
      expect(plannerId).not.toBe('');
      return;
    }
    
    const response = await editPlanner(request, adminAuthToken, contractId, plannerId, 2025);
    expect(response.status).toBe(200);

    console.log('Edit response:', response.body);
  });

  test('Request Leave from admin side using all possible scenarios', async({request}) =>{

  });

  

  



});