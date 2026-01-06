import express from 'express';
import { transcribeAudio } from '../services/voice/speechToText';
import { synthesizeSpeech } from '../services/voice/textToSpeech';

const router = express.Router();

/**
 * POST /api/voice/transcribe
 * Transcribe audio buffer to text
 */
router.post('/transcribe', express.raw({ type: 'application/octet-stream', limit: '10mb' }), async (req, res) => {
  try {
    const audioBuffer = Buffer.from(req.body);
    
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ error: 'No audio data provided' });
    }

    const { languageCode, sampleRateHertz, encoding } = req.query;

    const result = await transcribeAudio(audioBuffer, {
      languageCode: languageCode as string || 'en-IN',
      sampleRateHertz: sampleRateHertz ? parseInt(sampleRateHertz as string) : undefined,
      encoding: encoding as any || 'WEBM_OPUS',
    });

    res.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      isFinal: result.isFinal,
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to transcribe audio',
    });
  }
});

/**
 * POST /api/voice/synthesize
 * Synthesize text to speech
 */
router.post('/synthesize', async (req, res) => {
  try {
    const { text, languageCode, ssmlGender, voiceName, speakingRate } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await synthesizeSpeech(text, {
      languageCode: languageCode || 'en-IN',
      ssmlGender: ssmlGender || 'FEMALE',
      voiceName: voiceName,
      speakingRate: speakingRate || 1.0,
    });

    // Set appropriate headers for audio response
    // Determine content type based on encoding (ElevenLabs uses MP3, Groq uses WAV, Google uses OGG_OPUS)
    let contentType: string;
    if (result.audioConfig.encoding === 'MP3') {
      contentType = 'audio/mpeg';
    } else if (result.audioConfig.encoding === 'WAV') {
      contentType = 'audio/wav';
    } else {
      contentType = 'audio/ogg; codecs=opus';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', result.audioContent.length.toString());
    res.setHeader('Cache-Control', 'no-cache');

    res.send(result.audioContent);
  } catch (error: any) {
    console.error('Synthesis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to synthesize speech',
    });
  }
});

export default router;


