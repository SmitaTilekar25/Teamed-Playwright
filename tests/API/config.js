// API Configuration Constants

const API_CONFIG = {
  // Stage Environment URLs
  BASE_URL: 'https://tgapi-stage.teamed.global/v1',
  ADMIN_BASE_URL: 'https://tgapi-stage.teamed.global/admin/v1',
  
 
  
  // Default admin credentials
  ADMIN_CREDENTIALS: {
    email: 'smita@teamed.global',
    password: 'test123456'
  },
  
  // Common settings
  EMAIL_RETRY_CONFIG: {
    maxRetries: 5,
    delayBetweenRetries: 5000 // 5 seconds
  },
  
  // Regex patterns
  ACTIVATION_LINK_REGEX: /href="(https:\/\/tgclient-stage\.teamed\.global\/auth\/activate\/[a-f0-9]+)"/
};

module.exports = API_CONFIG; 