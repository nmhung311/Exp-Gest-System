// Advanced Skeleton Loading Components
// Components skeleton loading tối ưu cho tất cả các trang

import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'pulse' | 'wave' | 'shimmer' | 'fade'
  duration?: number
  delay?: number
  children?: React.ReactNode
  style?: React.CSSProperties
}

// Base Skeleton Component
const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'pulse',
  duration = 1.5,
  delay = 0,
  children
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'pulse':
        return 'animate-pulse'
      case 'wave':
        return 'animate-wave'
      case 'shimmer':
        return 'animate-shimmer'
      case 'fade':
        return 'animate-fade'
      default:
        return 'animate-pulse'
    }
  }

  const style = {
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }

  return (
    <div
      className={`bg-gray-700 rounded ${getVariantClasses()} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// Text Skeleton
export const TextSkeleton: React.FC<{
  lines?: number
  width?: string | string[]
  height?: string
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ 
  lines = 1, 
  width = '100%', 
  height = '1rem',
  className = '',
  variant = 'pulse'
}) => {
  const widths = Array.isArray(width) ? width : [width]
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          className="h-4"
          style={{ width: widths[index] || widths[0] }}
        />
      ))}
    </div>
  )
}

// Avatar Skeleton
export const AvatarSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ size = 'md', className = '', variant = 'pulse' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <Skeleton
      variant={variant}
      className={`rounded-full ${sizeClasses[size]} ${className}`}
    />
  )
}

// Card Skeleton
export const CardSkeleton: React.FC<{
  showAvatar?: boolean
  showActions?: boolean
  lines?: number
  className?: string
  variant?: SkeletonProps['variant']
  delay?: number
}> = ({ 
  showAvatar = true, 
  showActions = true, 
  lines = 3,
  className = '',
  variant = 'pulse'
}) => {
  return (
    <div className={`bg-black/20 border border-white/10 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3 mb-3">
        {showAvatar && (
          <AvatarSkeleton size="md" variant={variant} />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton variant={variant} className="h-4 w-3/4" />
          <Skeleton variant={variant} className="h-3 w-1/2" />
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            className="h-3"
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
      
      {showActions && (
        <div className="flex gap-2 pt-3 border-t border-white/10">
          <Skeleton variant={variant} className="h-6 w-16" />
          <Skeleton variant={variant} className="h-6 w-16" />
          <Skeleton variant={variant} className="h-6 w-16" />
        </div>
      )}
    </div>
  )
}

// Table Skeleton
export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ 
  rows = 5, 
  columns = 6, 
  showHeader = true,
  className = '',
  variant = 'pulse'
}) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left">
        {showHeader && (
          <thead className="text-xs text-white/60 uppercase bg-black/30">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton variant={variant} className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/10">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton 
                    variant={variant} 
                    className="h-4" 
                    style={{ width: `${Math.random() * 60 + 40}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// List Skeleton
export const ListSkeleton: React.FC<{
  items?: number
  showAvatar?: boolean
  showActions?: boolean
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ 
  items = 5, 
  showAvatar = true, 
  showActions = true,
  className = '',
  variant = 'pulse'
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <CardSkeleton
          key={index}
          showAvatar={showAvatar}
          showActions={showActions}
          variant={variant}
          delay={index * 0.1}
        />
      ))}
    </div>
  )
}

// Statistics Cards Skeleton
export const StatsCardsSkeleton: React.FC<{
  cards?: number
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ cards = 4, className = '', variant = 'pulse' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="bg-black/20 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton variant={variant} className="h-4 w-20" />
            <Skeleton variant={variant} className="h-6 w-6 rounded" />
          </div>
          <Skeleton variant={variant} className="h-8 w-16 mb-1" />
          <Skeleton variant={variant} className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

// Form Skeleton
export const FormSkeleton: React.FC<{
  fields?: number
  showSubmit?: boolean
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ 
  fields = 5, 
  showSubmit = true,
  className = '',
  variant = 'pulse'
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant={variant} className="h-4 w-24" />
          <Skeleton variant={variant} className="h-10 w-full rounded-lg" />
        </div>
      ))}
      
      {showSubmit && (
        <div className="flex gap-3 pt-4">
          <Skeleton variant={variant} className="h-10 w-24" />
          <Skeleton variant={variant} className="h-10 w-24" />
        </div>
      )}
    </div>
  )
}

// Pagination Skeleton
export const PaginationSkeleton: React.FC<{
  showInfo?: boolean
  className?: string
  variant?: SkeletonProps['variant']
}> = ({ showInfo = true, className = '', variant = 'pulse' }) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${className}`}>
      {showInfo && (
        <Skeleton variant={variant} className="h-4 w-48" />
      )}
      
      <div className="flex items-center gap-2">
        <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
        <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
        <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
        <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
        <Skeleton variant={variant} className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  )
}

// Loading States
export const LoadingState: React.FC<{
  message?: string
  showSpinner?: boolean
  className?: string
}> = ({ 
  message = 'Đang tải...', 
  showSpinner = true,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center gap-3">
        {showSpinner && (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
        <span className="text-white/60 text-sm">{message}</span>
      </div>
    </div>
  )
}

// Error State
export const ErrorState: React.FC<{
  message?: string
  onRetry?: () => void
  className?: string
}> = ({ 
  message = 'Có lỗi xảy ra', 
  onRetry,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-white/60 text-sm mb-4 text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}

// Empty State
export const EmptyState: React.FC<{
  message?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}> = ({ 
  message = 'Không có dữ liệu', 
  description,
  icon,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {icon && (
        <div className="text-white/40 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-white/60 text-lg font-medium mb-2">{message}</h3>
      {description && (
        <p className="text-white/40 text-sm text-center mb-4">{description}</p>
      )}
      {action && action}
    </div>
  )
}

// Preload Indicator
export const PreloadIndicator: React.FC<{
  isPreloading?: boolean
  preloadedPages?: number[]
  currentPage?: number
  className?: string
}> = ({ 
  isPreloading = false, 
  preloadedPages = [],
  currentPage = 1,
  className = ''
}) => {
  if (!isPreloading && preloadedPages.length === 0) return null

  return (
    <div className={`flex items-center gap-2 text-xs text-white/60 ${className}`}>
      {isPreloading && (
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Đang tải trước...</span>
        </div>
      )}
      
      {preloadedPages.length > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span>Đã tải {preloadedPages.length} trang</span>
        </div>
      )}
    </div>
  )
}

// Page Status Indicator
export const PageStatusIndicator: React.FC<{
  page: number
  isLoaded?: boolean
  isPreloaded?: boolean
  isCurrent?: boolean
  className?: string
}> = ({ 
  page, 
  isLoaded = false, 
  isPreloaded = false,
  isCurrent = false,
  className = ''
}) => {
  const getStatusColor = () => {
    if (isCurrent) return 'bg-blue-500 text-white'
    if (isLoaded) return 'bg-green-500/20 text-green-400'
    if (isPreloaded) return 'bg-yellow-500/20 text-yellow-400'
    return 'bg-gray-500/20 text-gray-400'
  }

  const getStatusIcon = () => {
    if (isCurrent) return '●'
    if (isLoaded) return '✓'
    if (isPreloaded) return '○'
    return '○'
  }

  return (
    <div
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${getStatusColor()} ${className}`}
      title={`Trang ${page} - ${isCurrent ? 'Hiện tại' : isLoaded ? 'Đã tải' : isPreloaded ? 'Đã tải trước' : 'Chưa tải'}`}
    >
      {getStatusIcon()}
    </div>
  )
}

export default Skeleton
