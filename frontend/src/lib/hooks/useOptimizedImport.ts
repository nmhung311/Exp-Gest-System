// Custom Hook: useOptimizedImport
// Hook để tối ưu hóa trải nghiệm import khách mời

import { useCallback, useState, useEffect, useRef } from 'react'
import { Guest } from '@/lib/types/guest'
import { fetchGuestsPage, GuestsApiParams } from '@/lib/api/guestsApi'

interface ImportProgress {
  currentPage: number
  totalPages: number
  isComplete: boolean
  error?: string
}

interface UseOptimizedImportOptions {
  eventFilter: string
  filters: {
    searchTerm: string
    statusFilter: string
    tagFilter: string
    organizationFilter: string
    roleFilter: string
  }
  itemsPerPage?: number
  onFirstPageLoaded?: (guests: Guest[]) => void
  onImportComplete?: () => void
  onError?: (error: Error) => void
}

export function useOptimizedImport({
  eventFilter,
  filters,
  itemsPerPage = 6,
  onFirstPageLoaded,
  onImportComplete,
  onError
}: UseOptimizedImportOptions) {
  
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    currentPage: 0,
    totalPages: 0,
    isComplete: false
  })
  
  const [firstPageData, setFirstPageData] = useState<Guest[]>([])
  const [allPagesData, setAllPagesData] = useState<Map<number, Guest[]>>(new Map())
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const isImportingRef = useRef(false)

  // Hàm load trang đầu tiên nhanh
  const loadFirstPage = useCallback(async () => {
    try {
      const params: GuestsApiParams = {
        page: 1,
        itemsPerPage,
        eventFilter,
        searchTerm: filters.searchTerm,
        statusFilter: filters.statusFilter,
        tagFilter: filters.tagFilter,
        organizationFilter: filters.organizationFilter,
        roleFilter: filters.roleFilter
      }
      
      const result = await fetchGuestsPage(params)
      
      setFirstPageData(result.guests)
      setProgress(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: result.totalPages,
        isComplete: result.totalPages === 1
      }))
      
      onFirstPageLoaded?.(result.guests)
      
      return result
    } catch (error) {
      console.error('Error loading first page:', error)
      onError?.(error as Error)
      throw error
    }
  }, [eventFilter, filters, itemsPerPage, onFirstPageLoaded, onError])

  // Hàm load các trang còn lại trong background
  const loadRemainingPages = useCallback(async (totalPages: number) => {
    if (totalPages <= 1) {
      setProgress(prev => ({ ...prev, isComplete: true }))
      onImportComplete?.()
      return
    }

    const pagesToLoad = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
    const newPagesData = new Map<number, Guest[]>()
    
    setProgress(prev => ({ ...prev, currentPage: 1 }))

    for (let i = 0; i < pagesToLoad.length; i++) {
      // Kiểm tra nếu import bị hủy
      if (abortControllerRef.current?.signal.aborted) {
        break
      }

      const page = pagesToLoad[i]
      
      try {
        const params: GuestsApiParams = {
          page,
          itemsPerPage,
          eventFilter,
          searchTerm: filters.searchTerm,
          statusFilter: filters.statusFilter,
          tagFilter: filters.tagFilter,
          organizationFilter: filters.organizationFilter,
          roleFilter: filters.roleFilter
        }
        
        const result = await fetchGuestsPage(params)
        newPagesData.set(page, result.guests)
        
        // Cập nhật progress
        setProgress(prev => ({
          ...prev,
          currentPage: page,
          isComplete: page === totalPages
        }))
        
        // Cập nhật dữ liệu tất cả trang
        setAllPagesData(prev => {
          const updated = new Map(prev)
          updated.set(page, result.guests)
          return updated
        })
        
        // Delay nhỏ để không overload server
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error loading page ${page}:`, error)
        // Tiếp tục load trang tiếp theo thay vì dừng
        continue
      }
    }
    
    if (!abortControllerRef.current?.signal.aborted) {
      onImportComplete?.()
    }
  }, [eventFilter, filters, itemsPerPage, onImportComplete])

  // Hàm bắt đầu import tối ưu
  const startOptimizedImport = useCallback(async () => {
    if (isImportingRef.current) return
    
    isImportingRef.current = true
    setIsImporting(true)
    
    // Tạo abort controller mới
    abortControllerRef.current = new AbortController()
    
    try {
      // Bước 1: Load trang đầu tiên nhanh
      const firstPageResult = await loadFirstPage()
      
      // Bước 2: Bắt đầu load các trang còn lại trong background
      if (firstPageResult.totalPages > 1) {
        // Sử dụng setTimeout để đảm bảo UI được cập nhật trước
        setTimeout(() => {
          loadRemainingPages(firstPageResult.totalPages)
        }, 50)
      } else {
        // Chỉ có 1 trang, hoàn thành ngay
        setProgress(prev => ({ ...prev, isComplete: true }))
        onImportComplete?.()
      }
      
    } catch (error) {
      console.error('Error in optimized import:', error)
      onError?.(error as Error)
    } finally {
      isImportingRef.current = false
      setIsImporting(false)
    }
  }, [loadFirstPage, loadRemainingPages, onImportComplete, onError])

  // Hàm hủy import
  const cancelImport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    isImportingRef.current = false
    setIsImporting(false)
    setProgress(prev => ({ ...prev, isComplete: true }))
  }, [])

  // Hàm reset
  const reset = useCallback(() => {
    cancelImport()
    setFirstPageData([])
    setAllPagesData(new Map())
    setProgress({
      currentPage: 0,
      totalPages: 0,
      isComplete: false
    })
  }, [cancelImport])

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Tính toán dữ liệu hiện tại
  const currentData = firstPageData.length > 0 ? firstPageData : []
  const allData = Array.from(allPagesData.values()).flat()
  const hasMorePages = progress.currentPage < progress.totalPages

  return {
    // State
    isImporting,
    progress,
    firstPageData: currentData,
    allPagesData: allData,
    hasMorePages,
    
    // Actions
    startOptimizedImport,
    cancelImport,
    reset,
    
    // Computed
    isComplete: progress.isComplete,
    progressPercentage: progress.totalPages > 0 
      ? Math.round((progress.currentPage / progress.totalPages) * 100) 
      : 0,
    
    // Status
    isLoadingFirstPage: isImporting && progress.currentPage === 0,
    isBackgroundLoading: isImporting && progress.currentPage > 0 && !progress.isComplete,
    hasError: progress.error !== undefined
  }
}

export default useOptimizedImport
