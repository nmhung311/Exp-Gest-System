// Progressive Loading Component
// Hiển thị loading progress và stages cho better UX

import React, { useState, useEffect } from 'react'
import { LoadingState, ErrorState, EmptyState } from '@/components/loading/AdvancedSkeletonLoader'

interface LoadingStage {
  id: string
  name: string
  description?: string
  status: 'pending' | 'loading' | 'completed' | 'error'
  progress?: number
  duration?: number
}

interface ProgressiveLoadingProps {
  // Loading stages
  stages: LoadingStage[]
  currentStage?: string
  
  // Configuration
  showProgress?: boolean
  showStages?: boolean
  showTiming?: boolean
  autoAdvance?: boolean
  
  // Styling
  className?: string
  compact?: boolean
  
  // Callbacks
  onStageComplete?: (stageId: string) => void
  onAllComplete?: () => void
  onError?: (stageId: string, error: Error) => void
}

export default function ProgressiveLoading({
  stages,
  currentStage,
  showProgress = true,
  showStages = true,
  showTiming = false,
  autoAdvance = false,
  className = '',
  compact = false,
  onStageComplete,
  onAllComplete,
  onError
}: ProgressiveLoadingProps) {
  
  const [stageStates, setStageStates] = useState<Map<string, LoadingStage>>(
    new Map(stages.map(stage => [stage.id, stage]))
  )
  
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  
  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)
    
    return () => clearInterval(interval)
  }, [])
  
  // Update stage status
  const updateStageStatus = (stageId: string, status: LoadingStage['status'], progress?: number) => {
    setStageStates(prev => {
      const newStates = new Map(prev)
      const stage = newStates.get(stageId)
      if (stage) {
        newStates.set(stageId, {
          ...stage,
          status,
          progress: progress ?? stage.progress
        })
      }
      return newStates
    })
  }
  
  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    const totalStages = stages.length
    const completedStages = Array.from(stageStates.values()).filter(
      stage => stage.status === 'completed'
    ).length
    
    return totalStages > 0 ? (completedStages / totalStages) * 100 : 0
  }, [stages.length, stageStates])
  
  // Calculate elapsed time
  const elapsedTime = currentTime - startTime
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${remainingSeconds}s`
  }
  
  // Get stage status color
  const getStageStatusColor = (status: LoadingStage['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-400'
      case 'loading': return 'text-blue-400'
      case 'completed': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }
  
  // Get stage status icon
  const getStageStatusIcon = (status: LoadingStage['status']) => {
    switch (status) {
      case 'pending': return '○'
      case 'loading': return '⟳'
      case 'completed': return '✓'
      case 'error': return '✗'
      default: return '○'
    }
  }
  
  // Check if all stages are complete
  const allComplete = Array.from(stageStates.values()).every(
    stage => stage.status === 'completed'
  )
  
  // Check if there's an error
  const hasError = Array.from(stageStates.values()).some(
    stage => stage.status === 'error'
  )
  
  // Auto-advance stages
  useEffect(() => {
    if (autoAdvance && currentStage) {
      const stage = stageStates.get(currentStage)
      if (stage && stage.status === 'loading') {
        const timer = setTimeout(() => {
          updateStageStatus(currentStage, 'completed')
          onStageComplete?.(currentStage)
        }, stage.duration || 1000)
        
        return () => clearTimeout(timer)
      }
    }
  }, [currentStage, stageStates, autoAdvance, onStageComplete])
  
  // Handle completion
  useEffect(() => {
    if (allComplete && !hasError) {
      onAllComplete?.()
    }
  }, [allComplete, hasError, onAllComplete])
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/60 text-sm">
            {overallProgress.toFixed(0)}%
          </span>
        </div>
        
        {showTiming && (
          <span className="text-white/40 text-xs">
            {formatTime(elapsedTime)}
          </span>
        )}
      </div>
    )
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress */}
      {showProgress && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/80 text-lg font-medium">Đang tải dữ liệu</h3>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">
                {overallProgress.toFixed(0)}%
              </span>
              {showTiming && (
                <span className="text-white/40 text-xs">
                  {formatTime(elapsedTime)}
                </span>
              )}
            </div>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              {Array.from(stageStates.values()).filter(s => s.status === 'completed').length} / {stages.length} hoàn thành
            </span>
            <span>
              {Array.from(stageStates.values()).filter(s => s.status === 'loading').length} đang tải
            </span>
          </div>
        </div>
      )}
      
      {/* Loading Stages */}
      {showStages && (
        <div className="bg-black/20 border border-white/10 rounded-lg p-4">
          <h4 className="text-white/80 text-sm font-medium mb-3">Chi tiết tải</h4>
          
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const stageState = stageStates.get(stage.id)
              const isActive = currentStage === stage.id
              const isCompleted = stageState?.status === 'completed'
              const isLoading = stageState?.status === 'loading'
              const hasError = stageState?.status === 'error'
              
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-500/10 border border-blue-500/20' :
                    isCompleted ? 'bg-green-500/10 border border-green-500/20' :
                    hasError ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-gray-500/10 border border-gray-500/20'
                  }`}
                >
                  {/* Stage Number */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isLoading ? 'bg-blue-500 text-white' :
                    hasError ? 'bg-red-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  {/* Stage Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-white/80 text-sm font-medium">
                        {stage.name}
                      </h5>
                      <span className={`text-xs ${getStageStatusColor(stageState?.status || 'pending')}`}>
                        {getStageStatusIcon(stageState?.status || 'pending')}
                      </span>
                    </div>
                    
                    {stage.description && (
                      <p className="text-white/60 text-xs">
                        {stage.description}
                      </p>
                    )}
                    
                    {/* Progress Bar */}
                    {isLoading && stageState?.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${stageState.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          {stageState.progress.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Stage Status */}
                  <div className="text-right">
                    {isLoading && (
                      <div className="text-blue-400 text-xs">
                        Đang tải...
                      </div>
                    )}
                    {isCompleted && (
                      <div className="text-green-400 text-xs">
                        Hoàn thành
                      </div>
                    )}
                    {hasError && (
                      <div className="text-red-400 text-xs">
                        Lỗi
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Error State */}
      {hasError && (
        <ErrorState
          message="Có lỗi xảy ra trong quá trình tải"
          onRetry={() => {
            // Reset all stages to pending
            setStageStates(new Map(stages.map(stage => [stage.id, { ...stage, status: 'pending' }])))
            setStartTime(Date.now())
          }}
        />
      )}
      
      {/* Success State */}
      {allComplete && !hasError && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-green-400 text-sm font-medium">Tải hoàn tất</h4>
              <p className="text-green-400/60 text-xs">
                Tất cả dữ liệu đã được tải thành công
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
