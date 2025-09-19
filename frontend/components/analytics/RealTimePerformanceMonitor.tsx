// Real-time Performance Monitor Component
// Component monitor hiệu suất real-time cho pagination

import React, { useState, useEffect, useRef } from 'react'
import { paginationAnalytics, PaginationMetrics } from '@/lib/analytics/paginationAnalytics'

interface RealTimePerformanceMonitorProps {
  className?: string
  showChart?: boolean
  chartHeight?: number
  updateInterval?: number
  maxDataPoints?: number
}

interface PerformanceDataPoint {
  timestamp: number
  loadTime: number
  cacheHitRate: number
  memoryUsage: number
  errorRate: number
}

export default function RealTimePerformanceMonitor({
  className = '',
  showChart = true,
  chartHeight = 200,
  updateInterval = 1000,
  maxDataPoints = 50
}: RealTimePerformanceMonitorProps) {
  
  const [dataPoints, setDataPoints] = useState<PerformanceDataPoint[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<PaginationMetrics | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const intervalRef = useRef<NodeJS.Timeout>()
  
  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true)
    
    intervalRef.current = setInterval(() => {
      const metrics = paginationAnalytics.getMetrics()
      setCurrentMetrics(metrics)
      
      const newDataPoint: PerformanceDataPoint = {
        timestamp: Date.now(),
        loadTime: metrics.loadTimes.average,
        cacheHitRate: metrics.cache.hitRate,
        memoryUsage: metrics.memory.estimatedUsage,
        errorRate: metrics.errors.totalErrors > 0 ? (metrics.errors.totalErrors / metrics.interactions.totalInteractions) * 100 : 0
      }
      
      setDataPoints(prev => {
        const newPoints = [...prev, newDataPoint]
        return newPoints.slice(-maxDataPoints)
      })
      
      // Check for alerts
      checkAlerts(metrics)
    }, updateInterval)
  }
  
  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }
  
  // Check for performance alerts
  const checkAlerts = (metrics: PaginationMetrics) => {
    const newAlerts: string[] = []
    
    // Load time alert
    if (metrics.loadTimes.average > 1000) {
      newAlerts.push(`Load time cao: ${metrics.loadTimes.average.toFixed(0)}ms`)
    }
    
    // Cache hit rate alert
    if (metrics.cache.hitRate < 50) {
      newAlerts.push(`Cache hit rate thấp: ${metrics.cache.hitRate.toFixed(1)}%`)
    }
    
    // Memory usage alert
    if (metrics.memory.estimatedUsage > 50) {
      newAlerts.push(`Memory usage cao: ${metrics.memory.estimatedUsage.toFixed(1)}MB`)
    }
    
    // Error rate alert
    if (metrics.errors.totalErrors > 0 && metrics.interactions.totalInteractions > 0) {
      const errorRate = (metrics.errors.totalErrors / metrics.interactions.totalInteractions) * 100
      if (errorRate > 10) {
        newAlerts.push(`Error rate cao: ${errorRate.toFixed(1)}%`)
      }
    }
    
    setAlerts(newAlerts)
  }
  
  // Draw chart
  const drawChart = () => {
    const canvas = canvasRef.current
    if (!canvas || dataPoints.length < 2) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const width = canvas.width
    const height = canvas.height
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Set up chart area
    const padding = 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }
    
    // Draw load time line
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    dataPoints.forEach((point, index) => {
      const x = padding + (chartWidth / (dataPoints.length - 1)) * index
      const y = height - padding - (point.loadTime / 2000) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // Draw cache hit rate line
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    dataPoints.forEach((point, index) => {
      const x = padding + (chartWidth / (dataPoints.length - 1)) * index
      const y = height - padding - (point.cacheHitRate / 100) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // Draw memory usage line
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    dataPoints.forEach((point, index) => {
      const x = padding + (chartWidth / (dataPoints.length - 1)) * index
      const y = height - padding - (point.memoryUsage / 100) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '12px Arial'
    ctx.textAlign = 'left'
    
    // Y-axis labels
    ctx.fillText('2000ms', 5, padding + 5)
    ctx.fillText('1000ms', 5, padding + chartHeight / 2 + 5)
    ctx.fillText('0ms', 5, height - padding + 5)
    
    // Legend
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(width - 120, padding, 10, 10)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText('Load Time', width - 105, padding + 8)
    
    ctx.fillStyle = '#10b981'
    ctx.fillRect(width - 120, padding + 20, 10, 10)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText('Cache Hit Rate', width - 105, padding + 28)
    
    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(width - 120, padding + 40, 10, 10)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText('Memory Usage', width - 105, padding + 48)
  }
  
  // Animation loop
  const animate = () => {
    drawChart()
    animationRef.current = requestAnimationFrame(animate)
  }
  
  // Start animation when monitoring
  useEffect(() => {
    if (isMonitoring && showChart) {
      animate()
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isMonitoring, showChart, dataPoints])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [])
  
  // Format number
  const formatNumber = (num: number, decimals: number = 1) => {
    return num.toFixed(decimals)
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
  
  // Get current status color
  const getStatusColor = (value: number, thresholds: { good: number; fair: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-400'
    if (value <= thresholds.fair) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  return (
    <div className={`bg-black/20 border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white/80 text-lg font-medium">Real-time Performance Monitor</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-white/60 text-sm">
              {isMonitoring ? 'Đang monitor' : 'Đã dừng'}
            </span>
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isMonitoring
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {isMonitoring ? 'Dừng' : 'Bắt đầu'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Current Metrics */}
        {currentMetrics && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 border border-white/10 rounded-lg p-3">
              <div className="text-white/60 text-sm">Load Time</div>
              <div className={`text-lg font-medium ${getStatusColor(currentMetrics.loadTimes.average, { good: 200, fair: 500, poor: 1000 })}`}>
                {formatTime(currentMetrics.loadTimes.average)}
              </div>
            </div>
            
            <div className="bg-black/20 border border-white/10 rounded-lg p-3">
              <div className="text-white/60 text-sm">Cache Hit Rate</div>
              <div className={`text-lg font-medium ${getStatusColor(100 - currentMetrics.cache.hitRate, { good: 10, fair: 25, poor: 50 })}`}>
                {formatNumber(currentMetrics.cache.hitRate, 1)}%
              </div>
            </div>
            
            <div className="bg-black/20 border border-white/10 rounded-lg p-3">
              <div className="text-white/60 text-sm">Memory Usage</div>
              <div className={`text-lg font-medium ${getStatusColor(currentMetrics.memory.estimatedUsage, { good: 10, fair: 25, poor: 50 })}`}>
                {formatMemory(currentMetrics.memory.estimatedUsage)}
              </div>
            </div>
            
            <div className="bg-black/20 border border-white/10 rounded-lg p-3">
              <div className="text-white/60 text-sm">Error Rate</div>
              <div className={`text-lg font-medium ${getStatusColor((currentMetrics.errors.totalErrors / Math.max(currentMetrics.interactions.totalInteractions, 1)) * 100, { good: 1, fair: 5, poor: 10 })}`}>
                {formatNumber((currentMetrics.errors.totalErrors / Math.max(currentMetrics.interactions.totalInteractions, 1)) * 100, 1)}%
              </div>
            </div>
          </div>
        )}
        
        {/* Chart */}
        {showChart && (
          <div className="bg-black/20 border border-white/10 rounded-lg p-4">
            <h4 className="text-white/80 text-sm font-medium mb-3">Performance Chart</h4>
            <canvas
              ref={canvasRef}
              width={800}
              height={chartHeight}
              className="w-full h-full"
            />
          </div>
        )}
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-red-400 text-sm font-medium mb-2">Performance Alerts</h4>
            <ul className="space-y-1">
              {alerts.map((alert, index) => (
                <li key={index} className="text-red-400/80 text-xs">
                  • {alert}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Data Points Info */}
        <div className="text-center text-white/60 text-xs">
          {dataPoints.length} data points | Update every {updateInterval}ms
        </div>
      </div>
    </div>
  )
}
