// Progressive Loading Component
// Component hiển thị progressive loading với multiple stages

import React, { useState, useEffect } from 'react'
import { LoadingState } from './AdvancedSkeletonLoader'

interface ProgressiveLoaderProps {
  // Loading stages
  stages: LoadingStage[]
  currentStage: number
  onStageComplete?: (stage: number) => void
  onAllStagesComplete?: () => void
  
  // UI props
  className?: string
  showProgress?: boolean
  showStageNames?: boolean
  showTimeEstimate?: boolean
  showCancelButton?: boolean
  
  // Styling
  variant?: 'default' | 'compact' | 'detailed'
  color?: 'blue' | 'green' | 'purple' | 'orange'
  
  // Callbacks
  onCancel?: () => void
}

interface LoadingStage {
  id: string
  name: string
  description?: string
  duration?: number // Estimated duration in ms
  weight?: number // Weight for progress calculation (default: 1)
  status: 'pending' | 'loading' | 'completed' | 'error'
  error?: string
}

export default function ProgressiveLoader({
  stages,
  currentStage,
  onStageComplete,
  onAllStagesComplete,
  className = '',
  showProgress = true,
  showStageNames = true,
  showTimeEstimate = true,
  showCancelButton = false,
  variant = 'default',
  color = 'blue',
  onCancel
}: ProgressiveLoaderProps) {
  
  const [completedStages, setCompletedStages] = useState<Set<number>>(new Set())
  const [stageStartTimes, setStageStartTimes] = useState<Map<number, number>>(new Map())
  const [totalProgress, setTotalProgress] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)
  
  // Calculate total progress
  useEffect(() => {
    const totalWeight = stages.reduce((sum, stage) => sum + (stage.weight || 1), 0)
    const completedWeight = stages
      .filter((_, index) => completedStages.has(index))
      .reduce((sum, stage) => sum + (stage.weight || 1), 0)
    
    const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0
    setTotalProgress(progress)
  }, [stages, completedStages])
  
  // Handle stage completion
  useEffect(() => {
    if (currentStage >= 0 && currentStage < stages.length) {
      const stage = stages[currentStage]
      
      if (stage.status === 'completed' && !completedStages.has(currentStage)) {
        setCompletedStages(prev => new Set([...prev, currentStage]))
        onStageComplete?.(currentStage)
        
        // Check if all stages are completed
        if (completedStages.size + 1 === stages.length) {
          onAllStagesComplete?.()
        }
      }
    }
  }, [currentStage, stages, completedStages, onStageComplete, onAllStagesComplete])
  
  // Track stage start times
  useEffect(() => {
    if (currentStage >= 0 && currentStage < stages.length) {
      const now = Date.now()
      setStageStartTimes(prev => new Map(prev.set(currentStage, now)))
    }
  }, [currentStage])
  
  // Calculate estimated time remaining
  useEffect(() => {
    if (currentStage >= 0 && currentStage < stages.length) {
      const stage = stages[currentStage]
      const startTime = stageStartTimes.get(currentStage)
      
      if (stage.duration && startTime) {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, stage.duration - elapsed)
        setEstimatedTimeRemaining(remaining)
      } else {
        setEstimatedTimeRemaining(null)
      }
    }
  }, [currentStage, stages, stageStartTimes])
  
  // Get color classes
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          primary: 'text-blue-400',
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-500/20',
          border: 'border-blue-500/20'
        }
      case 'green':
        return {
          primary: 'text-green-400',
          bg: 'bg-green-500',
          bgLight: 'bg-green-500/20',
          border: 'border-green-500/20'
        }
      case 'purple':
        return {
          primary: 'text-purple-400',
          bg: 'bg-purple-500',
          bgLight: 'bg-purple-500/20',
          border: 'border-purple-500/20'
        }
      case 'orange':
        return {
          primary: 'text-orange-400',
          bg: 'bg-orange-500',
          bgLight: 'bg-orange-500/20',
          border: 'border-orange-500/20'
        }
      default:
        return {
          primary: 'text-blue-400',
          bg: 'bg-blue-500',
          bgLight: 'bg-blue-500/20',
          border: 'border-blue-500/20'
        }
    }
  }
  
  const colors = getColorClasses()
  
  // Get stage status icon
  const getStageIcon = (stage: LoadingStage, index: number) => {
    if (stage.status === 'completed') return '✓'
    if (stage.status === 'error') return '❌'
    if (index === currentStage && stage.status === 'loading') return '⏳'
    return '○'
  }
  
  // Get stage status color
  const getStageColor = (stage: LoadingStage, index: number) => {
    if (stage.status === 'completed') return 'text-green-400'
    if (stage.status === 'error') return 'text-red-400'
    if (index === currentStage && stage.status === 'loading') return colors.primary
    return 'text-white/40'
  }
  
  // Format time
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }
  
  // Render compact variant
  const renderCompact = () => (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Progress bar */}
      {showProgress && (
        <div className="flex-1 bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${colors.bg}`}
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      )}
      
      {/* Progress text */}
      <div className="text-white/80 text-sm font-medium">
        {Math.round(totalProgress)}%
      </div>
      
      {/* Cancel button */}
      {showCancelButton && onCancel && (
        <button
          onClick={onCancel}
          className="text-white/60 hover:text-white/80 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  )
  
  // Render detailed variant
  const renderDetailed = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white/80 text-lg font-medium">Đang tải...</h3>
        {showCancelButton && onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/60">
            <span>Tiến độ</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="bg-white/10 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${colors.bg}`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Time estimate */}
      {showTimeEstimate && estimatedTimeRemaining !== null && (
        <div className="text-sm text-white/60">
          Thời gian còn lại: {formatTime(estimatedTimeRemaining)}
        </div>
      )}
      
      {/* Stages */}
      {showStageNames && (
        <div className="space-y-2">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                index === currentStage && stage.status === 'loading'
                  ? colors.border
                  : 'border-white/10'
              } ${
                index === currentStage && stage.status === 'loading'
                  ? colors.bgLight
                  : 'bg-black/20'
              }`}
            >
              <div className={`text-lg ${getStageColor(stage, index)}`}>
                {getStageIcon(stage, index)}
              </div>
              
              <div className="flex-1">
                <div className="text-white/80 text-sm font-medium">
                  {stage.name}
                </div>
                {stage.description && (
                  <div className="text-white/60 text-xs mt-1">
                    {stage.description}
                  </div>
                )}
                {stage.error && (
                  <div className="text-red-400 text-xs mt-1">
                    {stage.error}
                  </div>
                )}
              </div>
              
              {stage.duration && (
                <div className="text-white/60 text-xs">
                  {formatTime(stage.duration)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
  
  // Render default variant
  const renderDefault = () => (
    <div className={`space-y-3 ${className}`}>
      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/60">
            <span>Tiến độ</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <div className="bg-white/10 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${colors.bg}`}
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Current stage */}
      {showStageNames && currentStage >= 0 && currentStage < stages.length && (
        <div className="flex items-center gap-3">
          <div className={`text-lg ${getStageColor(stages[currentStage], currentStage)}`}>
            {getStageIcon(stages[currentStage], currentStage)}
          </div>
          <div className="flex-1">
            <div className="text-white/80 text-sm font-medium">
              {stages[currentStage].name}
            </div>
            {stages[currentStage].description && (
              <div className="text-white/60 text-xs mt-1">
                {stages[currentStage].description}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Time estimate */}
      {showTimeEstimate && estimatedTimeRemaining !== null && (
        <div className="text-sm text-white/60">
          Còn lại: {formatTime(estimatedTimeRemaining)}
        </div>
      )}
      
      {/* Cancel button */}
      {showCancelButton && onCancel && (
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  )
  
  // Render based on variant
  switch (variant) {
    case 'compact':
      return renderCompact()
    case 'detailed':
      return renderDetailed()
    case 'default':
    default:
      return renderDefault()
  }
}
