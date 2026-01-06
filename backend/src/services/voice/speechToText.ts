import { transcribeAudioElevenLabs, ElevenLabsSTTResult } from './elevenLabsSTT';
import { transcribeAudioGroq } from './groqSTT';

/**
 * Get STT provider from environment variable
 * Options: 'elevenlabs', 'groq', or 'auto' (default: 'auto')
 * 'auto' will use ElevenLabs if API key is set, otherwise fallback to Groq
 */
function getSTTProvider(): 'elevenlabs' | 'groq' {
  const provider = process.env.STT_PROVIDER?.toLowerCase() || 'auto';
  
  if (provider === 'elevenlabs') {
    return 'elevenlabs';
  } else if (provider === 'groq') {
    return 'groq';
  } else {
    // Auto: prefer ElevenLabs if API key is available, otherwise Groq
    return process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'groq';
  }
}

export interface SpeechToTextConfig {
  languageCode?: string;
  sampleRateHertz?: number;
  encoding?: 'LINEAR16' | 'MULAW' | 'ALAW' | 'FLAC' | 'OGG_OPUS' | 'WEBM_OPUS';
  audioChannelCount?: number;
  enableAutomaticPunctuation?: boolean;
}

export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Transcribe audio buffer to text
 * Uses ElevenLabs if configured, falls back to Groq when quota is exceeded
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  config: SpeechToTextConfig = {}
): Promise<SpeechToTextResult> {
  const provider = getSTTProvider();

  if (provider === 'elevenlabs') {
    try {
      // Try ElevenLabs first
      const result = await transcribeAudioElevenLabs(audioBuffer, {
        languageCode: config.languageCode || 'en',
        modelId: process.env.ELEVENLABS_STT_MODEL_ID,
      });
      return {
        transcript: result.transcript,
        confidence: result.confidence,
        isFinal: result.isFinal,
      };
    } catch (error: any) {
      // Check if it's an error that should trigger fallback to Groq
      // - Invalid API key (401)
      // - Quota exceeded (402)
      // - Rate limit (429)
      // - Any other ElevenLabs error
      const shouldFallback = 
        error.message?.includes('invalid') ||
        error.message?.includes('401') ||
        error.message?.includes('quota') || 
        error.message?.includes('rate limit') ||
        error.message?.includes('402') ||
        error.message?.includes('429') ||
        error.message?.includes('ElevenLabs');
      
      if (shouldFallback) {
        console.log('⚠️ ElevenLabs STT failed, falling back to Groq STT:', error.message);
        // Fallback to Groq STT
        try {
          return await transcribeAudioGroq(audioBuffer, {
            language: config.languageCode || 'en',
          });
        } catch (groqError: any) {
          // If Groq also fails, throw a combined error
          throw new Error(`Both ElevenLabs and Groq STT failed. ElevenLabs: ${error.message}. Groq: ${groqError.message}`);
        }
      }
      // Re-throw if it's not an ElevenLabs error
      throw error;
    }
  } else {
    // Use Groq STT directly
    return await transcribeAudioGroq(audioBuffer, {
      language: config.languageCode || 'en',
    });
  }
}

/**
 * Note: Streaming STT is not available with Groq API
 * For real-time transcription, you would need to use chunked requests
 * or implement a different approach
 */
export function createStreamingRecognize(
  config: SpeechToTextConfig = {}
): any {
  console.warn('⚠️ Streaming STT not available with Groq. Use chunked transcribeAudio calls instead.');
  throw new Error('Streaming STT not supported. Use transcribeAudio with audio chunks.');
}

