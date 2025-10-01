/**
 * Professional Logger Utility
 * Provides structured logging with levels, formatting, and production optimization
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string | number;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Set log level based on environment
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, levelName: string, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelName, message, context);
    
    // Use appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, error || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.log(formattedMessage);
        }
        break;
    }
  }

  // Public logging methods
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, 'ERROR', message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, 'WARN', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, 'INFO', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, context);
  }

  // Specialized logging methods
  apiCall(method: string, url: string, status?: number, context?: LogContext): void {
    const message = `API ${method} ${url}${status ? ` → ${status}` : ''}`;
    this.info(message, { ...context, type: 'api' });
  }

  auth(action: string, userId?: string | number, context?: LogContext): void {
    this.info(`Auth: ${action}`, { ...context, userId, type: 'auth' });
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    this.info(message, { ...context, type: 'performance' });
  }

  business(action: string, context?: LogContext): void {
    this.info(`Business: ${action}`, { ...context, type: 'business' });
  }

  // Error tracking for production
  trackError(error: Error, context?: LogContext): void {
    this.error(`Unhandled error: ${error.message}`, error, context);
    
    // In production, you might want to send to error tracking service
    if (this.isProduction) {
      // Example: send to Sentry, LogRocket, etc.
      // this.sendToErrorService(error, context);
    }
  }

  // Performance monitoring
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Group logging for related operations
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // Set log level dynamically
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.level;
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports
export const log = {
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  api: (method: string, url: string, status?: number, context?: LogContext) => logger.apiCall(method, url, status, context),
  auth: (action: string, userId?: string | number, context?: LogContext) => logger.auth(action, userId, context),
  perf: (operation: string, duration: number, context?: LogContext) => logger.performance(operation, duration, context),
  business: (action: string, context?: LogContext) => logger.business(action, context),
  time: (label: string) => logger.time(label),
  timeEnd: (label: string) => logger.timeEnd(label),
  group: (label: string) => logger.group(label),
  groupEnd: () => logger.groupEnd(),
};

// Console configuration is handled in consoleConfig.ts

export default logger;
