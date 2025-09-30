// Responsive Pagination Manager
// Manager component để tự động chọn pagination mode phù hợp

import React, { useState, useEffect, useMemo } from 'react'
import { PreloadPaginationHook } from '@/lib/types/pagination'
import PreloadPagination from './PreloadPagination'
import InfiniteScrollPagination from './InfiniteScrollPagination'
import MobilePagination from './MobilePagination'
import EnhancedPagination from './EnhancedPagination'

interface ResponsivePaginationManagerProps<T = any> {
  // Pagination state
  pagination: PreloadPaginationHook<T>
  
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
  
  // Infinite scroll settings
  infiniteScrollConfig?: {
    threshold?: number
    rootMargin?: string
    enabled?: boolean
  }
  
  // Callbacks
  onPageChange?: (page: number) => void
  onLoadMore?: (page: number) => void
  onScrollToTop?: () => void
  onItemClick?: (item: T, index: number) => void
  
  // Render props
  renderItem?: (item: T, index: number) => React.ReactNode
  renderLoadMore?: () => React.ReactNode
  renderEmpty?: () => React.ReactNode
  renderError?: (error: string, retry: () => void) => React.ReactNode
  
  // Dependencies
  dependencies?: React.DependencyList
}

export default function ResponsivePaginationManager<T = any>({
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
  infiniteScrollConfig = {},
  onPageChange,
  onLoadMore,
  onScrollToTop,
  onItemClick,
  renderItem,
  renderLoadMore,
  renderEmpty,
  renderError,
  dependencies = []
}: ResponsivePaginationManagerProps<T>) {
  
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [preferredMode, setPreferredMode] = useState<'pagination' | 'infinite-scroll' | 'auto'>('auto')
  const [userPreference, setUserPreference] = useState<string | null>(null)
  
  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  // Load user preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pagination-mode-preference')
      if (saved) {
        setUserPreference(saved)
      }
    } catch (error) {
      console.warn('Failed to load pagination preference:', error)
    }
  }, [])
  
  // Save user preference
  const saveUserPreference = (mode: string) => {
    try {
      localStorage.setItem('pagination-mode-preference', mode)
      setUserPreference(mode)
    } catch (error) {
      console.warn('Failed to save pagination preference:', error)
    }
  }
  
  // Determine pagination mode
  const paginationMode = useMemo(() => {
    // User preference takes priority
    if (userPreference) {
      return userPreference as 'pagination' | 'infinite-scroll' | 'auto'
    }
    
    // Auto mode based on screen size
    if (preferredMode === 'auto') {
      switch (screenSize) {
        case 'mobile':
          return 'infinite-scroll'
        case 'tablet':
          return 'pagination'
        case 'desktop':
          return 'pagination'
        default:
          return 'pagination'
      }
    }
    
    return preferredMode
  }, [userPreference, preferredMode, screenSize])
  
  // Get pagination component props
  const getPaginationProps = () => ({
    pagination,
    showInfo,
    showPageNumbers,
    showPreloadIndicators,
    showProgressiveLoading,
    showPageStatus,
    showCacheStats,
    maxVisiblePages,
    compact,
    className,
    onPageChange,
    onLoadMore,
    onScrollToTop,
    onItemClick,
    renderItem,
    renderLoadMore,
    renderEmpty,
    renderError,
    dependencies
  })
  
  // Get infinite scroll props
  const getInfiniteScrollProps = () => ({
    fetchData: async (page: number) => {
      await pagination.actions.refreshPage(page)
      return {
        data: pagination.currentItems,
        totalItems: pagination.state.totalItems,
        totalPages: pagination.state.totalPages
      }
    },
    config: {
      itemsPerPage: pagination.state.itemsPerPage,
      preloadPages: 2,
      cacheSize: 20,
      enableBackgroundPreload: true,
      preloadDelay: 300
    },
    threshold: infiniteScrollConfig.threshold || 100,
    rootMargin: infiniteScrollConfig.rootMargin || '0px',
    enabled: infiniteScrollConfig.enabled !== false,
    showInfo,
    showPreloadIndicator: showPreloadIndicators,
    showLoadMoreButton: true,
    showScrollToTop: true,
    className,
    renderItem,
    renderLoadMore: renderLoadMore ? () => <>{renderLoadMore()}</> : undefined,
    renderEmpty: renderEmpty ? () => <>{renderEmpty()}</> : undefined,
    renderError: renderError ? (error: string, retry: () => void) => <>{renderError(error, retry)}</> : undefined,
    onLoadMore,
    onError: pagination.actions.refreshAll,
    onSuccess: pagination.actions.refreshAll,
    onItemClick,
    dependencies
  })
  
  // Get mobile pagination props
  const getMobilePaginationProps = () => ({
    pagination,
    mode: paginationMode,
    showInfo,
    showPreloadIndicator: showPreloadIndicators,
    showPageStatus,
    showScrollToTop: true,
    infiniteScrollConfig,
    className,
    compact,
    onPageChange,
    onLoadMore,
    onScrollToTop,
    renderItem,
    renderLoadMore,
    renderEmpty,
    renderError
  })
  
  // Render mode selector
  const renderModeSelector = () => {
    if (compact) return null
    
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-white/60 text-sm">Chế độ hiển thị:</span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setPreferredMode('pagination')
              saveUserPreference('pagination')
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              paginationMode === 'pagination'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Trang
          </button>
          <button
            onClick={() => {
              setPreferredMode('infinite-scroll')
              saveUserPreference('infinite-scroll')
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              paginationMode === 'infinite-scroll'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Cuộn
          </button>
          <button
            onClick={() => {
              setPreferredMode('auto')
              saveUserPreference('auto')
            }}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              paginationMode === 'auto'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            Tự động
          </button>
        </div>
      </div>
    )
  }
  
  // Render based on mode
  const renderPagination = () => {
    switch (paginationMode) {
      case 'infinite-scroll':
        return <InfiniteScrollPagination {...getInfiniteScrollProps()} />
      
      case 'pagination':
        return <PreloadPagination {...getPaginationProps()} />
      
      case 'auto':
      default:
        return <MobilePagination {...getMobilePaginationProps()} />
    }
  }
  
  // Render screen size indicator
  const renderScreenSizeIndicator = () => {
    if (compact || process.env.NODE_ENV === 'production') return null
    
    return (
      <div className="text-xs text-white/40 mb-2">
        Màn hình: {screenSize} | Chế độ: {paginationMode}
      </div>
    )
  }
  
  return (
    <div className={className}>
      {/* Mode selector */}
      {renderModeSelector()}
      
      {/* Screen size indicator */}
      {renderScreenSizeIndicator()}
      
      {/* Pagination component */}
      {renderPagination()}
    </div>
  )
}
