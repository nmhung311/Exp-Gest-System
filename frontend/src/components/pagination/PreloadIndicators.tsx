// Preload Indicators Component
// Hiển thị trạng thái preload và cache cho pagination

import React, { useState, useEffect } from 'react'
import { PreloadIndicator, PageStatusIndicator } from '@/components/loading/AdvancedSkeletonLoader'

interface PreloadIndicatorsProps {
  // Pagination state
  currentPage: number
  totalPages: number
  loadedPages: Set<number>
  preloadedPages: Set<number>
  isPreloading: boolean
  
  // Configuration
  showPageStatus?: boolean
  showPreloadProgress?: boolean
  showCacheStats?: boolean
  maxVisiblePages?: number
  
  // Styling
  className?: string
  compact?: boolean
}

export default function PreloadIndicators({
  currentPage,
  totalPages,
  loadedPages,
  preloadedPages,
  isPreloading,
  showPageStatus = true,
  showPreloadProgress = true,
  showCacheStats = false,
  maxVisiblePages = 7,
  className = '',
  compact = false
}: PreloadIndicatorsProps) {
  
  const [showAllPages, setShowAllPages] = useState(false)
  
  // Calculate visible pages
  const visiblePages = React.useMemo(() => {
    if (showAllPages || totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    const pages: number[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)
    
    // Always show first page
    pages.push(1)
    
    // Show pages around current page
    const start = Math.max(2, currentPage - halfVisible)
    const end = Math.min(totalPages - 1, currentPage + halfVisible)
    
    if (start > 2) {
      pages.push(-1) // Ellipsis
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (end < totalPages - 1) {
      pages.push(-1) // Ellipsis
    }
    
    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }, [currentPage, totalPages, maxVisiblePages, showAllPages])
  
  // Calculate preload progress
  const preloadProgress = React.useMemo(() => {
    const totalLoaded = loadedPages.size + preloadedPages.size
    return {
      loaded: loadedPages.size,
      preloaded: preloadedPages.size,
      total: totalLoaded,
      percentage: totalPages > 0 ? (totalLoaded / totalPages) * 100 : 0
    }
  }, [loadedPages.size, preloadedPages.size, totalPages])
  
  // Calculate cache efficiency
  const cacheStats = React.useMemo(() => {
    const totalAccesses = loadedPages.size + preloadedPages.size
    const cacheHits = loadedPages.size
    const hitRate = totalAccesses > 0 ? (cacheHits / totalAccesses) * 100 : 0
    
    return {
      hitRate: Math.round(hitRate),
      totalPages: totalPages,
      loadedPages: loadedPages.size,
      preloadedPages: preloadedPages.size,
      efficiency: hitRate > 80 ? 'excellent' : hitRate > 60 ? 'good' : hitRate > 40 ? 'fair' : 'poor'
    }
  }, [loadedPages.size, preloadedPages.size, totalPages])
  
  // Get efficiency color
  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }
  
  // Get efficiency icon
  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return '🚀'
      case 'good': return '⚡'
      case 'fair': return '📈'
      case 'poor': return '⚠️'
      default: return '📊'
    }
  }
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <PreloadIndicator
          isPreloading={isPreloading}
          preloadedPages={Array.from(preloadedPages)}
          currentPage={currentPage}
        />
        
        {showCacheStats && (
          <div className="flex items-center gap-1 text-xs text-white/60">
            <span>{getEfficiencyIcon(cacheStats.efficiency)}</span>
            <span className={getEfficiencyColor(cacheStats.efficiency)}>
              {cacheStats.hitRate}%
            </span>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preload Progress */}
      {showPreloadProgress && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white/80 text-sm font-medium">Trạng thái tải</h4>
            <PreloadIndicator
              isPreloading={isPreloading}
              preloadedPages={Array.from(preloadedPages)}
              currentPage={currentPage}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Tiến độ tải</span>
              <span>{preloadProgress.percentage.toFixed(1)}%</span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${preloadProgress.percentage}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Đã tải: {preloadProgress.loaded}</span>
              <span>Tải trước: {preloadProgress.preloaded}</span>
              <span>Tổng: {preloadProgress.total}/{totalPages}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Page Status */}
      {showPageStatus && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white/80 text-sm font-medium">Trạng thái trang</h4>
            {totalPages > maxVisiblePages && (
              <button
                onClick={() => setShowAllPages(!showAllPages)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showAllPages ? 'Thu gọn' : 'Xem tất cả'}
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1">
            {visiblePages.map((page, index) => {
              if (page === -1) {
                return (
                  <div
                    key={`ellipsis-${index}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white/40"
                  >
                    ...
                  </div>
                )
              }
              
              return (
                <PageStatusIndicator
                  key={page}
                  page={page}
                  isLoaded={loadedPages.has(page)}
                  isPreloaded={preloadedPages.has(page)}
                  isCurrent={page === currentPage}
                />
              )
            })}
          </div>
          
          <div className="mt-3 flex items-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Hiện tại</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Đã tải</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span>Tải trước</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full" />
              <span>Chưa tải</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Cache Statistics */}
      {showCacheStats && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white/80 text-sm font-medium">Hiệu suất cache</h4>
            <span className={`text-xs ${getEfficiencyColor(cacheStats.efficiency)}`}>
              {getEfficiencyIcon(cacheStats.efficiency)} {cacheStats.efficiency.toUpperCase()}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Tỷ lệ hit</span>
              <span className={getEfficiencyColor(cacheStats.efficiency)}>
                {cacheStats.hitRate}%
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  cacheStats.efficiency === 'excellent' ? 'bg-green-500' :
                  cacheStats.efficiency === 'good' ? 'bg-blue-500' :
                  cacheStats.efficiency === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${cacheStats.hitRate}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
              <div>Trang đã tải: {cacheStats.loadedPages}</div>
              <div>Tải trước: {cacheStats.preloadedPages}</div>
              <div>Tổng trang: {cacheStats.totalPages}</div>
              <div>Hiệu suất: {cacheStats.efficiency}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
