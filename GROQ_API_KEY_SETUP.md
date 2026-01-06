# How to Fix Groq API Key Error

## Error Message
```
Groq API error: 401 Invalid API Key
```

## Solution

### Step 1: Get Your Groq API Key

1. Go to https://console.groq.com/
2. Sign in or create a free account
3. Navigate to **API Keys** section
4. Click **Create API Key** or copy your existing key
5. The key will look like: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Update the API Key

1. Open `backend/.env` file
2. Find the line: `GROQ_API_KEY=gsk_...`
3. Replace the value with your new API key:
   ```
   GROQ_API_KEY=your_new_api_key_here
   ```
4. Save the file

### Step 3: Restart the Backend Server

1. Stop the backend server (Ctrl+C in the PowerShell window)
2. Restart it:
   ```powershell
   cd backend
   npm run dev
   ```

### Step 4: Test Again

Try sending a message in the chat interface again.

## Troubleshooting

- **Key format**: Should start with `gsk_` and be about 50+ characters long
- **No spaces**: Make sure there are no spaces before or after the key
- **Quotes**: Don't add quotes around the key value
- **Restart required**: Always restart the backend after changing .env file

## Free Tier Limits

Groq offers a free tier with generous limits. If you hit rate limits:
- Wait a few minutes
- Check your usage at https://console.groq.com/
- Consider upgrading if needed












