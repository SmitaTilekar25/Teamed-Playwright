const { test, expect } = require('@playwright/test');
const { MailSlurp } = require('mailslurp-client');
let employerEmail;
const fs = require('fs');

// Define the API key directly in the code
const apiKey = '9026da55e1ffab3377ba8d316a02b4e8baa5e545aa00e99cb3e446ea3787910b'; // Replace with your actual MailSlurp API key
const mailslurp = new MailSlurp({ apiKey });

async function fetchMailSlurpEmail(inboxId, emailSubject) {
    try {
        // Wait for an email in the inbox
        const email = await mailslurp.waitForLatestEmail(inboxId, 30000); // Wait up to 30 seconds for the latest email

        // Ensure the email subject matches the expected subject
        if (email.subject.includes(emailSubject)) {
            return email.body; // Return the email content
        } else {
            throw new Error('No email found with the expected subject');
        }
    } catch (error) {
        console.error('Error fetching email:', error);
        throw error;
    }
}


test('Add Employer @sanity', async ({ page }) => {
    await page.goto('https://tgadmin-staging.teamed.global/auth/login');

    // Login as Admin
    await page.locator("//input[@id='login.email']").fill('smita@teamed.global');
    await page.locator("//input[@id='login.password']").fill('test123456');
    await page.locator("//button[@type='submit']").click();

    await page.locator("//a[normalize-space()='Add Employer']").click();

    const employers = [
        {
            companyName: "Automation!!!!!!",
            IndustrySector: "Construction and Building",
            vatNumber: "123456",
            registeredAddress: {
                line1: "123 Main St",
                line2: "Suite 1",
                city: "New York",
                state: "NY",
                postcode: "10001",
            },
            contactAddressSame: true,
            keyContact: {
                firstName: "John",
                lastName: "Doe",
                jobTitle: "Manager",
                phoneNumber: "5551234567",
            },
        },
    ];

    async function fillForm(page, employer) {
        // Create a new MailSlurp inbox dynamically
        //const inbox = await mailslurp.createInbox(); 
        //console.log('Inbox created with email address:', inbox.emailAddress);
        //employerEmail=inbox.emailAddress;

        //fs.writeFileSync('employerEmail.json', JSON.stringify({ email: employerEmail }));

        // Fill in Company Details
        await page.fill("input[id='employer.name']", employer.companyName);

        // Select Industry Sector
        await page.locator("div[id='employer.industry_sector_id']").click();
        await page.waitForSelector("div[role='option']", { state: 'visible' });
        await page.locator("div[role='option'] >> text=Construction and Building").click();

        // Select Domicile
        await page.locator("div[id='employer.domicile_id'] input[type='text']").click();
        await page.locator("div[id='employer.domicile_id'] input[type='text']").fill('United Arab Emirates');
        await page.locator("div[id='employer.domicile_id'] input[type='text']").press('Enter');
        await page.locator("div[id='employer.domicile_id'] input[type='text']").press('Tab');

        // Fill in VAT Number
        await page.fill("//input[@id='employer.vat_number']", employer.vatNumber);

        // Select Currency
        await page.locator("div[id='employer.currency_id'] input[type='text']").click();
        await page.locator("div[id='employer.currency_id'] input[type='text']").fill('US Dollar');
        await page.locator("div[id='employer.currency_id'] input[type='text']").press('Enter');
        await page.locator("div[id='employer.currency_id'] input[type='text']").press('Tab');

        // Registered Address
        await page.fill("input[id='registered_address.line_one']", employer.registeredAddress.line1);
        await page.fill("input[id='registered_address.line_two']", employer.registeredAddress.line2);
        await page.fill("input[id='registered_address.city']", employer.registeredAddress.city);
        await page.fill("input[id='registered_address.state']", employer.registeredAddress.state);
        await page.fill("input[id='registered_address.zip']", employer.registeredAddress.postcode);

        await page.locator("div[id='registered_address.country_id'] input[type='text']").click();
        await page.locator("div[id='registered_address.country_id'] input[type='text']").fill('Albania');
        await page.locator("div[id='registered_address.country_id'] input[type='text']").press('Enter');
        await page.locator("div[id='registered_address.country_id'] input[type='text']").press('Tab');

        // Contact Address
        if (employer.contactAddressSame) {
            await page.locator("label[for='sameAsCheckbox']").check();
        }

        // Key Contact Information
        await page.fill("input[id='officer.first_name']", employer.keyContact.firstName);
        await page.fill("input[id='officer.last_name']", employer.keyContact.lastName);
        await page.fill("input[id='officer.job_title']", employer.keyContact.jobTitle);
        await page.fill("input[id='officer.email']", employerEmail); // Use the created inbox email address
        

        // Phone Number
        await page.locator("(//div[@class='ui compact search dropdown label css-skfx5x-PhoneField'])[1]").click();
        await page.fill("input[placeholder='Number']", employer.keyContact.phoneNumber);
        await page.locator("button[type='submit']").click();

        await page.locator("(//button[@type='button'])[3]").click();

        // Fetch the email and extract the link
        const emailContent = await fetchMailSlurpEmail(inbox.id, 'Welcome to Teamed'); // Replace with the actual email subject
        console.log('Email Content:', emailContent);

        const linkRegex = /https:\/\/tgapp-staging\.teamed\.global\/auth\/activate\/[a-z0-9]{32}/i;
        const match = emailContent.match(linkRegex);
        if (match && match[0]) {
            console.log('Password Reset Link:', match[0]);

            // Navigate to the password reset link
            await page.goto(match[0]);
        }

        await page.fill("//input[@id='create_password.password']",'test123456');
        await page.fill("//input[@id='create_password.password_again']",'test123456');
        await page.locator("//label [@for='accept_terms.terms'] /text()").check();
        await page.locator("//label [@for='accept_terms.terms']/text()").check();
        await page.locator("//button[@type='submit']").click();
    }

    for (const employer of employers) {
        await fillForm(page, employer);
        await page.waitForTimeout(2000); // Adjust as needed for submission confirmation
    }
});

