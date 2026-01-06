/**
 * WebSocket client for voice streaming
 */

export interface VoiceMessage {
  type: 'start' | 'audio' | 'transcribe' | 'stop' | 'end';
  sessionId?: string;
  data?: string; // Base64 encoded audio
  transcript?: string;
  languageCode?: string;
}

export interface VoiceResponse {
  type: 'ready' | 'transcript' | 'response' | 'error' | 'stopped';
  sessionId?: string;
  transcript?: string;
  isFinal?: boolean;
  confidence?: number;
  text?: string;
  audio?: string; // Base64 encoded audio
  audioFormat?: string;
  error?: string;
}

export class VoiceWebSocketClient {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private url: string;
  private listeners: Map<string, ((data: VoiceResponse) => void)[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(apiUrl: string = 'http://localhost:3001') {
    // Convert HTTP URL to WebSocket URL
    this.url = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/voice/ws';
  }

  /**
   * Connect to WebSocket server
   */
  connect(sessionId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }

        this.ws = new WebSocket(this.url);
        let isResolved = false;
        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            if (this.ws) {
              this.ws.close();
              this.ws = null;
            }
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000); // 5 second timeout

        this.ws.onopen = () => {
          console.log('✅ Voice WebSocket connected');
          this.reconnectAttempts = 0;
          clearTimeout(timeout);
          
          if (!isResolved) {
            isResolved = true;
            
            // Start session
            if (sessionId) {
              this.sessionId = sessionId;
              this.send({
                type: 'start',
                sessionId,
                languageCode: 'en-IN',
              });
            }
            
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const response: VoiceResponse = JSON.parse(event.data);
            this.handleMessage(response);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            // Don't close connection on parse errors - just log
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(timeout);
          // Don't close connection on error - let onclose handle it
        };

        this.ws.onclose = (event) => {
          console.log('Voice WebSocket disconnected', event.code, event.reason);
          clearTimeout(timeout);
          
          // Log close code details for debugging
          if (event.code === 1005) {
            console.warn('WebSocket closed with code 1005 (No Status Received) - abnormal closure');
          } else if (event.code === 1006) {
            console.warn('WebSocket closed with code 1006 (Abnormal Closure) - connection lost');
          }
          
          this.ws = null;
          
          if (!isResolved) {
            isResolved = true;
            reject(new Error(`WebSocket connection closed: ${event.code} ${event.reason || ''}`));
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message to server
   */
  send(message: VoiceMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send audio chunk
   */
  sendAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1] || reader.result as string;
        this.send({
          type: 'audio',
          data: base64,
        });
        resolve();
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * Request transcription
   */
  transcribe(transcript: string): void {
    this.send({
      type: 'transcribe',
      transcript,
    });
  }

  /**
   * Stop recording
   */
  stop(): void {
    this.send({ type: 'stop' });
  }

  /**
   * End session
   */
  disconnect(): void {
    if (this.ws) {
      this.send({ type: 'end' });
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: VoiceResponse) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: VoiceResponse) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(response: VoiceResponse): void {
    // Emit to specific event listeners
    if (response.type && this.listeners.has(response.type)) {
      this.listeners.get(response.type)!.forEach((callback) => {
        callback(response);
      });
    }

    // Also emit to 'message' listeners
    if (this.listeners.has('message')) {
      this.listeners.get('message')!.forEach((callback) => {
        callback(response);
      });
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}



