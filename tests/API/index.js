// Central export file for all API helpers
// This allows importing all helpers from a single location while maintaining modular structure

const authHelpers = require('./authHelpers');
const employeeHelpers = require('./employeeHelpers');
const validationHelpers = require('./validationHelpers');
const emailHelpers = require('./emailHelpers');
const calendarHelpers = require('./calendarHelpers');
const config = require('./config');

module.exports = {
  // Authentication helpers
  ...authHelpers,
  
  // Employee management helpers
  ...employeeHelpers,
  
  // Validation helpers
  ...validationHelpers,
  
  // Email helpers
  ...emailHelpers,
  
  // Calendar/Holiday helpers
  ...calendarHelpers,
  
  // Configuration
  config
};

// Alternative named exports for specific modules
module.exports.auth = authHelpers;
module.exports.employee = employeeHelpers;
module.exports.validation = validationHelpers;
module.exports.email = emailHelpers;
module.exports.calendar = calendarHelpers; 