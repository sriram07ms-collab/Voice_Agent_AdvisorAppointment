# Groq Voice Agent Fallback Implementation

## ✅ Implementation Complete

Groq has been successfully integrated as a fallback option for both Text-to-Speech (TTS) and Speech-to-Text (STT) when ElevenLabs quota is exceeded.

## What Was Changed

### 1. **New Service Files**
- Created `backend/src/services/voice/groqSTT.ts`
  - Implements Groq STT using Whisper models
  - Uses direct HTTP API calls to Groq's OpenAI-compatible endpoint
  - Supports multiple audio formats (webm, mp3, wav, etc.)
  - Handles errors gracefully

- Created `backend/src/services/voice/groqTTS.ts`
  - Implements Groq TTS using canopylabs/orpheus-v1-english model
  - Uses direct HTTP API calls to Groq's OpenAI-compatible endpoint
  - Supports multiple voices (alloy, echo, fable, onyx, nova, shimmer)
  - Returns MP3 audio format

### 2. **Updated STT Service**
- Modified `backend/src/services/voice/speechToText.ts`
  - Removed Google Cloud STT dependency
  - Added automatic fallback to Groq when ElevenLabs quota is exceeded
  - Detects quota errors (402, 429) and switches to Groq automatically
  - Provider options: 'elevenlabs', 'groq', or 'auto'

### 3. **Updated TTS Service**
- Modified `backend/src/services/voice/textToSpeech.ts`
  - Removed Google Cloud TTS dependency
  - Added automatic fallback to Groq when ElevenLabs quota is exceeded
  - Detects quota errors (402, 429) and switches to Groq automatically
  - Provider options: 'elevenlabs', 'groq', or 'auto'

### 4. **Updated Configuration**
- Modified `backend/env.template`
  - Added Groq STT and TTS configuration options
  - Updated provider documentation to reflect Groq as fallback

## How It Works

### Fallback Chain

**Text-to-Speech (TTS):**
1. Try ElevenLabs TTS
2. If quota exceeded (402/429) → Automatically fallback to Groq TTS
3. If Groq fails → Error is thrown

**Speech-to-Text (STT):**
1. Try ElevenLabs STT
2. If quota exceeded (402/429) → Automatically fallback to Groq STT
3. If Groq fails → Error is thrown

### Automatic Detection

The system automatically detects when ElevenLabs quota is exceeded by checking for:
- HTTP status codes: 402 (Payment Required) or 429 (Rate Limit)
- Error messages containing "quota" or "rate limit"

When detected, it automatically switches to Groq without user intervention.

## Configuration

### Environment Variables

Add to your `backend/.env` file:

```env
# Groq API Key (required for LLM services)
GROQ_API_KEY=your_groq_api_key_here

# Groq Voice API Key (optional - for STT/TTS services)
# If set, this key will be used specifically for voice services
# If not set, will fallback to GROQ_API_KEY
# This allows quota isolation between voice and LLM services
GROQ_VOICE_API_KEY=your_groq_voice_api_key_here

# Provider Selection (optional)
TTS_PROVIDER=auto  # Options: 'elevenlabs', 'groq', or 'auto'
STT_PROVIDER=auto  # Options: 'elevenlabs', 'groq', or 'auto'

# Groq STT Configuration (optional)
GROQ_STT_MODEL=whisper-large-v3-turbo  # Options: whisper-large-v3-turbo (fast) or whisper-large-v3 (accurate)

# Groq TTS Configuration (optional)
GROQ_TTS_MODEL=canopylabs/orpheus-v1-english
GROQ_TTS_VOICE=diana  # Options: autumn, diana, hannah (female), austin, daniel, troy (male)
```

### API Key Configuration

**Option 1: Single Key (Simpler)**
- Set only `GROQ_API_KEY`
- Used for both LLM and voice services
- Simpler configuration

**Option 2: Separate Keys (Recommended for Production)**
- Set `GROQ_API_KEY` for LLM services
- Set `GROQ_VOICE_API_KEY` for STT/TTS services
- Allows quota isolation and separate billing tracking
- If `GROQ_VOICE_API_KEY` is not set, automatically falls back to `GROQ_API_KEY`

### Provider Options

- **`auto`** (default): Uses ElevenLabs if API key is set, otherwise uses Groq. Automatically falls back to Groq when quota is exceeded.
- **`elevenlabs`**: Forces ElevenLabs usage, but still falls back to Groq on quota errors.
- **`groq`**: Forces Groq usage directly (skips ElevenLabs).

## Groq Features

### Speech-to-Text (STT)
- **Models:**
  - `whisper-large-v3-turbo`: Fast (216x real-time), $0.04/hour
  - `whisper-large-v3`: Accurate (189x real-time), $0.111/hour
- **Supported Formats:** flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
- **Max File Size:** 25 MB (free tier), 100 MB (dev tier)
- **Languages:** Multilingual support (English, Hindi, etc.)

### Text-to-Speech (TTS)
- **Model:** `canopylabs/orpheus-v1-english`
- **Voices:** 
  - Female: autumn, diana, hannah
  - Male: austin, daniel, troy
- **Format:** WAV
- **Languages:** English, Arabic
- **Speed:** Adjustable (0.25 to 4.0)
- **Default Voice:** diana (female, good for Indian English)
- **⚠️ Important:** This model requires terms acceptance before use. Accept terms at: https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english

## Benefits

1. **Seamless Fallback:** Automatic switching when quota is exceeded
2. **No User Impact:** Users don't notice the switch
3. **Cost-Effective:** Groq pricing is competitive
4. **Fast Performance:** Groq's LPU architecture provides ultra-fast inference
5. **No Google Dependency:** Removed Google Cloud STT/TTS requirements

## Testing

### Test Normal Operation
1. Ensure `ELEVENLABS_API_KEY` is set
2. Make a voice request
3. Should use ElevenLabs

### Test Fallback
1. Simulate quota error or set invalid ElevenLabs key
2. Make a voice request
3. Should automatically fallback to Groq
4. Check logs for: `⚠️ ElevenLabs quota exceeded, falling back to Groq STT/TTS`

### Test Direct Groq
1. Set `STT_PROVIDER=groq` and `TTS_PROVIDER=groq`
2. Make a voice request
3. Should use Groq directly

## Notes

- **Streaming STT:** Not available with Groq. The `createStreamingRecognize` function now throws an error. Use chunked `transcribeAudio` calls instead.
- **Audio Format:** Groq TTS returns WAV format, which is compatible with the existing frontend implementation (browsers support WAV natively).
- **Error Handling:** Both services handle errors gracefully and provide clear error messages.
- **Model Terms Acceptance:** The `canopylabs/orpheus-v1-english` TTS model requires terms acceptance. If you get a `model_terms_required` error:
  1. Visit: https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english
  2. Accept the terms of service
  3. Retry your request

## Next Steps

1. ✅ Add your Groq API key to `.env`
2. ✅ Restart your backend server
3. ✅ Test voice features
4. ✅ Monitor logs for fallback usage

---

**Happy coding! 🎉**

