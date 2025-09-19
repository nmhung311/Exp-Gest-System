// Infinite Scroll Hook
// Hook cho infinite scroll với preload pagination

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PreloadPaginationConfig, PaginationState } from '@/lib/types/pagination'
import { PaginationCacheManager } from '@/lib/utils/paginationCache'

interface InfiniteScrollOptions<T = any> {
  // Data fetching
  fetchData: (page: number, itemsPerPage: number) => Promise<{
    data: T[]
    totalItems: number
    totalPages: number
  }>
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Infinite scroll settings
  threshold?: number // Distance from bottom to trigger load (in pixels)
  rootMargin?: string // Intersection observer root margin
  enabled?: boolean // Enable/disable infinite scroll
  
  // Callbacks
  onLoadMore?: (page: number) => void
  onError?: (error: Error, page: number) => void
  onSuccess?: (data: T[], page: number) => void
  
  // Dependencies
  dependencies?: React.DependencyList
}

interface InfiniteScrollState<T = any> {
  // Data
  items: T[]
  allItems: T[] // All loaded items for infinite scroll
  
  // Pagination
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  
  // Loading states
  isLoading: boolean
  isLoadingMore: boolean
  isPreloading: boolean
  hasMore: boolean
  
  // Error handling
  error: string | null
  retryCount: number
  
  // Performance
  loadedPages: Set<number>
  preloadedPages: Set<number>
  lastAccessTime: Map<number, number>
}

interface InfiniteScrollActions<T = any> {
  // Navigation
  loadMore: () => void
  goToPage: (page: number) => void
  refresh: () => void
  reset: () => void
  
  // Data management
  addItem: (item: T) => void
  updateItem: (index: number, item: T) => void
  removeItem: (index: number) => void
  
  // Configuration
  setEnabled: (enabled: boolean) => void
  setThreshold: (threshold: number) => void
  setItemsPerPage: (itemsPerPage: number) => void
}

