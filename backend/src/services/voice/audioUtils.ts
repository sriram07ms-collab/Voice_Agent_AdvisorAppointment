/**
 * Audio utility functions for buffer management and format conversion
 */

export interface AudioChunk {
  data: Buffer;
  timestamp: number;
  sequence: number;
}

/**
 * Audio buffer manager for streaming audio
 */
export class AudioBufferManager {
  private chunks: AudioChunk[] = [];
  private maxChunks: number = 1000; // Prevent memory issues
  private sequence: number = 0;

  /**
   * Add audio chunk to buffer
   */
  addChunk(data: Buffer): void {
    const chunk: AudioChunk = {
      data,
      timestamp: Date.now(),
      sequence: this.sequence++,
    };

    this.chunks.push(chunk);

    // Remove old chunks if buffer is too large
    if (this.chunks.length > this.maxChunks) {
      this.chunks.shift();
    }
  }

  /**
   * Get all chunks as single buffer
   */
  getBuffer(): Buffer {
    return Buffer.concat(this.chunks.map((chunk) => chunk.data));
  }

  /**
   * Get chunks since a specific timestamp
   */
  getChunksSince(timestamp: number): Buffer {
    const recentChunks = this.chunks.filter((chunk) => chunk.timestamp >= timestamp);
    return Buffer.concat(recentChunks.map((chunk) => chunk.data));
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.chunks = [];
    this.sequence = 0;
  }

  /**
   * Get buffer size in bytes
   */
  getSize(): number {
    return this.chunks.reduce((total, chunk) => total + chunk.data.length, 0);
  }

  /**
   * Get number of chunks
   */
  getChunkCount(): number {
    return this.chunks.length;
  }
}

/**
 * Convert audio format if needed
 */
export function convertAudioFormat(
  audioBuffer: Buffer,
  fromFormat: string,
  toFormat: string
): Buffer {
  // For now, return as-is (format conversion would require additional libraries)
  // In production, you might want to use ffmpeg or similar
  return audioBuffer;
}

/**
 * Validate audio buffer
 */
export function validateAudioBuffer(buffer: Buffer, minSize: number = 100): boolean {
  return buffer && buffer.length >= minSize;
}








