// Custom Hook: useCheckinPagination
// Hook chuyên biệt cho Check-in page với preload pagination

import { useCallback, useMemo, useState, useEffect } from 'react'
import { usePreloadPagination } from './usePreloadPagination'
import { fetchCheckedInGuestsPage, CheckinApiParams } from '@/lib/api/checkinApi'
import { Guest } from '@/lib/types/guest'
import { PreloadPaginationConfig } from '@/lib/types/pagination'

export interface CheckinFilters {
  searchTerm: string
  statusFilter: 'all' | 'checked_in' | 'not_checked_in'
  eventFilter: string
}

interface UseCheckinPaginationOptions {
  // Filters
  filters: CheckinFilters
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Callbacks
  onError?: (error: Error, page: number) => void
  onSuccess?: (guests: Guest[], page: number) => void
  onFiltersChange?: (filters: CheckinFilters) => void
  onCheckinUpdate?: (guest: Guest) => void
}

export function useCheckinPagination({
  filters,
  config = {},
  onError,
  onSuccess,
  onFiltersChange,
  onCheckinUpdate
}: UseCheckinPaginationOptions) {
  
  // Create fetch function for pagination
  const fetchCheckedInGuests = useCallback(async (page: number, itemsPerPage: number) => {
    const params: CheckinApiParams = {
      page,
      itemsPerPage,
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      eventFilter: filters.eventFilter
    }
    
    const result = await fetchCheckedInGuestsPage(params)
    
    return {
      data: result.guests,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    }
  }, [filters])
  
  // Use the base preload pagination hook
  const pagination = usePreloadPagination({
    fetchData: fetchCheckedInGuests,
    config: {
      itemsPerPage: 10, // Check-in page uses 10 items per page
      preloadPages: 2, // Preload 2 pages ahead
      cacheSize: 8, // Cache up to 8 pages (80 items)
      enableBackgroundPreload: true,
      preloadDelay: 200, // 200ms delay between preloads (faster for check-in)
      ...config
    },
    onError,
    onSuccess
  })
  
  // Real-time updates
  useEffect(() => {
    const { subscribeToCheckinUpdates } = require('@/lib/api/checkinApi')
    
    const unsubscribe = subscribeToCheckinUpdates((guest: Guest) => {
      onCheckinUpdate?.(guest)
      // Refresh current page to show updated data
      pagination.actions.refreshPage()
    })
    
    return unsubscribe
  }, [pagination.actions, onCheckinUpdate])
  
  // Enhanced actions specific to check-in
  const checkinActions = useMemo(() => ({
    ...pagination.actions,
    
    // Filter actions
    updateFilters: (newFilters: Partial<CheckinFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }
      onFiltersChange?.(updatedFilters)
    },
    
    clearFilters: () => {
      const clearedFilters: CheckinFilters = {
        searchTerm: '',
        statusFilter: 'all',
        eventFilter: ''
      }
      onFiltersChange?.(clearedFilters)
    },
    
    // Search actions
    search: (searchTerm: string) => {
      pagination.actions.refreshAll()
    },
    
    // Check-in actions
    checkinGuest: async (guestId: number, method: 'qr' | 'manual' = 'manual') => {
      const { checkinGuest } = await import('@/lib/api/checkinApi')
      return await checkinGuest(guestId, method)
    },
    
    checkoutGuest: async (guestId: number) => {
      const { checkoutGuest } = await import('@/lib/api/checkinApi')
      return await checkoutGuest(guestId)
    },
    
    // Bulk actions
    bulkCheckin: async (guestIds: number[]) => {
      const { bulkCheckinGuests } = await import('@/lib/api/checkinApi')
      const result = await bulkCheckinGuests(guestIds)
      // Refresh current page after bulk operation
      pagination.actions.refreshPage()
      return result
    },
    
    bulkCheckout: async (guestIds: number[]) => {
      const { bulkCheckoutGuests } = await import('@/lib/api/checkinApi')
      const result = await bulkCheckoutGuests(guestIds)
      // Refresh current page after bulk operation
      pagination.actions.refreshPage()
      return result
    },
    
    // Refresh actions
    refreshWithFilters: () => {
      pagination.actions.refreshAll()
    },
    
    // Preload specific pages
    preloadAroundCurrent: () => {
      const currentPage = pagination.state.currentPage
      const pagesToPreload = [
        currentPage - 1,
        currentPage + 1,
        currentPage + 2
      ].filter(page => page > 0 && page <= pagination.state.totalPages)
      
      pagesToPreload.forEach(page => {
        pagination.actions.preloadPage(page)
      })
    }
  }), [pagination, filters, onFiltersChange])
  
  // Computed values specific to check-in
  const checkinComputed = useMemo(() => ({
    ...pagination,
    actions: checkinActions,
    
    // Filter status
    hasActiveFilters: Object.values(filters).some(value => 
      value !== '' && value !== 'all'
    ),
    
    // Search status
    isSearching: filters.searchTerm.length > 0,
    
    // Loading states
    isInitialLoading: pagination.state.isInitialLoad && pagination.state.isLoading,
    isRefreshing: !pagination.state.isInitialLoad && pagination.state.isLoading,
    isPreloading: pagination.state.isPreloading,
    
    // Data status
    hasData: pagination.currentItems.length > 0,
    isEmpty: !pagination.state.isLoading && pagination.currentItems.length === 0,
    hasError: pagination.state.error !== null,
    
    // Check-in specific data
    checkedInGuests: pagination.currentItems.filter(guest => 
      guest.checkin_status === 'checked_in' || guest.checkin_status === 'checked_out'
    ),
    notCheckedInGuests: pagination.currentItems.filter(guest => 
      guest.checkin_status === 'not_arrived'
    ),
    
    // Pagination status
    canGoNext: pagination.hasNextPage,
    canGoPrev: pagination.hasPrevPage,
    isFirstPage: pagination.state.currentPage === 1,
    isLastPage: pagination.state.currentPage === pagination.state.totalPages,
    
    // Cache status
    isPageCached: (page: number) => pagination.isPageLoaded(page),
    isPagePreloaded: (page: number) => pagination.isPagePreloaded(page),
    
    // Performance info
    cacheStats: {
      loadedPages: pagination.state.loadedPages.size,
      preloadedPages: pagination.state.preloadedPages.size,
      totalPages: pagination.state.totalPages,
      cacheHitRate: pagination.state.loadedPages.size / Math.max(1, pagination.state.totalPages)
    }
  }), [pagination, checkinActions, filters])
  
  return checkinComputed
}

