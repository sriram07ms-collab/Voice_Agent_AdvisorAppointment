# Error Debugging Guide

## 🔍 Where to Check Error Messages

### 1. **Browser Console (Most Important for Frontend Errors)**

#### How to Open:
- **Windows/Linux**: Press `F12` or `Ctrl+Shift+I`
- **Mac**: Press `Cmd+Option+I`
- **Right-click** → Select "Inspect" → Click "Console" tab

#### What to Look For:
- Red error messages
- Yellow warnings
- Network request failures
- JavaScript errors
- WebSocket connection errors

#### Example Errors You Might See:
```
❌ WebSocket connection error
❌ Recording error: Microphone permission denied
❌ Failed to connect to voice service
❌ API Error: 404 Not Found
```

---

### 2. **Browser Network Tab (For API/WebSocket Issues)**

#### How to Open:
1. Press `F12` to open DevTools
2. Click the **"Network"** tab
3. Refresh the page (`Ctrl+R`)
4. Click the microphone button
5. Look for:
   - Failed requests (red status codes)
   - WebSocket connections (WS filter)
   - API calls to `/api/voice/*` endpoints

#### What to Check:
- **Status Codes**: Should be `200` or `101` (WebSocket)
- **Failed Requests**: Red entries with error status (400, 401, 404, 500, etc.)
- **WebSocket**: Should show "101 Switching Protocols" when connected
- Click on failed requests to see error details

---

### 3. **Backend Terminal/Logs**

#### Location:
The terminal window where you ran `npm run dev` in the `backend` folder

#### What to Look For:
```
❌ ElevenLabs API error: ...
❌ WebSocket error: ...
❌ STT/TTS error: ...
❌ Error: ELEVENLABS_API_KEY is not set
❌ Port 3001 already in use
```

#### Common Backend Errors:
- **Port already in use**: Another process is using port 3001
- **Missing API keys**: Check `.env` file in `backend/` folder
- **WebSocket errors**: Connection issues
- **STT/TTS errors**: API provider errors (ElevenLabs, Google Cloud)

---

### 4. **Frontend Terminal/Logs**

#### Location:
The terminal window where you ran `npm run dev` in the `frontend` folder

#### What to Look For:
```
❌ Compilation errors
❌ Module not found
❌ TypeScript errors
❌ Port 3000 already in use
```

#### Common Frontend Errors:
- **Port already in use**: Another process is using port 3000
- **Compilation errors**: TypeScript/JavaScript syntax errors
- **Module not found**: Missing dependencies (run `npm install`)

---

## 🚨 Common Error Scenarios

### Scenario 1: "Speech recognition error" or "Recording error"

**Check:**
1. **Browser Console** (F12) - See the exact error message
2. **Browser Permissions** - Check if microphone access is allowed
3. **Backend Terminal** - Check if backend is running

**Solution:**
- Allow microphone permissions in browser
- Ensure backend is running on port 3001
- Check browser console for specific error details

---

### Scenario 2: "Failed to connect to voice service"

**Check:**
1. **Backend Terminal** - Is the server running?
2. **Browser Network Tab** - Can you see WebSocket connection attempt?
3. **Browser Console** - WebSocket connection error details

**Solution:**
- Start backend server: `cd backend && npm run dev`
- Check if port 3001 is available
- Check browser console for connection timeout errors

---

### Scenario 3: "ElevenLabs API error"

**Check:**
1. **Backend Terminal** - Full error message
2. **Backend `.env` file** - Is `ELEVENLABS_API_KEY` set?
3. **Browser Console** - Any error messages from API calls

**Solution:**
- Verify API key in `backend/.env` file
- Check ElevenLabs API quota/limits
- Check backend logs for specific error code (401, 429, etc.)

---

### Scenario 4: Blank screen or page won't load

**Check:**
1. **Frontend Terminal** - Compilation errors?
2. **Browser Console** - JavaScript errors?
3. **Network Tab** - Are files loading?

**Solution:**
- Check frontend terminal for compilation errors
- Hard refresh: `Ctrl+Shift+R`
- Clear browser cache
- Check if frontend is running on port 3000

---

## 📋 Quick Checklist

When reporting an error, please check:

- [ ] Browser Console (F12) - What errors do you see?
- [ ] Browser Network Tab - Any failed requests?
- [ ] Backend Terminal - Any error messages?
- [ ] Frontend Terminal - Any compilation errors?
- [ ] Browser Permissions - Is microphone access allowed?
- [ ] Server Status - Are both servers running?

---

## 🔧 How to Get Help

When asking for help, please provide:

1. **Exact error message** from Browser Console
2. **Screenshot** of the error (if possible)
3. **Browser** you're using (Chrome, Firefox, Edge, etc.)
4. **Backend terminal output** (if relevant)
5. **Steps to reproduce** the error

---

## 📝 Example: How to Check Errors Step-by-Step

1. **Open Browser Console**
   - Press `F12`
   - Click "Console" tab
   - Look for red error messages

2. **Try the Voice Feature**
   - Click the microphone button
   - Watch the console for errors

3. **Check Network Tab**
   - Click "Network" tab in DevTools
   - Filter by "WS" (WebSocket) or "XHR" (API calls)
   - Click the microphone button
   - Check if requests are successful

4. **Check Backend Terminal**
   - Look at the terminal where backend is running
   - Check for error messages

5. **Copy the Error**
   - Right-click on error in console
   - Select "Copy" or "Copy message"
   - Share the exact error message

---

## 🎯 Most Common Issue: Browser Cache

If you're seeing old errors or the page looks outdated:

1. **Hard Refresh**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Cache**: 
   - Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Click "Clear data"
3. **Incognito/Private Window**: Open a new incognito window and test





