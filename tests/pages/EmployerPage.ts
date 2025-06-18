import { Page } from '@playwright/test';
import { loginData, employerFormData } from '../data/employerFormData';

export class EmployerPage {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToLoginPage() {
        await this.page.goto('https://tgclient-stage.teamed.global/');
        await this.page.waitForLoadState('networkidle');
    }

    async login() {
        // Fill email
        await this.page.fill('input[type="email"]', loginData.email);
        
        // Fill password
        await this.page.fill('input[type="password"]', loginData.password);
        
        // Click login button
        await this.page.click('button[type="submit"]');
        
        // Wait for navigation
        await this.page.waitForLoadState('networkidle');
    }

    async clickAddEmployerButton() {
        // Wait for and click the Add Employee button
        await this.page.click('text=/ADD EMPLOYEE/i');
        
        // Wait for form to be visible
        await this.page.waitForSelector('form');
    }

    async fillEmployerForm() {
        // Fill company information
        await this.page.fill('input[name="companyName"]', employerFormData.companyName);
        await this.page.fill('input[name="companyWebsite"]', employerFormData.companyWebsite);
        await this.page.selectOption('select[name="companySize"]', employerFormData.companySize);
        await this.page.selectOption('select[name="industry"]', employerFormData.industry);
        
        // Fill address information
        await this.page.selectOption('select[name="country"]', employerFormData.country);
        await this.page.selectOption('select[name="state"]', employerFormData.state);
        await this.page.fill('input[name="city"]', employerFormData.city);
        await this.page.fill('input[name="address"]', employerFormData.address);
        await this.page.fill('input[name="zipCode"]', employerFormData.zipCode);

        // Fill contact information
        await this.page.fill('input[name="firstName"]', employerFormData.firstName);
        await this.page.fill('input[name="lastName"]', employerFormData.lastName);
        await this.page.fill('input[name="phoneNumber"]', employerFormData.phoneNumber);
        await this.page.fill('input[name="position"]', employerFormData.position);
    }

    async submitEmployerForm() {
        await this.page.click('button[type="submit"]');
        await this.page.waitForLoadState('networkidle');
    }
} 