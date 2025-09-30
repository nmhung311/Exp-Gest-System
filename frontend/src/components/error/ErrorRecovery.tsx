// Error Recovery Component
// Component xử lý lỗi và recovery cho pagination

import React, { useState, useEffect } from 'react'
import { errorHandler, ErrorInfo } from '@/lib/utils/errorHandler'
import { LoadingState, ErrorState } from '@/components/loading/AdvancedSkeletonLoader'

interface ErrorRecoveryProps {
  // Error handling
  error?: Error | null
  onRetry?: () => void
  onDismiss?: () => void
  
  // Configuration
  showDetails?: boolean
  showRetryButton?: boolean
  showDismissButton?: boolean
  autoRetry?: boolean
  maxAutoRetries?: number
  
  // Styling
  className?: string
  variant?: 'inline' | 'modal' | 'banner'
  
  // Custom messages
  messages?: {
    title?: string
    description?: string
    retryButton?: string
    dismissButton?: string
    retryingMessage?: string
  }
}

export default function ErrorRecovery({
  error,
  onRetry,
  onDismiss,
  showDetails = true,
  showRetryButton = true,
  showDismissButton = true,
  autoRetry = false,
  maxAutoRetries = 3,
  className = '',
  variant = 'inline',
  messages = {}
}: ErrorRecoveryProps) {
  
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  
  // Default messages
  const defaultMessages = {
    title: 'Đã xảy ra lỗi',
    description: 'Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại.',
    retryButton: 'Thử lại',
    dismissButton: 'Bỏ qua',
    retryingMessage: 'Đang thử lại...'
  }
  
  const finalMessages = { ...defaultMessages, ...messages }
  
  // Handle error
  useEffect(() => {
    if (error) {
      const errorInfo = errorHandler.handleError(error, {
        component: 'ErrorRecovery',
        action: 'render'
      })
      setErrorInfo(errorInfo)
      setRetryCount(errorInfo.retryCount)
      
      // Auto retry if enabled
      if (autoRetry && errorInfo.retryable && autoRetryCount < maxAutoRetries) {
        setTimeout(() => {
          handleRetry()
        }, 1000)
      }
    }
  }, [error, autoRetry, maxAutoRetries, autoRetryCount])
  
  // Handle retry
  const handleRetry = async () => {
    if (isRetrying) return
    
    setIsRetrying(true)
    setAutoRetryCount(prev => prev + 1)
    
    try {
      await onRetry?.()
      
      // Resolve error if successful
      if (errorInfo) {
        errorHandler.resolveError(errorInfo.id)
        setErrorInfo(null)
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError)
      
      // Update retry count
      if (errorInfo) {
        const updatedError = errorHandler.getError(errorInfo.id)
        if (updatedError) {
          setErrorInfo(updatedError)
          setRetryCount(updatedError.retryCount)
        }
      }
    } finally {
      setIsRetrying(false)
    }
  }
  
  // Handle dismiss
  const handleDismiss = () => {
    if (errorInfo) {
      errorHandler.resolveError(errorInfo.id)
    }
    onDismiss?.()
    setErrorInfo(null)
  }
  
  // Get error severity color
  const getSeverityColor = (severity: ErrorInfo['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }
  
  // Get error severity icon
  const getSeverityIcon = (severity: ErrorInfo['severity']) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      case 'low': return 'ℹ️'
      default: return '❌'
    }
  }
  
  // Get error type description
  const getErrorTypeDescription = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'network': return 'Lỗi kết nối mạng'
      case 'api': return 'Lỗi API'
      case 'validation': return 'Lỗi xác thực dữ liệu'
      case 'timeout': return 'Lỗi timeout'
      case 'unknown': return 'Lỗi không xác định'
      default: return 'Lỗi'
    }
  }
  
  // Render inline variant
  const renderInline = () => (
    <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-red-400 text-xl">
          {getSeverityIcon(errorInfo?.severity || 'medium')}
        </div>
        
        <div className="flex-1">
          <h3 className="text-red-400 text-sm font-medium mb-1">
            {finalMessages.title}
          </h3>
          
          <p className="text-red-400/80 text-xs mb-3">
            {finalMessages.description}
          </p>
          
          {showDetails && errorInfo && (
            <div className="space-y-2 mb-3">
              <div className="text-xs text-red-400/60">
                <span className="font-medium">Loại lỗi:</span> {getErrorTypeDescription(errorInfo.type)}
              </div>
              
              <div className="text-xs text-red-400/60">
                <span className="font-medium">Mức độ:</span> {errorInfo.severity}
              </div>
              
              {errorInfo.retryCount > 0 && (
                <div className="text-xs text-red-400/60">
                  <span className="font-medium">Số lần thử:</span> {errorInfo.retryCount}
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || !errorInfo?.retryable}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isRetrying ? (
                  <>
                    <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    {finalMessages.retryingMessage}
                  </>
                ) : (
                  finalMessages.retryButton
                )}
              </button>
            )}
            
            {showDismissButton && (
              <button
                onClick={handleDismiss}
                className="px-3 py-1 bg-white/10 text-white/80 rounded text-xs hover:bg-white/20 transition-colors"
              >
                {finalMessages.dismissButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render modal variant
  const renderModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-black/90 border border-white/20 rounded-xl p-6 max-w-md w-full ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">
            {getSeverityIcon(errorInfo?.severity || 'medium')}
          </div>
          
          <h3 className="text-white text-lg font-medium mb-2">
            {finalMessages.title}
          </h3>
          
          <p className="text-white/60 text-sm mb-6">
            {finalMessages.description}
          </p>
          
          {showDetails && errorInfo && (
            <div className="bg-black/20 border border-white/10 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-xs text-white/60">
                <div>
                  <span className="font-medium">Loại lỗi:</span> {getErrorTypeDescription(errorInfo.type)}
                </div>
                
                <div>
                  <span className="font-medium">Mức độ:</span> {errorInfo.severity}
                </div>
                
                <div>
                  <span className="font-medium">Thời gian:</span> {new Date(errorInfo.context.timestamp).toLocaleString()}
                </div>
                
                {errorInfo.retryCount > 0 && (
                  <div>
                    <span className="font-medium">Số lần thử:</span> {errorInfo.retryCount}
                  </div>
                )}
                
                {errorInfo.message && (
                  <div>
                    <span className="font-medium">Chi tiết:</span> {errorInfo.message}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            {showRetryButton && (
              <button
                onClick={handleRetry}
                disabled={isRetrying || !errorInfo?.retryable}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    {finalMessages.retryingMessage}
                  </>
                ) : (
                  finalMessages.retryButton
                )}
              </button>
            )}
            
            {showDismissButton && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors"
              >
                {finalMessages.dismissButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render banner variant
  const renderBanner = () => (
    <div className={`bg-red-500/10 border-l-4 border-red-500 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="text-red-400 text-lg">
          {getSeverityIcon(errorInfo?.severity || 'medium')}
        </div>
        
        <div className="flex-1">
          <h3 className="text-red-400 text-sm font-medium">
            {finalMessages.title}
          </h3>
          
          <p className="text-red-400/80 text-xs mt-1">
            {finalMessages.description}
          </p>
        </div>
        
        <div className="flex gap-2">
          {showRetryButton && (
            <button
              onClick={handleRetry}
              disabled={isRetrying || !errorInfo?.retryable}
              className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetrying ? finalMessages.retryingMessage : finalMessages.retryButton}
            </button>
          )}
          
          {showDismissButton && (
            <button
              onClick={handleDismiss}
              className="px-3 py-1 bg-white/10 text-white/80 rounded text-xs hover:bg-white/20 transition-colors"
            >
              {finalMessages.dismissButton}
            </button>
          )}
        </div>
      </div>
    </div>
  )
  
  // Don't render if no error
  if (!error && !errorInfo) return null
  
  // Render based on variant
  switch (variant) {
    case 'modal':
      return renderModal()
    case 'banner':
      return renderBanner()
    case 'inline':
    default:
      return renderInline()
  }
}
