# Phase 2: MCP Integration Setup Guide

## Overview

Phase 2 integrates real Google Calendar, Google Sheets, and Gmail services using the Google APIs. This replaces the mock implementations with actual data sources.

## Prerequisites

1. Google Cloud Account
2. Node.js and npm installed
3. Phase 1 completed and working

## Step 1: Google Cloud Project Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project name: `Groww-Advisor-Scheduler`
4. Click "Create"

### 1.2 Enable Required APIs

1. Navigate to "APIs & Services" → "Library"
2. Enable the following APIs:
   - **Google Calendar API**
   - **Google Sheets API**
   - **Gmail API**

### 1.3 Create Service Account

1. Navigate to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `mcp-integration-sa`
4. Description: `Service account for MCP integrations`
5. Click "Create and Continue"
6. Grant roles:
   - **Calendar Admin** (for calendar operations)
   - **Editor** (for Sheets operations)
7. Click "Done"

### 1.4 Create Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. Save the downloaded JSON file as `backend/config/google-service-account.json`
7. **IMPORTANT**: Never commit this file to git!

## Step 2: Google Calendar Setup

### 2.1 Create Dedicated Calendar

1. Go to [Google Calendar](https://calendar.google.com/)
2. Click the "+" next to "Other calendars" → "Create new calendar"
3. Name: `Advisor Appointments`
4. Description: `Calendar for advisor consultation bookings`
5. Click "Create calendar"

### 2.2 Share Calendar with Service Account

1. In calendar settings, go to "Share with specific people"
2. Click "Add people"
3. Enter the service account email (found in the JSON file: `client_email`)
4. Permission: **Make changes to events**
5. Click "Send"
6. Note the Calendar ID (found in calendar settings → "Integrate calendar" → "Calendar ID")
   - Format: `xxxxx@group.calendar.google.com`

## Step 3: Google Sheets Setup

### 3.1 Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name: `Advisor Pre-Bookings`

### 3.2 Setup Headers

In row 1, add these headers:
```
Date | Time | Topic | Booking Code | Status | Created At | Updated At
```

### 3.3 Share Sheet with Service Account

1. Click "Share" button
2. Enter the service account email (from JSON file)
3. Permission: **Editor**
4. Uncheck "Notify people"
5. Click "Share"

### 3.4 Get Sheet ID

From the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
Copy the `SHEET_ID` part.

## Step 4: Gmail Setup

### 4.1 Enable Domain-Wide Delegation (Required for Gmail API)

Gmail API requires domain-wide delegation to allow service accounts to create email drafts on behalf of users. This requires Google Workspace admin access.

#### 4.1.1 Enable Domain-Wide Delegation in Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" → "Service Accounts"
3. Click on your service account (`mcp-integration-sa`)
4. Go to the "Details" tab
5. Scroll down to "Domain-wide delegation"
6. Check "Enable Google Workspace Domain-wide Delegation"
7. Note the **Client ID** (you'll need this in the next step)

#### 4.1.2 Authorize Scopes in Google Workspace Admin Console

1. Go to [Google Admin Console](https://admin.google.com/)
   - **Note**: You need Google Workspace admin access for this step
2. Navigate to "Security" → "API Controls" → "Domain-wide Delegation"
3. Click "Add new"
4. Enter the **Client ID** from step 4.1.1
5. In "OAuth Scopes", add:
   ```
   https://www.googleapis.com/auth/gmail.compose
   ```
6. Click "Authorize"

#### 4.1.3 Configure Environment Variable

In your `backend/.env` file, set:
```env
GMAIL_USE_DELEGATION=true
GMAIL_USER_EMAIL=advisor@groww.in  # Must be a Google Workspace user
GMAIL_FROM_EMAIL=noreply@groww.in
```

**Important Notes:**
- Domain-wide delegation only works with **Google Workspace** accounts (not personal Gmail)
- The `GMAIL_USER_EMAIL` must be a valid Google Workspace user in your domain
- The service account will impersonate this user to create drafts
- If you don't have Google Workspace, email drafts will fail gracefully (booking will still succeed)

### 4.2 Alternative: OAuth2 (For Personal Gmail)

If you don't have Google Workspace, you can use OAuth2 instead:
1. Create OAuth2 credentials in Google Cloud Console
2. Implement OAuth2 flow to get user consent
3. Store access/refresh tokens
4. Use tokens for Gmail API calls

**Note**: OAuth2 implementation is more complex and requires user interaction. Domain-wide delegation is recommended for production.

## Step 5: Configure Environment Variables

### 5.1 Automated Setup (Recommended)

**For Windows (PowerShell):**
```powershell
cd backend
.\setup-env-mcp.ps1
```

**For Linux/macOS (Bash):**
```bash
cd backend
chmod +x setup-env-mcp.sh
./setup-env-mcp.sh
```

This script will:
- Create `backend/.env` from template if it doesn't exist
- Check for service account file
- Provide instructions for next steps

### 5.2 Manual Setup

If you prefer to set up manually:

1. **Create backend/.env** (if it doesn't exist):
   ```bash
   cp backend/env.template backend/.env
   ```

2. **Update backend/.env** with your values:
   ```env
   # MCP Integration (Phase 2)
   MCP_ENABLED=true
   
   # Google Cloud Configuration
   GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
   
   # Google Calendar Configuration
   GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
   
   # Google Sheets Configuration
   GOOGLE_SHEET_ID=your_sheet_id_here
   GOOGLE_SHEET_NAME=Sheet1
   
   # Gmail Configuration
   GMAIL_USER_EMAIL=advisor@groww.in
   GMAIL_FROM_EMAIL=noreply@groww.in
   # Set to 'true' if domain-wide delegation is configured (requires Google Workspace)
   GMAIL_USE_DELEGATION=false
   ```

### 5.3 Update Existing .env

If `backend/.env` already exists, use the update script:

**For Windows (PowerShell):**
```powershell
cd backend
.\update-env-mcp.ps1 -CalendarId "your_calendar_id@group.calendar.google.com" -SheetId "your_sheet_id" -EnableMCP
```

**For Linux/macOS (Bash):**
```bash
cd backend
chmod +x update-env-mcp.sh
./update-env-mcp.sh "your_calendar_id@group.calendar.google.com" "your_sheet_id" "advisor@groww.in" "noreply@groww.in" "true"
```

### 5.4 Verify Config Directory

Ensure the config directory exists and contains your service account file:

```bash
# Directory should exist
ls backend/config/

# Service account file should be present
ls backend/config/google-service-account.json
```

**Note**: The service account file is automatically excluded from git via `.gitignore`

## Step 6: Update .gitignore

Ensure `backend/config/google-service-account.json` is in `.gitignore`:

```
backend/config/google-service-account.json
backend/config/*.json
!backend/config/package.json
```

## Step 7: Test the Integration

### 7.1 Start the Backend

```bash
cd backend
npm run dev
```

### 7.2 Test Booking Flow

1. Open the chat interface
2. Complete a booking:
   - "I want to book an advisor call"
   - "I need help with nominee changes"
   - "yes"
   - "tomorrow afternoon"
   - Select a slot
   - "yes" to confirm

### 7.3 Verify MCP Operations

1. **Google Calendar**: Check for event titled "Advisor Q&A — Account Changes/Nominee — NL-XXXX"
2. **Google Sheet**: Check for new row with booking details
3. **Gmail**: 
   - If `GMAIL_USE_DELEGATION=true` and domain-wide delegation is configured:
     - Check the drafts folder of `GMAIL_USER_EMAIL` for advisor notification
     - Draft subject: "New Advisor Consultation Request - NL-XXXX"
   - If domain-wide delegation is not configured:
     - Email draft creation will fail (expected)
     - Check backend logs for: "⚠️ Email draft creation failed, but booking will continue"
     - Booking will still succeed without email notification

## Troubleshooting

### Error: "Google service account file not found"

- Verify the path in `GOOGLE_SERVICE_ACCOUNT_PATH`
- Ensure the file exists at `backend/config/google-service-account.json`
- Check file permissions

### Error: "GOOGLE_CALENDAR_ID not configured"

- Verify `GOOGLE_CALENDAR_ID` is set in `.env`
- Ensure calendar is shared with service account email

### Error: "Permission denied" for Calendar/Sheets

- Verify service account email has access
- Check calendar/sheet sharing settings
- Ensure service account has correct roles in Google Cloud

### Error: "Gmail API quota exceeded"

- Gmail API has rate limits
- Implement delays between requests if needed
- Consider using OAuth2 for production

### Error: "Gmail API - insufficient permission" or "403 Forbidden"

This error occurs when domain-wide delegation is not properly configured. Solutions:

1. **Verify Domain-Wide Delegation is Enabled:**
   - Check that "Enable Google Workspace Domain-wide Delegation" is checked in service account settings
   - Verify the Client ID is authorized in Google Admin Console

2. **Verify OAuth Scopes:**
   - In Google Admin Console → Domain-wide Delegation
   - Ensure `https://www.googleapis.com/auth/gmail.compose` is added
   - Client ID must match your service account's Client ID

3. **Check GMAIL_USE_DELEGATION:**
   - Ensure `GMAIL_USE_DELEGATION=true` in `backend/.env`
   - Restart the backend server after changing this value

4. **Verify GMAIL_USER_EMAIL:**
   - Must be a valid Google Workspace user (not personal Gmail)
   - Must be in the same domain as your Google Workspace

5. **If Using Personal Gmail:**
   - Domain-wide delegation only works with Google Workspace
   - For personal Gmail, you need OAuth2 (not implemented in current version)
   - Email drafts will fail gracefully, but bookings will still succeed

**Note**: If you don't have Google Workspace, email drafts will not work. This is expected behavior - the booking system will continue to function without email notifications.

### MCP Operations Fail but Booking Succeeds

This is expected behavior (graceful degradation). The system will:
- Log errors to console
- Continue with booking even if MCP fails
- Allow manual reconciliation later

## Disabling MCP (Fallback to Phase 1)

To disable MCP and use mock implementations:

```env
MCP_ENABLED=false
```

The system will automatically fall back to mock slot generation and skip MCP operations.

## Next Steps

- Set up domain-wide delegation for Gmail (if needed for sending emails)
- Implement retry logic for failed MCP operations
- Add background job for syncing failed operations
- Set up monitoring and alerts for MCP failures


