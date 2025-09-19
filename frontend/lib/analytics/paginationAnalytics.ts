// Pagination Analytics System
// Hệ thống analytics để đo hiệu suất pagination

import { PaginationState } from '@/lib/types/pagination'

export interface PaginationMetrics {
  // Performance metrics
  loadTimes: {
    initialLoad: number
    pageLoad: number
    preload: number
    average: number
  }
  
  // Cache metrics
  cache: {
    hitRate: number
    missRate: number
    size: number
    maxSize: number
    efficiency: 'excellent' | 'good' | 'fair' | 'poor'
  }
  
  // User interaction metrics
  interactions: {
    pageChanges: number
    preloadTriggers: number
    refreshActions: number
    errorRetries: number
    totalInteractions: number
  }
  
  // Data metrics
  data: {
    totalItems: number
    totalPages: number
    loadedPages: number
    preloadedPages: number
    itemsPerPage: number
  }
  
  // Error metrics
  errors: {
    totalErrors: number
    loadErrors: number
    preloadErrors: number
    retrySuccessRate: number
  }
  
  // Memory metrics
  memory: {
    estimatedUsage: number // in MB
    cacheEntries: number
    averageItemSize: number
  }
  
  // Session metrics
  session: {
    startTime: number
    duration: number
    pagesVisited: number
    uniquePages: number
  }
}

export interface AnalyticsEvent {
  type: 'page_load' | 'preload' | 'cache_hit' | 'cache_miss' | 'error' | 'interaction' | 'memory_usage'
  timestamp: number
  page?: number
  duration?: number
  data?: any
  metadata?: Record<string, any>
}

export interface PerformanceThresholds {
  excellent: {
    loadTime: number // ms
    cacheHitRate: number // percentage
    memoryUsage: number // MB
  }
  good: {
    loadTime: number
    cacheHitRate: number
    memoryUsage: number
  }
  fair: {
    loadTime: number
    cacheHitRate: number
    memoryUsage: number
  }
  poor: {
    loadTime: number
    cacheHitRate: number
    memoryUsage: number
  }
}

class PaginationAnalytics {
  private events: AnalyticsEvent[] = []
  private metrics: Partial<PaginationMetrics> = {}
  private sessionStartTime: number = Date.now()
  private thresholds: PerformanceThresholds
  
  constructor() {
    this.thresholds = {
      excellent: {
        loadTime: 200,
        cacheHitRate: 90,
        memoryUsage: 10
      },
      good: {
        loadTime: 500,
        cacheHitRate: 75,
        memoryUsage: 25
      },
      fair: {
        loadTime: 1000,
        cacheHitRate: 60,
        memoryUsage: 50
      },
      poor: {
        loadTime: 2000,
        cacheHitRate: 40,
        memoryUsage: 100
      }
    }
    
    this.initializeMetrics()
  }
  
  private initializeMetrics() {
    this.metrics = {
      loadTimes: {
        initialLoad: 0,
        pageLoad: 0,
        preload: 0,
        average: 0
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        size: 0,
        maxSize: 0,
        efficiency: 'poor'
      },
      interactions: {
        pageChanges: 0,
        preloadTriggers: 0,
        refreshActions: 0,
        errorRetries: 0,
        totalInteractions: 0
      },
      data: {
        totalItems: 0,
        totalPages: 0,
        loadedPages: 0,
        preloadedPages: 0,
        itemsPerPage: 0
      },
      errors: {
        totalErrors: 0,
        loadErrors: 0,
        preloadErrors: 0,
        retrySuccessRate: 0
      },
      memory: {
        estimatedUsage: 0,
        cacheEntries: 0,
        averageItemSize: 0
      },
      session: {
        startTime: this.sessionStartTime,
        duration: 0,
        pagesVisited: 0,
        uniquePages: 0
      }
    }
  }
  
