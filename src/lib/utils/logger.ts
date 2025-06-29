// Defines the severity levels for logging messages
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Represents a structured log entry with metadata
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>; // Additional data for debugging
  timestamp: Date;
  service?: string; // Service name for log identification
}

/**
 * Logger class for structured logging with service identification
 * Provides methods for different log levels and automatic timestamping
 */
export class Logger {
  private serviceName: string;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    // Enhance context with error details if Error object is provided
    const errorContext = error ? {
      ...context,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    } : context;
    
    this.log(LogLevel.ERROR, message, errorContext);
  }
  
  // Core logging method that formats and outputs log entries
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      service: this.serviceName
    };
    
    // Route to appropriate console method based on log level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[${entry.service}] ${message}`, context || '');
        break;
      case LogLevel.INFO:
        console.info(`[${entry.service}] ${message}`, context || '');
        break;
      case LogLevel.WARN:
        console.warn(`[${entry.service}] ${message}`, context || '');
        break;
      case LogLevel.ERROR:
        console.error(`[${entry.service}] ${message}`, context || '');
        break;
    }
  }
}

// Factory function for creating logger instances with service identification
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}