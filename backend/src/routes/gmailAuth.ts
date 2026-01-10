import express from 'express';
import { getGmailAuthUrl, exchangeCodeForTokens, isGmailOAuth2Ready } from '../services/mcp/gmailOAuth2';

const router = express.Router();

/**
 * GET /api/auth/gmail/authorize
 * Get authorization URL for Gmail OAuth2
 */
router.get('/authorize', (req, res) => {
  try {
    const authUrl = getGmailAuthUrl();
    res.json({
      success: true,
      authUrl,
      message: 'Visit the authUrl to authorize Gmail access',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to generate authorization URL. Check OAuth2 credentials in .env',
    });
  }
});

/**
 * GET /api/auth/gmail/callback
 * OAuth2 callback - exchange code for tokens
 */
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <html>
        <body>
          <h1>Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p><a href="/api/auth/gmail/authorize">Try again</a></p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html>
        <body>
          <h1>Authorization Failed</h1>
          <p>No authorization code received</p>
          <p><a href="/api/auth/gmail/authorize">Try again</a></p>
        </body>
      </html>
    `);
  }

  try {
    await exchangeCodeForTokens(code as string);
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #00D09C;">✅ Gmail Authorization Successful!</h1>
          <p>Your Gmail account has been authorized. You can now close this window.</p>
          <p style="color: #666;">Email drafts will now be created automatically when bookings are made.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #dc3545;">❌ Authorization Failed</h1>
          <p>Error: ${error.message}</p>
          <p><a href="/api/auth/gmail/authorize">Try again</a></p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/gmail/status
 * Check OAuth2 authentication status
 */
router.get('/status', (req, res) => {
  try {
    const isReady = isGmailOAuth2Ready();
    res.json({
      success: true,
      authenticated: isReady,
      message: isReady 
        ? 'Gmail OAuth2 is configured and authenticated' 
        : 'Gmail OAuth2 is not authenticated. Visit /api/auth/gmail/authorize to authorize',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      authenticated: false,
      error: error.message,
    });
  }
});

export default router;









