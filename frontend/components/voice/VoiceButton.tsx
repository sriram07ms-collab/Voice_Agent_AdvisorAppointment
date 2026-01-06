'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceRecorder } from '@/lib/voice/voiceRecorder';
import { VoiceWebSocketClient, VoiceResponse } from '@/lib/voice/voiceWebSocket';

interface VoiceButtonProps {
  onTranscript?: (transcript: string) => void;
  onResponse?: (text: string, audioUrl: string) => void;
  sessionId?: string;
  apiUrl?: string;
}

export default function VoiceButton({
  onTranscript,
  onResponse,
  sessionId,
  apiUrl = 'http://localhost:3001',
}: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const wsClientRef = useRef<VoiceWebSocketClient | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callbacks in refs so they're always current without causing re-renders
  const onTranscriptRef = useRef(onTranscript);
  const onResponseRef = useRef(onResponse);
  
  // Update refs when callbacks change
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onResponseRef.current = onResponse;
  }, [onTranscript, onResponse]);

  useEffect(() => {
    // Initialize WebSocket client
    wsClientRef.current = new VoiceWebSocketClient(apiUrl);

    // Set up event listeners
    wsClientRef.current.on('ready', (response: VoiceResponse) => {
      console.log('Voice session ready:', response);
      setError(null); // Clear any previous errors
    });

    wsClientRef.current.on('transcript', (response: VoiceResponse) => {
      if (response.transcript) {
        setTranscript(response.transcript);
        if (response.isFinal && onTranscriptRef.current) {
          onTranscriptRef.current(response.transcript);
        }
      }
    });

    wsClientRef.current.on('response', (response: VoiceResponse) => {
      if (response.text && response.audio) {
        // Convert base64 audio to blob URL
        // Map audioFormat to correct MIME type
        let mimeType: string;
        if (response.audioFormat === 'mp3') {
          mimeType = 'audio/mpeg';
        } else if (response.audioFormat === 'wav') {
          mimeType = 'audio/wav';
        } else if (response.audioFormat === 'ogg_opus') {
          mimeType = 'audio/ogg; codecs=opus';
        } else {
          mimeType = 'audio/ogg'; // Default fallback
        }
        const audioBlob = base64ToBlob(response.audio, mimeType);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (onResponseRef.current) {
          onResponseRef.current(response.text, audioUrl);
        }
        
        // Play audio
        playAudio(audioUrl);
      }
      setIsProcessing(false);
    });

    wsClientRef.current.on('error', (response: VoiceResponse) => {
      setError(response.error || 'Unknown error');
      setIsRecording(false);
      setIsProcessing(false);
    });

    // Don't connect immediately - connect only when user clicks microphone button
    // This prevents showing errors on page load

    return () => {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (recorderRef.current) {
        recorderRef.current.release();
      }
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, [sessionId, apiUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      
      // Ensure WebSocket is connected before starting recording
      if (!wsClientRef.current?.isConnected()) {
        try {
          setError(null); // Clear any previous errors
          await wsClientRef.current?.connect(sessionId || undefined);
        } catch (err: any) {
          console.error('WebSocket connection error:', err);
          setError('Unable to connect to voice service. Please ensure the backend server is running on port 3001.');
          setIsRecording(false);
          return;
        }
      }

      // Initialize recorder
      recorderRef.current = new VoiceRecorder({
        sampleRate: 48000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      });

      // Start recording first, then update state
      await recorderRef.current.start();
      
      // Only set recording state to true after recorder successfully starts
      setIsRecording(true);
      
      // Note: We don't send chunks during recording because WebM chunks cannot be concatenated
      // We'll send the complete blob only when recording stops

    } catch (err: any) {
      console.error('Recording error:', err);
      // Display user-friendly error message
      const errorMessage = err.message || 'Failed to start recording. Please check your microphone permissions.';
      setError(errorMessage);
      setIsRecording(false);
      
      // Clean up if recorder was partially initialized
      if (recorderRef.current) {
        try {
          recorderRef.current.release();
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        recorderRef.current = null;
      }
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (recorderRef.current) {
        const finalBlob = await recorderRef.current.stop();
        
        // Send the final complete audio blob to backend
        if (wsClientRef.current && wsClientRef.current.isConnected()) {
          await wsClientRef.current.sendAudio(finalBlob);
        }

        recorderRef.current = null;
      }

      if (wsClientRef.current) {
        wsClientRef.current.stop();
      }

    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 ease-in-out
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600 shadow-groww-lg scale-105'
            : 'bg-groww-primary hover:bg-groww-primary-dark shadow-groww hover:shadow-groww-lg'
          }
          ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
          focus:outline-none focus:ring-2 focus:ring-groww-primary focus:ring-offset-2
        `}
        title={isRecording ? 'Stop recording' : 'Start voice recording'}
        aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
      >
        {/* Pulse animation for recording */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
        )}
        
        {isProcessing ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isRecording ? (
          <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {transcript && (
        <div className="text-xs text-groww-gray-700 max-w-[200px] text-center font-medium bg-white px-3 py-1.5 rounded-lg shadow-groww border border-groww-gray-200 animate-fade-in">
          {transcript}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 max-w-[200px] text-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 animate-fade-in">
          {error}
        </div>
      )}

      {isRecording && !transcript && (
        <div className="flex items-center gap-2 text-xs text-groww-gray-600 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Recording...
        </div>
      )}
    </div>
  );
}

// Helper functions
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

function playAudio(audioUrl: string): void {
  const audio = new Audio(audioUrl);
  
  // Handle audio loading errors
  audio.addEventListener('error', (e) => {
    console.error('Audio playback error:', e);
    console.error('Audio URL:', audioUrl);
    console.error('Audio error details:', {
      error: audio.error,
      networkState: audio.networkState,
      readyState: audio.readyState,
    });
  });
  
  // Play audio
  audio.play().catch((err) => {
    console.error('Failed to play audio:', err);
    console.error('Audio URL:', audioUrl);
    // Check if it's an autoplay policy error
    if (err.name === 'NotAllowedError') {
      console.warn('Audio autoplay blocked. User interaction may be required.');
    }
  });
  
  // Clean up URL after playback or error
  audio.addEventListener('ended', () => {
    URL.revokeObjectURL(audioUrl);
  });
  
  audio.addEventListener('error', () => {
    URL.revokeObjectURL(audioUrl);
  });
}


