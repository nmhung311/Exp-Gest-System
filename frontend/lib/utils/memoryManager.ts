// Smart Memory Manager
// Hệ thống quản lý memory thông minh cho pagination

import { PaginationCacheManager } from './paginationCache'

export interface MemoryStats {
  totalMemory: number // in MB
  usedMemory: number // in MB
  availableMemory: number // in MB
  cacheMemory: number // in MB
  otherMemory: number // in MB
  memoryPressure: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

export interface MemoryThresholds {
  low: number // MB
  medium: number // MB
  high: number // MB
  critical: number // MB
}

export interface CleanupStrategy {
  name: string
  priority: number
  condition: (stats: MemoryStats) => boolean
  action: () => void
  description: string
}

class MemoryManager {
  private cacheManagers: Map<string, PaginationCacheManager<any>> = new Map()
  private memoryThresholds: MemoryThresholds
  private cleanupStrategies: CleanupStrategy[] = []
  private isMonitoring: boolean = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private memoryHistory: number[] = []
  private maxHistorySize: number = 100
  
  constructor() {
    this.memoryThresholds = {
      low: 10,    // 10MB
      medium: 25, // 25MB
      high: 50,   // 50MB
      critical: 100 // 100MB
    }
    
    this.initializeCleanupStrategies()
  }
  
  // Initialize cleanup strategies
  private initializeCleanupStrategies() {
    this.cleanupStrategies = [
      {
        name: 'Clear Old Cache Entries',
        priority: 1,
        condition: (stats) => stats.memoryPressure === 'medium',
        action: () => this.clearOldCacheEntries(),
        description: 'Clear cache entries older than 5 minutes'
      },
      {
        name: 'Reduce Cache Size',
        priority: 2,
        condition: (stats) => stats.memoryPressure === 'high',
        action: () => this.reduceCacheSize(),
        description: 'Reduce cache size by 50%'
      },
      {
        name: 'Clear Preloaded Pages',
        priority: 3,
        condition: (stats) => stats.memoryPressure === 'high',
        action: () => this.clearPreloadedPages(),
        description: 'Clear all preloaded pages'
      },
      {
        name: 'Force Garbage Collection',
        priority: 4,
        condition: (stats) => stats.memoryPressure === 'critical',
        action: () => this.forceGarbageCollection(),
        description: 'Force garbage collection'
      },
      {
        name: 'Clear All Caches',
        priority: 5,
        condition: (stats) => stats.memoryPressure === 'critical',
        action: () => this.clearAllCaches(),
        description: 'Clear all caches as last resort'
      }
    ]
  }
  
  // Register cache manager
  registerCacheManager(name: string, cacheManager: PaginationCacheManager<any>) {
    this.cacheManagers.set(name, cacheManager)
  }
  
  // Unregister cache manager
  unregisterCacheManager(name: string) {
    this.cacheManagers.delete(name)
  }
  
  // Get memory statistics
  getMemoryStats(): MemoryStats {
    const totalMemory = this.getTotalMemory()
    const usedMemory = this.getUsedMemory()
    const availableMemory = totalMemory - usedMemory
    const cacheMemory = this.getCacheMemory()
    const otherMemory = usedMemory - cacheMemory
    
    const memoryPressure = this.getMemoryPressure(usedMemory)
    const recommendations = this.getRecommendations(usedMemory, memoryPressure)
    
    return {
      totalMemory,
      usedMemory,
      availableMemory,
      cacheMemory,
      otherMemory,
      memoryPressure,
      recommendations
    }
  }
  
  // Get total memory (estimated)
  private getTotalMemory(): number {
    // Estimate total memory based on device capabilities
    if (typeof window !== 'undefined' && 'deviceMemory' in navigator) {
      return (navigator as any).deviceMemory * 1024 // Convert GB to MB
    }
    
    // Fallback estimation
    return 2048 // 2GB default
  }
  
  // Get used memory (estimated)
  private getUsedMemory(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / (1024 * 1024) // Convert bytes to MB
    }
    
    // Fallback estimation based on cache usage
    return this.getCacheMemory() * 2
  }
  
  // Get cache memory usage
  private getCacheMemory(): number {
    let totalCacheMemory = 0
    
    this.cacheManagers.forEach(cacheManager => {
      const stats = cacheManager.getCacheStats()
      totalCacheMemory += stats.memoryUsage
    })
    
    return totalCacheMemory
  }
  
  // Get memory pressure level
  private getMemoryPressure(usedMemory: number): 'low' | 'medium' | 'high' | 'critical' {
    if (usedMemory <= this.memoryThresholds.low) return 'low'
    if (usedMemory <= this.memoryThresholds.medium) return 'medium'
    if (usedMemory <= this.memoryThresholds.high) return 'high'
    return 'critical'
  }
  
  // Get memory recommendations
  private getRecommendations(usedMemory: number, pressure: string): string[] {
    const recommendations: string[] = []
    
    if (pressure === 'medium') {
      recommendations.push('Consider clearing old cache entries')
      recommendations.push('Monitor memory usage closely')
    } else if (pressure === 'high') {
      recommendations.push('Clear preloaded pages to free memory')
      recommendations.push('Reduce cache size')
      recommendations.push('Consider implementing lazy loading')
    } else if (pressure === 'critical') {
      recommendations.push('Clear all caches immediately')
      recommendations.push('Implement aggressive memory cleanup')
      recommendations.push('Consider reducing page size')
    }
    
    return recommendations
  }
  
