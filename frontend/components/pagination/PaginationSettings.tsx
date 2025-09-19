// Pagination Settings Component
// Component cho phép user tùy chỉnh pagination behavior

import React, { useState, useEffect } from 'react'
import { PreloadPaginationConfig } from '@/lib/types/pagination'

interface PaginationSettingsProps {
  // Current configuration
  config: PreloadPaginationConfig
  onConfigChange: (config: PreloadPaginationConfig) => void
  
  // UI props
  className?: string
  showAdvanced?: boolean
  showPresets?: boolean
  showReset?: boolean
}

// Predefined presets
const PRESETS = {
  fast: {
    name: 'Nhanh',
    description: 'Tối ưu cho tốc độ, ít cache',
    config: {
      itemsPerPage: 5,
      preloadPages: 1,
      cacheSize: 5,
      enableInfiniteScroll: false
    }
  },
  balanced: {
    name: 'Cân bằng',
    description: 'Cân bằng tốc độ và memory',
    config: {
      itemsPerPage: 10,
      preloadPages: 2,
      cacheSize: 8,
      enableInfiniteScroll: false
    }
  },
  smooth: {
    name: 'Mượt mà',
    description: 'Tối ưu cho UX, nhiều cache',
    config: {
      itemsPerPage: 15,
      preloadPages: 3,
      cacheSize: 12,
      enableInfiniteScroll: true
    }
  },
  mobile: {
    name: 'Mobile',
    description: 'Tối ưu cho thiết bị di động',
    config: {
      itemsPerPage: 8,
      preloadPages: 1,
      cacheSize: 6,
      enableInfiniteScroll: true
    }
  }
}

