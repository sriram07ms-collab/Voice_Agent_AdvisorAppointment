# Fix Redirect URI Mismatch Error

## Error: `redirect_uri_mismatch`

This error occurs when the redirect URI in your `.env` file doesn't match what's configured in Google Cloud Console.

## Solution

### Step 1: Verify Redirect URI in .env

Your `backend/.env` should have:
```env
GMAIL_OAUTH2_REDIRECT_URI=http://localhost:3001/api/auth/gmail/callback
```

**Important**: 
- Must be `http://` (not `https://`)
- Must be `localhost:3001` (not `localhost:3000` or other ports)
- Must be `/api/auth/gmail/callback` (exact path)
- **NO trailing slash** (`/` at the end)

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID (the one you're using)
4. Click on it to edit
5. Under **Authorized redirect URIs**, check if you have:
   ```
   http://localhost:3001/api/auth/gmail/callback
   ```
6. If it's missing or different:
   - Click **"Add URI"** or edit the existing one
   - Enter: `http://localhost:3001/api/auth/gmail/callback`
   - **Make sure it matches EXACTLY** (no trailing slash, correct port, http not https)
7. Click **"Save"**

### Step 3: Common Mistakes to Avoid

❌ **Wrong:**
- `http://localhost:3001/api/auth/gmail/callback/` (trailing slash)
- `https://localhost:3001/api/auth/gmail/callback` (https instead of http)
- `http://localhost:3000/api/auth/gmail/callback` (wrong port)
- `http://127.0.0.1:3001/api/auth/gmail/callback` (127.0.0.1 instead of localhost)

✅ **Correct:**
- `http://localhost:3001/api/auth/gmail/callback`

### Step 4: Restart Backend

After updating Google Cloud Console:
1. Restart your backend server
2. Try the authorization URL again

### Step 5: Verify

After fixing, the authorization should work. You'll be redirected to:
```
http://localhost:3001/api/auth/gmail/callback?code=...
```

And see a success page.

## Still Having Issues?

1. **Clear browser cache** - Sometimes browsers cache OAuth errors
2. **Check both places match exactly:**
   - `backend/.env`: `GMAIL_OAUTH2_REDIRECT_URI=...`
   - Google Cloud Console: Authorized redirect URIs
3. **Wait a few minutes** - Google Cloud changes can take a moment to propagate








