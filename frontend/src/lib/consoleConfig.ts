/**
 * Console Configuration for Production
 * Override console methods to provide professional logging
 */

import { logger } from './logger';

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug,
  group: console.group,
  groupEnd: console.groupEnd,
  time: console.time,
  timeEnd: console.timeEnd,
};

// Override console methods in production
if (process.env.NODE_ENV === 'production') {
  // Only show errors and warnings in production
  console.log = (...args: any[]) => {
    // Silent in production
  };

  console.info = (...args: any[]) => {
    // Silent in production
  };

  console.debug = (...args: any[]) => {
    // Silent in production
  };

  console.warn = (...args: any[]) => {
    // Only log warnings that are important
    const message = args.join(' ');
    if (message.includes('error') || message.includes('failed') || message.includes('401') || message.includes('500')) {
      logger.warn(message, { type: 'console_warn' });
    }
  };

  console.error = (...args: any[]) => {
    // Always log errors
    const message = args.join(' ');
    logger.error(message, undefined, { type: 'console_error' });
  };

  // Keep grouping and timing for development tools
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
  console.time = originalConsole.time;
  console.timeEnd = originalConsole.timeEnd;
}

// Development mode - use our logger but keep console functionality
if (process.env.NODE_ENV === 'development') {
  console.log = (...args: any[]) => {
    if (args.length === 1 && typeof args[0] === 'string') {
      logger.debug(args[0]);
    } else {
      originalConsole.log(...args);
    }
  };

  console.warn = (...args: any[]) => {
    if (args.length === 1 && typeof args[0] === 'string') {
      logger.warn(args[0]);
    } else {
      originalConsole.warn(...args);
    }
  };

  console.error = (...args: any[]) => {
    if (args.length === 1 && typeof args[0] === 'string') {
      logger.error(args[0]);
    } else {
      originalConsole.error(...args);
    }
  };
}

// Export original console for special cases
export { originalConsole };

// Console cleanup function
export function restoreConsole() {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
  console.time = originalConsole.time;
  console.timeEnd = originalConsole.timeEnd;
}

export default {
  originalConsole,
  restoreConsole,
};
