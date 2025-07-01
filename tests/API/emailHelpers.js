const { EMAIL_RETRY_CONFIG, ACTIVATION_LINK_REGEX } = require('./config');

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
  getEmailBody,
  extractActivationLink
}; 