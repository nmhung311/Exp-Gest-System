// Pagination Test Suite
// Unit tests và integration tests cho pagination system

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PaginationCacheManager } from '../utils/paginationCache'
import { memoryManager } from '../utils/memoryManager'
import { errorHandler } from '../utils/errorHandler'

// Mock data
const mockGuests = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Guest ${i + 1}`,
  email: `guest${i + 1}@example.com`,
  rsvp_status: 'pending' as const,
  checkin_status: 'not_arrived' as const,
  created_at: new Date().toISOString()
}))

const mockEvents = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Event ${i + 1}`,
  date: new Date().toISOString(),
  description: `Description for event ${i + 1}`
}))

// Mock API functions
const mockFetchData = vi.fn()
const mockBatchFetchData = vi.fn()

describe('Pagination System', () => {
  let cacheManager: PaginationCacheManager<any>
  
  beforeEach(() => {
    cacheManager = new PaginationCacheManager(10)
    vi.clearAllMocks()
    
    // Setup mock API responses
    mockFetchData.mockImplementation((page: number, limit: number) => {
      const start = (page - 1) * limit
      const end = start + limit
      return Promise.resolve({
        data: mockGuests.slice(start, end),
        totalPages: Math.ceil(mockGuests.length / limit),
        totalItems: mockGuests.length
      })
    })
    
    mockBatchFetchData.mockImplementation((pages: number[], limit: number) => {
      const result: { [key: number]: any } = {}
      pages.forEach(page => {
        const start = (page - 1) * limit
        const end = start + limit
        result[page] = {
          data: mockGuests.slice(start, end),
          totalPages: Math.ceil(mockGuests.length / limit),
          totalItems: mockGuests.length
        }
      })
      return Promise.resolve(result)
    })
  })
  
  afterEach(() => {
    cacheManager.clear()
    memoryManager.clearAllCaches()
    errorHandler.clearAllErrors()
  })
  
  describe('PaginationCacheManager', () => {
    it('should initialize with correct default values', () => {
      expect(cacheManager.getCacheStats()).toEqual({
        size: 0,
        maxSize: 10,
        hitRate: 0,
        memoryUsage: 0
      })
    })
    
    it('should store and retrieve data correctly', () => {
      const testData = mockGuests.slice(0, 10)
      cacheManager.set(1, testData)
      
      const retrieved = cacheManager.get(1)
      expect(retrieved).toEqual(testData)
      expect(cacheManager.isLoaded(1)).toBe(true)
    })
    
    it('should handle cache hits and misses correctly', () => {
      const testData = mockGuests.slice(0, 10)
      cacheManager.set(1, testData)
      
      // Cache hit
      const hit = cacheManager.get(1)
      expect(hit).toEqual(testData)
      
      // Cache miss
      const miss = cacheManager.get(2)
      expect(miss).toBeUndefined()
      
      const stats = cacheManager.getCacheStats()
      expect(stats.hitRate).toBe(50) // 1 hit, 1 miss
    })
    
    it('should evict LRU entries when cache is full', () => {
      // Fill cache to capacity
      for (let i = 1; i <= 10; i++) {
        cacheManager.set(i, mockGuests.slice(0, 10))
      }
      
      // Add one more entry to trigger eviction
      cacheManager.set(11, mockGuests.slice(0, 10))
      
      // First entry should be evicted
      expect(cacheManager.get(1)).toBeUndefined()
      expect(cacheManager.get(11)).toBeDefined()
    })
    
    it('should track preloaded pages correctly', () => {
      const testData = mockGuests.slice(0, 10)
      cacheManager.set(1, testData, true) // Mark as preload
      
      expect(cacheManager.isPreloaded(1)).toBe(true)
      expect(cacheManager.isLoaded(1)).toBe(false)
      
      cacheManager.markLoaded(1)
      expect(cacheManager.isPreloaded(1)).toBe(false)
      expect(cacheManager.isLoaded(1)).toBe(true)
    })
    
    it('should clear cache correctly', () => {
      cacheManager.set(1, mockGuests.slice(0, 10))
      cacheManager.set(2, mockGuests.slice(10, 20))
      
      expect(cacheManager.getCacheStats().size).toBe(2)
      
      cacheManager.clear()
      expect(cacheManager.getCacheStats().size).toBe(0)
    })
  })
  
  describe('Memory Manager', () => {
    it('should register and unregister cache managers', () => {
      const testCache = new PaginationCacheManager(5)
      memoryManager.registerCacheManager('test', testCache)
      
      const stats = memoryManager.getMemoryStats()
      expect(stats.cacheMemory).toBeGreaterThan(0)
      
      memoryManager.unregisterCacheManager('test')
      const newStats = memoryManager.getMemoryStats()
      expect(newStats.cacheMemory).toBe(0)
    })
    
    it('should detect memory pressure correctly', () => {
      const stats = memoryManager.getMemoryStats()
      expect(['low', 'medium', 'high', 'critical']).toContain(stats.memoryPressure)
    })
    
    it('should provide memory recommendations', () => {
      const stats = memoryManager.getMemoryStats()
      expect(Array.isArray(stats.recommendations)).toBe(true)
    })
    
    it('should track memory history', () => {
      const history = memoryManager.getMemoryHistory()
      expect(Array.isArray(history)).toBe(true)
    })
    
    it('should calculate memory trend', () => {
      const trend = memoryManager.getMemoryTrend()
      expect(['increasing', 'decreasing', 'stable']).toContain(trend)
    })
    
    it('should provide memory forecast', () => {
      const forecast = memoryManager.getMemoryForecast()
      expect(forecast).toHaveProperty('nextMinute')
      expect(forecast).toHaveProperty('next5Minutes')
      expect(typeof forecast.nextMinute).toBe('number')
      expect(typeof forecast.next5Minutes).toBe('number')
    })
  })
  
  describe('Error Handler', () => {
    it('should handle errors correctly', () => {
      const error = new Error('Test error')
      const errorInfo = errorHandler.handleError(error, {
        component: 'TestComponent',
        action: 'testAction'
      })
      
      expect(errorInfo).toHaveProperty('id')
      expect(errorInfo).toHaveProperty('type')
      expect(errorInfo).toHaveProperty('message')
      expect(errorInfo).toHaveProperty('context')
      expect(errorInfo).toHaveProperty('severity')
      expect(errorInfo).toHaveProperty('retryable')
    })
    
    it('should categorize errors correctly', () => {
      const networkError = new Error('Network connection failed')
      const apiError = new Error('API returned 500')
      const validationError = new Error('Validation failed')
      const timeoutError = new Error('Request timeout')
      
      const networkInfo = errorHandler.handleError(networkError)
      const apiInfo = errorHandler.handleError(apiError)
      const validationInfo = errorHandler.handleError(validationError)
      const timeoutInfo = errorHandler.handleError(timeoutError)
      
      expect(networkInfo.type).toBe('network')
      expect(apiInfo.type).toBe('api')
      expect(validationInfo.type).toBe('validation')
      expect(timeoutInfo.type).toBe('timeout')
    })
    
    it('should determine error severity correctly', () => {
      const criticalError = new Error('Critical system failure')
      const highError = new Error('Unauthorized access')
      const mediumError = new Error('Server timeout')
      const lowError = new Error('Minor validation issue')
      
      const criticalInfo = errorHandler.handleError(criticalError)
      const highInfo = errorHandler.handleError(highError)
      const mediumInfo = errorHandler.handleError(mediumError)
      const lowInfo = errorHandler.handleError(lowError)
      
      expect(criticalInfo.severity).toBe('critical')
      expect(highInfo.severity).toBe('high')
      expect(mediumInfo.severity).toBe('medium')
      expect(lowInfo.severity).toBe('low')
    })
    
    it('should track retry attempts correctly', () => {
      const error = new Error('Retryable error')
      const errorInfo = errorHandler.handleError(error)
      
      expect(errorInfo.retryable).toBe(true)
      expect(errorInfo.retryCount).toBe(0)
      expect(errorInfo.maxRetries).toBeGreaterThan(0)
    })
    
    it('should resolve errors correctly', () => {
      const error = new Error('Test error')
      const errorInfo = errorHandler.handleError(error)
      
      expect(errorInfo.resolved).toBe(false)
      
      errorHandler.resolveError(errorInfo.id)
      const resolvedError = errorHandler.getError(errorInfo.id)
      expect(resolvedError?.resolved).toBe(true)
    })
    
    it('should provide error statistics', () => {
      // Add some test errors
      errorHandler.handleError(new Error('Error 1'))
      errorHandler.handleError(new Error('Error 2'))
      errorHandler.handleError(new Error('Error 3'))
      
      const stats = errorHandler.getErrorStats()
      expect(stats.total).toBe(3)
      expect(stats.unresolved).toBe(3)
      expect(stats.resolved).toBe(0)
    })
    
    it('should filter errors by type and severity', () => {
      errorHandler.handleError(new Error('Network error'))
      errorHandler.handleError(new Error('API error'))
      errorHandler.handleError(new Error('Validation error'))
      
      const networkErrors = errorHandler.getErrorsByType('network')
      const apiErrors = errorHandler.getErrorsByType('api')
      const validationErrors = errorHandler.getErrorsByType('validation')
      
      expect(networkErrors).toHaveLength(1)
      expect(apiErrors).toHaveLength(1)
      expect(validationErrors).toHaveLength(1)
    })
  })
  
  describe('Integration Tests', () => {
    it('should handle pagination with cache and memory management', async () => {
      // Register cache manager
      memoryManager.registerCacheManager('guests', cacheManager)
      
      // Load first page
      const page1Data = await mockFetchData(1, 10)
      cacheManager.set(1, page1Data.data)
      
      // Load second page
      const page2Data = await mockFetchData(2, 10)
      cacheManager.set(2, page2Data.data)
      
      // Verify cache
      expect(cacheManager.get(1)).toEqual(page1Data.data)
      expect(cacheManager.get(2)).toEqual(page2Data.data)
      
      // Verify memory stats
      const memoryStats = memoryManager.getMemoryStats()
      expect(memoryStats.cacheMemory).toBeGreaterThan(0)
      
      // Cleanup
      memoryManager.unregisterCacheManager('guests')
    })
    
    it('should handle errors during pagination', async () => {
      // Mock API error
      mockFetchData.mockRejectedValueOnce(new Error('API Error'))
      
      try {
        await mockFetchData(1, 10)
      } catch (error) {
        const errorInfo = errorHandler.handleError(error as Error, {
          component: 'PaginationTest',
          action: 'loadPage',
          page: 1
        })
        
        expect(errorInfo.type).toBe('api')
        expect(errorInfo.retryable).toBe(true)
      }
    })
    
    it('should handle batch loading with error recovery', async () => {
      // Mock partial batch failure
      mockBatchFetchData.mockImplementationOnce((pages: number[]) => {
        const result: { [key: number]: any } = {}
        pages.forEach(page => {
          if (page === 2) {
            throw new Error('Page 2 failed')
          }
          const start = (page - 1) * 10
          const end = start + 10
          result[page] = {
            data: mockGuests.slice(start, end),
            totalPages: 10,
            totalItems: 100
          }
        })
        return Promise.resolve(result)
      })
      
      try {
        await mockBatchFetchData([1, 2, 3], 10)
      } catch (error) {
        const errorInfo = errorHandler.handleError(error as Error, {
          component: 'BatchLoader',
          action: 'loadPages',
          additionalData: { pages: [1, 2, 3] }
        })
        
        expect(errorInfo.type).toBe('api')
        expect(errorInfo.context.additionalData).toEqual({ pages: [1, 2, 3] })
      }
    })
  })
  
  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        data: `Data for item ${i + 1}`
      }))
      
      const startTime = performance.now()
      
      // Store large dataset in cache
      cacheManager.set(1, largeDataset)
      
      // Retrieve data
      const retrieved = cacheManager.get(1)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(retrieved).toEqual(largeDataset)
      expect(duration).toBeLessThan(100) // Should complete in less than 100ms
    })
    
    it('should maintain performance with multiple cache operations', () => {
      const startTime = performance.now()
      
      // Perform multiple cache operations
      for (let i = 1; i <= 100; i++) {
        const data = mockGuests.slice(0, 10)
        cacheManager.set(i, data)
        cacheManager.get(i)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(500) // Should complete in less than 500ms
    })
    
    it('should handle memory pressure gracefully', () => {
      // Fill cache to capacity
      for (let i = 1; i <= 10; i++) {
        cacheManager.set(i, mockGuests.slice(0, 10))
      }
      
      // Add more data to trigger eviction
      for (let i = 11; i <= 20; i++) {
        cacheManager.set(i, mockGuests.slice(0, 10))
      }
      
      // Verify cache size is within limits
      const stats = cacheManager.getCacheStats()
      expect(stats.size).toBeLessThanOrEqual(10)
    })
  })
})
