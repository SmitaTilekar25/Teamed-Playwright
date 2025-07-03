# API Helpers - Page Object Model Structure

This directory contains API helper functions organized following the Page Object Model (POM) pattern for better maintainability and separation of concerns.

## File Structure

```
tests/api/
├── authHelpers.js       # Authentication-related functions
├── employeeHelpers.js   # Employee management functions  
├── validationHelpers.js # Validation and verification functions
├── emailHelpers.js      # Email handling functions
├── calendarHelpers.js   # Calendar and holiday functions
├── config.js           # Configuration constants and URLs
├── index.js            # Central export file
└── README.md           # This documentation
```

## Usage Examples

### Option 1: Import specific helper modules
```javascript
const { employerLogin } = require('./api/authHelpers');
const { createEmployee } = require('./api/employeeHelpers');
const { validateSalaries } = require('./api/validationHelpers');
```

### Option 2: Import all helpers from index
```javascript
const { employerLogin, createEmployee } = require('./api/index');
```

### Option 3: Import all and use directly
```javascript
const helpers = require('./api/index');
const authToken = await helpers.employerLogin(request, email, password, 201, true);
const contractData = await helpers.createEmployee(request, authToken, requestBody, 201);
```

### Option 4: Import configuration
```javascript
const config = require('./api/config');
console.log(config.BASE_URL); // https://tgapi-stage.teamed.global/v1
```

## Helper Modules

### authHelpers.js (Authentication Functions)
- `employerLogin(request, email, password, expectedStatus, expectToken)`
- `adminLogin(request)`
- `employeeLogin(request, emailId, password)`
- `createPassword(request, activationLink, password)`
- `createNewPasswordforEmployees(request, activationCode, password, password_again)`

### employeeHelpers.js (Employee Management)
- `createEmployee(request, authToken, requestBody, expectedStatus)`
- `sendWelcomeEmail(request, authToken, employeeId, email)`
- `employeeDetails(request, authToken, employeeId)`

### validationHelpers.js (Validation Functions)
- `validateSalaries(request, authToken, contractId, expectedGrossSalary, expectedEffectiveDate)`
- `validateJobTitles(request, authToken, contractId, jobTitle)`

### emailHelpers.js (Email Handling)
- `getEmailBody(gmail, recipientEmail)`
- `extractActivationLink(emailBody)`

### calendarHelpers.js (Calendar & Holidays)
- `customHolidays(request, authToken, countryCode)`
- `calendarificAPI(request, year, authToken, countryCode, contractId)`
- `createPlanner(request, authToken, contractId)`

## Configuration Management

The `config.js` file centralizes all configuration constants:

- Base URLs for different environments
- Admin credentials
- Email retry settings
- Regex patterns

This makes it easy to switch between environments and maintain consistent settings across all helper functions.

## Migration from Original helpers.js

To migrate your existing test files:

1. **Replace single import:**
   ```javascript
   // Old
   const { employerLogin, createEmployee } = require('./helpers');

   // New - Option 1
   const { employerLogin } = require('./api/authHelpers');
   const { createEmployee } = require('./api/employeeHelpers');

   // New - Option 2  
   const { employerLogin, createEmployee } = require('./api/index');
   ```

2. **Function calls remain the same** - no changes needed to existing function calls

3. **Consider using configuration constants:**
   ```javascript
   const config = require('./api/config');
   // Use config.BASE_URL instead of hardcoded URLs
   ```

## Benefits of This Structure

- **Separation of Concerns**: Each file handles a specific functionality area
- **Easier Maintenance**: Changes to authentication logic only affect authHelpers.js
- **Better Testing**: Can test each module independently
- **Scalability**: Easy to add new helper functions in appropriate modules
- **Configuration Management**: Centralized config makes environment switching simple
- **Backward Compatibility**: Can still import all functions from index.js if needed 
