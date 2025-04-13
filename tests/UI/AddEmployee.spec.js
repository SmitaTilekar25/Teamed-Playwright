const { test, expect } = require('@playwright/test');
//const { email, employerPassword } = require('./data');
const { join } = require('path');
const fs = require('fs');



test('Add Employee', async ({ page }) => {

 // Read the employer email from the file
const data = fs.readFileSync('employerEmail.json', 'utf8');
const employerEmail = JSON.parse(data).email;

page.goto("https://tgapp-staging.teamed.global/auth/login");
await page.fill("//input[@id='login.email']",employerEmail);
await page.fill("//input[@id='login.password']",'test123456');
await page.locator("//button[@type='submit']").click();
const FirstSave=await page.locator("//button[@type='submit']");
if(await FirstSave.isVisible())
{
    await FirstSave.click();
}
/* const submit= await page.locator("//button[@type='submit']");
if(submit.isVisible())
{
    await submit.click();
} */
//Add Employee

await page.locator("//a[normalize-space()='Add Employee']").click();

const employees = [
    {
        FirstName:"Alice",
        LastName:"Smith",
        email:"alicesmith@mailinator.com",
        JobTitle:"QA",
        Salary:"800000",
        phone:"8978675654"
    },
];


async function fillEmployeeDetails(page,employee)
{
await page.fill("//input[@id='employee.first_name']", employee.FirstName);
await page.fill("//input[@id='employee.last_name']",employee.LastName);

//Select Domicile
await page.locator("//div[@id='employee.domicile_id']//input[@type='text']").click();
await page.locator("//div[@id='employee.domicile_id']//input[@type='text']").fill('United Arab Emirates');
await page.locator("//div[@id='employee.domicile_id']//input[@type='text']").press('Enter');
await page.locator("//div[@id='employee.domicile_id']//input[@type='text']").press('Tab');

await page.fill("//input[@id='employee.email']",employee.email);


//Add Phone Number
await page.locator("(//div[@class='ui compact search dropdown label input-phone'])[1]").click();
await page.fill("//input[@placeholder='Number']", employee.phone );

await page.fill("//input[@id='contract.job_title']",employee.JobTitle);

//Select Attendence Type
 // Step 1: Click the dropdown to activate the typing mode
 const dropdownLocator = page.locator('//div[@id="contract.attendance_type_id"]');
 await dropdownLocator.click();

 // Step 2: Type the desired value (e.g., "Full time") into the dropdown
 const valueToType = "Full time";
 await dropdownLocator.type(valueToType); // Simulate typing the value

 // Step 3: Press 'Enter' to confirm the selection
 await page.keyboard.press('Enter'); // Simulate pressing the Enter key


//Select Contract Type

const dropdowncontrcat=await page.locator("//div[@id='contract.contract_type_id']//input[@type='text']");
dropdowncontrcat.click();
const type="Permanent";
await dropdowncontrcat.type(type);
await page.keyboard.press('Enter');
await page.keyboard.press('Tab');

if (type=='Permanent')
{
    await page.fill("//input[@placeholder='Start date']",'23/04/2025');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
}
else
{
    await page.fill("//input[@placeholder='Start date']",'23/04/2025');
    await page.fill("(//input[@placeholder='Start date'])[2]",'23/11/2025')
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
}

    //add salary Currency
//Step 1: Click the dropdown to activate the typing mode
 const dropdownCurrency = page.locator("//div[@id='contract.currency_id']");
 await dropdownCurrency.click();

 // Step 2: Type the desired value (e.g., "Full time") into the dropdown
 const valueToTypeSalary = "PHP";
 await dropdownCurrency.type(valueToTypeSalary); // Simulate typing the value

 // Step 3: Press 'Enter' to confirm the selection
 await page.keyboard.press('Enter'); // Simulate pressing the Enter key 




    //Add Salary
    await page.fill("//input[@id='contract.gross_salary']",employee.Salary);

    }


for(const employee of employees)
{
    await fillEmployeeDetails(page,employee);
    await page.waitForTimeout(2000);   // Adjust as needed for submission confirmation
}
});