// Hook for check-in statistics
export function useCheckinStats(eventFilter?: string) {
  const [stats, setStats] = useState<{
    totalGuests: number
    checkedIn: number
    notCheckedIn: number
    checkinRate: number
    recentCheckins: Guest[]
  } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { getCheckinStats } = await import('@/lib/api/checkinApi')
      const result = await getCheckinStats(eventFilter)
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [eventFilter])
  
  useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// Hook for check-in filters
export function useCheckinFilters(initialFilters: CheckinFilters = {
  searchTerm: '',
  statusFilter: 'all',
  eventFilter: ''
}) {
  const [filters, setFilters] = useState<CheckinFilters>(initialFilters)
  
  const updateFilter = useCallback((key: keyof CheckinFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const updateFilters = useCallback((newFilters: Partial<CheckinFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      eventFilter: ''
    })
  }, [])
  
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '' && value !== 'all')
  }, [filters])
  
  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters
  }
}

// Hook for real-time check-in updates
export function useCheckinUpdates() {
  const [updates, setUpdates] = useState<Guest[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const { subscribeToCheckinUpdates } = require('@/lib/api/checkinApi')
    
    const unsubscribe = subscribeToCheckinUpdates((guest: Guest) => {
      setUpdates(prev => [guest, ...prev.slice(0, 9)]) // Keep last 10 updates
      setIsConnected(true)
    })
    
    return unsubscribe
  }, [])
  
  const clearUpdates = useCallback(() => {
    setUpdates([])
  }, [])
  
  return {
    updates,
    isConnected,
    clearUpdates
  }
}

export default useCheckinPagination
