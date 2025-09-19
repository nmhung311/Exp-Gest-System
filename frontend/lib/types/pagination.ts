// Preload Pagination Types và Interfaces
// Được sử dụng cho tất cả các trang trong hệ thống

export interface PreloadPaginationConfig {
  itemsPerPage: number
  preloadPages: number // Số trang preload (default: 2)
  cacheSize: number // Số trang cache tối đa (default: 10)
  enableInfiniteScroll: boolean // Bật infinite scroll cho mobile
  enableBackgroundPreload: boolean // Bật preload trong background
  preloadDelay: number // Delay trước khi preload (ms)
}

export interface PaginationState<T = any> {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  
  // Cache management
  pageData: Map<number, T[]>
  loadedPages: Set<number>
  preloadedPages: Set<number>
  lastAccessTime: Map<number, number>
  
  // Loading states
  isLoading: boolean
  isPreloading: boolean
  isInitialLoad: boolean
  
  // Error handling
  error: string | null
  retryCount: number
}

export interface PreloadPaginationActions<T = any> {
  // Navigation
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  
  // Data management
  refreshPage: (page?: number) => Promise<void>
  refreshAll: () => Promise<void>
  clearCache: () => void
  
  // Preload management
  preloadNext: () => Promise<void>
  preloadPage: (page: number) => Promise<void>
  
  // State management
  setItemsPerPage: (itemsPerPage: number) => void
  setConfig: (config: Partial<PreloadPaginationConfig>) => void
}

export interface PreloadPaginationHook<T = any> {
  // State
  state: PaginationState<T>
  actions: PreloadPaginationActions<T>
  
  // Computed values
  currentItems: T[]
  hasNextPage: boolean
  hasPrevPage: boolean
  isPageLoaded: (page: number) => boolean
  isPagePreloaded: (page: number) => boolean
  
  // Pagination info
  paginationInfo: {
    startIndex: number
    endIndex: number
    showingItems: number
    totalItems: number
  }
}

// API Response Types
export interface PaginationApiResponse<T = any> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  preloadedData?: {
    [page: number]: T[]
  }
}

export interface BatchPaginationApiResponse<T = any> {
  data: {
    [page: number]: T[]
  }
  pagination: {
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
  loadedPages: number[]
  preloadedPages: number[]
}

// Cache Management Types
export interface CacheEntry<T = any> {
  data: T[]
  timestamp: number
  accessCount: number
  lastAccess: number
}

export interface CacheManager<T = any> {
  get: (page: number) => CacheEntry<T> | null
  set: (page: number, data: T[]) => void
  has: (page: number) => boolean
  delete: (page: number) => void
  clear: () => void
  cleanup: () => void
  getStats: () => {
    size: number
    hitRate: number
    memoryUsage: number
  }
}

// Loading States
export type LoadingState = 'idle' | 'loading' | 'preloading' | 'error' | 'success'

export interface LoadingIndicatorProps {
  state: LoadingState
  message?: string
  progress?: number
}

// Preload Strategy Types
export type PreloadStrategy = 'aggressive' | 'conservative' | 'smart'

export interface PreloadStrategyConfig {
  strategy: PreloadStrategy
  preloadPages: number
  preloadDelay: number
  maxConcurrentPreloads: number
  enablePredictivePreload: boolean
}

// Mobile Optimization Types
export interface MobilePaginationConfig {
  enableInfiniteScroll: boolean
  infiniteScrollThreshold: number
  enablePullToRefresh: boolean
  enableSwipeNavigation: boolean
  itemsPerPageMobile: number
}

// Performance Monitoring Types
export interface PaginationMetrics {
  loadTime: number
  preloadTime: number
  cacheHitRate: number
  memoryUsage: number
  apiCallsCount: number
  userInteractions: number
}

export interface PerformanceMonitor {
  startTimer: (name: string) => void
  endTimer: (name: string) => number
  recordMetric: (metric: string, value: number) => void
  getMetrics: () => PaginationMetrics
  resetMetrics: () => void
}

// Error Handling Types
export interface PaginationError {
  code: string
  message: string
  page?: number
  retryable: boolean
  timestamp: number
}

export interface ErrorHandler {
  handleError: (error: PaginationError) => void
  retry: (page: number) => Promise<void>
  shouldRetry: (error: PaginationError) => boolean
  getRetryDelay: (retryCount: number) => number
}

// Default Configurations
export const DEFAULT_PAGINATION_CONFIG: PreloadPaginationConfig = {
  itemsPerPage: 10,
  preloadPages: 2,
  cacheSize: 10,
  enableInfiniteScroll: false,
  enableBackgroundPreload: true,
  preloadDelay: 500
}

export const MOBILE_PAGINATION_CONFIG: MobilePaginationConfig = {
  enableInfiniteScroll: true,
  infiniteScrollThreshold: 100,
  enablePullToRefresh: true,
  enableSwipeNavigation: true,
  itemsPerPageMobile: 6
}

export const PRELOAD_STRATEGY_CONFIG: PreloadStrategyConfig = {
  strategy: 'smart',
  preloadPages: 2,
  preloadDelay: 500,
  maxConcurrentPreloads: 3,
  enablePredictivePreload: true
}
