const { expect } = require('@playwright/test');
const { BASE_URL } = require('./config');

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

async function createPlanner(request,authToken,contractId)
{
  console.log(`Creating planner for contract Id: ${contractId}`);
  console.log(`Authorization Token: ${authToken}`);
  const response = await request.post(`${BASE_URL}/contracts/${contractId}/planners`,
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
  customHolidays,
  calendarificAPI,
  createPlanner
}; 