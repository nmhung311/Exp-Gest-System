// Performance Settings Component
// Component settings để tùy chỉnh performance monitoring

import React, { useState, useEffect } from 'react'
import { paginationAnalytics, PerformanceThresholds } from '@/lib/analytics/paginationAnalytics'

interface PerformanceSettingsProps {
  className?: string
  onSettingsChange?: (settings: PerformanceSettings) => void
}

interface PerformanceSettings {
  // Monitoring settings
  enableMonitoring: boolean
  updateInterval: number
  maxDataPoints: number
  
  // Thresholds
  thresholds: PerformanceThresholds
  
  // Alerts
  enableAlerts: boolean
  alertLoadTime: number
  alertCacheHitRate: number
  alertMemoryUsage: number
  alertErrorRate: number
  
  // Display settings
  showChart: boolean
  chartHeight: number
  showDetails: boolean
  
  // Export settings
  enableExport: boolean
  exportFormat: 'json' | 'csv'
  autoExport: boolean
  exportInterval: number
}

export default function PerformanceSettings({
  className = '',
  onSettingsChange
}: PerformanceSettingsProps) {
  
  const [settings, setSettings] = useState<PerformanceSettings>({
    enableMonitoring: true,
    updateInterval: 1000,
    maxDataPoints: 50,
    thresholds: {
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
    },
    enableAlerts: true,
    alertLoadTime: 1000,
    alertCacheHitRate: 50,
    alertMemoryUsage: 50,
    alertErrorRate: 10,
    showChart: true,
    chartHeight: 200,
    showDetails: true,
    enableExport: false,
    exportFormat: 'json',
    autoExport: false,
    exportInterval: 300000 // 5 minutes
  })
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'monitoring' | 'thresholds' | 'alerts' | 'display' | 'export'>('monitoring')
  
  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('performance-settings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      }
    } catch (error) {
      console.warn('Failed to load performance settings:', error)
    }
  }, [])
  
  // Save settings to localStorage
  const saveSettings = (newSettings: PerformanceSettings) => {
    try {
      localStorage.setItem('performance-settings', JSON.stringify(newSettings))
      setSettings(newSettings)
      onSettingsChange?.(newSettings)
    } catch (error) {
      console.warn('Failed to save performance settings:', error)
    }
  }
  
  // Update setting
  const updateSetting = <K extends keyof PerformanceSettings>(
    key: K,
    value: PerformanceSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }
  
  // Update threshold
  const updateThreshold = (
    level: keyof PerformanceThresholds,
    metric: keyof PerformanceThresholds['excellent'],
    value: number
  ) => {
    const newSettings = {
      ...settings,
      thresholds: {
        ...settings.thresholds,
        [level]: {
          ...settings.thresholds[level],
          [metric]: value
        }
      }
    }
    saveSettings(newSettings)
  }
  
  // Reset to defaults
  const resetToDefaults = () => {
    const defaultSettings: PerformanceSettings = {
      enableMonitoring: true,
      updateInterval: 1000,
      maxDataPoints: 50,
      thresholds: {
        excellent: { loadTime: 200, cacheHitRate: 90, memoryUsage: 10 },
        good: { loadTime: 500, cacheHitRate: 75, memoryUsage: 25 },
        fair: { loadTime: 1000, cacheHitRate: 60, memoryUsage: 50 },
        poor: { loadTime: 2000, cacheHitRate: 40, memoryUsage: 100 }
      },
      enableAlerts: true,
      alertLoadTime: 1000,
      alertCacheHitRate: 50,
      alertMemoryUsage: 50,
      alertErrorRate: 10,
      showChart: true,
      chartHeight: 200,
      showDetails: true,
      enableExport: false,
      exportFormat: 'json',
      autoExport: false,
      exportInterval: 300000
    }
    saveSettings(defaultSettings)
  }
  
  // Export data
  const exportData = () => {
    const data = paginationAnalytics.exportData()
    
    if (settings.exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pagination-analytics-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export
      const csvData = [
        ['Timestamp', 'Type', 'Page', 'Duration', 'Data'],
        ...data.events.map(event => [
          new Date(event.timestamp).toISOString(),
          event.type,
          event.page?.toString() || '',
          event.duration?.toString() || '',
          JSON.stringify(event.data || {})
        ])
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pagination-analytics-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }
  
  // Clear data
  const clearData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu analytics?')) {
      paginationAnalytics.clear()
    }
  }
  
  // Render monitoring tab
  const renderMonitoringTab = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enableMonitoring}
            onChange={(e) => updateSetting('enableMonitoring', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-white/80 text-sm">Bật monitoring</span>
        </label>
        
        <div className="space-y-2">
          <label className="text-white/80 text-sm">Update interval (ms)</label>
          <input
            type="number"
            value={settings.updateInterval}
            onChange={(e) => updateSetting('updateInterval', parseInt(e.target.value))}
            min="100"
            max="10000"
            step="100"
            className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-white/80 text-sm">Max data points</label>
          <input
            type="number"
            value={settings.maxDataPoints}
            onChange={(e) => updateSetting('maxDataPoints', parseInt(e.target.value))}
            min="10"
            max="1000"
            step="10"
            className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
  
  // Render thresholds tab
  const renderThresholdsTab = () => (
    <div className="space-y-4">
      {(['excellent', 'good', 'fair', 'poor'] as const).map(level => (
        <div key={level} className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h4 className="text-white/80 text-sm font-medium mb-3 capitalize">{level}</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-white/60 text-xs">Load Time (ms)</label>
              <input
                type="number"
                value={settings.thresholds[level].loadTime}
                onChange={(e) => updateThreshold(level, 'loadTime', parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-black/20 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-white/60 text-xs">Cache Hit Rate (%)</label>
              <input
                type="number"
                value={settings.thresholds[level].cacheHitRate}
                onChange={(e) => updateThreshold(level, 'cacheHitRate', parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full px-2 py-1 bg-black/20 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-white/60 text-xs">Memory Usage (MB)</label>
              <input
                type="number"
                value={settings.thresholds[level].memoryUsage}
                onChange={(e) => updateThreshold(level, 'memoryUsage', parseInt(e.target.value))}
                className="w-full px-2 py-1 bg-black/20 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
  
  // Render alerts tab
  const renderAlertsTab = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enableAlerts}
            onChange={(e) => updateSetting('enableAlerts', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-white/80 text-sm">Bật alerts</span>
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-white/80 text-sm">Alert Load Time (ms)</label>
            <input
              type="number"
              value={settings.alertLoadTime}
              onChange={(e) => updateSetting('alertLoadTime', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-white/80 text-sm">Alert Cache Hit Rate (%)</label>
            <input
              type="number"
              value={settings.alertCacheHitRate}
              onChange={(e) => updateSetting('alertCacheHitRate', parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-white/80 text-sm">Alert Memory Usage (MB)</label>
            <input
              type="number"
              value={settings.alertMemoryUsage}
              onChange={(e) => updateSetting('alertMemoryUsage', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-white/80 text-sm">Alert Error Rate (%)</label>
            <input
              type="number"
              value={settings.alertErrorRate}
              onChange={(e) => updateSetting('alertErrorRate', parseInt(e.target.value))}
              min="0"
              max="100"
              className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render display tab
  const renderDisplayTab = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.showChart}
            onChange={(e) => updateSetting('showChart', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-white/80 text-sm">Hiển thị chart</span>
        </label>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.showDetails}
            onChange={(e) => updateSetting('showDetails', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-white/80 text-sm">Hiển thị chi tiết</span>
        </label>
        
        <div className="space-y-2">
          <label className="text-white/80 text-sm">Chart Height (px)</label>
          <input
            type="number"
            value={settings.chartHeight}
            onChange={(e) => updateSetting('chartHeight', parseInt(e.target.value))}
            min="100"
            max="500"
            step="50"
            className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
  
  // Render export tab
  const renderExportTab = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.enableExport}
            onChange={(e) => updateSetting('enableExport', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-white/80 text-sm">Bật export</span>
        </label>
        
        <div className="space-y-2">
          <label className="text-white/80 text-sm">Export Format</label>
          <select
            value={settings.exportFormat}
            onChange={(e) => updateSetting('exportFormat', e.target.value as 'json' | 'csv')}
            className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoExport}
            onChange={(e) => updateSetting('autoExport', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-white/80 text-sm">Auto export</span>
        </label>
        
        <div className="space-y-2">
          <label className="text-white/80 text-sm">Export Interval (ms)</label>
          <input
            type="number"
            value={settings.exportInterval}
            onChange={(e) => updateSetting('exportInterval', parseInt(e.target.value))}
            min="60000"
            max="3600000"
            step="60000"
            className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={exportData}
          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
        >
          Export Data
        </button>
        <button
          onClick={clearData}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Clear Data
        </button>
      </div>
    </div>
  )
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return renderMonitoringTab()
      case 'thresholds':
        return renderThresholdsTab()
      case 'alerts':
        return renderAlertsTab()
      case 'display':
        return renderDisplayTab()
      case 'export':
        return renderExportTab()
      default:
        return renderMonitoringTab()
    }
  }
  
  return (
    <div className={`bg-black/20 border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white/80 text-lg font-medium">Performance Settings</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm hover:bg-yellow-500/30 transition-colors"
            >
              Reset
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
                { id: 'monitoring', label: 'Monitoring' },
                { id: 'thresholds', label: 'Thresholds' },
                { id: 'alerts', label: 'Alerts' },
                { id: 'display', label: 'Display' },
                { id: 'export', label: 'Export' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
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
              <span className="text-white/80 text-sm">Monitoring</span>
              <span className={`text-xs ${settings.enableMonitoring ? 'text-green-400' : 'text-red-400'}`}>
                {settings.enableMonitoring ? 'Bật' : 'Tắt'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Alerts</span>
              <span className={`text-xs ${settings.enableAlerts ? 'text-green-400' : 'text-red-400'}`}>
                {settings.enableAlerts ? 'Bật' : 'Tắt'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Export</span>
              <span className={`text-xs ${settings.enableExport ? 'text-green-400' : 'text-red-400'}`}>
                {settings.enableExport ? 'Bật' : 'Tắt'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
