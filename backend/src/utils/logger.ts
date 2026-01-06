/**
 * Comprehensive error logger for backend services
 * Captures errors with timestamps, stack traces, and context
 */

import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
}

class Logger {
  private logDir: string;
  private logFile: string;

  constructor() {
    // Create logs directory in backend root
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry): void {
    const logLine = JSON.stringify(entry) + '\n';
    
    try {
      fs.appendFileSync(this.logFile, logLine, 'utf8');
    } catch (err) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', err);
      console.error('Log entry:', entry);
    }
    
    // Also output to console for immediate visibility
    const consoleMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.service}] ${entry.message}`;
    if (entry.level === 'error') {
      console.error(consoleMessage);
      if (entry.error) {
        console.error('Error details:', entry.error);
      }
      if (entry.context) {
        console.error('Context:', entry.context);
      }
    } else if (entry.level === 'warn') {
      console.warn(consoleMessage);
    } else {
      console.log(consoleMessage);
    }
  }

  error(service: string, message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      service,
      message,
      context,
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      entry.error = {
        name: 'UnknownError',
        message: String(error),
      };
      entry.context = { ...context, rawError: error };
    }

    this.writeLog(entry);
  }

  warn(service: string, message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      service,
      message,
      context,
    });
  }

  info(service: string, message: string, context?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'info',
      service,
      message,
      context,
    });
  }

  debug(service: string, message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'debug',
        service,
        message,
        context,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();




