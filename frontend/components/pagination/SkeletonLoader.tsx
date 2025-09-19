// Skeleton Loading Component
// Component hiển thị skeleton loading cho pagination

import React from 'react'

interface SkeletonLoaderProps {
  count?: number
  className?: string
  variant?: 'card' | 'table' | 'list'
  showAvatar?: boolean
  showActions?: boolean
}

export default function SkeletonLoader({
  count = 6,
  className = '',
  variant = 'card',
  showAvatar = false,
  showActions = false
}: SkeletonLoaderProps) {
  const renderSkeletonItem = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {showAvatar && (
                  <div className="w-8 h-8 bg-white/20 rounded-full" />
                )}
                <div className="space-y-2">
                  <div className="h-4 bg-white/20 rounded w-32" />
                  <div className="h-3 bg-white/20 rounded w-24" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-white/20 rounded-full w-20" />
                {showActions && (
                  <div className="flex gap-2">
                    <div className="h-6 bg-white/20 rounded w-12" />
                    <div className="h-6 bg-white/20 rounded w-12" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/20 rounded w-full" />
              <div className="h-3 bg-white/20 rounded w-3/4" />
            </div>
          </div>
        )
      
      case 'table':
        return (
          <tr className="animate-pulse">
            <td className="px-4 py-3">
              <div className="w-4 h-4 bg-white/20 rounded" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-white/20 rounded w-8" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-white/20 rounded w-24" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-white/20 rounded w-32" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-white/20 rounded w-20" />
            </td>
            <td className="px-4 py-3">
              <div className="h-4 bg-white/20 rounded w-16" />
            </td>
            <td className="px-4 py-3">
              <div className="h-6 bg-white/20 rounded-full w-20" />
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <div className="h-6 bg-white/20 rounded w-12" />
                <div className="h-6 bg-white/20 rounded w-12" />
                <div className="h-6 bg-white/20 rounded w-12" />
              </div>
            </td>
          </tr>
        )
      
      case 'list':
        return (
          <div className="flex items-center gap-3 p-3 animate-pulse">
            {showAvatar && (
              <div className="w-10 h-10 bg-white/20 rounded-full" />
            )}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded w-3/4" />
              <div className="h-3 bg-white/20 rounded w-1/2" />
            </div>
            <div className="h-6 bg-white/20 rounded-full w-16" />
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeletonItem()}
        </div>
      ))}
    </div>
  )
}

// Skeleton for pagination info
export function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
      <div className="h-4 bg-white/20 rounded w-48" />
      <div className="flex items-center gap-2">
        <div className="h-8 bg-white/20 rounded w-16" />
        <div className="flex gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-8 bg-white/20 rounded w-8" />
          ))}
        </div>
        <div className="h-8 bg-white/20 rounded w-16" />
      </div>
    </div>
  )
}

// Skeleton for loading states
export function LoadingState({
  message = "Đang tải...",
  showSpinner = true,
  className = ""
}: {
  message?: string
  showSpinner?: boolean
  className?: string
}) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center gap-3">
        {showSpinner && (
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        )}
        <span className="text-white/60 text-sm">{message}</span>
      </div>
    </div>
  )
}

// Skeleton for error states
export function ErrorState({
  message = "Có lỗi xảy ra",
  onRetry,
  className = ""
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="text-red-400 text-sm mb-4">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}

// Skeleton for empty states
export function EmptyState({
  message = "Không có dữ liệu",
  icon,
  className = ""
}: {
  message?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      {icon && <div className="mb-4">{icon}</div>}
      <div className="text-white/60 text-sm">{message}</div>
    </div>
  )
}
