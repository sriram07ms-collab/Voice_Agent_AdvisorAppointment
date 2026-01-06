# MCP Integration Debugging Guide

## Issue: MCP Operations Not Creating Calendar/Sheet/Email Entries

If you see the booking confirmation but no entries in Google Calendar, Google Sheets, or Gmail drafts, follow these steps:

## 1. Check Backend Console Logs

When you create a booking, check the backend console (PowerShell window running `npm run dev:backend`) for:

### Success Messages:
- `✅ Google authentication successful`
- `✅ Calendar event created: [event-id]`
- `✅ Booking record appended to sheet at row [number]`
- `✅ Email draft created: [draft-id]`
- `✅ MCP operations completed for booking [code]`

### Error Messages:
- `❌ Google authentication failed`
- `❌ Error creating calendar hold`
- `❌ Error appending booking record`
- `❌ Error creating email draft`
- `❌ MCP operations failed (booking will continue)`

## 2. Verify Environment Variables

Check `backend/.env` file:

```env
MCP_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
GOOGLE_SHEET_ID=your_sheet_id_here
GOOGLE_SHEET_NAME=Sheet1
GMAIL_USER_EMAIL=advisor@groww.in
```

## 3. Verify Service Account File

1. Check if file exists: `backend/config/google-service-account.json`
2. Verify file contains:
   - `client_email`
   - `private_key`
   - `project_id`

## 4. Check Google Cloud Permissions

### Service Account Permissions Required:

1. **Google Calendar API**:
   - Enable "Google Calendar API" in Google Cloud Console
   - Grant service account access to the calendar:
     - Go to Google Calendar → Settings → Share with specific people
     - Add service account email (from `client_email` in JSON)
     - Give "Make changes to events" permission

2. **Google Sheets API**:
   - Enable "Google Sheets API" in Google Cloud Console
   - Share the Google Sheet with service account email:
     - Open Google Sheet → Share button
     - Add service account email
     - Give "Editor" permission

3. **Gmail API**:
   - Enable "Gmail API" in Google Cloud Console
   - **Note**: Gmail API typically requires OAuth2, not service account
   - Service account may not work for Gmail drafts
   - This is expected to fail - booking will continue

## 5. Common Error Messages and Solutions

### "Google service account file not found"
- **Solution**: Check `GOOGLE_SERVICE_ACCOUNT_PATH` in `.env`
- Verify file exists at the specified path

### "GOOGLE_CALENDAR_ID not configured"
- **Solution**: Set `GOOGLE_CALENDAR_ID` in `.env`
- Get calendar ID from Calendar Settings → Calendar ID

### "GOOGLE_SHEET_ID not configured"
- **Solution**: Set `GOOGLE_SHEET_ID` in `.env`
- Get sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### "403 Forbidden" or "Permission denied"
- **Solution**: 
  - Share calendar/sheet with service account email
  - Verify service account has correct permissions in Google Cloud Console
  - Check API is enabled in Google Cloud Console

### "401 Unauthorized"
- **Solution**:
  - Verify service account JSON file is valid
  - Check `client_email` and `private_key` are correct
  - Ensure service account is not disabled in Google Cloud Console

## 6. Test MCP Operations Manually

You can test each MCP operation separately by checking the backend logs:

1. **Calendar**: Look for `✅ Calendar event created` or `❌ Error creating calendar hold`
2. **Sheets**: Look for `✅ Booking record appended` or `❌ Error appending booking record`
3. **Gmail**: Look for `✅ Email draft created` or `❌ Error creating email draft`

## 7. Check Booking Confirmation Message

The booking confirmation now shows actual MCP status:

```
Your booking has been confirmed!
Your booking code is: NL-P537

MCP Operations:
✅ Calendar event created (ID: abc123)
✅ Sheet entry added (Row: 5)
❌ Email draft creation failed
```

If you see `❌` for any operation, check the backend logs for detailed error messages.

## 8. Enable Detailed Logging

All MCP operations now log:
- Success with IDs/row numbers
- Error messages with codes
- Full error responses (if available)

Check the backend console for these detailed logs.

## Next Steps

1. **Try booking again** and watch the backend console
2. **Copy the error messages** from the console
3. **Check Google Cloud Console** for API enablement and permissions
4. **Verify service account** has access to calendar and sheet
5. **Share this guide** with your team if they encounter similar issues









