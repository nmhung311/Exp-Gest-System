/**
 * Performance Monitoring Utilities
 * Track and log performance metrics
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupPerformanceObservers();
  }

  private setupPerformanceObservers() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              logger.warn(`Long task detected: ${entry.duration}ms`, {
                type: 'performance',
                duration: entry.duration,
                startTime: entry.startTime,
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        // Long task API not supported
      }

      // Monitor navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.logNavigationMetrics(navEntry);
            }
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        // Navigation timing not supported
      }
    }
  }

  private logNavigationMetrics(navEntry: PerformanceNavigationTiming) {
    const metrics = {
      dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
      tcp: navEntry.connectEnd - navEntry.connectStart,
      request: navEntry.responseStart - navEntry.requestStart,
      response: navEntry.responseEnd - navEntry.responseStart,
      dom: navEntry.domContentLoadedEventEnd - navEntry.responseEnd,
      load: navEntry.loadEventEnd - navEntry.loadEventStart,
      total: navEntry.loadEventEnd - navEntry.fetchStart,
    };

    logger.info('Page load metrics', {
      type: 'performance',
      metrics,
      url: window.location.href,
    });

    // Warn about slow page loads
    if (metrics.total > 3000) {
      logger.warn('Slow page load detected', {
        type: 'performance',
        duration: metrics.total,
        url: window.location.href,
      });
    }
  }

  // Start timing a custom operation
  startTiming(name: string, context?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      context,
    });
  }

  // End timing and log the result
  endTiming(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Performance metric not found: ${name}`, { type: 'performance' });
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log based on duration
    if (duration > 1000) {
      logger.warn(`Slow operation: ${name}`, {
        type: 'performance',
        duration,
        context: metric.context,
      });
    } else if (duration > 100) {
      logger.info(`Operation: ${name}`, {
        type: 'performance',
        duration,
        context: metric.context,
      });
    }

    this.metrics.delete(name);
    return duration;
  }

  // Measure function execution time
  measure<T>(name: string, fn: () => T, context?: Record<string, any>): T {
    this.startTiming(name, context);
    try {
      const result = fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Measure async function execution time
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name, context);
    try {
      const result = await fn();
      this.endTiming(name);
      return result;
    } catch (error) {
      this.endTiming(name);
      throw error;
    }
  }

  // Get current performance metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Clean up observers
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const perf = {
  start: (name: string, context?: Record<string, any>) => performanceMonitor.startTiming(name, context),
  end: (name: string) => performanceMonitor.endTiming(name),
  measure: <T>(name: string, fn: () => T, context?: Record<string, any>) => 
    performanceMonitor.measure(name, fn, context),
  measureAsync: <T>(name: string, fn: () => Promise<T>, context?: Record<string, any>) => 
    performanceMonitor.measureAsync(name, fn, context),
};

// React hook for measuring component render time
export function usePerformanceMeasure(componentName: string) {
  const { useEffect } = require('react');
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // Longer than one frame (16ms)
        logger.debug(`Component render: ${componentName}`, {
          type: 'performance',
          duration,
          component: componentName,
        });
      }
    };
  });
}

export default performanceMonitor;
