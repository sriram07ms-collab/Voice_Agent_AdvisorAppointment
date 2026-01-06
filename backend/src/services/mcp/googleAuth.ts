import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

let authClient: any = null;

export async function getGoogleAuthClient() {
  if (authClient) {
    return authClient;
  }

  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || './config/google-service-account.json';
  // Resolve path relative to backend directory (where server.ts runs)
  // __dirname in compiled code is dist/services/mcp, so go up to dist, then to backend root
  // In dev (tsx), __dirname is src/services/mcp, so go up to src, then to backend root
  const backendDir = path.resolve(__dirname, '../../..');
  const fullPath = path.resolve(backendDir, serviceAccountPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Google service account file not found at: ${fullPath}`);
    throw new Error(`Google service account file not found at: ${fullPath}`);
  }

  console.log(`📁 Loading service account from: ${fullPath}`);
  const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    console.error('❌ Service account file missing required fields (client_email or private_key)');
    throw new Error('Service account file is missing required fields');
  }

  console.log(`🔐 Authenticating as: ${serviceAccount.client_email}`);
  
  // Check if domain-wide delegation is enabled (for Gmail API)
  const gmailUserEmail = process.env.GMAIL_USER_EMAIL;
  const useDomainWideDelegation = process.env.GMAIL_USE_DELEGATION === 'true' && gmailUserEmail;
  
  authClient = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
    // Use domain-wide delegation for Gmail if configured
    subject: useDomainWideDelegation ? gmailUserEmail : undefined,
  });
  
  if (useDomainWideDelegation) {
    console.log(`📧 Using domain-wide delegation for Gmail as: ${gmailUserEmail}`);
  }

  try {
    await authClient.authorize();
    console.log('✅ Google authentication successful');
  } catch (authError: any) {
    console.error('❌ Google authentication failed:', authError.message);
    throw new Error(`Google authentication failed: ${authError.message}`);
  }
  
  return authClient;
}



