// Infinite Scroll Pagination Component
// Component pagination với infinite scroll cho mobile

import React, { useState, useEffect } from 'react'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { PreloadPaginationConfig } from '@/lib/types/pagination'
import { LoadingState, ErrorState, EmptyState } from '@/components/loading/AdvancedSkeletonLoader'
import { PreloadIndicator } from '@/components/loading/AdvancedSkeletonLoader'

interface InfiniteScrollPaginationProps<T = any> {
  // Data fetching
  fetchData: (page: number, itemsPerPage: number) => Promise<{
    data: T[]
    totalItems: number
    totalPages: number
  }>
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Infinite scroll settings
  threshold?: number
  rootMargin?: string
  enabled?: boolean
  
  // Display options
  showInfo?: boolean
  showPreloadIndicator?: boolean
  showLoadMoreButton?: boolean
  showScrollToTop?: boolean
  
  // Styling
  className?: string
  itemClassName?: string
  loadMoreClassName?: string
  
  // Render props
  renderItem: (item: T, index: number) => React.ReactNode
  renderLoadMore?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: (error: string, retry: () => void) => React.ReactNode
  
  // Callbacks
  onLoadMore?: (page: number) => void
  onError?: (error: Error, page: number) => void
  onSuccess?: (data: T[], page: number) => void
  onItemClick?: (item: T, index: number) => void
  
  // Dependencies
  dependencies?: React.DependencyList
}

export default function InfiniteScrollPagination<T = any>({
  fetchData,
  config = {},
  threshold = 100,
  rootMargin = '0px',
  enabled = true,
  showInfo = true,
  showPreloadIndicator = true,
  showLoadMoreButton = true,
  showScrollToTop = true,
  className = '',
  itemClassName = '',
  loadMoreClassName = '',
  renderItem,
  renderLoadMore,
  renderEmpty,
  renderError,
  onLoadMore,
  onError,
  onSuccess,
  onItemClick,
  dependencies = []
}: InfiniteScrollPaginationProps<T>) {
  
  const [showScrollToTopButton, setShowScrollToTopButton] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  
  // Use infinite scroll hook
  const {
    state,
    actions,
    scrollRef,
    loadMoreRef
  } = useInfiniteScroll({
    fetchData,
    config,
    threshold,
    rootMargin,
    enabled,
    onLoadMore,
    onError,
    onSuccess,
    dependencies
  })
  
  // Handle scroll to top
  const handleScrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }
  
  // Handle scroll position tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const scrollTop = target.scrollTop
    setScrollPosition(scrollTop)
    setShowScrollToTopButton(scrollTop > 300)
  }
  
  // Handle item click
  const handleItemClick = (item: T, index: number) => {
    onItemClick?.(item, index)
  }
  
  // Handle load more button click
  const handleLoadMoreClick = () => {
    actions.loadMore()
  }
  
  // Handle retry
  const handleRetry = () => {
    actions.refresh()
  }
  
  // Render load more button
  const renderLoadMoreButton = () => {
    if (!showLoadMoreButton || !state.hasMore) return null
    
    if (renderLoadMore) {
      return renderLoadMore()
    }
    
    return (
      <button
        onClick={handleLoadMoreClick}
        disabled={state.isLoadingMore}
        className={`w-full py-3 px-4 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${loadMoreClassName}`}
      >
        {state.isLoadingMore ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Đang tải thêm...</span>
          </div>
        ) : (
          <span>Tải thêm</span>
        )}
      </button>
    )
  }
  
  // Render scroll to top button
  const renderScrollToTopButton = () => {
    if (!showScrollToTop || !showScrollToTopButton) return null
    
    return (
      <button
        onClick={handleScrollToTop}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Lên đầu trang"
      >
        <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    )
  }
  
  // Render preload indicator
  const renderPreloadIndicator = () => {
    if (!showPreloadIndicator || !state.isPreloading) return null
    
    return (
      <div className="text-center py-2">
        <PreloadIndicator
          isPreloading={state.isPreloading}
          preloadedPages={Array.from(state.preloadedPages)}
          currentPage={state.currentPage}
        />
      </div>
    )
  }
  
  // Render info
  const renderInfo = () => {
    if (!showInfo) return null
    
    return (
      <div className="text-center py-2 text-white/60 text-sm">
        Hiển thị {state.items.length} / {state.totalItems} mục
        {state.isLoadingMore && (
          <span className="ml-2 text-blue-400">(Đang tải thêm...)</span>
        )}
      </div>
    )
  }
  
  // Render empty state
  if (state.items.length === 0 && !state.isLoading) {
    if (renderEmpty) {
      return renderEmpty()
    }
    
    return (
      <div className={className}>
        <EmptyState
          message="Không có dữ liệu"
          description="Chưa có dữ liệu nào để hiển thị"
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>
    )
  }
  
  // Render error state
  if (state.error && !state.isLoading) {
    if (renderError) {
      return renderError(state.error, handleRetry)
    }
    
    return (
      <div className={className}>
        <ErrorState
          message={state.error}
          onRetry={handleRetry}
        />
      </div>
    )
  }
  
  // Render main content
  return (
    <div className={`relative ${className}`}>
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Items */}
        <div className="space-y-2">
          {state.items.map((item, index) => (
            <div
              key={index}
              onClick={() => handleItemClick(item, index)}
              className={`cursor-pointer ${itemClassName}`}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
        
        {/* Load more trigger */}
        <div ref={loadMoreRef} className="py-4">
          {renderLoadMoreButton()}
        </div>
        
        {/* Preload indicator */}
        {renderPreloadIndicator()}
        
        {/* Info */}
        {renderInfo()}
      </div>
      
      {/* Scroll to top button */}
      {renderScrollToTopButton()}
      
      {/* Loading overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <LoadingState
            message="Đang tải dữ liệu..."
            showSpinner={true}
          />
        </div>
      )}
    </div>
  )
}
