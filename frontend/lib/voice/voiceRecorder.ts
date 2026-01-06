/**
 * Voice recorder using Web Audio API
 */

export interface VoiceRecorderConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isRecording: boolean = false;
  private config: VoiceRecorderConfig;

  constructor(config: VoiceRecorderConfig = {}) {
    this.config = {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...config,
    };
  }

  /**
   * Start recording audio
   */
  async start(): Promise<void> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      }

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('Audio recording is not supported in this browser. Please use a modern browser.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.config.sampleRate,
          channelCount: this.config.channelCount,
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
        },
      });

      // Use WebM with Opus codec for better quality and compatibility
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      };

      // Fallback to default if WebM Opus not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          options.mimeType = 'audio/webm';
        } else {
          // Use default mimeType if WebM not supported
          options.mimeType = undefined;
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
        // Error will be handled in stop() method
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
    } catch (error: any) {
      // Provide helpful error messages based on error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('Microphone is being used by another application. Please close other apps using the microphone and try again.');
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        throw new Error('Microphone settings not supported. Trying with default settings...');
      } else {
        throw new Error(`Failed to access microphone: ${error.message || 'Unknown error'}. Please check your browser permissions.`);
      }
    }
  }

  /**
   * Stop recording and get audio blob
   */
  async stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm;codecs=opus' });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.onerror = (event: any) => {
        this.cleanup();
        const errorMsg = event.error?.message || 'Recording failed';
        reject(new Error(`Recording error: ${errorMsg}. Please try again.`));
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Get current recording as blob (without stopping)
   */
  getCurrentRecording(): Blob | null {
    if (this.chunks.length === 0) {
      return null;
    }
    return new Blob(this.chunks, { type: 'audio/webm;codecs=opus' });
  }

  /**
   * Check if currently recording
   */
  getRecordingState(): boolean {
    return this.isRecording;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }

  /**
   * Release all resources
   */
  release(): void {
    this.stop().catch(() => {
      // Ignore errors during cleanup
    });
    this.cleanup();
  }
}



