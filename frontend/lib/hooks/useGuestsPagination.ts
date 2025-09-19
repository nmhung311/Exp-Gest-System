// Custom Hook: useGuestsPagination
// Hook chuyên biệt cho Guests page với preload pagination

import { useCallback, useMemo, useState, useEffect } from 'react'
import { usePreloadPagination } from './usePreloadPagination'
import { fetchGuestsPage, GuestsApiParams } from '@/lib/api/guestsApi'
import { Guest, GuestFilters } from '@/lib/types/guest'
import { PreloadPaginationConfig } from '@/lib/types/pagination'

interface UseGuestsPaginationOptions {
  // Filters
  filters: GuestFilters
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Callbacks
  onError?: (error: Error, page: number) => void
  onSuccess?: (guests: Guest[], page: number) => void
  onFiltersChange?: (filters: GuestFilters) => void
}

export function useGuestsPagination({
  filters,
  config = {},
  onError,
  onSuccess,
  onFiltersChange
}: UseGuestsPaginationOptions) {
  
  // Create fetch function for pagination
  const fetchGuests = useCallback(async (page: number, itemsPerPage: number) => {
    const params: GuestsApiParams = {
      page,
      itemsPerPage,
      eventFilter: filters.eventFilter,
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      tagFilter: filters.tagFilter,
      organizationFilter: filters.organizationFilter,
      roleFilter: filters.roleFilter
    }
    
    const result = await fetchGuestsPage(params)
    
    return {
      data: result.guests,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    }
  }, [filters])
  
  // Use the base preload pagination hook
  const pagination = usePreloadPagination({
    fetchData: fetchGuests,
    config: {
      itemsPerPage: 6, // Guests page uses 6 items per page
      preloadPages: 2, // Preload 2 pages ahead
      cacheSize: 10, // Cache up to 10 pages
      enableBackgroundPreload: true,
      preloadDelay: 300, // 300ms delay between preloads
      ...config
    },
    onError,
    onSuccess
  })
  
  // Enhanced actions specific to guests
  const guestsActions = useMemo(() => ({
    ...pagination.actions,
    
    // Filter actions
    updateFilters: (newFilters: Partial<GuestFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }
      onFiltersChange?.(updatedFilters)
    },
    
    clearFilters: () => {
      const clearedFilters: GuestFilters = {
        eventFilter: '',
        searchTerm: '',
        statusFilter: 'all',
        tagFilter: 'all',
        organizationFilter: 'all',
        roleFilter: 'all'
      }
      onFiltersChange?.(clearedFilters)
    },
    
    // Search actions
    search: (searchTerm: string) => {
      pagination.actions.refreshAll()
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
  
  // Computed values specific to guests
  const guestsComputed = useMemo(() => ({
    ...pagination,
    actions: guestsActions,
    
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
  }), [pagination, guestsActions, filters])
  
  return guestsComputed
}

// Hook for guest statistics
export function useGuestsStats(eventFilter?: string) {
  const [stats, setStats] = useState<{
    total: number
    accepted: number
    declined: number
    pending: number
    checkedIn: number
  } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { getGuestsStats } = await import('@/lib/api/guestsApi')
      const result = await getGuestsStats(eventFilter)
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

// Hook for guest filters
export function useGuestsFilters(initialFilters: GuestFilters = {
  eventFilter: '',
  searchTerm: '',
  statusFilter: 'all',
  tagFilter: 'all',
  organizationFilter: 'all',
  roleFilter: 'all'
}) {
  const [filters, setFilters] = useState<GuestFilters>(initialFilters)
  
  const updateFilter = useCallback((key: keyof GuestFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const updateFilters = useCallback((newFilters: Partial<GuestFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({
      eventFilter: '',
      searchTerm: '',
      statusFilter: 'all',
      tagFilter: 'all',
      organizationFilter: 'all',
      roleFilter: 'all'
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

export default useGuestsPagination
