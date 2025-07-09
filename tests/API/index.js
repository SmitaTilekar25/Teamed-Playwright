// Central export file for all API helpers
const authHelpers = require('./authHelpers');
const employeeHelpers = require('./employeeHelpers');
const validationHelpers = require('./validationHelpers');
const emailHelpers = require('./emailHelpers');
const calendarHelpers = require('./calendarHelpers');
// const helpers = require('./helpers');
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
  
  // General helper functions (disabled - not currently using)
  // ...helpers,
  
  // Calendar and holiday functions (comes after helpers to override createPlanner)
  ...calendarHelpers,
  
  // Configuration
  config
}; 