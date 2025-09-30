// Advanced Error Handling System
// Hệ thống xử lý lỗi nâng cao cho pagination

export interface ErrorContext {
  component: string
  action: string
  page?: number
  timestamp: number
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  additionalData?: Record<string, any>
}

export interface ErrorInfo {
  id: string
  type: 'network' | 'api' | 'validation' | 'timeout' | 'unknown'
  message: string
  stack?: string
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  retryable: boolean
  retryCount: number
  maxRetries: number
  lastRetry?: number
  resolved: boolean
  resolvedAt?: number
}

export interface RetryStrategy {
  name: string
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  condition: (error: ErrorInfo) => boolean
}

export interface ErrorHandlerConfig {
  enableLogging: boolean
  enableReporting: boolean
  enableRetry: boolean
  maxErrors: number
  retryStrategies: RetryStrategy[]
  onError?: (error: ErrorInfo) => void
  onRetry?: (error: ErrorInfo, attempt: number) => void
  onResolve?: (error: ErrorInfo) => void
}

class ErrorHandler {
  private errors: Map<string, ErrorInfo> = new Map()
  private config: ErrorHandlerConfig
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private errorCount: number = 0
  
  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableReporting: true,
      enableRetry: true,
      maxErrors: 100,
      retryStrategies: this.getDefaultRetryStrategies(),
      ...config
    }
  }
  
  // Get default retry strategies
  private getDefaultRetryStrategies(): RetryStrategy[] {
    return [
      {
        name: 'network',
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffMultiplier: 2,
        jitter: true,
        condition: (error) => error.type === 'network' || error.type === 'timeout'
      },
      {
        name: 'api',
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 1.5,
        jitter: true,
        condition: (error) => error.type === 'api' && error.message.includes('5')
      },
      {
        name: 'validation',
        maxRetries: 1,
        baseDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 1,
        jitter: false,
        condition: (error) => error.type === 'validation'
      }
    ]
  }
  
  // Handle error
  handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    customConfig?: Partial<ErrorHandlerConfig>
  ): ErrorInfo {
    const errorId = this.generateErrorId()
    const fullContext: ErrorContext = {
      component: 'unknown',
      action: 'unknown',
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    }
    
    const errorInfo: ErrorInfo = {
      id: errorId,
      type: this.categorizeError(error),
      message: error.message,
      stack: error.stack,
      context: fullContext,
      severity: this.determineSeverity(error, fullContext),
      retryable: this.isRetryable(error),
      retryCount: 0,
      maxRetries: this.getMaxRetries(error),
      resolved: false
    }
    
    // Store error
    this.errors.set(errorId, errorInfo)
    this.errorCount++
    
    // Cleanup old errors if needed
    if (this.errors.size > this.config.maxErrors) {
      this.cleanupOldErrors()
    }
    
    // Log error
    if (this.config.enableLogging) {
      this.logError(errorInfo)
    }
    
    // Report error
    if (this.config.enableReporting) {
      this.reportError(errorInfo)
    }
    
    // Trigger retry if applicable
    if (this.config.enableRetry && errorInfo.retryable) {
      this.scheduleRetry(errorInfo)
    }
    
    // Call error callback
    this.config.onError?.(errorInfo)
    
    return errorInfo
  }
  
  // Categorize error type
  private categorizeError(error: Error): ErrorInfo['type'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network'
    }
    
    if (message.includes('timeout')) {
      return 'timeout'
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation'
    }
    
    if (message.includes('api') || message.includes('http')) {
      return 'api'
    }
    
    return 'unknown'
  }
  
  // Determine error severity
  private determineSeverity(error: Error, context: ErrorContext): ErrorInfo['severity'] {
    const message = error.message.toLowerCase()
    
    // Critical errors
    if (message.includes('critical') || message.includes('fatal')) {
      return 'critical'
    }
    
    // High severity errors
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'high'
    }
    
    // Medium severity errors
    if (message.includes('timeout') || message.includes('server error')) {
      return 'medium'
    }
    
    // Low severity errors
    return 'low'
  }
  
  // Check if error is retryable
  private isRetryable(error: Error): boolean {
    const message = error.message.toLowerCase()
    
    // Non-retryable errors
    if (message.includes('unauthorized') || 
        message.includes('forbidden') || 
        message.includes('not found') ||
        message.includes('validation')) {
      return false
    }
    
    // Retryable errors
    if (message.includes('network') || 
        message.includes('timeout') || 
        message.includes('server error') ||
        message.includes('5')) {
      return true
    }
    
    return false
  }
  
  // Get max retries for error
  private getMaxRetries(error: Error): number {
    const strategy = this.config.retryStrategies.find(s => s.condition({
      id: Date.now().toString(),
      type: this.categorizeError(error),
      message: error.message,
      context: {} as ErrorContext,
      severity: 'low',
      retryable: true,
      retryCount: 0,
      maxRetries: 0,
      resolved: false
    }))
    
    return strategy?.maxRetries || 1
  }
  
  // Generate unique error ID
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Log error
  private logError(error: ErrorInfo) {
    const logLevel = error.severity === 'critical' ? 'error' : 
                    error.severity === 'high' ? 'warn' : 'info'
    
    console[logLevel](`[${error.severity.toUpperCase()}] ${error.message}`, {
      id: error.id,
      type: error.type,
      context: error.context,
      retryable: error.retryable,
      retryCount: error.retryCount
    })
  }
  
  // Report error (placeholder for external reporting)
  private reportError(error: ErrorInfo) {
    // In a real application, this would send to an error reporting service
    // like Sentry, LogRocket, or custom analytics
    console.log('Error reported:', error)
  }
  
  // Schedule retry
  private scheduleRetry(error: ErrorInfo) {
    const strategy = this.config.retryStrategies.find(s => s.condition(error))
    if (!strategy) return
    
    if (error.retryCount >= error.maxRetries) {
      console.log(`Max retries reached for error ${error.id}`)
      return
    }
    
    const delay = this.calculateRetryDelay(error, strategy)
    
    const timeout = setTimeout(() => {
      this.retryError(error)
    }, delay)
    
    this.retryTimeouts.set(error.id, timeout)
  }
  
  // Calculate retry delay
  private calculateRetryDelay(error: ErrorInfo, strategy: RetryStrategy): number {
    const baseDelay = strategy.baseDelay
    const multiplier = Math.pow(strategy.backoffMultiplier, error.retryCount)
    let delay = baseDelay * multiplier
    
    // Apply jitter
    if (strategy.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }
    
    // Cap at max delay
    delay = Math.min(delay, strategy.maxDelay)
    
    return Math.floor(delay)
  }
  
  // Retry error
  private retryError(error: ErrorInfo) {
    error.retryCount++
    error.lastRetry = Date.now()
    
    this.config.onRetry?.(error, error.retryCount)
    
    // Clear timeout
    const timeout = this.retryTimeouts.get(error.id)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(error.id)
    }
    
    // Check if max retries reached
    if (error.retryCount >= error.maxRetries) {
      console.log(`Max retries reached for error ${error.id}`)
      return
    }
    
    // Schedule next retry
    this.scheduleRetry(error)
  }
  
  // Resolve error
  resolveError(errorId: string) {
    const error = this.errors.get(errorId)
    if (!error) return
    
    error.resolved = true
    error.resolvedAt = Date.now()
    
    // Clear retry timeout
    const timeout = this.retryTimeouts.get(errorId)
    if (timeout) {
      clearTimeout(timeout)
      this.retryTimeouts.delete(errorId)
    }
    
    this.config.onResolve?.(error)
  }
  
  // Get error by ID
  getError(errorId: string): ErrorInfo | undefined {
    return this.errors.get(errorId)
  }
  
  // Get all errors
  getAllErrors(): ErrorInfo[] {
    return Array.from(this.errors.values())
  }
  
  // Get errors by type
  getErrorsByType(type: ErrorInfo['type']): ErrorInfo[] {
    return this.getAllErrors().filter(error => error.type === type)
  }
  
  // Get errors by severity
  getErrorsBySeverity(severity: ErrorInfo['severity']): ErrorInfo[] {
    return this.getAllErrors().filter(error => error.severity === severity)
  }
  
  // Get unresolved errors
  getUnresolvedErrors(): ErrorInfo[] {
    return this.getAllErrors().filter(error => !error.resolved)
  }
  
  // Get error statistics
  getErrorStats() {
    const errors = this.getAllErrors()
    const unresolved = this.getUnresolvedErrors()
    
    const stats = {
      total: errors.length,
      unresolved: unresolved.length,
      resolved: errors.length - unresolved.length,
      byType: {} as Record<ErrorInfo['type'], number>,
      bySeverity: {} as Record<ErrorInfo['severity'], number>,
      retryable: errors.filter(e => e.retryable).length,
      retrying: errors.filter(e => e.retryCount > 0 && !e.resolved).length,
      errorRate: this.calculateErrorRate()
    }
    
    // Count by type
    errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
    })
    
    // Count by severity
    errors.forEach(error => {
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
    })
    
    return stats
  }
  
  // Calculate error rate
  private calculateErrorRate(): number {
    // This would need to be implemented based on your specific needs
    // For now, return a simple calculation
    const recentErrors = this.getAllErrors().filter(
      error => Date.now() - error.context.timestamp < 60000 // Last minute
    )
    
    return recentErrors.length
  }
  
  // Cleanup old errors
  private cleanupOldErrors() {
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000 // 24 hours ago
    const oldErrors = this.getAllErrors().filter(
      error => error.context.timestamp < cutoffTime
    )
    
    oldErrors.forEach(error => {
      this.errors.delete(error.id)
      const timeout = this.retryTimeouts.get(error.id)
      if (timeout) {
        clearTimeout(timeout)
        this.retryTimeouts.delete(error.id)
      }
    })
  }
  
  // Clear all errors
  clearAllErrors() {
    this.errors.clear()
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
    this.errorCount = 0
  }
  
  // Update configuration
  updateConfig(newConfig: Partial<ErrorHandlerConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
  
  // Get configuration
  getConfig(): ErrorHandlerConfig {
    return { ...this.config }
  }
  
  // Destroy handler
  destroy() {
    this.clearAllErrors()
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler()

// Export default
export default errorHandler
