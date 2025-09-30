// Mobile-Optimized Pagination Component
// Component pagination tối ưu cho mobile devices

import React, { useState, useEffect, useRef } from 'react'
import { PreloadPaginationHook } from '@/lib/types/pagination'
import { PreloadIndicator, PageStatusIndicator } from '@/components/loading/AdvancedSkeletonLoader'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'

interface MobilePaginationProps<T = any> {
  // Pagination state
  pagination: PreloadPaginationHook<T>
  
  // Display mode
  mode?: 'pagination' | 'infinite-scroll' | 'auto'
  
  // Configuration
  showInfo?: boolean
  showPreloadIndicator?: boolean
  showPageStatus?: boolean
  showScrollToTop?: boolean
  
  // Infinite scroll settings
  infiniteScrollConfig?: {
    threshold?: number
    rootMargin?: string
    enabled?: boolean
  }
  
  // Styling
  className?: string
  compact?: boolean
  
  // Callbacks
  onPageChange?: (page: number) => void
  onLoadMore?: (page: number) => void
  onScrollToTop?: () => void
  
  // Render props
  renderItem?: (item: T, index: number) => React.ReactNode
  renderLoadMore?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: (error: string, retry: () => void) => React.ReactNode
}

export default function MobilePagination<T = any>({
  pagination,
  mode = 'auto',
  showInfo = true,
  showPreloadIndicator = true,
  showPageStatus = false,
  showScrollToTop = true,
  infiniteScrollConfig = {},
  className = '',
  compact = false,
  onPageChange,
  onLoadMore,
  onScrollToTop,
  renderItem,
  renderLoadMore,
  renderEmpty,
  renderError
}: MobilePaginationProps<T>) {
  
  const [isMobile, setIsMobile] = useState(false)
  const [showAllPages, setShowAllPages] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Auto mode: use infinite scroll on mobile, pagination on desktop
  const actualMode = mode === 'auto' ? (isMobile ? 'infinite-scroll' : 'pagination') : mode
  
  // Handle scroll position tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const scrollTop = target.scrollTop
    setScrollPosition(scrollTop)
    setShowScrollToTopButton(scrollTop > 300)
  }
  
  // Handle scroll to top
  const handleScrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      onScrollToTop?.()
    }
  }
  
  // Handle page change
  const handlePageChange = (page: number) => {
    pagination.actions.goToPage(page)
    onPageChange?.(page)
  }
  
  // Handle load more
  const handleLoadMore = () => {
    const nextPage = pagination.state.currentPage + 1
    pagination.actions.goToPage(nextPage)
    onLoadMore?.(nextPage)
  }
  
  // Calculate visible pages for pagination mode
  const visiblePages = React.useMemo(() => {
    if (showAllPages || pagination.state.totalPages <= 5) {
      return Array.from({ length: pagination.state.totalPages }, (_, i) => i + 1)
    }
    
    const pages: number[] = []
    const currentPage = pagination.state.currentPage
    const totalPages = pagination.state.totalPages
    
    // Always show first page
    pages.push(1)
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
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
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }, [pagination.state.currentPage, pagination.state.totalPages, showAllPages])
  
  // Render pagination mode
  const renderPaginationMode = () => (
    <div className={`space-y-3 ${className}`}>
      {/* Main pagination */}
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(pagination.state.currentPage - 1)}
          disabled={!pagination.hasPrevPage || pagination.state.isLoading}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Trước</span>
        </button>
        
        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === -1) {
              return (
                <button
                  key={`ellipsis-${index}`}
                  onClick={() => setShowAllPages(!showAllPages)}
                  className="px-2 py-1 text-white/40 hover:text-white/60 transition-colors"
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
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-blue-500 text-white'
                    : isLoaded
                    ? 'bg-green-500/20 text-green-400'
                    : isPreloaded
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                } ${pagination.state.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {page}
              </button>
            )
          })}
        </div>
        
        {/* Next button */}
        <button
          onClick={() => handlePageChange(pagination.state.currentPage + 1)}
          disabled={!pagination.hasNextPage || pagination.state.isLoading}
          className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span className="hidden sm:inline">Sau</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Info */}
      {showInfo && (
        <div className="text-center text-white/60 text-sm">
          Trang {pagination.state.currentPage} / {pagination.state.totalPages}
          {pagination.state.isPreloading && (
            <span className="ml-2 text-blue-400">(Đang tải trước...)</span>
          )}
        </div>
      )}
      
      {/* Preload indicator */}
      {showPreloadIndicator && (
        <div className="text-center">
          <PreloadIndicator
            isPreloading={pagination.state.isPreloading}
            preloadedPages={Array.from(pagination.state.preloadedPages)}
            currentPage={pagination.state.currentPage}
          />
        </div>
      )}
    </div>
  )
  
  // Render infinite scroll mode
  const renderInfiniteScrollMode = () => (
    <div className={`space-y-3 ${className}`}>
      {/* Items container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Items */}
        {renderItem && (
          <div className="space-y-2">
            {pagination.currentItems.map((item, index) => (
              <div key={index}>
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
        
        {/* Load more trigger */}
        <div ref={loadMoreRef} className="py-4">
          {pagination.hasNextPage && (
            <button
              onClick={handleLoadMore}
              disabled={pagination.state.isLoading}
              className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pagination.state.isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải...</span>
                </div>
              ) : (
                <span>Tải thêm</span>
              )}
            </button>
          )}
        </div>
        
        {/* Info */}
        {showInfo && (
          <div className="text-center text-white/60 text-sm py-2">
            Hiển thị {pagination.currentItems.length} / {pagination.state.totalItems} mục
          </div>
        )}
        
        {/* Preload indicator */}
        {showPreloadIndicator && (
          <div className="text-center py-2">
            <PreloadIndicator
              isPreloading={pagination.state.isPreloading}
              preloadedPages={Array.from(pagination.state.preloadedPages)}
              currentPage={pagination.state.currentPage}
            />
          </div>
        )}
      </div>
      
      {/* Scroll to top button */}
      {showScrollToTop && showScrollToTopButton && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
          title="Lên đầu trang"
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
  
  // Render compact mode
  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
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
    )
  }
  
  // Render based on mode
  if (actualMode === 'infinite-scroll') {
    return renderInfiniteScrollMode()
  }
  
  return renderPaginationMode()
}
