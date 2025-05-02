/**
 * Logger Utility
 * 
 * Provides standardized logging functionality throughout the application.
 * This utility helps maintain consistent logging patterns and can be configured
 * to output to different destinations based on the environment.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  service?: string;
}

/**
 * Logger class that provides standardized logging methods
 */
export class Logger {
  private serviceName: string;
  
  /**
   * Creates a new logger instance for a specific service
   * @param serviceName The name of the service using this logger
   */
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  /**
   * Logs a debug message
   * @param message The message to log
   * @param context Optional contextual data
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  /**
   * Logs an info message
   * @param message The message to log
   * @param context Optional contextual data
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  /**
   * Logs a warning message
   * @param message The message to log
   * @param context Optional contextual data
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  /**
   * Logs an error message
   * @param message The message to log
   * @param error Optional error object
   * @param context Optional contextual data
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
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
  
  /**
   * Internal method to handle the actual logging
   * @param level The log level
   * @param message The message to log
   * @param context Optional contextual data
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      service: this.serviceName
    };
    
    // In production, this would send logs to appropriate destinations
    // based on environment (console, file, cloud logging service, etc.)
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

/**
 * Creates a logger instance for a specific service
 * @param serviceName The name of the service
 * @returns A Logger instance
 */
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}