const { EMAIL_RETRY_CONFIG, ACTIVATION_LINK_REGEX } = require('./config');
const fs = require('fs');
const { google } = require('googleapis');

async function setupOAuth2Client() {
  let oAuth2Client = null;

  if (oAuth2Client) {
    return oAuth2Client;
  }

  const credentials = JSON.parse(fs.readFileSync('./tests/fixtures/credentials.json'));
  const { client_secret, client_id, redirect_uris } = credentials.web;
  oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    if (fs.existsSync('./tests/fixtures/refresh_token.txt')) {
      const refreshToken = fs.readFileSync('./tests/fixtures/refresh_token.txt', 'utf-8').trim();
      console.log('Found existing refresh token in refresh_token.txt');
      
      const tokens = {
        refresh_token: refreshToken,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        token_type: 'Bearer',
        expiry_date: 0
      };

      oAuth2Client.setCredentials(tokens);
      
      try {
        await oAuth2Client.getAccessToken();
        console.log('Successfully refreshed access token');
        return oAuth2Client;
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }

    console.log('Starting new authorization flow...');
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      prompt: 'consent'
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
    
    const code = process.env.AUTH_CODE || fs.readFileSync('./tests/fixtures/auth_code.txt', 'utf-8').trim();
    if (!code || code.includes('PASTE YOUR AUTHORIZATION CODE HERE')) {
      throw new Error('Please complete the authorization flow and provide a fresh authorization code');
    }

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('Received new tokens from authorization');
    
    // Save refresh token for future use
    if (tokens.refresh_token) {
      fs.writeFileSync('./tests/fixtures/refresh_token.txt', tokens.refresh_token);
      console.log('New refresh token saved to refresh_token.txt');
    }
    
    oAuth2Client.setCredentials(tokens);
    return oAuth2Client;
  } catch (error) {
    console.error('OAuth setup error:', error);
    throw error;
  }
}
// Function to generate a unique Gmail address
function generateUniqueGmail() {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
  const emailAddress = `smita+${uniqueId}@teamed.global`;
  console.log(`Generated Unique Gmail Address: ${emailAddress}`);
  return emailAddress;
}

async function getEmailBody(gmail, recipientEmail) {
  const maxRetries = EMAIL_RETRY_CONFIG.maxRetries;
  const delayBetweenRetries = EMAIL_RETRY_CONFIG.delayBetweenRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt} of ${maxRetries} to fetch email for ${recipientEmail}`);
    
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `to:${recipientEmail}`,
      maxResults: 1,
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      if (attempt === maxRetries) {
        throw new Error('No emails found for the recipient after all retries.');
      }
      console.log(`No emails found yet, waiting ${delayBetweenRetries/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenRetries));
      continue;
    }

    const messageId = res.data.messages[0].id;
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    let emailBody;
    const payload = message.data.payload;

    // Check if the email body is directly in the payload
    if (payload.body && payload.body.data) {
      emailBody = payload.body.data;
    } 
    // Check if the body is in parts
    else if (payload.parts) {
      // Try to find HTML part first
      const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');
      if (htmlPart?.body?.data) {
        emailBody = htmlPart.body.data;
      } 
      // Fall back to plain text if no HTML
      else {
        const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          emailBody = textPart.body.data;
        }
      }
    }

    if (!emailBody) {
      throw new Error('Email body not found in any expected location.');
    }

    return Buffer.from(emailBody, 'base64').toString('utf-8');
  }
}

function extractActivationLink(emailBody) {
  const linkRegex = ACTIVATION_LINK_REGEX;
  const match = emailBody.match(linkRegex);

  if (!match) {
    throw new Error('No activation link found in the email body.');
  }

  const fullUrl = match[1];
  console.log('Found activation URL:', fullUrl);
  
  const activationCode = fullUrl.split('/').pop(); // Get the last part after the final '/'
  console.log('Extracted activation code:', activationCode);
  
  if (!activationCode) {
    throw new Error('Could not extract activation code from URL.');
  }

  return activationCode;
}

module.exports = {
  setupOAuth2Client,
  getEmailBody,
  extractActivationLink,
  generateUniqueGmail
}; 