  // Track events
  track(event: AnalyticsEvent) {
    this.events.push(event)
    this.updateMetrics(event)
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event)
    }
  }
  
  // Track page load
  trackPageLoad(page: number, duration: number, isInitial: boolean = false) {
    this.track({
      type: 'page_load',
      timestamp: Date.now(),
      page,
      duration,
      data: { isInitial }
    })
  }
  
  // Track preload
  trackPreload(page: number, duration: number) {
    this.track({
      type: 'preload',
      timestamp: Date.now(),
      page,
      duration
    })
  }
  
  // Track cache hit/miss
  trackCacheHit(page: number) {
    this.track({
      type: 'cache_hit',
      timestamp: Date.now(),
      page
    })
  }
  
  trackCacheMiss(page: number) {
    this.track({
      type: 'cache_miss',
      timestamp: Date.now(),
      page
    })
  }
  
  // Track error
  trackError(type: 'load' | 'preload', page: number, error: Error) {
    this.track({
      type: 'error',
      timestamp: Date.now(),
      page,
      data: { errorType: type, message: error.message }
    })
  }
  
  // Track interaction
  trackInteraction(type: 'page_change' | 'preload_trigger' | 'refresh' | 'retry', page?: number) {
    this.track({
      type: 'interaction',
      timestamp: Date.now(),
      page,
      data: { interactionType: type }
    })
  }
  
  // Track memory usage
  trackMemoryUsage(usage: number, cacheEntries: number) {
    this.track({
      type: 'memory_usage',
      timestamp: Date.now(),
      data: { usage, cacheEntries }
    })
  }
  
  // Update metrics based on events
  private updateMetrics(event: AnalyticsEvent) {
    switch (event.type) {
      case 'page_load':
        this.updateLoadTimeMetrics(event)
        break
      case 'preload':
        this.updatePreloadMetrics(event)
        break
      case 'cache_hit':
      case 'cache_miss':
        this.updateCacheMetrics(event)
        break
      case 'error':
        this.updateErrorMetrics(event)
        break
      case 'interaction':
        this.updateInteractionMetrics(event)
        break
      case 'memory_usage':
        this.updateMemoryMetrics(event)
        break
    }
  }
  
  private updateLoadTimeMetrics(event: AnalyticsEvent) {
    if (!this.metrics.loadTimes) return
    
    const duration = event.duration || 0
    const isInitial = event.data?.isInitial
    
    if (isInitial) {
      this.metrics.loadTimes.initialLoad = duration
    } else {
      this.metrics.loadTimes.pageLoad = duration
    }
    
    // Calculate average
    const loadEvents = this.events.filter(e => e.type === 'page_load')
    const totalDuration = loadEvents.reduce((sum, e) => sum + (e.duration || 0), 0)
    this.metrics.loadTimes.average = loadEvents.length > 0 ? totalDuration / loadEvents.length : 0
  }
  
  private updatePreloadMetrics(event: AnalyticsEvent) {
    if (!this.metrics.loadTimes) return
    
    const duration = event.duration || 0
    this.metrics.loadTimes.preload = duration
  }
  
  private updateCacheMetrics(event: AnalyticsEvent) {
    if (!this.metrics.cache) return
    
    const hitEvents = this.events.filter(e => e.type === 'cache_hit')
    const missEvents = this.events.filter(e => e.type === 'cache_miss')
    const totalEvents = hitEvents.length + missEvents.length
    
    if (totalEvents > 0) {
      this.metrics.cache.hitRate = (hitEvents.length / totalEvents) * 100
      this.metrics.cache.missRate = (missEvents.length / totalEvents) * 100
      this.metrics.cache.efficiency = this.getCacheEfficiency(this.metrics.cache.hitRate)
    }
  }
  
  private updateErrorMetrics(event: AnalyticsEvent) {
    if (!this.metrics.errors) return
    
    this.metrics.errors.totalErrors++
    
    const errorType = event.data?.errorType
    if (errorType === 'load') {
      this.metrics.errors.loadErrors++
    } else if (errorType === 'preload') {
      this.metrics.errors.preloadErrors++
    }
    
    // Calculate retry success rate
    const retryEvents = this.events.filter(e => e.data?.interactionType === 'retry')
    const successfulRetries = retryEvents.filter(e => {
      // Check if next event after retry is successful
      const retryIndex = this.events.indexOf(e)
      const nextEvent = this.events[retryIndex + 1]
      return nextEvent && nextEvent.type !== 'error'
    }).length
    
    this.metrics.errors.retrySuccessRate = retryEvents.length > 0 ? (successfulRetries / retryEvents.length) * 100 : 0
  }
  
  private updateInteractionMetrics(event: AnalyticsEvent) {
    if (!this.metrics.interactions) return
    
    this.metrics.interactions.totalInteractions++
    
    const interactionType = event.data?.interactionType
    switch (interactionType) {
      case 'page_change':
        this.metrics.interactions.pageChanges++
        break
      case 'preload_trigger':
        this.metrics.interactions.preloadTriggers++
        break
      case 'refresh':
        this.metrics.interactions.refreshActions++
        break
      case 'retry':
        this.metrics.interactions.errorRetries++
        break
    }
  }
  
  private updateMemoryMetrics(event: AnalyticsEvent) {
    if (!this.metrics.memory) return
    
    const usage = event.data?.usage || 0
    const cacheEntries = event.data?.cacheEntries || 0
    
    this.metrics.memory.estimatedUsage = usage
    this.metrics.memory.cacheEntries = cacheEntries
    this.metrics.memory.averageItemSize = cacheEntries > 0 ? usage / cacheEntries : 0
  }
  
  // Get cache efficiency rating
  private getCacheEfficiency(hitRate: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (hitRate >= this.thresholds.excellent.cacheHitRate) return 'excellent'
    if (hitRate >= this.thresholds.good.cacheHitRate) return 'good'
    if (hitRate >= this.thresholds.fair.cacheHitRate) return 'fair'
    return 'poor'
  }
  
  // Get performance rating
  getPerformanceRating(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!this.metrics.loadTimes || !this.metrics.cache || !this.metrics.memory) {
      return 'poor'
    }
    
    const loadTime = this.metrics.loadTimes.average
    const cacheHitRate = this.metrics.cache.hitRate
    const memoryUsage = this.metrics.memory.estimatedUsage
    
    if (loadTime <= this.thresholds.excellent.loadTime && 
        cacheHitRate >= this.thresholds.excellent.cacheHitRate && 
        memoryUsage <= this.thresholds.excellent.memoryUsage) {
      return 'excellent'
    }
    
    if (loadTime <= this.thresholds.good.loadTime && 
        cacheHitRate >= this.thresholds.good.cacheHitRate && 
        memoryUsage <= this.thresholds.good.memoryUsage) {
      return 'good'
    }
    
    if (loadTime <= this.thresholds.fair.loadTime && 
        cacheHitRate >= this.thresholds.fair.cacheHitRate && 
        memoryUsage <= this.thresholds.fair.memoryUsage) {
      return 'fair'
    }
    
    return 'poor'
  }
  
  // Get current metrics
  getMetrics(): PaginationMetrics {
    const now = Date.now()
    const duration = now - this.sessionStartTime
    
    // Update session duration
    if (this.metrics.session) {
      this.metrics.session.duration = duration
    }
    
    // Calculate pages visited
    const pageLoadEvents = this.events.filter(e => e.type === 'page_load')
    const uniquePages = new Set(pageLoadEvents.map(e => e.page)).size
    
    if (this.metrics.session) {
      this.metrics.session.pagesVisited = pageLoadEvents.length
      this.metrics.session.uniquePages = uniquePages
    }
    
    return this.metrics as PaginationMetrics
  }
  
  // Get performance summary
  getPerformanceSummary() {
    const metrics = this.getMetrics()
    const rating = this.getPerformanceRating()
    
    return {
      rating,
      metrics,
      recommendations: this.getRecommendations(metrics),
      thresholds: this.thresholds
    }
  }
  
  // Get performance recommendations
  private getRecommendations(metrics: PaginationMetrics): string[] {
    const recommendations: string[] = []
    
    // Load time recommendations
    if (metrics.loadTimes.average > this.thresholds.good.loadTime) {
      recommendations.push('Consider reducing page load time by optimizing API calls or implementing better caching')
    }
    
    // Cache recommendations
    if (metrics.cache.hitRate < this.thresholds.good.cacheHitRate) {
      recommendations.push('Improve cache hit rate by increasing cache size or optimizing preload strategy')
    }
    
    // Memory recommendations
    if (metrics.memory.estimatedUsage > this.thresholds.good.memoryUsage) {
      recommendations.push('Reduce memory usage by implementing cache cleanup or reducing cache size')
    }
    
    // Error recommendations
    if (metrics.errors.totalErrors > 0) {
      recommendations.push('Implement better error handling and retry mechanisms')
    }
    
    // Interaction recommendations
    if (metrics.interactions.errorRetries > metrics.interactions.totalInteractions * 0.1) {
      recommendations.push('High retry rate detected - consider improving error handling')
    }
    
    return recommendations
  }
  
  // Export data
  exportData() {
    return {
      events: this.events,
      metrics: this.getMetrics(),
      performanceSummary: this.getPerformanceSummary(),
      timestamp: Date.now()
    }
  }
  
  // Clear data
  clear() {
    this.events = []
    this.initializeMetrics()
    this.sessionStartTime = Date.now()
  }
  
  // Get events by type
  getEventsByType(type: AnalyticsEvent['type']) {
    return this.events.filter(event => event.type === type)
  }
  
  // Get events by page
  getEventsByPage(page: number) {
    return this.events.filter(event => event.page === page)
  }
  
  // Get events in time range
  getEventsInRange(startTime: number, endTime: number) {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    )
  }
}

// Singleton instance
export const paginationAnalytics = new PaginationAnalytics()

// Export default
export default paginationAnalytics
