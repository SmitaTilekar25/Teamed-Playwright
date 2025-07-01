// Central export file for all API helpers
const authHelpers = require('./authHelpers');
const employeeHelpers = require('./employeeHelpers');
const validationHelpers = require('./validationHelpers');
const emailHelpers = require('./emailHelpers');
const calendarHelpers = require('./calendarHelpers');
const config = require('./config');

module.exports = {
  // Authentication functions
  ...authHelpers,
  
  // Employee management functions  
  ...employeeHelpers,
  
  // Validation functions
  ...validationHelpers,
  
  // Email handling functions
  ...emailHelpers,
  
  // Calendar and holiday functions
  ...calendarHelpers,
  
  // Configuration
  config
}; 