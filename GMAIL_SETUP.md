# Gmail API Integration - Setup Guide

## Overview

The Gmail API integration allows the system to create email drafts for advisor notifications when bookings are created. This uses Google's Gmail API with domain-wide delegation.

## How It Works

1. When a booking is created, the system attempts to create an email draft
2. The draft is created in the `GMAIL_USER_EMAIL` account's drafts folder
3. The advisor can review and send the draft manually
4. If email draft creation fails, the booking still succeeds (graceful degradation)

## Setup Requirements

### Prerequisites

- **Google Workspace Account** (not personal Gmail)
- **Google Workspace Admin Access** (for domain-wide delegation)
- Service account already created (from Phase 2 setup)

### Step 1: Enable Domain-Wide Delegation

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Click on your service account (`mcp-integration-sa`)
4. Go to the **Details** tab
5. Scroll down to **Domain-wide delegation**
6. Check **"Enable Google Workspace Domain-wide Delegation"**
7. **Copy the Client ID** (you'll need this in the next step)

### Step 2: Authorize in Google Workspace Admin

1. Go to [Google Admin Console](https://admin.google.com/)
   - ⚠️ You need **Google Workspace admin access** for this
2. Navigate to **Security** → **API Controls** → **Domain-wide Delegation**
3. Click **"Add new"**
4. Enter the **Client ID** from Step 1
5. In **OAuth Scopes**, add:
   ```
   https://www.googleapis.com/auth/gmail.compose
   ```
6. Click **"Authorize"**

### Step 3: Configure Environment Variables

Update `backend/.env`:

```env
# Gmail Configuration
GMAIL_USER_EMAIL=advisor@groww.in  # Must be a Google Workspace user
GMAIL_FROM_EMAIL=noreply@groww.in
GMAIL_USE_DELEGATION=true  # Enable domain-wide delegation
```

### Step 4: Restart Backend

After updating `.env`, restart the backend server:

```bash
cd backend
npm run dev
```

## Testing

1. Create a booking through the chat interface
2. Check the backend logs for:
   ```
   ✅ Email draft created: {draft_id}
   ```
3. Go to Gmail (as `GMAIL_USER_EMAIL`)
4. Check the **Drafts** folder
5. You should see a draft with subject: "New Advisor Consultation Request - NL-XXXX"

## Troubleshooting

### Error: "403 Forbidden" or "insufficient permission"

**Possible causes:**
1. Domain-wide delegation not enabled in service account
2. Client ID not authorized in Google Admin Console
3. OAuth scope not added correctly
4. `GMAIL_USE_DELEGATION=false` in `.env`

**Solutions:**
- Verify all steps in "Setup Requirements" above
- Check that `GMAIL_USE_DELEGATION=true` in `.env`
- Restart backend after changing `.env`

### Error: "User not found" or "Invalid user"

**Possible causes:**
- `GMAIL_USER_EMAIL` is not a valid Google Workspace user
- Using personal Gmail (not supported)

**Solutions:**
- Ensure `GMAIL_USER_EMAIL` is a Google Workspace account
- Domain-wide delegation only works with Google Workspace, not personal Gmail

### Email Drafts Not Appearing

1. Check backend logs for errors
2. Verify domain-wide delegation is configured correctly
3. Check that you're logged into Gmail as `GMAIL_USER_EMAIL`
4. Look in the **Drafts** folder (not Inbox)

## Without Google Workspace

If you don't have Google Workspace:

- Email drafts will **not work** (this is expected)
- Bookings will **still succeed** (graceful degradation)
- You'll see in logs: `⚠️ Email draft creation failed, but booking will continue`
- Calendar and Sheets will still work normally

## Email Draft Format

The email draft includes:
- **To**: `GMAIL_USER_EMAIL`
- **From**: `GMAIL_FROM_EMAIL`
- **Subject**: "New Advisor Consultation Request - {booking_code}"
- **Body**: Booking details (code, topic, date/time, preferences)

The advisor can review and send the draft manually.

## Next Steps

- ✅ Email drafts are created automatically
- 📧 Advisor reviews and sends drafts manually
- 🔄 Future: Implement automatic sending (requires additional permissions)








