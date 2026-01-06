# Gmail OAuth2 Setup Guide (For Personal Gmail)

This guide will help you set up Gmail API integration using OAuth2 authentication, which works with **personal Gmail accounts** (no Google Workspace required).

## Overview

OAuth2 allows the application to access your personal Gmail account to create email drafts. You'll need to:
1. Create OAuth2 credentials in Google Cloud Console
2. Authorize the application once
3. The app will automatically create email drafts when bookings are made

## Step 1: Create OAuth2 Credentials

### 1.1 Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)

### 1.2 Enable Gmail API

1. Navigate to **APIs & Services** → **Library**
2. Search for **"Gmail API"**
3. Click on it and click **"Enable"**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (for personal Gmail)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `Groww Advisor Scheduler` (or any name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On **Scopes** page:
   - Click **"Add or Remove Scopes"**
   - Search for `gmail.compose`
   - Check **"https://www.googleapis.com/auth/gmail.compose"**
   - Click **"Update"** → **"Save and Continue"**
7. On **Test users** page (if shown):
   - Click **"Add Users"**
   - Add your Gmail address
   - Click **"Add"** → **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

### 1.4 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `Groww Advisor Scheduler Web Client`
5. **Authorized redirect URIs**:
   - Add: `http://localhost:3001/api/auth/gmail/callback`
6. Click **"Create"**
7. **Copy the Client ID and Client Secret** (you'll need these)

## Step 2: Configure Environment Variables

Update `backend/.env` with your OAuth2 credentials:

```env
# Gmail OAuth2 Configuration (for personal Gmail)
GMAIL_OAUTH2_CLIENT_ID=your_client_id_here
GMAIL_OAUTH2_CLIENT_SECRET=your_client_secret_here
GMAIL_OAUTH2_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback

# Gmail Configuration
GMAIL_USER_EMAIL=your_email@gmail.com  # Your personal Gmail address
GMAIL_FROM_EMAIL=noreply@groww.in

# Domain-wide delegation (set to false for personal Gmail)
GMAIL_USE_DELEGATION=false
```

**Important**: Replace `your_client_id_here` and `your_client_secret_here` with the values from Step 1.4.

## Step 3: Authorize the Application

### 3.1 Start the Backend Server

```bash
cd backend
npm run dev
```

### 3.2 Get Authorization URL

Open your browser and visit:
```
http://localhost:3001/api/auth/gmail/authorize
```

Or use the API response:
```bash
curl http://localhost:3001/api/auth/gmail/authorize
```

You'll get a JSON response with an `authUrl`. Copy that URL.

### 3.3 Authorize in Browser

1. Open the `authUrl` in your browser
2. You'll see Google's consent screen
3. Select your Gmail account
4. Click **"Allow"** to grant permissions
5. You'll be redirected to a success page

**Note**: If you see "This app isn't verified", click **"Advanced"** → **"Go to Groww Advisor Scheduler (unsafe)"**. This is normal for apps in development.

### 3.4 Verify Authorization

Check if authorization was successful:
```
http://localhost:3001/api/auth/gmail/status
```

You should see:
```json
{
  "success": true,
  "authenticated": true,
  "message": "Gmail OAuth2 is configured and authenticated"
}
```

## Step 4: Test Email Draft Creation

1. Create a booking through the chat interface
2. Check backend logs for:
   ```
   ✅ Email draft created: {draft_id}
   ```
3. Go to your Gmail account
4. Check the **Drafts** folder
5. You should see: "New Advisor Consultation Request - NL-XXXX"

## Troubleshooting

### Error: "OAuth2 credentials not configured"

**Solution**: Make sure `GMAIL_OAUTH2_CLIENT_ID` and `GMAIL_OAUTH2_CLIENT_SECRET` are set in `backend/.env`

### Error: "redirect_uri_mismatch"

**Solution**: 
- Check that `GMAIL_OAUTH2_REDIRECT_URI` in `.env` matches exactly what you entered in Google Cloud Console
- Must be: `http://localhost:3001/api/auth/gmail/callback`
- No trailing slashes!

### Error: "access_denied" or "consent_required"

**Solution**:
- Make sure you clicked "Allow" on the consent screen
- Check that your email is added as a test user (if app is in testing mode)
- Try the authorization flow again

### Error: "invalid_grant" when refreshing token

**Solution**:
- Delete `backend/config/gmail-tokens.json`
- Re-authorize by visiting `/api/auth/gmail/authorize` again

### Email Drafts Not Appearing

1. Check backend logs for errors
2. Verify authorization status: `http://localhost:3001/api/auth/gmail/status`
3. Check that you're logged into Gmail as `GMAIL_USER_EMAIL`
4. Look in the **Drafts** folder (not Inbox)

### Token Expired

Tokens are automatically refreshed. If you see token errors:
1. Delete `backend/config/gmail-tokens.json`
2. Re-authorize: `http://localhost:3001/api/auth/gmail/authorize`

## How It Works

1. **First Time**: You authorize the app once via OAuth2 flow
2. **Tokens Stored**: Access token and refresh token are saved in `backend/config/gmail-tokens.json`
3. **Automatic Refresh**: The app automatically refreshes tokens when needed
4. **Email Drafts**: When bookings are created, drafts are automatically created in your Gmail drafts folder

## Security Notes

- **Tokens are stored locally** in `backend/config/gmail-tokens.json`
- This file is **excluded from git** (see `.gitignore`)
- **Never commit** your OAuth2 credentials or tokens
- Tokens can be revoked at any time in [Google Account Settings](https://myaccount.google.com/permissions)

## Revoking Access

To revoke access:
1. Go to [Google Account Settings](https://myaccount.google.com/permissions)
2. Find "Groww Advisor Scheduler" (or your app name)
3. Click **"Remove Access"**

## Next Steps

- ✅ Email drafts are created automatically
- 📧 Review and send drafts manually from Gmail
- 🔄 Tokens refresh automatically
- 🚀 Ready for production (publish OAuth app for public use)








