import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

let oauth2Client: any = null;
let tokens: any = null;

/**
 * Get or create OAuth2 client for Gmail API
 */
export function getGmailOAuth2Client() {
  if (oauth2Client) {
    return oauth2Client;
  }

  const clientId = process.env.GMAIL_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.GMAIL_OAUTH2_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_OAUTH2_REDIRECT_URI || 'http://localhost:3001/api/auth/gmail/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth2 credentials not configured. Please set GMAIL_OAUTH2_CLIENT_ID and GMAIL_OAUTH2_CLIENT_SECRET in .env');
  }

  oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  // Load stored tokens if available
  const tokenPath = path.resolve(__dirname, '../../../config/gmail-tokens.json');
  if (fs.existsSync(tokenPath)) {
    try {
      tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      oauth2Client.setCredentials(tokens);
      console.log('✅ Loaded stored Gmail OAuth2 tokens');
    } catch (error) {
      console.warn('⚠️  Failed to load stored tokens, will need re-authentication');
    }
  }

  return oauth2Client;
}

/**
 * Get authorization URL for OAuth2 flow
 */
export function getGmailAuthUrl(): string {
  const client = getGmailOAuth2Client();
  const scopes = ['https://www.googleapis.com/auth/gmail.compose'];
  
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = getGmailOAuth2Client();
  
  try {
    const { tokens: newTokens } = await client.getToken(code);
    tokens = newTokens;
    client.setCredentials(tokens);
    
    // Save tokens to file
    const tokenPath = path.resolve(__dirname, '../../../config/gmail-tokens.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    console.log('✅ Gmail OAuth2 tokens saved successfully');
    
    return;
  } catch (error: any) {
    console.error('❌ Failed to exchange code for tokens:', error.message);
    throw new Error(`Failed to exchange code for tokens: ${error.message}`);
  }
}

/**
 * Check if OAuth2 is configured and authenticated
 */
export function isGmailOAuth2Ready(): boolean {
  try {
    const client = getGmailOAuth2Client();
    return tokens !== null && client.credentials?.access_token !== undefined;
  } catch {
    return false;
  }
}

/**
 * Refresh access token if needed
 */
export async function refreshGmailTokenIfNeeded(): Promise<void> {
  const client = getGmailOAuth2Client();
  
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh token available. Please re-authenticate.');
  }

  try {
    const { credentials } = await client.refreshAccessToken();
    tokens = { ...tokens, ...credentials };
    client.setCredentials(tokens);
    
    // Save updated tokens
    const tokenPath = path.resolve(__dirname, '../../../config/gmail-tokens.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    
    console.log('✅ Gmail OAuth2 token refreshed');
  } catch (error: any) {
    console.error('❌ Failed to refresh token:', error.message);
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
}








