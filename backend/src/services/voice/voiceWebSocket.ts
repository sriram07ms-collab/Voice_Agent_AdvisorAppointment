import { WebSocketServer, WebSocket } from 'ws';
import { transcribeAudio } from './speechToText';
import { synthesizeSpeech } from './textToSpeech';
import { processConversation } from '../conversation/orchestrator';
import { AudioBufferManager } from './audioUtils';
import { logger } from '../../utils/logger';

interface VoiceSession {
  sessionId: string;
  audioBuffer: AudioBufferManager;
  isRecording: boolean;
  processing: boolean; // Flag to indicate async processing is in progress
}

const activeSessions = new Map<string, VoiceSession>();

/**
 * Setup WebSocket server for voice streaming
 */
export function setupVoiceWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req) => {
    logger.info('voice-websocket', 'New WebSocket connection established');

    let sessionId: string | null = null;
    let session: VoiceSession | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle control messages
        if (message.type === 'start') {
          sessionId = message.sessionId || `voice-${Date.now()}`;
          session = {
            sessionId,
            audioBuffer: new AudioBufferManager(),
            isRecording: false,
            processing: false,
          };
          activeSessions.set(sessionId, session);

          // Note: We use REST API for STT instead of streaming because:
          // 1. Frontend sends WebM Opus format (from MediaRecorder)
          // 2. Google Cloud streaming STT expects LINEAR16 format
          // 3. Converting WebM Opus to LINEAR16 is complex and not necessary
          // 4. We'll buffer audio and transcribe when user stops recording

          ws.send(JSON.stringify({
            type: 'ready',
            sessionId,
            message: 'Voice session started',
          }));

        } else if (message.type === 'audio' && session) {
          // Handle final audio blob - store it for transcription when stop is received
          if (message.data) {
            const audioBuffer = Buffer.from(message.data, 'base64');
            // Get fresh session reference from activeSessions
            const audioSession = activeSessions.get(sessionId!);
            if (audioSession) {
              // Replace the buffer with the final complete blob (don't concatenate chunks)
              audioSession.audioBuffer.clear();
              audioSession.audioBuffer.addChunk(audioBuffer);
              audioSession.isRecording = true;
            }
          }

        } else if (message.type === 'stop' && session) {
          // Get session reference early to avoid race condition with WebSocket close
          const currentSession = activeSessions.get(sessionId!);
          if (!currentSession) {
            logger.warn('voice-websocket', `Session not found when processing stop message: ${sessionId}`, { sessionId });
            return;
          }
          
          // Stop recording and mark processing
          currentSession.isRecording = false;
          currentSession.processing = true; // Mark that async processing is starting
          
          try {
            // Get the final complete audio blob (not concatenated chunks)
            const audioBuffer = currentSession.audioBuffer.getBuffer();
            
            if (audioBuffer.length === 0) {
              ws.send(JSON.stringify({
                type: 'error',
                error: 'No audio recorded',
              }));
              return;
            }

            // Transcribe the buffered audio using REST API (supports WebM Opus)
            logger.info('voice-websocket', `Transcribing audio (${audioBuffer.length} bytes) for session ${sessionId}`, { sessionId, audioLength: audioBuffer.length });
            let sttResult;
            try {
              sttResult = await transcribeAudio(audioBuffer, {
                languageCode: 'en-IN',
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
              });
              logger.info('voice-websocket', `Transcript received: ${sttResult.transcript}`, { sessionId, transcript: sttResult.transcript });
            } catch (sttError: any) {
              logger.error('voice-websocket', `STT failed for session ${sessionId}`, sttError, { sessionId, audioLength: audioBuffer.length });
              ws.send(JSON.stringify({
                type: 'error',
                error: `Speech-to-text failed: ${sttError.message}`,
                sessionId,
              }));
              currentSession.processing = false;
              return;
            }

            // Send transcript to client
            ws.send(JSON.stringify({
              type: 'transcript',
              transcript: sttResult.transcript,
              isFinal: true,
              confidence: sttResult.confidence,
              sessionId,
            }));

            // Process with conversation orchestrator
            logger.info('voice-websocket', `Processing conversation for session ${sessionId}`, { sessionId, transcript: sttResult.transcript });
            const response = await processConversation(sessionId!, sttResult.transcript);
            logger.info('voice-websocket', `Conversation response generated for session ${sessionId}`, { sessionId, responseLength: response.message.length });
            
            // Synthesize response to speech
            logger.info('voice-websocket', `Synthesizing speech for session ${sessionId}`, { sessionId });
            const ttsResult = await synthesizeSpeech(response.message, {
              languageCode: 'en-IN',
              ssmlGender: 'FEMALE',
            });
            logger.info('voice-websocket', `Speech synthesized for session ${sessionId}`, { sessionId, audioLength: ttsResult.audioContent.length, format: ttsResult.audioConfig.encoding });

            // Determine audio format based on encoding
            let audioFormat: string;
            if (ttsResult.audioConfig.encoding === 'MP3') {
              audioFormat = 'mp3';
            } else if (ttsResult.audioConfig.encoding === 'WAV') {
              audioFormat = 'wav';
            } else {
              audioFormat = 'ogg_opus';
            }
            const audioBase64 = ttsResult.audioContent.toString('base64');
            logger.info('voice-websocket', `Sending response to client for session ${sessionId}`, { sessionId, audioFormat, audioBase64Length: audioBase64.length, wsReadyState: ws.readyState });
            
            // Check if WebSocket is still open before sending (1 = OPEN)
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({
                type: 'response',
                text: response.message,
                audio: audioBase64,
                audioFormat: audioFormat,
                sessionId,
              }));
              logger.info('voice-websocket', `Response sent successfully for session ${sessionId}`, { sessionId });
            } else {
              logger.warn('voice-websocket', `WebSocket is not open, cannot send response for session ${sessionId}`, { sessionId, readyState: ws.readyState });
            }

            // Clear audio buffer for next recording (check if session still exists)
            const finalSession = activeSessions.get(sessionId!);
            if (finalSession && finalSession.audioBuffer) {
              finalSession.audioBuffer.clear();
              finalSession.processing = false; // Mark processing as complete
            }
          } catch (error: any) {
            logger.error('voice-websocket', `Error processing audio for session ${sessionId}`, error, { sessionId });
            // Mark processing as complete even on error
            const errorSession = activeSessions.get(sessionId!);
            if (errorSession) {
              errorSession.processing = false;
            }
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message || 'Failed to process audio. Please check your STT provider configuration.',
            }));
          }

        } else if (message.type === 'transcribe' && session) {
          // Legacy endpoint - kept for compatibility but not used
          // Transcription now happens automatically on 'stop'
          const transcript = message.transcript || '';
          
          if (transcript.trim()) {
            try {
              // Process with conversation orchestrator
              const response = await processConversation(sessionId!, transcript);
              
              // Synthesize response to speech
              const ttsResult = await synthesizeSpeech(response.message, {
                languageCode: 'en-IN',
                ssmlGender: 'FEMALE',
              });

              // Determine audio format based on encoding
              let audioFormat: string;
              if (ttsResult.audioConfig.encoding === 'MP3') {
                audioFormat = 'mp3';
              } else if (ttsResult.audioConfig.encoding === 'WAV') {
                audioFormat = 'wav';
              } else {
                audioFormat = 'ogg_opus';
              }
              const audioBase64 = ttsResult.audioContent.toString('base64');
              
              // Check if WebSocket is still open before sending (1 = OPEN)
              if (ws.readyState === 1) {
                ws.send(JSON.stringify({
                  type: 'response',
                  text: response.message,
                  audio: audioBase64,
                  audioFormat: audioFormat,
                  sessionId,
                }));
                logger.info('voice-websocket', `Response sent successfully via transcribe endpoint for session ${sessionId}`, { sessionId });
              } else {
                logger.warn('voice-websocket', `WebSocket is not open, cannot send response via transcribe endpoint for session ${sessionId}`, { sessionId, readyState: ws.readyState });
              }
            } catch (error: any) {
              logger.error('voice-websocket', `Error processing conversation for session ${sessionId}`, error, { sessionId, transcript });
              ws.send(JSON.stringify({
                type: 'error',
                error: error.message || 'Failed to process conversation',
                sessionId,
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'No transcript provided',
            }));
          }

        } else if (message.type === 'end' && session) {
          // End session
          activeSessions.delete(sessionId!);
          session = null;
        }

      } catch (error: any) {
        logger.error('voice-websocket', 'WebSocket message processing error', error, { sessionId, messageType: message?.type });
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message || 'Unknown error',
          sessionId,
        }));
      }
    });

    ws.on('close', () => {
      logger.info('voice-websocket', `WebSocket connection closed for session ${sessionId}`, { sessionId });
      if (sessionId && activeSessions.has(sessionId)) {
        const session = activeSessions.get(sessionId);
        if (session && !session.processing) {
          // Only delete if not currently processing
          activeSessions.delete(sessionId);
          logger.info('voice-websocket', `Session ${sessionId} cleaned up immediately (not processing)`, { sessionId });
        } else {
          // If processing, schedule cleanup after delay
          logger.info('voice-websocket', `Session ${sessionId} is processing, scheduling cleanup`, { sessionId });
          setTimeout(() => {
            if (activeSessions.has(sessionId!)) {
              const delayedSession = activeSessions.get(sessionId!);
              if (delayedSession && !delayedSession.processing) {
                activeSessions.delete(sessionId!);
                logger.info('voice-websocket', `Session ${sessionId} cleaned up after processing`, { sessionId });
              }
            }
          }, 15000); // 15 second delay to allow processing to complete
        }
      }
    });

    ws.on('error', (error) => {
      logger.error('voice-websocket', 'WebSocket connection error', error, { sessionId });
    });
  });

  logger.info('voice-websocket', 'WebSocket server ready at /api/voice/ws');
}

