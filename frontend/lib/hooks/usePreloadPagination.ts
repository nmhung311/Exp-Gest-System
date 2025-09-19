// Custom Hook: usePreloadPagination
// Hook tái sử dụng cho tất cả các trang có pagination

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  PreloadPaginationConfig, 
  PaginationState, 
  PreloadPaginationActions, 
  PreloadPaginationHook,
  DEFAULT_PAGINATION_CONFIG 
} from '@/lib/types/pagination'
import { PaginationCacheManager, paginationUtils, performanceMonitor } from '@/lib/utils/paginationCache'
import { batchLoadWithRetry } from '@/lib/api/batchApi'

interface UsePreloadPaginationOptions<T = any> {
  // API function to fetch data
  fetchData: (page: number, itemsPerPage: number) => Promise<{
    data: T[]
    totalItems: number
    totalPages: number
  }>
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Initial data (optional)
  initialData?: T[]
  initialTotalItems?: number
  
  // Dependencies that should trigger refresh
  dependencies?: any[]
  
  // Error handling
  onError?: (error: Error, page: number) => void
  
  // Success callback
  onSuccess?: (data: T[], page: number) => void
}

export function usePreloadPagination<T = any>({
  fetchData,
  config = {},
  initialData = [],
  initialTotalItems = 0,
  dependencies = [],
  onError,
  onSuccess
}: UsePreloadPaginationOptions<T>): PreloadPaginationHook<T> {
  
  // Merge config with defaults
  const finalConfig: PreloadPaginationConfig = {
    ...DEFAULT_PAGINATION_CONFIG,
    ...config
  }
  
  // Initialize state
  const [state, setState] = useState<PaginationState<T>>({
    currentPage: 1,
    totalPages: 0,
    totalItems: initialTotalItems,
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
  
  // Abort controller for canceling requests
  const abortController = useRef<AbortController | null>(null)
  
  // Load page data
  const loadPage = useCallback(async (page: number, isPreload: boolean = false) => {
    // Check if page is already loaded
    if (cacheManager.current.has(page) && !isPreload) {
      const cachedData = cacheManager.current.get(page)
      if (cachedData) {
        setState(prev => ({
          ...prev,
          pageData: new Map(prev.pageData.set(page, cachedData.data)),
          loadedPages: new Set(prev.loadedPages.add(page)),
          lastAccessTime: new Map(prev.lastAccessTime.set(page, Date.now()))
        }))
        return
      }
    }
    
    // Set loading state
    setState(prev => ({
      ...prev,
      isLoading: !isPreload,
      isPreloading: isPreload,
      error: null
    }))
    
    try {
      performanceMonitor.startTimer(`load-page-${page}`)
      
      const result = await fetchData(page, finalConfig.itemsPerPage)
      
      performanceMonitor.endTimer(`load-page-${page}`)
      performanceMonitor.incrementMetric('apiCallsCount')
      
      // Update cache
      cacheManager.current.set(page, result.data)
      
      // Update state
      setState(prev => {
        const newState = {
          ...prev,
          pageData: new Map(prev.pageData.set(page, result.data)),
          loadedPages: new Set(prev.loadedPages.add(page)),
          lastAccessTime: new Map(prev.lastAccessTime.set(page, Date.now())),
          totalItems: result.totalItems,
          totalPages: result.totalPages,
          isLoading: false,
          isPreloading: false,
          isInitialLoad: false,
          error: null,
          retryCount: 0
        }
        
        if (isPreload) {
          newState.preloadedPages = new Set(prev.preloadedPages.add(page))
        }
        
        return newState
      })
      
      // Call success callback
      onSuccess?.(result.data, page)
      
    } catch (error) {
      performanceMonitor.endTimer(`load-page-${page}`)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPreloading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }))
      
      // Call error callback
      onError?.(error as Error, page)
    }
  }, [fetchData, finalConfig.itemsPerPage, onError, onSuccess])
  
  // Preload next pages
  const preloadNext = useCallback(async () => {
    if (!finalConfig.enableBackgroundPreload) return
    
    const candidates = cacheManager.current.getPreloadCandidates(
      state.currentPage, 
      finalConfig.preloadPages
    )
    
    for (const page of candidates) {
      if (page <= state.totalPages) {
        // Add delay between preloads
        if (finalConfig.preloadDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, finalConfig.preloadDelay))
        }
        
        await loadPage(page, true)
      }
    }
  }, [state.currentPage, state.totalPages, finalConfig.preloadPages, finalConfig.enableBackgroundPreload, finalConfig.preloadDelay, loadPage])
  
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
  }, dependencies)
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort()
      }
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

// Export default hook
export default usePreloadPagination
