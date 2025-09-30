// Custom Hook: useEventsPagination
// Hook chuyên biệt cho Events page với preload pagination

import { useCallback, useMemo, useState, useEffect } from 'react'
import { usePreloadPagination } from './usePreloadPagination'
import { fetchEventsPage, EventsApiParams } from '@/lib/api/eventsApi'
import { Event } from '@/lib/types/guest'
import { PreloadPaginationConfig } from '@/lib/types/pagination'

export interface EventsFilters {
  searchTerm: string
  statusFilter: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year'
}

interface UseEventsPaginationOptions {
  // Filters
  filters: EventsFilters
  
  // Configuration
  config?: Partial<PreloadPaginationConfig>
  
  // Callbacks
  onError?: (error: Error, page: number) => void
  onSuccess?: (events: Event[], page: number) => void
  onFiltersChange?: (filters: EventsFilters) => void
  onEventUpdate?: (event: Event) => void
}

export function useEventsPagination({
  filters,
  config = {},
  onError,
  onSuccess,
  onFiltersChange,
  onEventUpdate
}: UseEventsPaginationOptions) {
  
  // Create fetch function for pagination
  const fetchEvents = useCallback(async (page: number, itemsPerPage: number) => {
    const params: EventsApiParams = {
      page,
      itemsPerPage,
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      dateFilter: filters.dateFilter
    }
    
    const result = await fetchEventsPage(params)
    
    return {
      data: result.events,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    }
  }, [filters])
  
  // Use the base preload pagination hook
  const pagination = usePreloadPagination({
    fetchData: fetchEvents,
    config: {
      itemsPerPage: 10, // Events page uses 10 items per page
      preloadPages: 2, // Preload 2 pages ahead
      cacheSize: 6, // Cache up to 6 pages (60 items)
      enableBackgroundPreload: true,
      preloadDelay: 400, // 400ms delay between preloads (slower for events)
      ...config
    },
    onError,
    onSuccess
  })
  
  // Enhanced actions specific to events
  const eventsActions = useMemo(() => ({
    ...pagination.actions,
    
    // Filter actions
    updateFilters: (newFilters: Partial<EventsFilters>) => {
      const updatedFilters = { ...filters, ...newFilters }
      onFiltersChange?.(updatedFilters)
    },
    
    clearFilters: () => {
      const clearedFilters: EventsFilters = {
        searchTerm: '',
        statusFilter: 'all',
        dateFilter: 'all'
      }
      onFiltersChange?.(clearedFilters)
    },
    
    // Search actions
    search: (searchTerm: string) => {
      pagination.actions.refreshAll()
    },
    
    // Event CRUD actions
    createEvent: async (eventData: Partial<Event>) => {
      const { createEvent } = await import('@/lib/api/eventsApi')
      const result = await createEvent(eventData)
      if (result.success) {
        onEventUpdate?.(result.event)
        // Refresh current page after creation
        pagination.actions.refreshPage()
      }
      return result
    },
    
    updateEvent: async (eventId: number, eventData: Partial<Event>) => {
      const { updateEvent } = await import('@/lib/api/eventsApi')
      const result = await updateEvent(eventId, eventData)
      if (result.success) {
        onEventUpdate?.(result.event)
        // Refresh current page after update
        pagination.actions.refreshPage()
      }
      return result
    },
    
    deleteEvent: async (eventId: number) => {
      const { deleteEvent } = await import('@/lib/api/eventsApi')
      const result = await deleteEvent(eventId)
      if (result.success) {
        // Refresh current page after deletion
        pagination.actions.refreshPage()
      }
      return result
    },
    
    duplicateEvent: async (eventId: number) => {
      const { duplicateEvent } = await import('@/lib/api/eventsApi')
      const result = await duplicateEvent(eventId)
      if (result.success) {
        onEventUpdate?.(result.event)
        // Refresh current page after duplication
        pagination.actions.refreshPage()
      }
      return result
    },
    
    updateEventStatus: async (eventId: number, status: Event['status']) => {
      const { updateEventStatus } = await import('@/lib/api/eventsApi')
      const result = await updateEventStatus(eventId, status)
      if (result.success) {
        onEventUpdate?.(result.event)
        // Refresh current page after status update
        pagination.actions.refreshPage()
      }
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
  }), [pagination, filters, onFiltersChange, onEventUpdate])
  
  // Computed values specific to events
  const eventsComputed = useMemo(() => ({
    ...pagination,
    actions: eventsActions,
    
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
    
    // Events specific data
    upcomingEvents: pagination.currentItems.filter(event => event.status === 'upcoming'),
    ongoingEvents: pagination.currentItems.filter(event => event.status === 'ongoing'),
    completedEvents: pagination.currentItems.filter(event => event.status === 'completed'),
    cancelledEvents: pagination.currentItems.filter(event => event.status === 'cancelled'),
    
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
  }), [pagination, eventsActions, filters])
  
  return eventsComputed
}

// Hook for events statistics
export function useEventsStats() {
  const [stats, setStats] = useState<{
    total: number
    upcoming: number
    ongoing: number
    completed: number
    cancelled: number
    thisWeek: number
    thisMonth: number
  } | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { getEventsStats } = await import('@/lib/api/eventsApi')
      const result = await getEventsStats()
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])
  
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

// Hook for events filters
export function useEventsFilters(initialFilters: EventsFilters = {
  searchTerm: '',
  statusFilter: 'all',
  dateFilter: 'all'
}) {
  const [filters, setFilters] = useState<EventsFilters>(initialFilters)
  
  const updateFilter = useCallback((key: keyof EventsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const updateFilters = useCallback((newFilters: Partial<EventsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      dateFilter: 'all'
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

// Hook for upcoming events
export function useUpcomingEvents(limit: number = 5) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchUpcomingEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { getUpcomingEvents } = await import('@/lib/api/eventsApi')
      const result = await getUpcomingEvents(limit)
      setEvents(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [limit])
  
  useEffect(() => {
    fetchUpcomingEvents()
  }, [fetchUpcomingEvents])
  
  return {
    events,
    loading,
    error,
    refetch: fetchUpcomingEvents
  }
}

export default useEventsPagination
