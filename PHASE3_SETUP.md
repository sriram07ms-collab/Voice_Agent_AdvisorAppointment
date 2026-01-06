# Phase 3: Voice Integration Setup Guide

## Overview

Phase 3 adds voice capabilities to the advisor appointment scheduler:
- **Speech-to-Text (STT)**: Convert user's voice input to text
- **Text-to-Speech (TTS)**: Convert AI responses to voice
- **WebSocket Streaming**: Real-time audio streaming for natural conversation
- **Web Audio API**: Browser-based microphone recording and audio playback

## Prerequisites

1. Phase 1 and Phase 2 completed
2. Google Cloud Project with service account
3. Node.js 20+ installed
4. Modern browser with Web Audio API support (Chrome, Firefox, Edge)

## Step 1: Enable Google Cloud APIs

### 1.1 Enable Speech-to-Text API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Library**
3. Search for **"Cloud Speech-to-Text API"**
4. Click **"Enable"**

### 1.2 Enable Text-to-Speech API

1. In the same Library page
2. Search for **"Cloud Text-to-Speech API"**
3. Click **"Enable"**

### 1.3 Verify Service Account Permissions

Your service account (from Phase 2) should have access to these APIs. If not:
1. Go to **IAM & Admin** → **Service Accounts**
2. Click on your service account
3. Ensure it has **"Cloud Speech Client"** and **"Cloud Text-to-Speech API User"** roles

## Step 2: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
cd backend
npm install @google-cloud/speech @google-cloud/text-to-speech @elevenlabs/elevenlabs-js ws
npm install --save-dev @types/ws
```

## Step 3: Configuration

### 3.1 Text-to-Speech Provider Options

You can choose between two TTS providers:

1. **ElevenLabs** (Recommended for personal/portfolio projects)
   - ✅ Free tier: 10,000 credits/month (~10 minutes of audio)
   - ✅ Superior voice quality and naturalness
   - ✅ Perfect for demo/portfolio projects
   - ⚠️ Requires attribution for free tier
   - ⚠️ Free tier is for non-commercial use only

2. **Google Cloud TTS** (Default/Production)
   - ✅ Enterprise-grade reliability
   - ✅ Commercial license included
   - ✅ Pay-as-you-go pricing
   - ✅ Already configured if you have Google Cloud setup

### 3.1.1 Speech-to-Text Provider Options

You can also choose between two STT providers:

1. **ElevenLabs** (Optional - for personal/portfolio projects)
   - ✅ Free tier: 10,000 credits/month (~2.5 hours of transcription)
   - ✅ Good transcription quality
   - ⚠️ Note: Real-time streaming STT still uses Google Cloud STT
   - ⚠️ Free tier is for non-commercial use only

2. **Google Cloud STT** (Default/Production)
   - ✅ Enterprise-grade reliability
   - ✅ Supports real-time streaming transcription
   - ✅ Commercial license included
   - ✅ Pay-as-you-go pricing
   - ✅ Already configured if you have Google Cloud setup

### 3.2 Configure ElevenLabs (Optional - Recommended)

1. **Sign up for ElevenLabs**:
   - Go to [https://elevenlabs.io/](https://elevenlabs.io/)
   - Create a free account
   - Navigate to your profile → API Keys
   - Generate a new API key

2. **Add to `.env` file**:
   ```env
   # Text-to-Speech Provider (options: 'elevenlabs', 'google', or 'auto')
   TTS_PROVIDER=auto
   
   # Speech-to-Text Provider (options: 'elevenlabs', 'google', or 'auto')
   STT_PROVIDER=auto
   
   # ElevenLabs Configuration (shared for both TTS and STT)
   ELEVENLABS_API_KEY=your_api_key_here
   
   # Optional: Custom voice ID (defaults to Rachel, for TTS only)
   # Find voices at: https://elevenlabs.io/app/voice-library
   ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
   
   # Optional: STT Model ID (defaults to scribe_v1)
   ELEVENLABS_STT_MODEL_ID=scribe_v1
   ```

3. **Provider Selection**:
   - **TTS Provider**:
     - `TTS_PROVIDER=auto` (default): Uses ElevenLabs if API key is set, otherwise Google
     - `TTS_PROVIDER=elevenlabs`: Force ElevenLabs (will fallback to Google on error)
     - `TTS_PROVIDER=google`: Force Google Cloud TTS
   - **STT Provider**:
     - `STT_PROVIDER=auto` (default): Uses ElevenLabs if API key is set, otherwise Google
     - `STT_PROVIDER=elevenlabs`: Force ElevenLabs (will fallback to Google on error)
     - `STT_PROVIDER=google`: Force Google Cloud STT
     - Note: Real-time streaming STT (WebSocket) always uses Google Cloud STT

### 3.3 Google Cloud Configuration (Default/Fallback)

The voice integration uses the same service account as Phase 2. No additional environment variables are required if you've already configured:

```env
GOOGLE_SERVICE_ACCOUNT_PATH=./config/google-service-account.json
```

### 3.4 Verify Configuration

Ensure your `backend/.env` has:
- For ElevenLabs: `ELEVENLABS_API_KEY` set (optional but recommended)
- For Google TTS: `GOOGLE_SERVICE_ACCOUNT_PATH` set correctly
- Service account JSON file exists at the specified path (if using Google)

## Step 4: Test the Integration

### 4.1 Start the Servers

```bash
# From project root
npm run dev
```

Or separately:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4.2 Test Voice Features

1. Open `http://localhost:3000` in your browser
2. You should see a **green microphone button** next to the chat input
3. Click the microphone button
4. Grant microphone permissions when prompted
5. Speak your message (e.g., "I want to book an advisor call")
6. Click the button again to stop recording
7. The system will:
   - Transcribe your speech to text
   - Process it through the conversation engine
   - Generate a text response
   - Convert the response to speech
   - Play the audio response

