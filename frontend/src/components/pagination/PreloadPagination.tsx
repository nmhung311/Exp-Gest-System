// Preload Pagination Component
// Component tái sử dụng cho tất cả các trang có pagination

import React from 'react'
import { PreloadPaginationHook } from '@/lib/types/pagination'
import { PreloadIndicator, PageStatusIndicator } from '@/components/loading/AdvancedSkeletonLoader'

interface PreloadPaginationProps {
  pagination: PreloadPaginationHook
  showInfo?: boolean
  showPageNumbers?: boolean
  maxVisiblePages?: number
  className?: string
  onPageChange?: (page: number) => void
}

export default function PreloadPagination({
  pagination,
  showInfo = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className = '',
  onPageChange
}: PreloadPaginationProps) {
  const { state, actions, paginationInfo } = pagination
  
  const handlePageChange = (page: number) => {
    actions.goToPage(page)
    onPageChange?.(page)
  }
  
  const getPageNumbers = () => {
    const { currentPage, totalPages } = state
    const pages: (number | string)[] = []
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i)
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  
  const getPageButtonClass = (page: number, isActive: boolean) => {
    const baseClass = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center min-w-[40px]"
    
    if (isActive) {
      return `${baseClass} bg-blue-500 text-white shadow-lg`
    }
    
    return `${baseClass} bg-white/10 text-white/80 hover:bg-white/20 hover:text-white border border-white/20`
  }
  
  const getPreloadIndicator = (page: number) => {
    if (pagination.isPagePreloaded(page)) {
      return (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" 
             title="Trang đã preload sẵn" />
      )
    }
    return null
  }
  
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}>
      {/* Pagination Info */}
      {showInfo && (
        <div className="text-sm text-white/60 text-center sm:text-left">
          Hiển thị {paginationInfo.startIndex + 1}-{paginationInfo.endIndex} trong tổng số {paginationInfo.totalItems} mục
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={actions.prevPage}
          disabled={!pagination.hasPrevPage}
          className="px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Trước
        </button>
        
        {/* Page Numbers */}
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-white/40">
                    ...
                  </span>
                )
              }
              
              const pageNum = page as number
              const isActive = pageNum === state.currentPage
              
              return (
                <div key={pageNum} className="relative">
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    className={getPageButtonClass(pageNum, isActive)}
                  >
                    {pageNum}
                  </button>
                  {getPreloadIndicator(pageNum)}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Next Button */}
        <button
          onClick={actions.nextPage}
          disabled={!pagination.hasNextPage}
          className="px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          Sau
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Mobile Pagination Component
export function MobilePagination({
  pagination,
  className = '',
  onPageChange
}: Omit<PreloadPaginationProps, 'showPageNumbers' | 'maxVisiblePages'>) {
  const { state, actions, paginationInfo } = pagination
  
  const handlePageChange = (page: number) => {
    actions.goToPage(page)
    onPageChange?.(page)
  }
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page Info */}
      <div className="text-sm text-white/60">
        Trang {state.currentPage} / {state.totalPages}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={actions.prevPage}
          disabled={!pagination.hasPrevPage}
          className="px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Trước
        </button>
        
        <button
          onClick={actions.nextPage}
          disabled={!pagination.hasNextPage}
          className="px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Sau
        </button>
      </div>
    </div>
  )
}

// Compact Pagination Component
export function CompactPagination({
  pagination,
  className = '',
  onPageChange
}: Omit<PreloadPaginationProps, 'showPageNumbers' | 'maxVisiblePages'>) {
  const { state, actions } = pagination
  
  const handlePageChange = (page: number) => {
    actions.goToPage(page)
    onPageChange?.(page)
  }
  
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={actions.prevPage}
        disabled={!pagination.hasPrevPage}
        className="px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
      >
        ‹
      </button>
      
      <span className="text-xs text-white/60 px-2">
        {state.currentPage} / {state.totalPages}
      </span>
      
      <button
        onClick={actions.nextPage}
        disabled={!pagination.hasNextPage}
        className="px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
      >
        ›
      </button>
    </div>
  )
}
