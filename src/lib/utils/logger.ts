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
  
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      service: this.serviceName
    };
    
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

export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}