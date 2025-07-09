const BASE_URL = 'https://tgapi-stage.teamed.global/v1';
const Admin_BASE_URL = 'https://tgapi-stage.teamed.global/admin/v1'; 

/*const BASE_URL = 'https://api.dev.teamed.global/v1';
const Admin_BASE_URL = 'https://api.dev.teamed.global/admin/v1'; */

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'smita@teamed.global',
  password: 'test123456'
};

// Email retry settings
const EMAIL_RETRY_CONFIG = {
  maxRetries: 5,
  delayBetweenRetries: 5000 // 5 seconds
};

// Regex patterns
const ACTIVATION_LINK_REGEX = /href="(https:\/\/tgclient-stage\.teamed\.global\/auth\/activate\/[a-f0-9]+)"/;

module.exports = {
  BASE_URL,
  Admin_BASE_URL,
  ADMIN_CREDENTIALS,
  EMAIL_RETRY_CONFIG,
  ACTIVATION_LINK_REGEX
}; 