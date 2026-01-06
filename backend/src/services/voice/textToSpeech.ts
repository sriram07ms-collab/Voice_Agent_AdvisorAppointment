import { synthesizeSpeechElevenLabs, ElevenLabsTTSResult } from './elevenLabsTTS';
import { synthesizeSpeechGroq } from './groqTTS';

/**
 * Get TTS provider from environment variable
 * Options: 'elevenlabs', 'groq', or 'auto' (default: 'auto')
 * 'auto' will use ElevenLabs if API key is set, otherwise fallback to Groq
 */
function getTTSProvider(): 'elevenlabs' | 'groq' {
  const provider = process.env.TTS_PROVIDER?.toLowerCase() || 'auto';
  
  if (provider === 'elevenlabs') {
    return 'elevenlabs';
  } else if (provider === 'groq') {
    return 'groq';
  } else {
    // Auto: prefer ElevenLabs if API key is available, otherwise Groq
    return process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'groq';
  }
}

export interface TextToSpeechConfig {
  languageCode?: string;
  ssmlGender?: 'NEUTRAL' | 'FEMALE' | 'MALE';
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

export interface TextToSpeechResult {
  audioContent: Buffer;
  audioConfig: {
    encoding: 'MP3' | 'OGG_OPUS' | 'LINEAR16';
    sampleRateHertz: number;
  };
}

/**
 * Synthesize text to speech audio
 * Uses ElevenLabs if configured, falls back to Groq when quota is exceeded
 */
export async function synthesizeSpeech(
  text: string,
  config: TextToSpeechConfig = {}
): Promise<TextToSpeechResult> {
  const provider = getTTSProvider();

  if (provider === 'elevenlabs') {
    try {
      // Try ElevenLabs first
      const result = await synthesizeSpeechElevenLabs(text);
      // Convert ElevenLabs result format to match TextToSpeechResult
      return {
        audioContent: result.audioContent,
        audioConfig: {
          encoding: 'MP3', // ElevenLabs returns MP3
          sampleRateHertz: result.audioConfig.sampleRateHertz,
        },
      };
    } catch (error: any) {
      // Check if it's an error that should trigger fallback to Groq
      // - Invalid API key (401)
      // - Quota exceeded (402)
      // - Rate limit (429)
      // - Any other ElevenLabs error
      const shouldFallback = 
        error.message?.includes('invalid') ||
        error.status_code === 401 ||
        error.message?.includes('401') ||
        error.message?.includes('quota') || 
        error.message?.includes('rate limit') ||
        error.status_code === 402 || 
        error.status_code === 429 ||
        error.message?.includes('ElevenLabs');
      
      if (shouldFallback) {
        console.log('⚠️ ElevenLabs TTS failed, falling back to Groq TTS:', error.message);
        // Fallback to Groq TTS
        try {
          const groqResult = await synthesizeSpeechGroq(text, {
            speed: config.speakingRate || 1.0,
          });
          return {
            audioContent: groqResult.audioContent,
            audioConfig: {
              encoding: groqResult.audioConfig.encoding,
              sampleRateHertz: groqResult.audioConfig.sampleRateHertz,
            },
          };
        } catch (groqError: any) {
          // If Groq also fails, throw a combined error
          throw new Error(`Both ElevenLabs and Groq TTS failed. ElevenLabs: ${error.message}. Groq: ${groqError.message}`);
        }
      }
      // Re-throw if it's not an ElevenLabs error
      throw error;
    }
  } else {
    // Use Groq TTS directly
    const groqResult = await synthesizeSpeechGroq(text, {
      speed: config.speakingRate || 1.0,
    });
    return {
      audioContent: groqResult.audioContent,
      audioConfig: {
        encoding: groqResult.audioConfig.encoding,
        sampleRateHertz: groqResult.audioConfig.sampleRateHertz,
      },
    };
  }
}

/**
 * Get available voices for Groq TTS
 * Groq TTS voices: autumn, diana, hannah (female), austin, daniel, troy (male)
 */
export async function listVoices(languageCode: string = 'en-IN'): Promise<any[]> {
  // Groq TTS voices (for canopylabs/orpheus-v1-english model)
  return [
    { name: 'autumn', ssmlGender: 'FEMALE', languageCodes: ['en'] },
    { name: 'diana', ssmlGender: 'FEMALE', languageCodes: ['en'] },
    { name: 'hannah', ssmlGender: 'FEMALE', languageCodes: ['en'] },
    { name: 'austin', ssmlGender: 'MALE', languageCodes: ['en'] },
    { name: 'daniel', ssmlGender: 'MALE', languageCodes: ['en'] },
    { name: 'troy', ssmlGender: 'MALE', languageCodes: ['en'] },
  ];
}


