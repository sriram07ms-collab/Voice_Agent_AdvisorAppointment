import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

// Share the same client instance with TTS service
// Import the getter function from TTS service to reuse the client
let elevenLabsClient: ElevenLabsClient | null = null;

/**
 * Get or create ElevenLabs client (shared with TTS)
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

export interface ElevenLabsSTTConfig {
  modelId?: string;
  languageCode?: string;
}

export interface ElevenLabsSTTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Transcribe audio using ElevenLabs Speech-to-Text (Scribe)
 * 
 * Note: ElevenLabs STT accepts various audio formats including MP3, WAV, M4A, WebM, etc.
 * The free tier includes ~2.5 hours of STT transcription per month (10,000 credits)
 * 
 * This implementation uses a temporary file approach since the SDK expects file uploads
 */
export async function transcribeAudioElevenLabs(
  audioBuffer: Buffer,
  config: ElevenLabsSTTConfig = {}
): Promise<ElevenLabsSTTResult> {
  let tempFilePath: string | null = null;

  try {
    const client = getElevenLabsClient();

    // Default model: scribe_v1 (ElevenLabs STT model)
    const modelId = config.modelId || process.env.ELEVENLABS_STT_MODEL_ID || 'scribe_v1';

    // Create a temporary file for the audio buffer
    // ElevenLabs SDK expects a file path or File object
    tempFilePath = path.join(os.tmpdir(), `stt-${Date.now()}-${Math.random().toString(36).substring(7)}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Use direct HTTP API call with form-data using Node.js https module
    // ElevenLabs STT API endpoint: POST https://api.elevenlabs.io/v1/speech-to-text
    const FormDataModule = await import('form-data');
    const FormData = FormDataModule.default || FormDataModule;
    const formData = new FormData();
    
    // ElevenLabs API expects 'file' field name (as per API error message)
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model_id', modelId);
    // ElevenLabs uses different language codes (e.g., 'eng' instead of 'en-IN')
    // Map common language codes to ElevenLabs format, or omit for auto-detection
    if (config.languageCode) {
      // Map common language codes to ElevenLabs format
      const languageMap: { [key: string]: string } = {
        'en': 'eng',
        'en-us': 'eng',
        'en-in': 'eng',
        'en-gb': 'eng',
        'hi': 'hin',
        'hi-in': 'hin',
        'es': 'spa',
        'fr': 'fra',
        'de': 'deu',
        'it': 'ita',
        'pt': 'por',
        'ja': 'jpn',
        'ko': 'kor',
        'zh': 'zho',
      };
      const mappedLanguage = languageMap[config.languageCode.toLowerCase()];
      // Only append if we have a valid mapping, otherwise let ElevenLabs auto-detect
      if (mappedLanguage) {
        formData.append('language_code', mappedLanguage);
      }
      // If no mapping found, don't append language_code (ElevenLabs will auto-detect)
    }

    const apiKey = process.env.ELEVENLABS_API_KEY!;
    
    console.log(`📤 Sending audio to ElevenLabs STT (${audioBuffer.length} bytes, model: ${modelId})`);
    
    // Use Node.js https module for proper form-data handling
    const response = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: '/v1/speech-to-text',
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          ...formData.getHeaders(),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              // If response is not JSON, treat as plain text
              resolve({ text: data });
            }
          } else {
            reject(new Error(`ElevenLabs API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      // Set timeout on the request object (not in options)
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('ElevenLabs API request timeout (30s)'));
      });

      // Pipe form-data to request - this will automatically end the request
      formData.pipe(req);
    });

    // Parse the response
    let transcript = '';
    let confidence = 1.0;

    if (typeof response === 'string') {
      transcript = response;
    } else if (response && typeof response === 'object') {
      // Handle different response formats
      transcript = response.text || response.transcript || response.text || JSON.stringify(response);
      confidence = response.confidence || 1.0;
    }

    return {
      transcript: transcript.trim(),
      confidence: confidence,
      isFinal: true,
    };
  } catch (error: any) {
    console.error('❌ ElevenLabs STT error:', error.message);
    
    // Handle specific ElevenLabs errors
    if (error.status_code === 401 || error.message?.includes('401')) {
      throw new Error('ElevenLabs API key is invalid. Please check ELEVENLABS_API_KEY in .env');
    } else if (error.status_code === 429 || error.message?.includes('429')) {
      throw new Error('ElevenLabs API rate limit exceeded. Free tier: ~2.5 hours/month');
    } else if (error.status_code === 402 || error.message?.includes('402')) {
      throw new Error('ElevenLabs quota exceeded. Please upgrade your plan or wait for quota reset');
    }
    
    throw new Error(`ElevenLabs STT failed: ${error.message}`);
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn('Failed to clean up temp file:', cleanupError);
      }
    }
  }
}

