// Pagination Cache Manager
// Quản lý cache thông minh cho pagination data

import { CacheEntry, CacheManager, PaginationMetrics } from '@/lib/types/pagination'

export class PaginationCacheManager<T = any> implements CacheManager<T> {
  private cache = new Map<number, CacheEntry<T>>()
  private maxSize: number
  private hitCount = 0
  private missCount = 0
  private accessTimes = new Map<number, number>()
  
  constructor(maxSize: number = 10) {
    this.maxSize = maxSize
  }

  get(page: number): CacheEntry<T> | null {
    const entry = this.cache.get(page)
    
    if (entry) {
      // Update access statistics
      entry.lastAccess = Date.now()
      entry.accessCount++
      this.accessTimes.set(page, Date.now())
      this.hitCount++
      
      return entry
    }
    
    this.missCount++
    return null
  }

  set(page: number, data: T[]): void {
    const now = Date.now()
    
    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
    }
    
    this.cache.set(page, entry)
    this.accessTimes.set(page, now)
  }

  has(page: number): boolean {
    return this.cache.has(page)
  }

  delete(page: number): void {
    this.cache.delete(page)
    this.accessTimes.delete(page)
  }

  clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  cleanup(): void {
    if (this.cache.size === 0) return
    
    // Find least recently used page
    let lruPage = -1
    let oldestAccess = Date.now()
    
    for (const [page, accessTime] of this.accessTimes.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime
        lruPage = page
      }
    }
    
    if (lruPage !== -1) {
      this.delete(lruPage)
    }
  }

  getStats() {
    const totalRequests = this.hitCount + this.missCount
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0
    for (const entry of this.cache.values()) {
      memoryUsage += JSON.stringify(entry.data).length * 2 // Rough estimate
    }
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage / 1024) // KB
    }
  }

  // Get pages that should be preloaded based on current page
  getPreloadCandidates(currentPage: number, preloadPages: number): number[] {
    const candidates: number[] = []
    
    for (let i = 1; i <= preloadPages; i++) {
      const page = currentPage + i
      if (!this.has(page)) {
        candidates.push(page)
      }
    }
    
    return candidates
  }

  // Get pages that can be safely removed from cache
  getEvictionCandidates(): number[] {
    const candidates: number[] = []
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    for (const [page, entry] of this.cache.entries()) {
      if (now - entry.lastAccess > maxAge) {
        candidates.push(page)
      }
    }
    
    return candidates
  }

  // Warm up cache with initial data
  warmUp(pages: { [page: number]: T[] }): void {
    for (const [page, data] of Object.entries(pages)) {
      this.set(parseInt(page), data)
    }
  }

  // Get cache size in bytes (rough estimate)
  getMemoryUsage(): number {
    let totalSize = 0
    
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length * 2
    }
    
    return totalSize
  }

  // Check if cache is healthy
  isHealthy(): boolean {
    const stats = this.getStats()
    return stats.hitRate > 0.3 && stats.memoryUsage < 1024 * 1024 // 1MB
  }

  // Force cleanup of old entries
  forceCleanup(): void {
    const candidates = this.getEvictionCandidates()
    candidates.forEach(page => this.delete(page))
  }

  // Get cache entries sorted by access time
  getAccessOrder(): number[] {
    return Array.from(this.accessTimes.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([page]) => page)
  }
}

// Performance Monitor for pagination
export class PaginationPerformanceMonitor {
  private timers = new Map<string, number>()
  private metrics: PaginationMetrics = {
    loadTime: 0,
    preloadTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    apiCallsCount: 0,
    userInteractions: 0
  }

  startTimer(name: string): void {
    this.timers.set(name, Date.now())
  }

  endTimer(name: string): number {
    const startTime = this.timers.get(name)
    if (!startTime) return 0
    
    const duration = Date.now() - startTime
    this.timers.delete(name)
    
    // Update specific metrics
    if (name.includes('load')) {
      this.metrics.loadTime = duration
    } else if (name.includes('preload')) {
      this.metrics.preloadTime = duration
    }
    
    return duration
  }

  recordMetric(metric: keyof PaginationMetrics, value: number): void {
    this.metrics[metric] = value
  }

  incrementMetric(metric: keyof PaginationMetrics): void {
    this.metrics[metric]++
  }

  getMetrics(): PaginationMetrics {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      loadTime: 0,
      preloadTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0,
      apiCallsCount: 0,
      userInteractions: 0
    }
    this.timers.clear()
  }

  // Log performance metrics to console (development only)
  logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Pagination Performance Metrics:', this.metrics)
    }
  }
}

// Utility functions for pagination
export const paginationUtils = {
  // Calculate page range for display
  getPageRange(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  },

  // Check if page is in range
  isPageInRange(page: number, currentPage: number, totalPages: number): boolean {
    return page >= 1 && page <= totalPages
  },

  // Calculate start index for page
  getStartIndex(page: number, itemsPerPage: number): number {
    return (page - 1) * itemsPerPage
  },

  // Calculate end index for page
  getEndIndex(page: number, itemsPerPage: number): number {
    return page * itemsPerPage
  },

  // Calculate total pages
  getTotalPages(totalItems: number, itemsPerPage: number): number {
    return Math.ceil(totalItems / itemsPerPage)
  },

  // Check if page has next page
  hasNextPage(currentPage: number, totalPages: number): boolean {
    return currentPage < totalPages
  },

  // Check if page has previous page
  hasPrevPage(currentPage: number): boolean {
    return currentPage > 1
  },

  // Get pagination info
  getPaginationInfo(currentPage: number, itemsPerPage: number, totalItems: number) {
    const startIndex = this.getStartIndex(currentPage, itemsPerPage)
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
    const totalPages = this.getTotalPages(totalItems, itemsPerPage)
    
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startIndex,
      endIndex,
      showingItems: endIndex - startIndex,
      hasNextPage: this.hasNextPage(currentPage, totalPages),
      hasPrevPage: this.hasPrevPage(currentPage)
    }
  }
}

// Export default cache manager instance
export const defaultCacheManager = new PaginationCacheManager()
export const performanceMonitor = new PaginationPerformanceMonitor()