export default function PaginationSettings({
  config,
  onConfigChange,
  className = '',
  showAdvanced = true,
  showPresets = true,
  showReset = true
}: PaginationSettingsProps) {
  
  const [localConfig, setLocalConfig] = useState<PreloadPaginationConfig>(config)
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config)
  }, [config])
  
  // Handle config change
  const handleConfigChange = (newConfig: Partial<PreloadPaginationConfig>) => {
    const updatedConfig = { ...localConfig, ...newConfig }
    setLocalConfig(updatedConfig)
    onConfigChange(updatedConfig)
  }
  
  // Handle preset selection
  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS]
    if (preset) {
      setSelectedPreset(presetKey)
      handleConfigChange(preset.config)
    }
  }
  
  // Handle reset to default
  const handleReset = () => {
    const defaultConfig: PreloadPaginationConfig = {
      itemsPerPage: 10,
      preloadPages: 2,
      cacheSize: 8,
      enableInfiniteScroll: false
    }
    setSelectedPreset('')
    handleConfigChange(defaultConfig)
  }
  
  // Check if current config matches a preset
  const getCurrentPreset = () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      if (JSON.stringify(preset.config) === JSON.stringify(localConfig)) {
        return key
      }
    }
    return ''
  }
  
  // Get memory usage estimate
  const getMemoryEstimate = () => {
    const totalPages = localConfig.cacheSize
    const itemsPerPage = localConfig.itemsPerPage
    const estimatedMemory = totalPages * itemsPerPage * 0.5 // Rough estimate in MB
    return estimatedMemory
  }
  
  // Get performance estimate
  const getPerformanceEstimate = () => {
    const preloadPages = localConfig.preloadPages
    const cacheSize = localConfig.cacheSize
    
    if (preloadPages >= 3 && cacheSize >= 10) {
      return { level: 'high', color: 'text-green-400', text: 'Rất tốt' }
    } else if (preloadPages >= 2 && cacheSize >= 6) {
      return { level: 'medium', color: 'text-yellow-400', text: 'Tốt' }
    } else {
      return { level: 'low', color: 'text-orange-400', text: 'Cơ bản' }
    }
  }
  
  const performanceEstimate = getPerformanceEstimate()
  
  return (
    <div className={`bg-black/20 border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-white/80 text-lg font-medium">Cài đặt Pagination</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 bg-white/10 text-white/80 rounded text-sm hover:bg-white/20 transition-colors"
          >
            {isExpanded ? 'Thu gọn' : 'Mở rộng'}
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {isExpanded ? (
          <div className="space-y-6">
            {/* Presets */}
            {showPresets && (
              <div>
                <h4 className="text-white/80 text-sm font-medium mb-3">Presets</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(key)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedPreset === key || getCurrentPreset() === key
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-white/80 text-sm font-medium">{preset.name}</div>
                      <div className="text-white/60 text-xs mt-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Basic Settings */}
            <div>
              <h4 className="text-white/80 text-sm font-medium mb-3">Cài đặt cơ bản</h4>
              <div className="space-y-4">
                {/* Items per page */}
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Số items mỗi trang: {localConfig.itemsPerPage}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={localConfig.itemsPerPage}
                    onChange={(e) => handleConfigChange({ itemsPerPage: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>
                
                {/* Preload pages */}
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Số trang preload: {localConfig.preloadPages}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={localConfig.preloadPages}
                    onChange={(e) => handleConfigChange({ preloadPages: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>0</span>
                    <span>5</span>
                  </div>
                </div>
                
                {/* Cache size */}
                <div>
                  <label className="block text-white/80 text-sm mb-2">
                    Kích thước cache: {localConfig.cacheSize} trang
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    value={localConfig.cacheSize}
                    onChange={(e) => handleConfigChange({ cacheSize: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>3</span>
                    <span>20</span>
                  </div>
                </div>
                
                {/* Infinite scroll */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white/80 text-sm">Infinite scroll</div>
                    <div className="text-white/60 text-xs">Tự động load khi scroll</div>
                  </div>
                  <button
                    onClick={() => handleConfigChange({ enableInfiniteScroll: !localConfig.enableInfiniteScroll })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      localConfig.enableInfiniteScroll ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      localConfig.enableInfiniteScroll ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Advanced Settings */}
            {showAdvanced && (
              <div>
                <h4 className="text-white/80 text-sm font-medium mb-3">Cài đặt nâng cao</h4>
                <div className="space-y-4">
                  {/* Memory usage estimate */}
                  <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                    <div className="text-white/80 text-sm font-medium mb-2">Ước tính memory</div>
                    <div className="text-white/60 text-xs">
                      Khoảng {getMemoryEstimate().toFixed(1)}MB cho {localConfig.cacheSize} trang
                    </div>
                  </div>
                  
                  {/* Performance estimate */}
                  <div className="bg-black/20 border border-white/10 rounded-lg p-3">
                    <div className="text-white/80 text-sm font-medium mb-2">Hiệu suất dự kiến</div>
                    <div className={`text-sm ${performanceEstimate.color}`}>
                      {performanceEstimate.text}
                    </div>
                  </div>
                  
                  {/* Current preset info */}
                  {getCurrentPreset() && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <div className="text-blue-400 text-sm font-medium mb-1">
                        Preset: {PRESETS[getCurrentPreset() as keyof typeof PRESETS]?.name}
                      </div>
                      <div className="text-blue-400/80 text-xs">
                        {PRESETS[getCurrentPreset() as keyof typeof PRESETS]?.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              {showReset && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Reset
                </button>
              )}
              
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Items/trang</span>
              <span className="text-white text-lg font-bold">{localConfig.itemsPerPage}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Preload</span>
              <span className="text-white text-lg font-bold">{localConfig.preloadPages}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Cache</span>
              <span className="text-white text-lg font-bold">{localConfig.cacheSize}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Infinite scroll</span>
              <span className={`text-sm ${localConfig.enableInfiniteScroll ? 'text-green-400' : 'text-red-400'}`}>
                {localConfig.enableInfiniteScroll ? 'Bật' : 'Tắt'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
