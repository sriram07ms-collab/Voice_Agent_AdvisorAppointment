import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

let elevenLabsClient: ElevenLabsClient | null = null;

/**
 * Get or create ElevenLabs client
 */
function getElevenLabsClient(): ElevenLabsClient {
  if (elevenLabsClient) {
    return elevenLabsClient;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
  }

  elevenLabsClient = new ElevenLabsClient({
    apiKey: apiKey,
  });

  return elevenLabsClient;
}

export interface ElevenLabsTTSConfig {
  voiceId?: string;
  modelId?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface ElevenLabsTTSResult {
  audioContent: Buffer;
  audioConfig: {
    encoding: 'MP3';
    sampleRateHertz: number;
  };
}

/**
 * Synthesize text to speech using ElevenLabs
 * Default voice: "Rachel" (en-US) or "Antoni" for more natural Indian English
 * For Indian English, you can use: "Rachel", "Antoni", "Bella", or clone a custom voice
 */
export async function synthesizeSpeechElevenLabs(
  text: string,
  config: ElevenLabsTTSConfig = {}
): Promise<ElevenLabsTTSResult> {
  try {
    const client = getElevenLabsClient();

    // Default voice: Rachel (good for Indian English) or use Antoni
    // You can find voice IDs at: https://elevenlabs.io/app/voice-library
    // Popular voices: Rachel (21m00Tcm4TlvDq8ikWAM), Antoni (ErXwobaYiN019PkySvjV), Bella (EXAVITQu4vr4xnSDxMaL)
    const voiceId = config.voiceId || process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel (default)
    
    // Default model: eleven_multilingual_v2 (supports multiple languages including English)
    const modelId = config.modelId || process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

    // Voice settings for natural speech
    const voiceSettings = config.voiceSettings || {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
    };

    // Convert text to speech
    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text,
      modelId: modelId,
      voiceSettings: voiceSettings,
    });

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    // Combine all chunks into a single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioBuffer = Buffer.concat(chunks, totalLength);

    return {
      audioContent: audioBuffer,
      audioConfig: {
        encoding: 'MP3',
        sampleRateHertz: 22050, // ElevenLabs default sample rate
      },
    };
  } catch (error: any) {
    console.error('❌ ElevenLabs TTS error:', error.message);
    
    // Handle specific ElevenLabs errors
    if (error.status_code === 401) {
      throw new Error('ElevenLabs API key is invalid. Please check ELEVENLABS_API_KEY in .env');
    } else if (error.status_code === 429) {
      throw new Error('ElevenLabs API rate limit exceeded. Free tier: 10,000 credits/month (~10 minutes)');
    } else if (error.status_code === 402) {
      throw new Error('ElevenLabs quota exceeded. Please upgrade your plan or wait for quota reset');
    }
    
    throw new Error(`ElevenLabs TTS failed: ${error.message}`);
  }
}

/**
 * Get available voices from ElevenLabs
 */
export async function listElevenLabsVoices(): Promise<any[]> {
  try {
    const client = getElevenLabsClient();
    const response = await client.voices.getAll();
    return response.voices || [];
  } catch (error: any) {
    console.error('❌ Error listing ElevenLabs voices:', error.message);
    return [];
  }
}
