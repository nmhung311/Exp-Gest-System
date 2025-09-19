// Enhanced Pagination Component
// Component pagination nâng cao với tất cả features

import React, { useState, useEffect } from 'react'
import { PreloadPaginationHook } from '@/lib/types/pagination'
import { PreloadIndicator, PageStatusIndicator } from '@/components/loading/AdvancedSkeletonLoader'
import { PreloadIndicators } from './PreloadIndicators'
import { ProgressiveLoading } from '@/components/loading/ProgressiveLoading'

interface EnhancedPaginationProps {
  // Pagination state
  pagination: PreloadPaginationHook
  
  // Display options
  showInfo?: boolean
  showPageNumbers?: boolean
  showPreloadIndicators?: boolean
  showProgressiveLoading?: boolean
  showPageStatus?: boolean
  showCacheStats?: boolean
  
  // Configuration
  maxVisiblePages?: number
  compact?: boolean
  className?: string
  
  // Callbacks
  onPageChange?: (page: number) => void
  onPreloadPage?: (page: number) => void
  onRefresh?: () => void
  
  // Loading states
  isInitialLoading?: boolean
  isRefreshing?: boolean
  loadingMessage?: string
}

export default function EnhancedPagination({
  pagination,
  showInfo = true,
  showPageNumbers = true,
  showPreloadIndicators = true,
  showProgressiveLoading = false,
  showPageStatus = false,
  showCacheStats = false,
  maxVisiblePages = 5,
  compact = false,
  className = '',
  onPageChange,
  onPreloadPage,
  onRefresh,
  isInitialLoading = false,
  isRefreshing = false,
  loadingMessage = 'Đang tải...'
}: EnhancedPaginationProps) {
  
  const [showAllPages, setShowAllPages] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)
  
  // Calculate visible pages
  const visiblePages = React.useMemo(() => {
    if (showAllPages || pagination.state.totalPages <= maxVisiblePages) {
      return Array.from({ length: pagination.state.totalPages }, (_, i) => i + 1)
    }
    
    const pages: number[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    
    // Always show first page
    pages.push(1)
    
    // Show pages around current page
    const start = Math.max(2, pagination.state.currentPage - halfVisible)
    const end = Math.min(pagination.state.totalPages - 1, pagination.state.currentPage + halfVisible)
    
    if (start > 2) {
      pages.push(-1) // Ellipsis
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages - 1) {
      pages.push(-1) // Ellipsis
    }
    
    // Always show last page
    if (pagination.state.totalPages > 1) {
      pages.push(pagination.state.totalPages)
    }
    
    return pages
  }, [pagination.state.currentPage, pagination.state.totalPages, maxVisiblePages, showAllPages])
  
  // Calculate preload progress
  useEffect(() => {
    const totalLoaded = pagination.state.loadedPages.size + pagination.state.preloadedPages.size
    const progress = pagination.state.totalPages > 0 ? (totalLoaded / pagination.state.totalPages) * 100 : 0
    setPreloadProgress(progress)
  }, [pagination.state.loadedPages.size, pagination.state.preloadedPages.size, pagination.state.totalPages])
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page === pagination.state.currentPage) return
    
    pagination.actions.goToPage(page)
    onPageChange?.(page)
  }
  
  // Handle preload page
  const handlePreloadPage = (page: number) => {
    if (page > 0 && page <= pagination.state.totalPages) {
      pagination.actions.preloadPage(page)
      onPreloadPage?.(page)
    }
  }
  
  // Handle refresh
  const handleRefresh = () => {
    pagination.actions.refreshAll()
    onRefresh?.()
  }
  
  // Get page status
  const getPageStatus = (page: number) => {
    if (page === pagination.state.currentPage) return 'current'
    if (pagination.state.loadedPages.has(page)) return 'loaded'
    if (pagination.state.preloadedPages.has(page)) return 'preloaded'
    return 'pending'
  }
  
  // Render page number button
  const renderPageButton = (page: number, index: number) => {
    if (page === -1) {
      return (
        <button
          key={`ellipsis-${index}`}
          className="px-3 py-2 text-white/40 hover:text-white/60 transition-colors"
          onClick={() => setShowAllPages(!showAllPages)}
        >
          ...
        </button>
      )
    }
    
    const isCurrent = page === pagination.state.currentPage
    const isLoaded = pagination.state.loadedPages.has(page)
    const isPreloaded = pagination.state.preloadedPages.has(page)
    
    return (
      <button
        key={page}
        onClick={() => handlePageChange(page)}
        disabled={pagination.state.isLoading}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isCurrent
            ? 'bg-blue-500 text-white'
            : isLoaded
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : isPreloaded
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
            : 'bg-white/10 text-white/80 hover:bg-white/20'
        } ${pagination.state.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={`Trang ${page} - ${isCurrent ? 'Hiện tại' : isLoaded ? 'Đã tải' : isPreloaded ? 'Tải trước' : 'Chưa tải'}`}
      >
        {page}
      </button>
    )
  }
  
  // Render compact view
  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.state.currentPage - 1)}
            disabled={!pagination.hasPrevPage || pagination.state.isLoading}
            className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          
          <span className="text-white/60 text-sm">
            {pagination.state.currentPage} / {pagination.state.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.state.currentPage + 1)}
            disabled={!pagination.hasNextPage || pagination.state.isLoading}
            className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
        
        {showPreloadIndicators && (
          <PreloadIndicator
            isPreloading={pagination.state.isPreloading}
            preloadedPages={Array.from(pagination.state.preloadedPages)}
            currentPage={pagination.state.currentPage}
          />
        )}
      </div>
    )
  }
  
  // Render full view
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Info */}
        {showInfo && (
          <div className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
            Hiển thị {(pagination.state.currentPage - 1) * pagination.state.itemsPerPage + 1}-
            {Math.min(pagination.state.currentPage * pagination.state.itemsPerPage, pagination.state.totalItems)} 
            trong tổng số {pagination.state.totalItems} mục
            {pagination.state.isPreloading && (
              <span className="ml-2 text-blue-400">(Đang tải trước...)</span>
            )}
          </div>
        )}
        
        {/* Page Navigation */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(pagination.state.currentPage - 1)}
            disabled={!pagination.hasPrevPage || pagination.state.isLoading}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">Trước</span>
          </button>
          
          {/* Page Numbers */}
          {showPageNumbers && (
            <div className="flex items-center gap-1">
              {visiblePages.map((page, index) => renderPageButton(page, index))}
            </div>
          )}
          
          {/* Next Button */}
          <button
            onClick={() => handlePageChange(pagination.state.currentPage + 1)}
            disabled={!pagination.hasNextPage || pagination.state.isLoading}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Sau</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Preload Indicators */}
      {showPreloadIndicators && (
        <PreloadIndicators
          currentPage={pagination.state.currentPage}
          totalPages={pagination.state.totalPages}
          loadedPages={pagination.state.loadedPages}
          preloadedPages={pagination.state.preloadedPages}
          isPreloading={pagination.state.isPreloading}
          showPageStatus={showPageStatus}
          showCacheStats={showCacheStats}
          maxVisiblePages={maxVisiblePages}
        />
      )}
      
      {/* Progressive Loading */}
      {showProgressiveLoading && (isInitialLoading || isRefreshing) && (
        <ProgressiveLoading
          stages={[
            {
              id: 'load-data',
              name: 'Tải dữ liệu',
              description: 'Đang tải dữ liệu từ server',
              status: isInitialLoading ? 'loading' : 'completed',
              progress: preloadProgress
            },
            {
              id: 'process-data',
              name: 'Xử lý dữ liệu',
              description: 'Đang xử lý và format dữ liệu',
              status: isInitialLoading ? 'loading' : 'completed'
            },
            {
              id: 'render-ui',
              name: 'Hiển thị giao diện',
              description: 'Đang render giao diện người dùng',
              status: isInitialLoading ? 'loading' : 'completed'
            }
          ]}
          currentStage={isInitialLoading ? 'load-data' : undefined}
          showProgress={true}
          showStages={true}
          showTiming={true}
          compact={false}
        />
      )}
      
      {/* Loading States */}
      {pagination.state.isLoading && !isInitialLoading && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white/60 text-sm">{loadingMessage}</span>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {pagination.state.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h4 className="text-red-400 text-sm font-medium">Lỗi tải dữ liệu</h4>
              <p className="text-red-400/60 text-xs">{pagination.state.error}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
