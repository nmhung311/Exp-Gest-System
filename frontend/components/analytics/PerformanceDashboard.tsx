// Performance Dashboard Component
// Dashboard hiển thị metrics và analytics cho pagination

import React, { useState, useEffect } from 'react'
import { paginationAnalytics, PaginationMetrics, PerformanceThresholds } from '@/lib/analytics/paginationAnalytics'

interface PerformanceDashboardProps {
  className?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function PerformanceDashboard({
  className = '',
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 5000
}: PerformanceDashboardProps) {
  
  const [metrics, setMetrics] = useState<PaginationMetrics | null>(null)
  const [performanceSummary, setPerformanceSummary] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'performance' | 'cache' | 'errors' | 'memory'>('overview')
  
  // Refresh metrics
  const refreshMetrics = () => {
    const currentMetrics = paginationAnalytics.getMetrics()
    const summary = paginationAnalytics.getPerformanceSummary()
    
    setMetrics(currentMetrics)
    setPerformanceSummary(summary)
  }
  
  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshMetrics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])
  
  // Initial load
  useEffect(() => {
    refreshMetrics()
  }, [])
  
  // Get performance color
  const getPerformanceColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }
  
  // Get performance icon
  const getPerformanceIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return '🚀'
      case 'good': return '⚡'
      case 'fair': return '📈'
      case 'poor': return '⚠️'
      default: return '📊'
    }
  }
  
  // Format number
  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals)
  }
  
  // Format percentage
  const formatPercentage = (num: number) => {
    return `${formatNumber(num, 1)}%`
  }
  
  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${formatNumber(ms)}ms`
    return `${formatNumber(ms / 1000, 2)}s`
  }
  
  // Format memory
  const formatMemory = (mb: number) => {
    if (mb < 1) return `${formatNumber(mb * 1024)}KB`
    return `${formatNumber(mb, 1)}MB`
  }
  
  // Render overview tab
  const renderOverview = () => {
    if (!metrics || !performanceSummary) return null
    
    return (
      <div className="space-y-4">
        {/* Performance Rating */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/80 text-lg font-medium">Hiệu suất tổng thể</h3>
            <span className={`text-2xl ${getPerformanceColor(performanceSummary.rating)}`}>
              {getPerformanceIcon(performanceSummary.rating)}
            </span>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(performanceSummary.rating)}`}>
              {performanceSummary.rating.toUpperCase()}
            </div>
            <div className="text-white/60 text-sm mt-1">
              {performanceSummary.rating === 'excellent' && 'Hiệu suất xuất sắc!'}
              {performanceSummary.rating === 'good' && 'Hiệu suất tốt'}
              {performanceSummary.rating === 'fair' && 'Hiệu suất trung bình'}
              {performanceSummary.rating === 'poor' && 'Cần cải thiện hiệu suất'}
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-white/60 text-sm">Thời gian tải trung bình</div>
            <div className="text-white text-lg font-medium">
              {formatTime(metrics.loadTimes.average)}
            </div>
          </div>
          
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-white/60 text-sm">Tỷ lệ cache hit</div>
            <div className="text-white text-lg font-medium">
              {formatPercentage(metrics.cache.hitRate)}
            </div>
          </div>
          
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-white/60 text-sm">Sử dụng memory</div>
            <div className="text-white text-lg font-medium">
              {formatMemory(metrics.memory.estimatedUsage)}
            </div>
          </div>
          
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-white/60 text-sm">Tổng tương tác</div>
            <div className="text-white text-lg font-medium">
              {metrics.interactions.totalInteractions}
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        {performanceSummary.recommendations.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="text-yellow-400 text-sm font-medium mb-2">Khuyến nghị cải thiện</h4>
            <ul className="space-y-1">
              {performanceSummary.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-yellow-400/80 text-xs">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  // Render performance tab
  const renderPerformance = () => {
    if (!metrics) return null
    
    return (
      <div className="space-y-4">
        {/* Load Times */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h3 className="text-white/80 text-lg font-medium mb-3">Thời gian tải</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tải ban đầu</span>
              <span className="text-white font-medium">{formatTime(metrics.loadTimes.initialLoad)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tải trang</span>
              <span className="text-white font-medium">{formatTime(metrics.loadTimes.pageLoad)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tải trước</span>
              <span className="text-white font-medium">{formatTime(metrics.loadTimes.preload)}</span>
            </div>
            
            <div className="flex justify-between items-center border-t border-white/10 pt-3">
              <span className="text-white/80 text-sm font-medium">Trung bình</span>
              <span className="text-white text-lg font-bold">{formatTime(metrics.loadTimes.average)}</span>
            </div>
          </div>
        </div>
        
        {/* Data Metrics */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h3 className="text-white/80 text-lg font-medium mb-3">Dữ liệu</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tổng items</span>
              <span className="text-white font-medium">{metrics.data.totalItems}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tổng trang</span>
              <span className="text-white font-medium">{metrics.data.totalPages}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Trang đã tải</span>
              <span className="text-white font-medium">{metrics.data.loadedPages}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Trang tải trước</span>
              <span className="text-white font-medium">{metrics.data.preloadedPages}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Items/trang</span>
              <span className="text-white font-medium">{metrics.data.itemsPerPage}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Render cache tab
  const renderCache = () => {
    if (!metrics) return null
    
    return (
      <div className="space-y-4">
        {/* Cache Metrics */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h3 className="text-white/80 text-lg font-medium mb-3">Cache</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tỷ lệ hit</span>
              <span className="text-white font-medium">{formatPercentage(metrics.cache.hitRate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tỷ lệ miss</span>
              <span className="text-white font-medium">{formatPercentage(metrics.cache.missRate)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Kích thước cache</span>
              <span className="text-white font-medium">{metrics.cache.size} / {metrics.cache.maxSize}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Hiệu suất</span>
              <span className={`font-medium ${getPerformanceColor(metrics.cache.efficiency)}`}>
                {metrics.cache.efficiency.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Cache Progress Bar */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h4 className="text-white/80 text-sm font-medium mb-2">Sử dụng cache</h4>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(metrics.cache.size / metrics.cache.maxSize) * 100}%` }}
            />
          </div>
          
          <div className="text-xs text-white/60">
            {metrics.cache.size} / {metrics.cache.maxSize} entries
          </div>
        </div>
      </div>
    )
  }
  
  // Render errors tab
  const renderErrors = () => {
    if (!metrics) return null
    
    return (
      <div className="space-y-4">
        {/* Error Metrics */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h3 className="text-white/80 text-lg font-medium mb-3">Lỗi</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tổng lỗi</span>
              <span className="text-white font-medium">{metrics.errors.totalErrors}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Lỗi tải</span>
              <span className="text-white font-medium">{metrics.errors.loadErrors}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Lỗi tải trước</span>
              <span className="text-white font-medium">{metrics.errors.preloadErrors}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Tỷ lệ retry thành công</span>
              <span className="text-white font-medium">{formatPercentage(metrics.errors.retrySuccessRate)}</span>
            </div>
          </div>
        </div>
        
        {/* Error Rate */}
        {metrics.errors.totalErrors > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-red-400 text-sm font-medium mb-2">Tỷ lệ lỗi</h4>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics.errors.totalErrors / metrics.interactions.totalInteractions) * 100}%` }}
              />
            </div>
            
            <div className="text-xs text-red-400/80">
              {formatPercentage((metrics.errors.totalErrors / metrics.interactions.totalInteractions) * 100)} lỗi
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Render memory tab
  const renderMemory = () => {
    if (!metrics) return null
    
    return (
      <div className="space-y-4">
        {/* Memory Metrics */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h3 className="text-white/80 text-lg font-medium mb-3">Memory</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Sử dụng ước tính</span>
              <span className="text-white font-medium">{formatMemory(metrics.memory.estimatedUsage)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Cache entries</span>
              <span className="text-white font-medium">{metrics.memory.cacheEntries}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm">Kích thước trung bình item</span>
              <span className="text-white font-medium">{formatMemory(metrics.memory.averageItemSize)}</span>
            </div>
          </div>
        </div>
        
        {/* Memory Usage Chart */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h4 className="text-white/80 text-sm font-medium mb-2">Sử dụng memory</h4>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((metrics.memory.estimatedUsage / 100) * 100, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-white/60">
            {formatMemory(metrics.memory.estimatedUsage)} / 100MB
          </div>
        </div>
      </div>
    )
  }
  
  // Render tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview()
      case 'performance':
        return renderPerformance()
      case 'cache':
        return renderCache()
      case 'errors':
        return renderErrors()
      case 'memory':
        return renderMemory()
      default:
        return renderOverview()
    }
  }
  
  if (!metrics) {
    return (
      <div className={`bg-black/20 border border-white/10 rounded-lg p-4 ${className}`}>
        <div className="text-center text-white/60">Đang tải metrics...</div>
      </div>
    )
  }
  
  return (
    <div className={`bg-black/20 border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-white/80 text-lg font-medium">Performance Dashboard</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshMetrics}
              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition-colors"
            >
              Refresh
            </button>
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
            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/10">
              {[
                { id: 'overview', label: 'Tổng quan' },
                { id: 'performance', label: 'Hiệu suất' },
                { id: 'cache', label: 'Cache' },
                { id: 'errors', label: 'Lỗi' },
                { id: 'memory', label: 'Memory' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            {renderTabContent()}
          </div>
        ) : (
          renderOverview()
        )}
      </div>
    </div>
  )
}
