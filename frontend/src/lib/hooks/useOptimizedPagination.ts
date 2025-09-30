// Optimized Pagination Hook with Batch Loading
// Hook tối ưu sử dụng batch API cho preload pagination

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  PreloadPaginationConfig, 
  PaginationState, 
  PreloadPaginationActions, 
  PreloadPaginationHook,
  DEFAULT_PAGINATION_CONFIG 
} from '@/lib/types/pagination'
import { PaginationCacheManager, paginationUtils, performanceMonitor } from '@/lib/utils/paginationCache'
import { 
  batchGetGuests, 
  batchGetEvents, 
  batchGetCheckin,
  smartGuestsLoader,
  smartEventsLoader,
  smartCheckinLoader
} from '@/lib/api/batchApi'

interface OptimizedPaginationOptions<T = any> {
  // Entity type for batch loading
  entityType: 'guests' | 'events' | 'checkin'
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Filters
  filters: Record<string, any>
  
  // Callbacks
  onError?: (error: Error, page: number) => void
  onSuccess?: (data: T[], page: number) => void
  onFiltersChange?: (filters: Record<string, any>) => void
}

export function useOptimizedPagination<T = any>({
  entityType,
  config = {},
  filters,
  onError,
  onSuccess,
  onFiltersChange
}: OptimizedPaginationOptions<T>): PreloadPaginationHook<T> {
  
  // Merge config with defaults
  const finalConfig: PreloadPaginationConfig = {
    ...DEFAULT_PAGINATION_CONFIG,
    ...config
  }
  
  // Initialize state
  const [state, setState] = useState<PaginationState<T>>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: finalConfig.itemsPerPage,
    pageData: new Map(),
    loadedPages: new Set(),
    preloadedPages: new Set(),
    lastAccessTime: new Map(),
    isLoading: false,
    isPreloading: false,
    isInitialLoad: true,
    error: null,
    retryCount: 0
  })
  
  // Cache manager
  const cacheManager = useRef(new PaginationCacheManager<T>(finalConfig.cacheSize))
  
  // Get appropriate batch loader
  const getBatchLoader = useCallback(() => {
    switch (entityType) {
      case 'guests':
        return smartGuestsLoader
      case 'events':
        return smartEventsLoader
      case 'checkin':
        return smartCheckinLoader
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }, [entityType])
  
  // Load pages using batch API
  const loadPages = useCallback(async (pages: number[], isPreload: boolean = false) => {
    // Check if pages are already loaded
    const unloadedPages = pages.filter(page => !cacheManager.current.has(page))
    
    if (unloadedPages.length === 0) {
      // All pages are already loaded, just update state
      const pageData = new Map(state.pageData)
      const loadedPages = new Set(state.loadedPages)
      const preloadedPages = new Set(state.preloadedPages)
      
      pages.forEach(page => {
        const cachedData = cacheManager.current.get(page)
        if (cachedData) {
          pageData.set(page, cachedData.data)
          loadedPages.add(page)
          if (isPreload) {
            preloadedPages.add(page)
          }
        }
      })
      
      setState(prev => ({
        ...prev,
        pageData,
        loadedPages,
        preloadedPages
      }))
      return
    }
    
    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: !isPreload,
      isPreloading: isPreload,
      error: null
    }))
    
    try {
      performanceMonitor.startTimer(`batch-load-${entityType}`)
      
      const batchLoader = getBatchLoader()
      const result = await batchLoader.loadPages(
        unloadedPages,
        filters,
        {
          useCache: true,
          maxConcurrent: 3,
          retryAttempts: 2
        }
      )
      
      performanceMonitor.endTimer(`batch-load-${entityType}`)
      performanceMonitor.incrementMetric('apiCallsCount')
      
      // Update cache
      Object.entries(result.data).forEach(([pageStr, data]) => {
        const page = parseInt(pageStr)
        cacheManager.current.set(page, data)
      })
      
      // Update state
      setState(prev => {
        const newPageData = new Map(prev.pageData)
        const newLoadedPages = new Set(prev.loadedPages)
        const newPreloadedPages = new Set(prev.preloadedPages)
        
        Object.entries(result.data).forEach(([pageStr, data]) => {
          const page = parseInt(pageStr)
          newPageData.set(page, data)
          newLoadedPages.add(page)
          if (isPreload) {
            newPreloadedPages.add(page)
          }
        })
        
        return {
          ...prev,
          pageData: newPageData,
          loadedPages: newLoadedPages,
          preloadedPages: newPreloadedPages,
          totalItems: result.pagination.total_items,
          totalPages: result.pagination.total_pages,
          isLoading: false,
          isPreloading: false,
          isInitialLoad: false,
          error: null,
          retryCount: 0
        }
      })
      
      // Call success callbacks
      Object.entries(result.data).forEach(([pageStr, data]) => {
        const page = parseInt(pageStr)
        onSuccess?.(data, page)
      })
      
    } catch (error) {
      performanceMonitor.endTimer(`batch-load-${entityType}`)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPreloading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }))
      
      // Call error callbacks
      unloadedPages.forEach(page => {
        onError?.(error as Error, page)
      })
    }
  }, [entityType, filters, state.pageData, state.loadedPages, state.preloadedPages, getBatchLoader, onError, onSuccess])
  
  // Load single page
  const loadPage = useCallback(async (page: number, isPreload: boolean = false) => {
    await loadPages([page], isPreload)
  }, [loadPages])
  
  // Preload next pages
  const preloadNext = useCallback(async () => {
    if (!finalConfig.enableBackgroundPreload) return
    
    const currentPage = state.currentPage
    const candidates = cacheManager.current.getPreloadCandidates(
      currentPage, 
      finalConfig.preloadPages
    )
    
    if (candidates.length > 0) {
      // Add delay between preloads
      if (finalConfig.preloadDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, finalConfig.preloadDelay))
      }
      
      await loadPages(candidates, true)
    }
  }, [state.currentPage, finalConfig.preloadPages, finalConfig.enableBackgroundPreload, finalConfig.preloadDelay, loadPages])
  
  // Preload specific page
  const preloadPage = useCallback(async (page: number) => {
    if (page <= state.totalPages && !cacheManager.current.has(page)) {
      await loadPage(page, true)
    }
  }, [state.totalPages, loadPage])
  
  // Navigation actions
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return
    
    setState(prev => ({
      ...prev,
      currentPage: page
    }))
    
    // Load page if not cached
    if (!cacheManager.current.has(page)) {
      loadPage(page)
    }
    
    // Preload next pages
    preloadNext()
    
    performanceMonitor.incrementMetric('userInteractions')
  }, [state.totalPages, loadPage, preloadNext])
  
  const nextPage = useCallback(() => {
    if (state.currentPage < state.totalPages) {
      goToPage(state.currentPage + 1)
    }
  }, [state.currentPage, state.totalPages, goToPage])
  
  const prevPage = useCallback(() => {
    if (state.currentPage > 1) {
      goToPage(state.currentPage - 1)
    }
  }, [state.currentPage, goToPage])
  
  const goToFirstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])
  
  const goToLastPage = useCallback(() => {
    goToPage(state.totalPages)
  }, [state.totalPages, goToPage])
  
  // Data management actions
  const refreshPage = useCallback(async (page: number = state.currentPage) => {
    cacheManager.current.delete(page)
    await loadPage(page)
  }, [state.currentPage, loadPage])
  
  const refreshAll = useCallback(async () => {
    cacheManager.current.clear()
    setState(prev => ({
      ...prev,
      pageData: new Map(),
      loadedPages: new Set(),
      preloadedPages: new Set(),
      currentPage: 1
    }))
    await loadPage(1)
  }, [loadPage])
  
  const clearCache = useCallback(() => {
    cacheManager.current.clear()
    setState(prev => ({
      ...prev,
      pageData: new Map(),
      loadedPages: new Set(),
      preloadedPages: new Set()
    }))
  }, [])
  
  // Configuration actions
  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setState(prev => ({
      ...prev,
      itemsPerPage
    }))
    clearCache()
    loadPage(1)
  }, [clearCache, loadPage])
  
  const setConfig = useCallback((newConfig: Partial<PreloadPaginationConfig>) => {
    Object.assign(finalConfig, newConfig)
  }, [])
  
  // Computed values
  const currentItems = useMemo(() => {
    return state.pageData.get(state.currentPage) || []
  }, [state.pageData, state.currentPage])
  
  const hasNextPage = useMemo(() => {
    return paginationUtils.hasNextPage(state.currentPage, state.totalPages)
  }, [state.currentPage, state.totalPages])
  
  const hasPrevPage = useMemo(() => {
    return paginationUtils.hasPrevPage(state.currentPage)
  }, [state.currentPage])
  
  const isPageLoaded = useCallback((page: number) => {
    return state.loadedPages.has(page)
  }, [state.loadedPages])
  
  const isPagePreloaded = useCallback((page: number) => {
    return state.preloadedPages.has(page)
  }, [state.preloadedPages])
  
  const paginationInfo = useMemo(() => {
    return paginationUtils.getPaginationInfo(
      state.currentPage,
      state.itemsPerPage,
      state.totalItems
    )
  }, [state.currentPage, state.itemsPerPage, state.totalItems])
  
  // Actions object
  const actions: PreloadPaginationActions<T> = {
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    refreshPage,
    refreshAll,
    clearCache,
    preloadNext,
    preloadPage,
    setItemsPerPage,
    setConfig
  }
  
  // Initial load
  useEffect(() => {
    if (state.isInitialLoad) {
      loadPage(1)
    }
  }, [state.isInitialLoad, loadPage])
  
  // Dependencies change - refresh data
  useEffect(() => {
    if (!state.isInitialLoad) {
      refreshAll()
    }
  }, [filters])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear cache on unmount
      cacheManager.current.clear()
    }
  }, [])
  
  // Performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        performanceMonitor.logMetrics()
      }, 30000) // Log every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [])
  
  return {
    state,
    actions,
    currentItems,
    hasNextPage,
    hasPrevPage,
    isPageLoaded,
    isPagePreloaded,
    paginationInfo
  }
}

export default useOptimizedPagination
