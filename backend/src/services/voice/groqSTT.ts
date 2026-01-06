import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';

export interface GroqSTTConfig {
  model?: string;
  language?: string;
  prompt?: string;
  responseFormat?: 'json' | 'text' | 'verbose_json';
  temperature?: number;
}

export interface GroqSTTResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Transcribe audio using Groq Speech-to-Text (Whisper models)
 * 
 * Groq STT supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
 * Max file size: 25 MB (free tier), 100 MB (dev tier)
 * 
 * Models available:
 * - whisper-large-v3-turbo: Fast, 216x real-time, $0.04/hour
 * - whisper-large-v3: High accuracy, 189x real-time, $0.111/hour
 */
export async function transcribeAudioGroq(
  audioBuffer: Buffer,
  config: GroqSTTConfig = {}
): Promise<GroqSTTResult> {
  let tempFilePath: string | null = null;

  try {
    // Use GROQ_VOICE_API_KEY if set, otherwise fallback to GROQ_API_KEY
    const apiKey = process.env.GROQ_VOICE_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey === 'your_groq_voice_api_key_here' || apiKey.trim() === '') {
      throw new Error('Groq API key is not set. Please set GROQ_VOICE_API_KEY (or GROQ_API_KEY as fallback) in backend/.env file.');
    }

    // Default model: whisper-large-v3-turbo (fast and cost-effective)
    const model = config.model || process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo';

    // Create a temporary file for the audio buffer
    const fileExtension = 'webm'; // Default extension
    tempFilePath = path.join(os.tmpdir(), `groq-stt-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    // Map language code to Groq format (e.g., 'en-IN' -> 'en')
    const language = config.language 
      ? config.language.split('-')[0] // Extract base language (en from en-IN)
      : undefined;

    console.log(`📤 Sending audio to Groq STT (${audioBuffer.length} bytes, model: ${model})`);

    // Use direct HTTP API call with form-data (Groq uses OpenAI-compatible API)
    const FormDataModule = await import('form-data');
    const FormData = FormDataModule.default || FormDataModule;
    const formData = new FormData();
    
    formData.append('file', fs.createReadStream(tempFilePath), {
      filename: `audio.${fileExtension}`,
      contentType: `audio/${fileExtension}`,
    });
    formData.append('model', model);
    
    if (language) {
      formData.append('language', language);
    }
    if (config.prompt) {
      formData.append('prompt', config.prompt);
    }
    if (config.responseFormat) {
      formData.append('response_format', config.responseFormat);
    }
    if (config.temperature !== undefined) {
      formData.append('temperature', config.temperature.toString());
    }

    // Make HTTP request to Groq API
    const response = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
            reject(new Error(`Groq API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Groq API request timeout (30s)'));
      });

      formData.pipe(req);
    });

    // Parse the response
    let transcript = '';
    let confidence = 1.0;

    if (typeof response === 'string') {
      transcript = response;
    } else if (response && typeof response === 'object') {
      transcript = response.text || response.transcript || JSON.stringify(response);
      confidence = response.confidence || 1.0;
    }

    return {
      transcript: transcript.trim(),
      confidence: confidence,
      isFinal: true,
    };
  } catch (error: any) {
    console.error('❌ Groq STT error:', error.message);
    
    // Handle specific Groq errors
    if (error.status === 401 || error.message?.includes('401')) {
      throw new Error('Groq API key is invalid. Please check GROQ_VOICE_API_KEY (or GROQ_API_KEY) in .env');
    } else if (error.status === 429 || error.message?.includes('429')) {
      throw new Error('Groq API rate limit exceeded. Please check your quota.');
    } else if (error.status === 400 || error.message?.includes('400')) {
      throw new Error(`Groq STT request failed: ${error.message}`);
    }
    
    throw new Error(`Groq STT failed: ${error.message}`);
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

