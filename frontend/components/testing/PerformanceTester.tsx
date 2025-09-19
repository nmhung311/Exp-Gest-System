// Performance Testing Component
// Component để test hiệu suất pagination system

import React, { useState, useEffect, useRef } from 'react'
import { PaginationCacheManager } from '@/lib/utils/paginationCache'
import { memoryManager } from '@/lib/utils/memoryManager'
import { errorHandler } from '@/lib/utils/errorHandler'

interface PerformanceTest {
  id: string
  name: string
  description: string
  testFunction: () => Promise<PerformanceTestResult>
  category: 'cache' | 'memory' | 'api' | 'ui' | 'integration'
}

interface PerformanceTestResult {
  testId: string
  testName: string
  duration: number
  success: boolean
  error?: string
  metrics?: {
    memoryUsage?: number
    cacheHitRate?: number
    errorCount?: number
    [key: string]: any
  }
  timestamp: number
}

interface PerformanceTesterProps {
  className?: string
  showDetails?: boolean
  autoRun?: boolean
  runInterval?: number
}

export default function PerformanceTester({
  className = '',
  showDetails = true,
  autoRun = false,
  runInterval = 30000
}: PerformanceTesterProps) {
  
  const [tests, setTests] = useState<PerformanceTest[]>([])
  const [results, setResults] = useState<PerformanceTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFailedOnly, setShowFailedOnly] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const cacheManagerRef = useRef<PaginationCacheManager<any> | null>(null)
  const testIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Initialize tests
  useEffect(() => {
    const initializeTests = () => {
      const testList: PerformanceTest[] = [
        // Cache tests
        {
          id: 'cache-basic-operations',
          name: 'Cache Basic Operations',
          description: 'Test basic cache set/get operations',
          category: 'cache',
          testFunction: async () => {
            const startTime = performance.now()
            const cache = new PaginationCacheManager(10)
            
            // Test set operations
            for (let i = 1; i <= 5; i++) {
              cache.set(i, Array.from({ length: 10 }, (_, j) => ({ id: j, data: `item-${j}` })))
            }
            
            // Test get operations
            for (let i = 1; i <= 5; i++) {
              const data = cache.get(i)
              if (!data) throw new Error(`Failed to retrieve data for page ${i}`)
            }
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            return {
              testId: 'cache-basic-operations',
              testName: 'Cache Basic Operations',
              duration,
              success: true,
              metrics: {
                cacheHitRate: cache.getStats().hitRate
              },
              timestamp: Date.now()
            }
          }
        },
        
        {
          id: 'cache-lru-eviction',
          name: 'Cache LRU Eviction',
          description: 'Test LRU eviction when cache is full',
          category: 'cache',
          testFunction: async () => {
            const startTime = performance.now()
            const cache = new PaginationCacheManager(3)
            
            // Fill cache to capacity
            for (let i = 1; i <= 3; i++) {
              cache.set(i, Array.from({ length: 10 }, (_, j) => ({ id: j, data: `item-${j}` })))
            }
            
            // Add one more to trigger eviction
            cache.set(4, Array.from({ length: 10 }, (_, j) => ({ id: j, data: `item-${j}` })))
            
            // First entry should be evicted
            const firstEntry = cache.get(1)
            const lastEntry = cache.get(4)
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            return {
              testId: 'cache-lru-eviction',
              testName: 'Cache LRU Eviction',
              duration,
              success: firstEntry === undefined && lastEntry !== undefined,
              metrics: {
                cacheSize: cache.getStats().size
              },
              timestamp: Date.now()
            }
          }
        },
        
        // Memory tests
        {
          id: 'memory-usage-tracking',
          name: 'Memory Usage Tracking',
          description: 'Test memory usage tracking and reporting',
          category: 'memory',
          testFunction: async () => {
            const startTime = performance.now()
            
            // Register cache manager
            const cache = new PaginationCacheManager(10)
            memoryManager.registerCacheManager('test', cache)
            
            // Add some data
            for (let i = 1; i <= 5; i++) {
              cache.set(i, Array.from({ length: 100 }, (_, j) => ({ id: j, data: `item-${j}` })))
            }
            
            // Get memory stats
            const stats = memoryManager.getMemoryStats()
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            // Cleanup
            memoryManager.unregisterCacheManager('test')
            
            return {
              testId: 'memory-usage-tracking',
              testName: 'Memory Usage Tracking',
              duration,
              success: stats.cacheMemory > 0,
              metrics: {
                memoryUsage: stats.cacheMemory,
                totalMemory: stats.totalMemory,
                usedMemory: stats.usedMemory
              },
              timestamp: Date.now()
            }
          }
        },
        
        {
          id: 'memory-pressure-detection',
          name: 'Memory Pressure Detection',
          description: 'Test memory pressure detection and cleanup',
          category: 'memory',
          testFunction: async () => {
            const startTime = performance.now()
            
            // Register cache manager
            const cache = new PaginationCacheManager(5)
            memoryManager.registerCacheManager('test', cache)
            
            // Fill cache to trigger pressure
            for (let i = 1; i <= 10; i++) {
              cache.set(i, Array.from({ length: 1000 }, (_, j) => ({ id: j, data: `item-${j}` })))
            }
            
            // Get memory stats
            const stats = memoryManager.getMemoryStats()
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            // Cleanup
            memoryManager.unregisterCacheManager('test')
            
            return {
              testId: 'memory-pressure-detection',
              testName: 'Memory Pressure Detection',
              duration,
              success: stats.memoryPressure !== 'low',
              metrics: {
                memoryPressure: stats.memoryPressure,
                cacheMemory: stats.cacheMemory
              },
              timestamp: Date.now()
            }
          }
        },
        
        // API tests
        {
          id: 'api-error-handling',
          name: 'API Error Handling',
          description: 'Test API error handling and recovery',
          category: 'api',
          testFunction: async () => {
            const startTime = performance.now()
            
            // Simulate API error
            const error = new Error('API Error')
            const errorInfo = errorHandler.handleError(error, {
              component: 'PerformanceTest',
              action: 'testApiError'
            })
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            return {
              testId: 'api-error-handling',
              testName: 'API Error Handling',
              duration,
              success: errorInfo.type === 'api',
              metrics: {
                errorType: errorInfo.type,
                errorSeverity: errorInfo.severity,
                retryable: errorInfo.retryable
              },
              timestamp: Date.now()
            }
          }
        },
        
        {
          id: 'api-retry-logic',
          name: 'API Retry Logic',
          description: 'Test API retry logic and backoff',
          category: 'api',
          testFunction: async () => {
            const startTime = performance.now()
            
            // Simulate retryable error
            const error = new Error('Network timeout')
            const errorInfo = errorHandler.handleError(error, {
              component: 'PerformanceTest',
              action: 'testRetryLogic'
            })
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            return {
              testId: 'api-retry-logic',
              testName: 'API Retry Logic',
              duration,
              success: errorInfo.retryable && errorInfo.maxRetries > 0,
              metrics: {
                retryable: errorInfo.retryable,
                maxRetries: errorInfo.maxRetries,
                retryCount: errorInfo.retryCount
              },
              timestamp: Date.now()
            }
          }
        },
        
        // UI tests
        {
          id: 'ui-render-performance',
          name: 'UI Render Performance',
          description: 'Test UI rendering performance',
          category: 'ui',
          testFunction: async () => {
            const startTime = performance.now()
            
            // Simulate UI rendering
            const elements = Array.from({ length: 1000 }, (_, i) => ({
              id: i,
              name: `Element ${i}`,
              data: `Data for element ${i}`
            }))
            
            // Simulate rendering operations
            const renderedElements = elements.map(el => ({
              ...el,
              rendered: true,
              timestamp: Date.now()
            }))
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            return {
              testId: 'ui-render-performance',
              testName: 'UI Render Performance',
              duration,
              success: renderedElements.length === elements.length,
              metrics: {
                elementCount: elements.length,
                renderTime: duration
              },
              timestamp: Date.now()
            }
          }
        },
        
        // Integration tests
        {
          id: 'integration-full-pagination',
          name: 'Full Pagination Integration',
          description: 'Test complete pagination flow with cache and memory',
          category: 'integration',
          testFunction: async () => {
            const startTime = performance.now()
            
            // Setup
            const cache = new PaginationCacheManager(10)
            memoryManager.registerCacheManager('test', cache)
            
            // Simulate pagination
            const pages = [1, 2, 3, 4, 5]
            for (const page of pages) {
              const data = Array.from({ length: 10 }, (_, i) => ({
                id: (page - 1) * 10 + i + 1,
                name: `Item ${(page - 1) * 10 + i + 1}`,
                data: `Data for item ${(page - 1) * 10 + i + 1}`
              }))
              cache.set(page, data)
            }
            
            // Test navigation
            for (const page of pages) {
              const data = cache.get(page)
              if (!data) throw new Error(`Failed to retrieve page ${page}`)
            }
            
            // Get final stats
            const cacheStats = cache.getStats()
            const memoryStats = memoryManager.getMemoryStats()
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            // Cleanup
            memoryManager.unregisterCacheManager('test')
            
            return {
              testId: 'integration-full-pagination',
              testName: 'Full Pagination Integration',
              duration,
              success: true,
              metrics: {
                cacheSize: cacheStats.size,
                cacheHitRate: cacheStats.hitRate,
                memoryUsage: memoryStats.cacheMemory,
                pagesLoaded: pages.length
              },
              timestamp: Date.now()
            }
          }
        }
      ]
      
      setTests(testList)
    }
    
    initializeTests()
  }, [])
  
  // Auto run tests
  useEffect(() => {
    if (autoRun) {
      testIntervalRef.current = setInterval(() => {
        runAllTests()
      }, runInterval)
      
      return () => {
        if (testIntervalRef.current) {
          clearInterval(testIntervalRef.current)
        }
      }
    }
  }, [autoRun, runInterval])
  
  // Run single test
  const runTest = async (test: PerformanceTest) => {
    try {
      const result = await test.testFunction()
      setResults(prev => [...prev, result])
      return result
    } catch (error) {
      const result: PerformanceTestResult = {
        testId: test.id,
        testName: test.name,
        duration: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
      setResults(prev => [...prev, result])
      return result
    }
  }
  
  // Run all tests
  const runAllTests = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    const testResults: PerformanceTestResult[] = []
    
    for (const test of tests) {
      try {
        const result = await test.testFunction()
        testResults.push(result)
      } catch (error) {
        const result: PerformanceTestResult = {
          testId: test.id,
          testName: test.name,
          duration: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
        testResults.push(result)
      }
    }
    
    setResults(prev => [...prev, ...testResults])
    setIsRunning(false)
  }
  
  // Run tests by category
  const runTestsByCategory = async (category: string) => {
    if (isRunning) return
    
    setIsRunning(true)
    const categoryTests = tests.filter(test => 
      category === 'all' || test.category === category
    )
    
    for (const test of categoryTests) {
      await runTest(test)
    }
    
    setIsRunning(false)
  }
  
  // Clear results
  const clearResults = () => {
    setResults([])
  }
  
  // Get filtered results
  const getFilteredResults = () => {
    let filtered = results
    
    if (selectedCategory !== 'all') {
      const categoryTests = tests.filter(test => test.category === selectedCategory)
      const categoryTestIds = categoryTests.map(test => test.id)
      filtered = filtered.filter(result => categoryTestIds.includes(result.testId))
    }
    
    if (showFailedOnly) {
      filtered = filtered.filter(result => !result.success)
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  // Get test statistics
  const getTestStats = () => {
    const filtered = getFilteredResults()
    const total = filtered.length
    const passed = filtered.filter(r => r.success).length
    const failed = total - passed
    const avgDuration = total > 0 ? filtered.reduce((sum, r) => sum + r.duration, 0) / total : 0
    
    return { total, passed, failed, avgDuration }
  }
  
  // Get category options
  const getCategoryOptions = () => {
    const categories = ['all', ...new Set(tests.map(test => test.category))]
    return categories.map(category => ({
      value: category,
      label: category === 'all' ? 'Tất cả' : category.charAt(0).toUpperCase() + category.slice(1)
    }))
  }
  
  const filteredResults = getFilteredResults()
  const stats = getTestStats()
  const categoryOptions = getCategoryOptions()
  
  return (
    <div className={`bg-black/20 border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white/80 text-lg font-medium">Performance Tester</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-white/10 text-white/80 rounded text-sm hover:bg-white/20 transition-colors"
            >
              {isExpanded ? 'Thu gọn' : 'Mở rộng'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {isExpanded ? (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? 'Đang chạy...' : 'Chạy tất cả'}
              </button>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-white/80 text-sm"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => runTestsByCategory(selectedCategory)}
                disabled={isRunning}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chạy theo danh mục
              </button>
              
              <button
                onClick={clearResults}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Xóa kết quả
              </button>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                <div className="text-white/60 text-sm">Tổng tests</div>
                <div className="text-white text-xl font-bold">{stats.total}</div>
              </div>
              
              <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                <div className="text-white/60 text-sm">Thành công</div>
                <div className="text-green-400 text-xl font-bold">{stats.passed}</div>
              </div>
              
              <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                <div className="text-white/60 text-sm">Thất bại</div>
                <div className="text-red-400 text-xl font-bold">{stats.failed}</div>
              </div>
              
              <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                <div className="text-white/60 text-sm">Thời gian TB</div>
                <div className="text-white text-xl font-bold">{stats.avgDuration.toFixed(1)}ms</div>
              </div>
            </div>
            
            {/* Results */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-white/80 text-sm font-medium">Kết quả tests</h4>
                <label className="flex items-center gap-2 text-sm text-white/60">
                  <input
                    type="checkbox"
                    checked={showFailedOnly}
                    onChange={(e) => setShowFailedOnly(e.target.checked)}
                    className="rounded"
                  />
                  Chỉ hiển thị lỗi
                </label>
              </div>
              
              {filteredResults.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  Chưa có kết quả test nào
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredResults.map((result, index) => (
                    <div
                      key={`${result.testId}-${index}`}
                      className={`p-3 rounded-lg border ${
                        result.success
                          ? 'border-green-500/20 bg-green-500/10'
                          : 'border-red-500/20 bg-red-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                            {result.success ? '✓' : '❌'}
                          </span>
                          <span className="text-white/80 text-sm font-medium">
                            {result.testName}
                          </span>
                        </div>
                        <div className="text-white/60 text-xs">
                          {result.duration.toFixed(1)}ms
                        </div>
                      </div>
                      
                      {result.error && (
                        <div className="text-red-400 text-xs mb-2">
                          {result.error}
                        </div>
                      )}
                      
                      {result.metrics && showDetails && (
                        <div className="text-white/60 text-xs space-y-1">
                          {Object.entries(result.metrics).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Tổng tests</span>
              <span className="text-white text-lg font-bold">{stats.total}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Thành công</span>
              <span className="text-green-400 text-lg font-bold">{stats.passed}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Thất bại</span>
              <span className="text-red-400 text-lg font-bold">{stats.failed}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Thời gian TB</span>
              <span className="text-white text-lg font-bold">{stats.avgDuration.toFixed(1)}ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
