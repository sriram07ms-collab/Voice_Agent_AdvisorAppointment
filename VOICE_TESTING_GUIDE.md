# Voice Feature Testing Guide

## ✅ Implementation Status

Everything is **READY** for testing! Here's what's implemented:

### ✅ Frontend (Web UI)
- **Microphone Input**: `VoiceButton` component with Web Audio API
- **WebSocket Client**: Real-time audio streaming to backend
- **Audio Playback**: Automatic playback of TTS responses
- **UI Integration**: Voice button integrated in ChatWindow

### ✅ Backend
- **WebSocket Server**: Real-time voice streaming endpoint
- **STT Integration**: ElevenLabs + Google Cloud STT (with auto-fallback)
- **TTS Integration**: ElevenLabs + Google Cloud TTS (with auto-fallback)
- **Conversation Flow**: Full integration with Groq AI orchestrator

### ✅ Complete Flow
```
Browser Microphone → Web Audio API → WebSocket Stream → 
Backend STT (ElevenLabs/Google) → Groq AI Processing → 
Backend TTS (ElevenLabs/Google) → WebSocket Response → 
Browser Audio Playback
```

## 🧪 Testing Steps

### 1. **Start the Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. **Verify Configuration**

Check backend console for:
- ✅ ElevenLabs TTS is configured (if API key is set)
- ✅ ElevenLabs STT is configured (if API key is set)
- ✅ Using Google Cloud TTS/STT (if ElevenLabs not configured)

### 3. **Open the Application**

1. Open browser: `http://localhost:3000`
2. Grant microphone permissions when prompted
3. You should see:
   - Chat interface with messages
   - **Green microphone button** next to the input field

### 4. **Test Voice Flow**

#### Test 1: Basic Voice Input
1. Click the **green microphone button**
2. Speak: "I want to book an advisor call"
3. Click the button again to stop recording
4. You should see:
   - Transcript appears below the button
   - Processing indicator
   - AI response appears in chat
   - **Audio response plays automatically**

#### Test 2: Full Conversation
1. Click microphone
2. Say: "I need help with KYC onboarding"
3. Stop recording
4. Wait for response
5. Click microphone again
6. Say: "Tomorrow morning"
7. Continue the conversation

#### Test 3: Check Audio Quality
- **ElevenLabs TTS**: Should sound more natural (if configured)
- **Google TTS**: Should sound clear but more robotic
- Audio should play automatically after each response

### 5. **Verify the Flow**

Open browser DevTools Console (F12) and check for:

```
✅ Voice WebSocket connected
🎤 New voice WebSocket connection
✅ Voice session ready
```

### 6. **Troubleshooting**

#### Microphone Not Working
- Check browser permissions (lock icon → Microphone → Allow)
- Try a different browser (Chrome/Edge recommended)
- Check if microphone is working in other apps

#### No Audio Playback
- Check browser console for errors
- Ensure system volume is not muted
- Check if audio format is supported (MP3 for ElevenLabs, OGG for Google)

#### WebSocket Connection Failed
- Ensure backend is running on port 3001
- Check CORS settings
- Verify WebSocket URL: `ws://localhost:3001/api/voice/ws`

#### STT/TTS Errors
- Check backend console for detailed error messages
- Verify API keys are set correctly in `.env`
- Check ElevenLabs quota (free tier: ~10 min TTS, ~2.5 hours STT per month)

## 📋 Expected Behavior

### When Recording:
- Button turns **red** and pulses
- "Recording..." text appears
- Microphone icon changes to stop icon

### When Processing:
- Button shows **spinning loader**
- Transcript appears below button
- "Processing..." state

### When Response Received:
- AI message appears in chat
- **Audio automatically plays**
- Button returns to green (ready state)

## 🎯 Test Scenarios

### Scenario 1: Book Appointment
1. Click mic → "I want to book an advisor call"
2. Wait for response
3. Click mic → "KYC onboarding"
4. Click mic → "Tomorrow morning"
5. Click mic → "9 AM"
6. Verify booking code appears

### Scenario 2: Check Availability
1. Click mic → "What slots are available?"
2. Verify slots list appears

### Scenario 3: Error Handling
1. Click mic → Speak nothing (or very quietly)
2. Should show error or ask to try again

## 🔍 Debugging

### Check Backend Logs
```bash
# Look for:
🎤 New voice WebSocket connection
✅ Voice session ready
❌ Speech-to-Text error: [details]
❌ Text-to-Speech error: [details]
```

### Check Frontend Console
```javascript
// Look for:
✅ Voice WebSocket connected
Voice session ready
Failed to play audio: [error]
```

### Check Network Tab
- WebSocket connection: `ws://localhost:3001/api/voice/ws`
- Should show "101 Switching Protocols"

## ✅ Success Criteria

Your voice feature is working if:
1. ✅ Microphone button appears and responds to clicks
2. ✅ Browser requests microphone permission
3. ✅ Recording indicator shows when speaking
4. ✅ Transcript appears after stopping
5. ✅ AI response appears in chat
6. ✅ **Audio response plays automatically**
7. ✅ Can have a full voice conversation

## 🚀 Ready to Test!

Everything is implemented and ready. Just:
1. Start both servers
2. Open browser
3. Click the microphone button
4. Start talking!

---

**Note**: The first time you use voice, the browser will ask for microphone permission. Make sure to allow it!






