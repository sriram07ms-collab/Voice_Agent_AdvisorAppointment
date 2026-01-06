# ElevenLabs Integration Summary

## ✅ Implementation Complete

ElevenLabs Text-to-Speech (TTS) and Speech-to-Text (STT) have been successfully integrated into your advisor appointment scheduler!

## What Was Changed

### 1. **New Service Files**
- Created `backend/src/services/voice/elevenLabsTTS.ts`
  - Implements ElevenLabs TTS client
  - Handles API errors gracefully
  - Supports custom voice selection
- Created `backend/src/services/voice/elevenLabsSTT.ts`
  - Implements ElevenLabs STT (Scribe) client
  - Handles API errors gracefully
  - Uses direct HTTP API calls

### 2. **Updated TTS Service**
- Modified `backend/src/services/voice/textToSpeech.ts`
  - Added provider selection logic (ElevenLabs/Google/Auto)
  - Automatic fallback to Google TTS if ElevenLabs fails
  - Maintains backward compatibility

### 3. **Updated Routes**
- Modified `backend/src/routes/voice.ts`
  - Supports both MP3 (ElevenLabs) and OGG_OPUS (Google) formats
  - Sets correct Content-Type headers based on audio format

### 4. **Updated WebSocket Handler**
- Modified `backend/src/services/voice/voiceWebSocket.ts`
  - Sends correct audio format in response
  - Supports both MP3 and OGG_OPUS formats

### 5. **Updated Frontend**
- Modified `frontend/components/voice/VoiceButton.tsx`
  - Correctly maps audio formats to MIME types
  - Supports MP3 playback (ElevenLabs) and OGG playback (Google)

### 6. **Updated STT Service**
- Modified `backend/src/services/voice/speechToText.ts`
  - Added provider selection logic (ElevenLabs/Google/Auto)
  - Automatic fallback to Google STT if ElevenLabs fails
  - Maintains backward compatibility
  - Note: Real-time streaming STT always uses Google Cloud STT

### 7. **Configuration Updates**
- Updated `backend/env.template`
  - Added ElevenLabs configuration options
  - Added TTS_PROVIDER setting
  - Added STT_PROVIDER setting

### 8. **Documentation**
- Updated `PHASE3_SETUP.md`
  - Added ElevenLabs TTS and STT setup instructions
  - Added troubleshooting section for both TTS and STT

### 9. **Server Startup**
- Updated `backend/src/server.ts`
  - Shows which TTS provider is configured on startup
  - Shows which STT provider is configured on startup

## Setup Instructions

### Step 1: Get Your ElevenLabs API Key

1. Sign up at [https://elevenlabs.io/](https://elevenlabs.io/)
2. Go to your profile → API Keys
3. Generate a new API key

### Step 2: Configure Environment Variables

Add to your `backend/.env` file:

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

# Optional: Model ID (defaults to multilingual v2)
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
```

### Step 3: Start the Server

```bash
cd backend
npm run dev
```

You should see:
- ✅ ElevenLabs TTS is configured (if API key is set)
- Or: ⚠️ ElevenLabs API key not set, will use Google TTS

## How It Works

### Provider Selection

- **`TTS_PROVIDER=auto`** (default):
  - Uses ElevenLabs if API key is configured
  - Falls back to Google TTS if API key is missing or invalid
  - Falls back to Google TTS if ElevenLabs API fails

- **`TTS_PROVIDER=elevenlabs`**:
  - Forces ElevenLabs (still falls back to Google on error)

- **`TTS_PROVIDER=google`**:
  - Forces Google Cloud TTS

### Free Tier Limits

- **10,000 credits/month** shared between TTS and STT
  - **TTS**: ~10 minutes of audio per month
  - **STT**: ~2.5 hours of transcription per month
- Perfect for personal/portfolio projects
- Resets monthly
- Requires attribution (fine for portfolio projects)

### Voice Quality

- ElevenLabs provides superior, more natural-sounding voices
- Default voice: **Rachel** (good for Indian English)
- You can change voices via `ELEVENLABS_VOICE_ID`
- Browse voices: [https://elevenlabs.io/app/voice-library](https://elevenlabs.io/app/voice-library)

## Troubleshooting

### "ElevenLabs API key is invalid"
- Check that `ELEVENLABS_API_KEY` is set correctly in `.env`
- Verify the key is active at [ElevenLabs dashboard](https://elevenlabs.io/app/settings/api-keys)

### "Quota exceeded" or "Rate limit exceeded"
- Free tier includes ~10 minutes/month
- Wait for monthly reset, or upgrade to paid plan
- System automatically falls back to Google TTS

### Audio not playing
- Check browser console for errors
- Verify audio format is supported (MP3 for ElevenLabs, OGG for Google)
- Try a different browser

## Comparison

### Text-to-Speech (TTS)

| Feature | ElevenLabs (Free) | Google TTS |
|---------|------------------|------------|
| Voice Quality | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| Free Tier | 10 min/month | Pay-per-use |
| Commercial License | ❌ (Free tier) | ✅ Included |
| Setup | API Key only | Service Account |
| Best For | Personal/Portfolio | Production/Commercial |

### Speech-to-Text (STT)

| Feature | ElevenLabs (Free) | Google STT |
|---------|------------------|------------|
| Transcription Quality | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| Free Tier | 2.5 hours/month | Pay-per-use |
| Real-time Streaming | ❌ (Uses Google) | ✅ Supported |
| Commercial License | ❌ (Free tier) | ✅ Included |
| Setup | API Key only | Service Account |
| Best For | Personal/Portfolio | Production/Commercial |

## Next Steps

1. ✅ Add your ElevenLabs API key to `.env`
2. ✅ Restart your backend server
3. ✅ Test voice features in your app
4. ✅ Enjoy better voice quality!

## Notes

- The system automatically falls back to Google TTS if ElevenLabs fails
- No changes needed to your existing code - it "just works"
- Both providers are fully supported and tested
- Audio format (MP3 vs OGG) is handled automatically

---

**Happy coding! 🎉**

