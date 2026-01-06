import * as https from 'https';

export interface GroqTTSConfig {
  model?: string;
  voice?: string;
  speed?: number;
}

export interface GroqTTSResult {
  audioContent: Buffer;
  audioConfig: {
    encoding: 'WAV' | 'MP3';
    sampleRateHertz: number;
  };
}

/**
 * Synthesize text to speech using Groq TTS
 * 
 * Groq TTS models:
 * - canopylabs/orpheus-v1-english: English and Arabic, expressive voice
 * 
 * Voices available (for orpheus-v1-english):
 * - autumn, diana, hannah (female voices)
 * - austin, daniel, troy (male voices)
 */
export async function synthesizeSpeechGroq(
  text: string,
  config: GroqTTSConfig = {}
): Promise<GroqTTSResult> {
  try {
    // Use GROQ_VOICE_API_KEY if set, otherwise fallback to GROQ_API_KEY
    const apiKey = process.env.GROQ_VOICE_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey === 'your_groq_voice_api_key_here' || apiKey.trim() === '') {
      throw new Error('Groq API key is not set. Please set GROQ_VOICE_API_KEY (or GROQ_API_KEY as fallback) in backend/.env file.');
    }

    // Default model: canopylabs/orpheus-v1-english
    const model = config.model || process.env.GROQ_TTS_MODEL || 'canopylabs/orpheus-v1-english';
    
    // Valid Groq TTS voices
    const validVoices = ['autumn', 'diana', 'hannah', 'austin', 'daniel', 'troy'];
    
    // Default voice: diana (female, good for Indian English)
    let voice = config.voice || process.env.GROQ_TTS_VOICE || 'diana';
    
    // Validate voice
    if (!validVoices.includes(voice.toLowerCase())) {
      console.warn(`⚠️  Invalid Groq TTS voice "${voice}", falling back to "diana". Valid voices: ${validVoices.join(', ')}`);
      voice = 'diana';
    } else {
      voice = voice.toLowerCase(); // Ensure lowercase
    }
    
    // Speed: 1.0 is normal, range typically 0.25 to 4.0
    const speed = config.speed || 1.0;

    console.log(`📤 Sending text to Groq TTS (${text.length} chars, model: ${model}, voice: ${voice})`);
    
    // Double-check voice is valid before sending (defensive programming)
    if (!validVoices.includes(voice)) {
      throw new Error(`Invalid Groq TTS voice: "${voice}". Valid voices are: ${validVoices.join(', ')}. Please check GROQ_TTS_VOICE in your .env file.`);
    }

    // Use direct HTTP API call (Groq uses OpenAI-compatible API)
    const requestBody = JSON.stringify({
      model: model,
      input: text,
      voice: voice, // Groq supports: autumn, diana, hannah (female), austin, daniel, troy (male)
      speed: speed,
      response_format: 'wav', // Groq TTS only supports WAV format (not MP3)
    });

    // Make HTTP request to Groq API
    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/audio/speech',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          res.on('end', () => {
            resolve(Buffer.concat(chunks));
          });
        } else {
          let errorData = '';
          res.on('data', (chunk) => {
            errorData += chunk.toString();
          });
          res.on('end', () => {
            // Parse error response to extract detailed error information
            let errorMessage = `Groq API error: ${res.statusCode}`;
            try {
              const errorJson = JSON.parse(errorData);
              if (errorJson.error) {
                const error = errorJson.error;
                errorMessage = error.message || errorMessage;
                
                // Handle specific error codes
                if (error.code === 'model_terms_required') {
                  errorMessage = `Groq TTS model requires terms acceptance. Please accept the terms at: https://console.groq.com/playground?model=${encodeURIComponent(model)}`;
                }
              }
            } catch (e) {
              // If JSON parsing fails, use the raw error data
              errorMessage = `Groq API error: ${res.statusCode} - ${errorData}`;
            }
            reject(new Error(errorMessage));
          });
        }
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Groq API request timeout (30s)'));
      });

      req.write(requestBody);
      req.end();
    });

    return {
      audioContent: audioBuffer,
      audioConfig: {
        encoding: 'WAV',
        sampleRateHertz: 24000, // Groq TTS default sample rate
      },
    };
  } catch (error: any) {
    console.error('❌ Groq TTS error:', error.message);
    
    // Handle specific Groq errors
    if (error.status === 401 || error.message?.includes('401')) {
      throw new Error('Groq API key is invalid. Please check GROQ_VOICE_API_KEY (or GROQ_API_KEY) in .env');
    } else if (error.status === 429 || error.message?.includes('429')) {
      throw new Error('Groq API rate limit exceeded. Please check your quota.');
    } else if (error.message?.includes('model_terms_required') || error.message?.includes('terms acceptance')) {
      // This error is already formatted with the acceptance link
      throw error;
    } else if (error.status === 400 || error.message?.includes('400')) {
      throw new Error(`Groq TTS request failed: ${error.message}`);
    }
    
    throw new Error(`Groq TTS failed: ${error.message}`);
  }
}

