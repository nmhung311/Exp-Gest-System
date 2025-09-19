// Error Analytics Dashboard Component
// Dashboard hiển thị thống kê lỗi và analytics

import React, { useState, useEffect } from 'react'
import { errorHandler, ErrorInfo } from '@/lib/utils/errorHandler'

interface ErrorAnalyticsDashboardProps {
  className?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export default function ErrorAnalyticsDashboard({
  className = '',
  showDetails = true,
  autoRefresh = true,
  refreshInterval = 5000
}: ErrorAnalyticsDashboardProps) {
  
  const [errorStats, setErrorStats] = useState<any>(null)
  const [recentErrors, setRecentErrors] = useState<ErrorInfo[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'recent' | 'byType' | 'bySeverity'>('overview')
  
  // Refresh error data
  const refreshErrorData = () => {
    const stats = errorHandler.getErrorStats()
    const recent = errorHandler.getAllErrors()
      .sort((a, b) => b.context.timestamp - a.context.timestamp)
      .slice(0, 10)
    
    setErrorStats(stats)
    setRecentErrors(recent)
  }
  
  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshErrorData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])
  
  // Initial load
  useEffect(() => {
    refreshErrorData()
  }, [])
  
  // Get severity color
  const getSeverityColor = (severity: ErrorInfo['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }
  
  // Get severity icon
  const getSeverityIcon = (severity: ErrorInfo['severity']) => {
    switch (severity) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      case 'low': return 'ℹ️'
      default: return '❌'
    }
  }
  
  // Get type color
  const getTypeColor = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'network': return 'text-blue-400'
      case 'api': return 'text-green-400'
      case 'validation': return 'text-yellow-400'
      case 'timeout': return 'text-orange-400'
      case 'unknown': return 'text-gray-400'
      default: return 'text-white/60'
    }
  }
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN')
  }
  
  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`
    return `${Math.floor(ms / 60000)}m`
  }
  
  // Render overview tab
  const renderOverview = () => {
    if (!errorStats) return null
    
    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Tổng lỗi</div>
            <div className="text-white text-2xl font-bold">{errorStats.total}</div>
          </div>
          
          <div className="bg-black/20 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Chưa giải quyết</div>
            <div className="text-red-400 text-2xl font-bold">{errorStats.unresolved}</div>
          </div>
          
          <div className="bg-black/20 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Đã giải quyết</div>
            <div className="text-green-400 text-2xl font-bold">{errorStats.resolved}</div>
          </div>
          
          <div className="bg-black/20 border border-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm">Tỷ lệ lỗi</div>
            <div className="text-yellow-400 text-2xl font-bold">{errorStats.errorRate}/min</div>
          </div>
        </div>
        
        {/* Error Types */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h4 className="text-white/80 text-sm font-medium mb-3">Lỗi theo loại</h4>
          <div className="space-y-2">
            {Object.entries(errorStats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className={`text-sm ${getTypeColor(type as ErrorInfo['type'])}`}>
                  {type}
                </span>
                <span className="text-white/80 text-sm">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Error Severity */}
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h4 className="text-white/80 text-sm font-medium mb-3">Lỗi theo mức độ</h4>
          <div className="space-y-2">
            {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className={`text-sm ${getSeverityColor(severity as ErrorInfo['severity'])}`}>
                  {getSeverityIcon(severity as ErrorInfo['severity'])} {severity}
                </span>
                <span className="text-white/80 text-sm">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  // Render recent errors tab
  const renderRecent = () => (
    <div className="space-y-3">
      {recentErrors.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          Không có lỗi gần đây
        </div>
      ) : (
        recentErrors.map(error => (
          <div key={error.id} className="bg-black/20 border border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className={`text-lg ${getSeverityColor(error.severity)}`}>
                {getSeverityIcon(error.severity)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${getTypeColor(error.type)}`}>
                    {error.type}
                  </span>
                  <span className={`text-xs ${getSeverityColor(error.severity)}`}>
                    {error.severity}
                  </span>
                  {error.resolved && (
                    <span className="text-xs text-green-400">✓ Đã giải quyết</span>
                  )}
                </div>
                
                <p className="text-white/80 text-sm mb-2">{error.message}</p>
                
                <div className="text-xs text-white/60 space-y-1">
                  <div>Thời gian: {formatTimestamp(error.context.timestamp)}</div>
                  <div>Component: {error.context.component}</div>
                  <div>Action: {error.context.action}</div>
                  {error.retryCount > 0 && (
                    <div>Số lần thử: {error.retryCount}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
  
  // Render by type tab
  const renderByType = () => {
    if (!errorStats) return null
    
    const errorsByType = recentErrors.reduce((acc, error) => {
      if (!acc[error.type]) acc[error.type] = []
      acc[error.type].push(error)
      return acc
    }, {} as Record<ErrorInfo['type'], ErrorInfo[]>)
    
    return (
      <div className="space-y-4">
        {Object.entries(errorsByType).map(([type, errors]) => (
          <div key={type} className="bg-black/20 border border-white/10 rounded-lg p-4">
            <h4 className={`text-lg font-medium mb-3 ${getTypeColor(type as ErrorInfo['type'])}`}>
              {type} ({errors.length})
            </h4>
            
            <div className="space-y-2">
              {errors.slice(0, 5).map(error => (
                <div key={error.id} className="flex items-center justify-between p-2 bg-black/10 rounded">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getSeverityColor(error.severity)}`}>
                      {getSeverityIcon(error.severity)}
                    </span>
                    <span className="text-white/80 text-sm">{error.message}</span>
                  </div>
                  <span className="text-xs text-white/60">
                    {formatTimestamp(error.context.timestamp)}
                  </span>
                </div>
              ))}
              
              {errors.length > 5 && (
                <div className="text-center text-white/60 text-xs">
                  ... và {errors.length - 5} lỗi khác
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Render by severity tab
  const renderBySeverity = () => {
    if (!errorStats) return null
    
    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      if (!acc[error.severity]) acc[error.severity] = []
      acc[error.severity].push(error)
      return acc
    }, {} as Record<ErrorInfo['severity'], ErrorInfo[]>)
    
    return (
      <div className="space-y-4">
        {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
          const errors = errorsBySeverity[severity] || []
          if (errors.length === 0) return null
          
          return (
            <div key={severity} className="bg-black/20 border border-white/10 rounded-lg p-4">
              <h4 className={`text-lg font-medium mb-3 ${getSeverityColor(severity)}`}>
                {getSeverityIcon(severity)} {severity.toUpperCase()} ({errors.length})
              </h4>
              
              <div className="space-y-2">
                {errors.slice(0, 5).map(error => (
                  <div key={error.id} className="flex items-center justify-between p-2 bg-black/10 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${getTypeColor(error.type)}`}>
                        {error.type}
                      </span>
                      <span className="text-white/80 text-sm">{error.message}</span>
                    </div>
                    <span className="text-xs text-white/60">
                      {formatTimestamp(error.context.timestamp)}
                    </span>
                  </div>
                ))}
                
                {errors.length > 5 && (
                  <div className="text-center text-white/60 text-xs">
                    ... và {errors.length - 5} lỗi khác
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  
  // Render tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview()
      case 'recent':
        return renderRecent()
      case 'byType':
        return renderByType()
      case 'bySeverity':
        return renderBySeverity()
      default:
        return renderOverview()
    }
  }
  
  return (
    <div className={`bg-black/20 border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white/80 text-lg font-medium">Error Analytics</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshErrorData}
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
                { id: 'recent', label: 'Gần đây' },
                { id: 'byType', label: 'Theo loại' },
                { id: 'bySeverity', label: 'Theo mức độ' }
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Tổng lỗi</span>
              <span className="text-white text-lg font-bold">{errorStats?.total || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Chưa giải quyết</span>
              <span className="text-red-400 text-lg font-bold">{errorStats?.unresolved || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Tỷ lệ lỗi</span>
              <span className="text-yellow-400 text-lg font-bold">{errorStats?.errorRate || 0}/min</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
