const { expect } = require('@playwright/test');
const { BASE_URL, Admin_BASE_URL } = require('./config');

let plannerId="";
let authToken="";


async function customHolidays(request,authToken,countryCode) {
  const response=await request.get(`${BASE_URL}/custom_holidays?year=2025&country=${countryCode}`,
  {
    headers:{
      'Authorization': 'Bearer ${authToken}',
    }

});
return{
  status:response.status(),
  body:await response.json(),
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
  status:response.status(),
  body:await response.json()
}

}

async function createPlanner(request, authToken, contractId, scenario)
{
  console.log(`Creating planner for contract Id: ${contractId}`);
  console.log(`Authorization Token: ${authToken}`);
  console.log(`Using scenario: ${scenario}`);
  console.log(`API URL: ${Admin_BASE_URL}/contracts/${contractId}/planners`);
  
  // Load scenario data from plannerData.json
  const plannerData = require('../fixtures/plannerData.json');
  const scenarioData = plannerData.scenarios[scenario];
  
  if (!scenarioData) {
    throw new Error(`Scenario '${scenario}' not found in plannerData.json`);
  }
  
  console.log(`Scenario data:`, JSON.stringify(scenarioData, null, 2));
  console.log(`Request payload:`, JSON.stringify(scenarioData, null, 2));
  
  const response = await request.post(`${Admin_BASE_URL}/contracts/${contractId}/planners`,
  {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    data: scenarioData
  });
  
  console.log(`Response status: ${response.status()}`);
  
  let responseBody;
  try {
    responseBody = await response.json();
  } catch (error) {
    // Handle cases where response is not valid JSON (e.g., 500 errors)
    console.log('Response is not valid JSON, attempting to get text instead');
    responseBody = await response.text();
    console.log('Response text:', responseBody);
  }
  
  console.log('Response body:', responseBody);
  
  const status = response.status();
  let plannerId = null;
  
  // Only extract plannerId if the request was successful AND data exists AND responseBody is an object
  if (status === 201 && typeof responseBody === 'object' && responseBody.data && responseBody.data.length > 0 && responseBody.data[0]) {
    plannerId = responseBody.data[0].id;
    console.log(`Planner ID: ${plannerId}`);
  } else if (status === 201 && typeof responseBody === 'object' && responseBody.data && responseBody.data.length === 0) {
    // API returns 201 but empty data - this is the buggy behavior
    console.log(`⚠️  API Bug: Status 201 but no planner created (empty data array)`);
    plannerId = null;
  } else if (status !== 201) {
    console.log(`⚠️  API Error: Status ${status} - ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)}`);
  }
  
  return {
    status: status,
    plannerId: plannerId,
    body: responseBody
  };
}

async function editPlanner(request, authToken, contractId, plannerId, year)
{
  console.log(`Editing planner ${plannerId} for contract Id: ${contractId}`);
 
  const response= await request.fetch(`${Admin_BASE_URL}/contracts/${contractId}/planners/${plannerId}`,
  {
    method:'PATCH',
    headers:{
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    data:{
      "planner": {
        "public_holidays": [
          {
            "date": "2025-05-11",
            "name": "Test Holiday 1"
          },
          {
            "date": "2025-04-08",
            "name": "Test Holiday 2"
          },
          {
            "date": "2025-08-13",
            "name": "Test Holiday 3"
          }
        ],
        "year": 2025,
        "ad9cad8c-5835-4289-83d7-ca65cec37b7b": "15",
        "f980b53d-48a3-4688-ba66-8724462e70de": "6",
        "2ead9878-0c57-4267-9077-0bd6d7bb8258": "3"
      }
    }
  })
  return{
    status:response.status(),
    body:await response.json()
  }
  
  

    
}; 

module.exports = {
  customHolidays,
  calendarificAPI,
  createPlanner,
  editPlanner
 
}; 