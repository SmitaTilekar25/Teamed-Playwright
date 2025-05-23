const{test,expect}=require('@playwright/test');
const{adminLogin,createPlanner,calendarificAPI}=require('../helpers');
const employeedata=require('../../fixtures/employeeCredentials.json');

let adminAuthToken = '';
let contractId = employeedata.contractId;

test.describe.serial('Time Off Module Tests',()=> {
test('Login as an Admin',async({request})=>{
adminAuthToken=await adminLogin(request);
});

test('Create a planner for Employee',async({request})=>
{
  expect(contractId).toBeDefined();
  const response=await createPlanner(request,adminAuthToken,contractId)
  expect(response).toBe(201);
});


});