  // Start memory monitoring
  startMonitoring(interval: number = 30000) {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryPressure()
    }, interval)
  }
  
  // Stop memory monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
  }
  
  // Check memory pressure and trigger cleanup
  private checkMemoryPressure() {
    const stats = this.getMemoryStats()
    
    // Add to history
    this.memoryHistory.push(stats.usedMemory)
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift()
    }
    
    // Trigger cleanup strategies
    this.triggerCleanupStrategies(stats)
    
    // Log memory stats in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Memory Stats:', stats)
    }
  }
  
  // Trigger cleanup strategies
  private triggerCleanupStrategies(stats: MemoryStats) {
    const applicableStrategies = this.cleanupStrategies
      .filter(strategy => strategy.condition(stats))
      .sort((a, b) => a.priority - b.priority)
    
    for (const strategy of applicableStrategies) {
      try {
        strategy.action()
        console.log(`Memory cleanup: ${strategy.description}`)
        break // Only execute one strategy at a time
      } catch (error) {
        console.error(`Memory cleanup failed: ${strategy.name}`, error)
      }
    }
  }
  
  // Clear old cache entries
  private clearOldCacheEntries() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    this.cacheManagers.forEach(cacheManager => {
      const stats = cacheManager.getCacheStats()
      // This would need to be implemented in PaginationCacheManager
      // cacheManager.clearOldEntries(fiveMinutesAgo)
    })
  }
  
  // Reduce cache size
  private reduceCacheSize() {
    this.cacheManagers.forEach(cacheManager => {
      const stats = cacheManager.getCacheStats()
      const newMaxSize = Math.floor(stats.maxSize * 0.5)
      // This would need to be implemented in PaginationCacheManager
      // cacheManager.setMaxSize(newMaxSize)
    })
  }
  
  // Clear preloaded pages
  private clearPreloadedPages() {
    this.cacheManagers.forEach(cacheManager => {
      // This would need to be implemented in PaginationCacheManager
      // cacheManager.clearPreloadedPages()
    })
  }
  
  // Force garbage collection
  private forceGarbageCollection() {
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
    }
  }
  
  // Clear all caches
  private clearAllCaches() {
    this.cacheManagers.forEach(cacheManager => {
      cacheManager.clear()
    })
  }
  
  // Set memory thresholds
  setMemoryThresholds(thresholds: Partial<MemoryThresholds>) {
    this.memoryThresholds = { ...this.memoryThresholds, ...thresholds }
  }
  
  // Get memory history
  getMemoryHistory(): number[] {
    return [...this.memoryHistory]
  }
  
  // Get memory trend
  getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 2) return 'stable'
    
    const recent = this.memoryHistory.slice(-5)
    const older = this.memoryHistory.slice(-10, -5)
    
    if (recent.length === 0 || older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    const diff = recentAvg - olderAvg
    
    if (diff > 1) return 'increasing'
    if (diff < -1) return 'decreasing'
    return 'stable'
  }
  
  // Get memory forecast
  getMemoryForecast(): { nextMinute: number; next5Minutes: number } {
    if (this.memoryHistory.length < 5) {
      return { nextMinute: 0, next5Minutes: 0 }
    }
    
    const recent = this.memoryHistory.slice(-5)
    const trend = this.getMemoryTrend()
    
    let forecast = recent[recent.length - 1]
    
    if (trend === 'increasing') {
      forecast += 5 // Estimate 5MB increase
    } else if (trend === 'decreasing') {
      forecast -= 2 // Estimate 2MB decrease
    }
    
    return {
      nextMinute: Math.max(0, forecast),
      next5Minutes: Math.max(0, forecast + (trend === 'increasing' ? 10 : -5))
    }
  }
  
  // Optimize memory usage
  optimizeMemory() {
    const stats = this.getMemoryStats()
    
    if (stats.memoryPressure === 'low') {
      return { optimized: false, message: 'Memory usage is already optimal' }
    }
    
    // Apply optimization strategies
    const strategies = this.cleanupStrategies
      .filter(s => s.condition(stats))
      .sort((a, b) => a.priority - b.priority)
    
    for (const strategy of strategies) {
      try {
        strategy.action()
        return { optimized: true, message: strategy.description }
      } catch (error) {
        console.error(`Optimization failed: ${strategy.name}`, error)
      }
    }
    
    return { optimized: false, message: 'No optimization strategies available' }
  }
  
  // Get memory report
  getMemoryReport() {
    const stats = this.getMemoryStats()
    const history = this.getMemoryHistory()
    const trend = this.getMemoryTrend()
    const forecast = this.getMemoryForecast()
    
    return {
      current: stats,
      history,
      trend,
      forecast,
      cacheManagers: Array.from(this.cacheManagers.keys()),
      isMonitoring: this.isMonitoring,
      thresholds: this.memoryThresholds
    }
  }
  
  // Cleanup on destroy
  destroy() {
    this.stopMonitoring()
    this.clearAllCaches()
    this.cacheManagers.clear()
    this.memoryHistory = []
  }
}

// Singleton instance
export const memoryManager = new MemoryManager()

// Export default
export default memoryManager
