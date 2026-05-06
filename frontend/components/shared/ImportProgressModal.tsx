'use client'

import React from 'react'

interface ImportProgressModalProps {
  isVisible: boolean
  progress: {
    currentPage: number
    totalPages: number
    isComplete: boolean
  }
  progressPercentage: number
  isLoadingFirstPage: boolean
  isBackgroundLoading: boolean
  hasError: boolean
  onClose: () => void
}

export default function ImportProgressModal({
  isVisible,
  progress,
  progressPercentage,
  isLoadingFirstPage,
  isBackgroundLoading,
  hasError,
  onClose
}: ImportProgressModalProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icon */}
          <div className="mb-4">
            {hasError ? (
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : progress.isComplete ? (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasError ? 'Lỗi Import' : progress.isComplete ? 'Import Hoàn Thành' : 'Đang Import Khách Mời'}
          </h3>

          {/* Description */}
          <p className="text-gray-400 mb-6">
            {hasError 
              ? 'Có lỗi xảy ra trong quá trình import. Vui lòng thử lại.'
              : isLoadingFirstPage
              ? 'Đang tải trang đầu tiên...'
              : isBackgroundLoading
              ? 'Đang tải các trang còn lại trong nền...'
              : progress.isComplete
              ? 'Tất cả khách mời đã được tải thành công!'
              : 'Đang xử lý...'
            }
          </p>

          {/* Progress Bar */}
          {!hasError && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Tiến độ</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Trang {progress.currentPage} / {progress.totalPages}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {!hasError && !progress.isComplete && (
            <div className="space-y-2 mb-6">
              {isLoadingFirstPage && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Đang tải trang đầu tiên...</span>
                </div>
              )}
              {isBackgroundLoading && (
                <div className="flex items-center justify-center gap-2 text-purple-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Đang tải các trang còn lại...</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {hasError ? (
              <button
                onClick={onClose}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Đóng
              </button>
            ) : progress.isComplete ? (
              <button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Hoàn Thành
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isLoadingFirstPage ? 'Đóng' : 'Tiếp Tục'}
              </button>
            )}
          </div>

          {/* Additional Info */}
          {!hasError && !isLoadingFirstPage && (
            <div className="mt-4 text-xs text-gray-500">
              <p>Trang đầu tiên đã được tải. Các trang còn lại đang được tải trong nền.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