## How It Works

### Voice Flow

1. **User clicks microphone** → Browser requests microphone access
2. **User speaks** → Audio is recorded using Web Audio API
3. **Audio chunks sent** → WebSocket streams audio to backend every 500ms
4. **Backend STT** → ElevenLabs or Google Speech-to-Text transcribes audio (based on STT_PROVIDER)
5. **Interim transcripts** → Shown in real-time as user speaks
6. **User stops recording** → Final transcript sent to conversation engine
7. **AI processes** → Groq AI generates response
8. **Backend TTS** → ElevenLabs or Google Text-to-Speech converts response to audio (based on TTS_PROVIDER)
9. **Audio playback** → Browser plays the audio response

### Technical Details

- **Audio Format**: 
  - Input: WebM with Opus codec (48kHz, mono)
  - Output: OGG_OPUS (Google) or MP3 (ElevenLabs)
- **STT Language**: 
  - ElevenLabs: English (en) or custom language
  - Google Cloud: Indian English (en-IN) with Hindi support
- **TTS Voice**: 
  - ElevenLabs: Rachel (default) or custom voice
  - Google: Female Indian English voice (en-IN-Wavenet-D)
- **WebSocket**: Real-time bidirectional communication
- **Buffer Management**: Automatic chunking and buffering
- **Provider**: Auto-selects based on configuration (ElevenLabs preferred if configured)

## Troubleshooting

### Error: "Microphone permission denied"

**Solution**:
- Check browser permissions for microphone access
- Click the lock icon in the address bar → Site settings → Microphone → Allow
- Refresh the page

### Error: "Failed to connect to voice service"

**Solution**:
- Ensure backend is running on port 3001
- Check WebSocket URL: `ws://localhost:3001/api/voice/ws`
- Check browser console for connection errors
- Verify CORS is enabled in backend

### Error: "Speech-to-Text failed" or "ElevenLabs STT failed"

**Solution for ElevenLabs**:
- Verify `ELEVENLABS_API_KEY` is set correctly in `.env`
- Check API key is valid at [ElevenLabs dashboard](https://elevenlabs.io/app/settings/api-keys)
- If you see "quota exceeded": Free tier includes ~2.5 hours/month (resets monthly)
- If you see "rate limit exceeded": Wait a moment and try again
- System will automatically fallback to Google STT if ElevenLabs fails
- Note: Real-time streaming STT always uses Google Cloud STT

**Solution for Google STT**:
- Verify Speech-to-Text API is enabled in Google Cloud Console
- Check service account has proper permissions
- Verify `GOOGLE_SERVICE_ACCOUNT_PATH` is correct
- Check backend logs for detailed error messages

### Error: "Text-to-Speech failed" or "ElevenLabs TTS failed"

**Solution for ElevenLabs**:
- Verify `ELEVENLABS_API_KEY` is set correctly in `.env`
- Check API key is valid at [ElevenLabs dashboard](https://elevenlabs.io/app/settings/api-keys)
- If you see "quota exceeded": Free tier includes ~10 minutes/month (resets monthly)
- If you see "rate limit exceeded": Wait a moment and try again
- System will automatically fallback to Google TTS if ElevenLabs fails

**Solution for Google TTS**:
- Verify Text-to-Speech API is enabled in Google Cloud Console
- Check service account has proper permissions
- Verify `GOOGLE_SERVICE_ACCOUNT_PATH` is correct
- Check backend logs for detailed error messages

### No audio playback

**Solution**:
- Check browser audio settings
- Ensure system volume is not muted
- Check browser console for audio playback errors
- Try a different browser

### WebSocket connection issues

**Solution**:
- Ensure backend server is running
- Check firewall settings
- Verify WebSocket path: `/api/voice/ws`
- Check backend logs for WebSocket errors

## Browser Compatibility

### Supported Browsers

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+ (with limitations)
- ❌ Internet Explorer (not supported)

### Required Features

- Web Audio API
- MediaRecorder API
- WebSocket API
- getUserMedia API

## Performance Tips

1. **Network**: Use stable internet connection for best results
2. **Microphone**: Use a good quality microphone for better STT accuracy
3. **Environment**: Reduce background noise for better transcription
4. **Browser**: Close unnecessary tabs to free up resources

## Next Steps

- ✅ Voice recording and playback working
- ✅ Real-time transcription
- ✅ Voice responses
- 🔄 Future: Add voice activity detection (VAD)
- 🔄 Future: Add wake word detection
- 🔄 Future: Add multiple language support

## API Endpoints

### REST Endpoints

- `POST /api/voice/transcribe` - Transcribe audio buffer
- `POST /api/voice/synthesize` - Synthesize text to speech

### WebSocket Endpoint

- `ws://localhost:3001/api/voice/ws` - Real-time voice streaming

## Security Notes

- Microphone access requires user permission
- Audio is only sent to your backend server
- No audio is stored permanently
- All communication is over WebSocket (can be upgraded to WSS in production)