export function useInfiniteScroll<T = any>({
  fetchData,
  config = {},
  threshold = 100,
  rootMargin = '0px',
  enabled = true,
  onLoadMore,
  onError,
  onSuccess,
  dependencies = []
}: InfiniteScrollOptions<T>): {
  state: InfiniteScrollState<T>
  actions: InfiniteScrollActions<T>
  scrollRef: React.RefObject<HTMLDivElement>
  loadMoreRef: React.RefObject<HTMLDivElement>
} {
  
  // Merge config with defaults
  const finalConfig: PreloadPaginationConfig = {
    itemsPerPage: 10,
    preloadPages: 2,
    cacheSize: 20,
    enableInfiniteScroll: true,
    enableBackgroundPreload: true,
    preloadDelay: 300,
    ...config
  }
  
  // Initialize state
  const [state, setState] = useState<InfiniteScrollState<T>>({
    items: [],
    allItems: [],
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: finalConfig.itemsPerPage,
    isLoading: false,
    isLoadingMore: false,
    isPreloading: false,
    hasMore: true,
    error: null,
    retryCount: 0,
    loadedPages: new Set(),
    preloadedPages: new Set(),
    lastAccessTime: new Map()
  })
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const cacheManager = useRef(new PaginationCacheManager<T>(finalConfig.cacheSize))
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(false)
  
  // Load page data
  const loadPage = useCallback(async (page: number, isPreload: boolean = false) => {
    if (isLoadingRef.current) return
    
    // Check cache first
    const cachedData = cacheManager.current.get(page)
    if (cachedData) {
      setState(prev => ({
        ...prev,
        items: page === 1 ? cachedData.data : [...prev.allItems, ...cachedData.data],
        allItems: page === 1 ? cachedData.data : [...prev.allItems, ...cachedData.data],
        currentPage: page,
        loadedPages: new Set([...prev.loadedPages, page]),
        hasMore: page < prev.totalPages
      }))
      return
    }
    
    isLoadingRef.current = true
    
    setState(prev => ({
      ...prev,
      isLoading: page === 1,
      isLoadingMore: page > 1,
      isPreloading: isPreload,
      error: null
    }))
    
    try {
      const result = await fetchData(page, finalConfig.itemsPerPage)
      
      // Update cache
      cacheManager.current.set(page, result.data)
      
      setState(prev => {
        const newItems = page === 1 ? result.data : [...prev.allItems, ...result.data]
        const newLoadedPages = new Set([...prev.loadedPages, page])
        const newPreloadedPages = isPreload ? new Set([...prev.preloadedPages, page]) : prev.preloadedPages
        
        return {
          ...prev,
          items: newItems,
          allItems: newItems,
          currentPage: page,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          isLoading: false,
          isLoadingMore: false,
          isPreloading: false,
          hasMore: page < result.totalPages,
          loadedPages: newLoadedPages,
          preloadedPages: newPreloadedPages,
          error: null,
          retryCount: 0
        }
      })
      
      onSuccess?.(result.data, page)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        isPreloading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }))
      
      onError?.(error as Error, page)
    } finally {
      isLoadingRef.current = false
    }
  }, [fetchData, finalConfig.itemsPerPage, onSuccess, onError])
  
  // Load more data
  const loadMore = useCallback(() => {
    if (!state.hasMore || state.isLoadingMore || state.isLoading) return
    
    const nextPage = state.currentPage + 1
    loadPage(nextPage)
    onLoadMore?.(nextPage)
  }, [state.hasMore, state.isLoadingMore, state.isLoading, state.currentPage, loadPage, onLoadMore])
  
  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > state.totalPages) return
    
    // If page is already loaded, just update current page
    if (state.loadedPages.has(page)) {
      const cachedData = cacheManager.current.get(page)
      if (cachedData) {
        setState(prev => ({
          ...prev,
          currentPage: page,
          items: cachedData.data
        }))
        return
      }
    }
    
    // Load page
    loadPage(page)
  }, [state.totalPages, state.loadedPages, loadPage])
  
  // Refresh data
  const refresh = useCallback(() => {
    cacheManager.current.clear()
    setState(prev => ({
      ...prev,
      items: [],
      allItems: [],
      currentPage: 1,
      loadedPages: new Set(),
      preloadedPages: new Set(),
      hasMore: true,
      error: null,
      retryCount: 0
    }))
    loadPage(1)
  }, [loadPage])
  
  // Reset to initial state
  const reset = useCallback(() => {
    cacheManager.current.clear()
    setState({
      items: [],
      allItems: [],
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: finalConfig.itemsPerPage,
      isLoading: false,
      isLoadingMore: false,
      isPreloading: false,
      hasMore: true,
      error: null,
      retryCount: 0,
      loadedPages: new Set(),
      preloadedPages: new Set(),
      lastAccessTime: new Map()
    })
  }, [finalConfig.itemsPerPage])
  
  // Add item
  const addItem = useCallback((item: T) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, item],
      allItems: [...prev.allItems, item],
      totalItems: prev.totalItems + 1
    }))
  }, [])
  
  // Update item
  const updateItem = useCallback((index: number, item: T) => {
    setState(prev => {
      const newItems = [...prev.items]
      const newAllItems = [...prev.allItems]
      
      if (index >= 0 && index < newItems.length) {
        newItems[index] = item
      }
      
      if (index >= 0 && index < newAllItems.length) {
        newAllItems[index] = item
      }
      
      return {
        ...prev,
        items: newItems,
        allItems: newAllItems
      }
    })
  }, [])
  
  // Remove item
  const removeItem = useCallback((index: number) => {
    setState(prev => {
      const newItems = [...prev.items]
      const newAllItems = [...prev.allItems]
      
      if (index >= 0 && index < newItems.length) {
        newItems.splice(index, 1)
      }
      
      if (index >= 0 && index < newAllItems.length) {
        newAllItems.splice(index, 1)
      }
      
      return {
        ...prev,
        items: newItems,
        allItems: newAllItems,
        totalItems: Math.max(0, prev.totalItems - 1)
      }
    })
  }, [])
  
  // Set enabled
  const setEnabled = useCallback((enabled: boolean) => {
    if (enabled) {
      // Re-enable intersection observer
      if (loadMoreRef.current && observerRef.current) {
        observerRef.current.observe(loadMoreRef.current)
      }
    } else {
      // Disable intersection observer
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])
  
  // Set threshold
  const setThreshold = useCallback((threshold: number) => {
    // Recreate observer with new threshold
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    if (loadMoreRef.current && enabled) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries
          if (entry.isIntersecting && state.hasMore && !state.isLoadingMore) {
            loadMore()
          }
        },
        {
          rootMargin: rootMargin,
          threshold: 0.1
        }
      )
      
      observerRef.current.observe(loadMoreRef.current)
    }
  }, [enabled, rootMargin, state.hasMore, state.isLoadingMore, loadMore])
  
  // Set items per page
  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setState(prev => ({
      ...prev,
      itemsPerPage
    }))
    reset()
  }, [reset])
  
  // Setup intersection observer
  useEffect(() => {
    if (!enabled || !loadMoreRef.current) return
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && state.hasMore && !state.isLoadingMore) {
          loadMore()
        }
      },
      {
        rootMargin: rootMargin,
        threshold: 0.1
      }
    )
    
    observerRef.current.observe(loadMoreRef.current)
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, rootMargin, state.hasMore, state.isLoadingMore, loadMore])
  
  // Initial load
  useEffect(() => {
    loadPage(1)
  }, [...dependencies, loadPage])
  
  // Preload next pages
  useEffect(() => {
    if (!finalConfig.enableBackgroundPreload || state.isLoading || state.isLoadingMore) return
    
    const preloadPages = []
    for (let i = 1; i <= finalConfig.preloadPages; i++) {
      const page = state.currentPage + i
      if (page <= state.totalPages && !state.loadedPages.has(page) && !state.preloadedPages.has(page)) {
        preloadPages.push(page)
      }
    }
    
    if (preloadPages.length > 0) {
      const timer = setTimeout(() => {
        preloadPages.forEach(page => loadPage(page, true))
      }, finalConfig.preloadDelay)
      
      return () => clearTimeout(timer)
    }
  }, [state.currentPage, state.totalPages, state.loadedPages, state.preloadedPages, state.isLoading, state.isLoadingMore, finalConfig.enableBackgroundPreload, finalConfig.preloadPages, finalConfig.preloadDelay, loadPage])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      cacheManager.current.clear()
    }
  }, [])
  
  // Actions object
  const actions: InfiniteScrollActions<T> = {
    loadMore,
    goToPage,
    refresh,
    reset,
    addItem,
    updateItem,
    removeItem,
    setEnabled,
    setThreshold,
    setItemsPerPage
  }
  
  return {
    state,
    actions,
    scrollRef,
    loadMoreRef
  }
}

export default useInfiniteScroll
