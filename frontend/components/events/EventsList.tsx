// EventsList Component with Preload Pagination
// Component hiển thị danh sách sự kiện với preload pagination

import React, { useState } from 'react'
import { Event } from '@/lib/types/guest'
import { useEventsPagination } from '@/lib/hooks/useEventsPagination'
import { EventsFilters } from '@/lib/hooks/useEventsPagination'
import PreloadPagination from '@/components/pagination/PreloadPagination'
import SkeletonLoader from '@/components/pagination/SkeletonLoader'
import { LoadingState, ErrorState, EmptyState } from '@/components/pagination/SkeletonLoader'

interface EventsListProps {
  filters: EventsFilters
  onFiltersChange: (filters: EventsFilters) => void
  onEventSelect?: (event: Event) => void
  onEventEdit?: (event: Event) => void
  onEventDelete?: (event: Event) => void
  onEventDuplicate?: (event: Event) => void
  selectedEvents?: Set<number>
  onEventToggle?: (eventId: number) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  className?: string
}

export default function EventsList({
  filters,
  onFiltersChange,
  onEventSelect,
  onEventEdit,
  onEventDelete,
  onEventDuplicate,
  selectedEvents = new Set(),
  onEventToggle,
  onSelectAll,
  onDeselectAll,
  className = ''
}: EventsListProps) {
  
  const [deleting, setDeleting] = useState<Set<number>>(new Set())
  const [duplicating, setDuplicating] = useState<Set<number>>(new Set())
  
  // Use events pagination hook
  const pagination = useEventsPagination({
    filters,
    onFiltersChange,
    onError: (error, page) => {
      console.error(`Error loading events page ${page}:`, error)
    },
    onSuccess: (events, page) => {
      console.log(`Loaded ${events.length} events for page ${page}`)
    },
    onEventUpdate: (event) => {
      console.log('Event update received:', event)
    }
  })
  
  // Handle page change
  const handlePageChange = (page: number) => {
    pagination.actions.goToPage(page)
  }
  
  // Handle event deletion
  const handleDelete = async (event: Event) => {
    if (deleting.has(event.id)) return
    
    setDeleting(prev => new Set(prev).add(event.id))
    
    try {
      const result = await pagination.actions.deleteEvent(event.id)
      if (result.success) {
        onEventDelete?.(event)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(event.id)
        return newSet
      })
    }
  }
  
  // Handle event duplication
  const handleDuplicate = async (event: Event) => {
    if (duplicating.has(event.id)) return
    
    setDuplicating(prev => new Set(prev).add(event.id))
    
    try {
      const result = await pagination.actions.duplicateEvent(event.id)
      if (result.success) {
        onEventDuplicate?.(result.event)
      }
    } catch (error) {
      console.error('Error duplicating event:', error)
    } finally {
      setDuplicating(prev => {
        const newSet = new Set(prev)
        newSet.delete(event.id)
        return newSet
      })
    }
  }
  
  // Handle event selection
  const handleEventToggle = (eventId: number) => {
    onEventToggle?.(eventId)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    onSelectAll?.()
  }
  
  // Handle deselect all
  const handleDeselectAll = () => {
    onDeselectAll?.()
  }
  
  // Get event status color
  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400'
      case 'ongoing':
        return 'bg-green-500/20 text-green-400'
      case 'completed':
        return 'bg-gray-500/20 text-gray-400'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }
  
  // Get event status text
  const getStatusText = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'Sắp diễn ra'
      case 'ongoing':
        return 'Đang diễn ra'
      case 'completed':
        return 'Đã hoàn thành'
      case 'cancelled':
        return 'Đã hủy'
      default:
        return 'Không xác định'
    }
  }
  
  // Format event date
  const formatEventDate = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`)
    return eventDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Render event item
  const renderEventItem = (event: Event, index: number) => {
    const isDeleting = deleting.has(event.id)
    const isDuplicating = duplicating.has(event.id)
    
    return (
      <div key={event.id} className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-black/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedEvents.has(event.id)}
              onChange={() => handleEventToggle(event.id)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="text-white font-medium text-sm">{event.name}</div>
              <div className="text-white/60 text-xs">{event.location}</div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
              {getStatusText(event.status)}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-white/80 text-xs">
            <span className="text-white/60">Thời gian:</span> {formatEventDate(event.date, event.time)}
          </div>
          {event.description && (
            <div className="text-white/80 text-xs">
              <span className="text-white/60">Mô tả:</span> {event.description}
            </div>
          )}
          <div className="text-white/80 text-xs">
            <span className="text-white/60">Số khách tối đa:</span> {event.max_guests}
          </div>
          {event.dress_code && (
            <div className="text-white/80 text-xs">
              <span className="text-white/60">Trang phục:</span> {event.dress_code}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEventSelect?.(event)}
              className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
            >
              Xem
            </button>
            <button
              onClick={() => onEventEdit?.(event)}
              className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
            >
              Sửa
            </button>
            <button
              onClick={() => handleDuplicate(event)}
              disabled={isDuplicating}
              className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isDuplicating ? (
                <>
                  <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                  ...
                </>
              ) : (
                'Sao chép'
              )}
            </button>
            <button
              onClick={() => handleDelete(event)}
              disabled={isDeleting}
              className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {isDeleting ? (
                <>
                  <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                  ...
                </>
              ) : (
                'Xóa'
              )}
            </button>
          </div>
          <div className="text-white/40 text-xs">
            {new Date(event.created_at || event.date).toLocaleDateString('vi-VN')}
          </div>
        </div>
      </div>
    )
  }
  
  // Render desktop table view
  const renderDesktopView = () => (
    <div className="hidden lg:block">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-white/60 uppercase bg-black/30">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={selectedEvents.size === pagination.currentItems.length && pagination.currentItems.length > 0}
                  onChange={selectedEvents.size === pagination.currentItems.length ? handleDeselectAll : handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 w-16">STT</th>
              <th className="px-4 py-3 w-48">Tên sự kiện</th>
              <th className="px-4 py-3 w-32">Thời gian</th>
              <th className="px-4 py-3 w-32">Địa điểm</th>
              <th className="px-4 py-3 w-24">Số khách</th>
              <th className="px-4 py-3 w-32">Trạng thái</th>
              <th className="px-4 py-3 w-40">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagination.currentItems.map((event, index) => {
              const isDeleting = deleting.has(event.id)
              const isDuplicating = duplicating.has(event.id)
              
              return (
                <tr key={event.id} className="border-b border-white/10 hover:bg-black/20">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedEvents.has(event.id)}
                      onChange={() => handleEventToggle(event.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {(pagination.paginationInfo.currentPage - 1) * pagination.state.itemsPerPage + index + 1}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{event.name}</td>
                  <td className="px-4 py-3 text-white/80 text-xs">
                    {formatEventDate(event.date, event.time)}
                  </td>
                  <td className="px-4 py-3 text-white/80">{event.location}</td>
                  <td className="px-4 py-3 text-white/80">{event.max_guests}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEventSelect?.(event)}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => onEventEdit?.(event)}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDuplicate(event)}
                        disabled={isDuplicating}
                        className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDuplicating ? '...' : 'Sao chép'}
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        disabled={isDeleting}
                        className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? '...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
  
  // Render mobile card view
  const renderMobileView = () => (
    <div className="lg:hidden space-y-3">
      {pagination.currentItems.map((event, index) => renderEventItem(event, index))}
    </div>
  )
  
  // Render loading state
  if (pagination.isInitialLoading) {
    return (
      <div className={className}>
        <SkeletonLoader count={10} variant="card" className="space-y-3" />
      </div>
    )
  }
  
  // Render error state
  if (pagination.hasError) {
    return (
      <div className={className}>
        <ErrorState
          message={pagination.state.error || 'Có lỗi xảy ra khi tải danh sách sự kiện'}
          onRetry={() => pagination.actions.refreshAll()}
        />
      </div>
    )
  }
  
  // Render empty state
  if (pagination.isEmpty) {
    return (
      <div className={className}>
        <EmptyState
          message="Không có sự kiện nào"
          icon={
            <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>
    )
  }
  
  // Render main content
  return (
    <div className={className}>
      {/* Desktop View */}
      {renderDesktopView()}
      
      {/* Mobile View */}
      {renderMobileView()}
      
      {/* Pagination */}
      {pagination.state.totalPages > 1 && (
        <div className="mt-6">
          <PreloadPagination
            pagination={pagination}
            onPageChange={handlePageChange}
            showInfo={true}
            showPageNumbers={true}
            maxVisiblePages={5}
          />
        </div>
      )}
      
      {/* Loading indicator for preloading */}
      {pagination.isPreloading && (
        <div className="mt-4 text-center">
          <LoadingState message="Đang tải trang tiếp theo..." showSpinner={true} />
        </div>
      )}
    </div>
  )
}
