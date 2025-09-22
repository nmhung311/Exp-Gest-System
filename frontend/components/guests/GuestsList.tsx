// GuestsList Component with Preload Pagination
// Component hiển thị danh sách khách mời với preload pagination

import React from 'react'
import { Guest } from '@/lib/types/guest'
import { useGuestsPagination } from '@/lib/hooks/useGuestsPagination'
import { GuestFilters } from '@/lib/types/guest'
import PreloadPagination from '@/components/pagination/PreloadPagination'
import SkeletonLoader from '@/components/pagination/SkeletonLoader'
import { LoadingState, ErrorState, EmptyState } from '@/components/pagination/SkeletonLoader'

interface GuestsListProps {
  filters: GuestFilters
  onFiltersChange: (filters: GuestFilters) => void
  onGuestSelect?: (guest: Guest) => void
  onGuestEdit?: (guest: Guest) => void
  onGuestDelete?: (guest: Guest) => void
  selectedGuests?: Set<number>
  onGuestToggle?: (guestId: number) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  className?: string
}

export default function GuestsList({
  filters,
  onFiltersChange,
  onGuestSelect,
  onGuestEdit,
  onGuestDelete,
  selectedGuests = new Set(),
  onGuestToggle,
  onSelectAll,
  onDeselectAll,
  className = ''
}: GuestsListProps) {
  
  // Use guests pagination hook
  const pagination = useGuestsPagination({
    filters,
    onFiltersChange,
    onError: (error, page) => {
      console.error(`Error loading page ${page}:`, error)
    },
    onSuccess: (guests, page) => {
      console.log(`Loaded ${guests.length} guests for page ${page}`)
    }
  })
  
  // Handle page change
  const handlePageChange = (page: number) => {
    pagination.actions.goToPage(page)
  }
  
  // Handle guest selection
  const handleGuestToggle = (guestId: number) => {
    onGuestToggle?.(guestId)
  }
  
  // Handle select all
  const handleSelectAll = () => {
    onSelectAll?.()
  }
  
  // Handle deselect all
  const handleDeselectAll = () => {
    onDeselectAll?.()
  }
  
  // Get the newest guest ID (highest ID or most recent created_at)
  const getNewestGuestId = () => {
    if (pagination.currentItems.length === 0) return null
    return pagination.currentItems.reduce((newest, guest) => {
      if (!newest) return guest.id
      const newestDate = new Date(pagination.currentItems.find(g => g.id === newest)?.created_at || 0)
      const currentDate = new Date(guest.created_at)
      return currentDate > newestDate ? guest.id : newest
    }, null as number | null)
  }

  const newestGuestId = getNewestGuestId()
  const isNewestGuest = (guestId: number) => guestId === newestGuestId

  // Render guest item
  const renderGuestItem = (guest: Guest, index: number) => (
    <div 
      key={guest.id} 
      className={`rounded-xl p-4 transition-all duration-500 ${
        isNewestGuest(guest.id) 
          ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/30 animate-pulse' 
          : 'bg-black/20 border border-white/10 hover:bg-black/30'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectedGuests.has(guest.id)}
            onChange={() => handleGuestToggle(guest.id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <div>
            <div className="flex items-center gap-2">
              <div className="text-white font-medium text-sm">{guest.name}</div>
              {isNewestGuest(guest.id) && (
                <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full animate-bounce">
                  MỚI
                </span>
              )}
            </div>
            {guest.email && (
              <div className="text-white/60 text-xs">{guest.email}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
            guest.rsvp_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
            guest.rsvp_status === 'declined' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {guest.rsvp_status === 'accepted' ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : guest.rsvp_status === 'declined' ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-xs">
              {guest.rsvp_status === 'accepted' ? 'Đã chấp nhận' :
               guest.rsvp_status === 'declined' ? 'Đã từ chối' : 'Chờ phản hồi'}
            </span>
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {guest.role && (
          <div className="text-white/80 text-xs">
            <span className="text-white/60">Vai trò:</span> {guest.role}
          </div>
        )}
        {guest.organization && (
          <div className="text-white/80 text-xs">
            <span className="text-white/60">Tổ chức:</span> {guest.organization}
          </div>
        )}
        {guest.tag && (
          <div className="text-white/80 text-xs">
            <span className="text-white/60">Tag:</span> {guest.tag}
          </div>
        )}
        {guest.phone && (
          <div className="text-white/80 text-xs">
            <span className="text-white/60">SĐT:</span> {guest.phone}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGuestEdit?.(guest)}
            className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
          >
            Sửa
          </button>
          <button
            onClick={() => onGuestSelect?.(guest)}
            className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
          >
            Thiệp
          </button>
          <button
            onClick={() => onGuestDelete?.(guest)}
            className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
          >
            Xóa
          </button>
        </div>
        <div className="text-white/40 text-xs">
          {new Date(guest.created_at).toLocaleDateString('vi-VN')}
        </div>
      </div>
    </div>
  )
  
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
                  checked={selectedGuests.size === pagination.currentItems.length && pagination.currentItems.length > 0}
                  onChange={selectedGuests.size === pagination.currentItems.length ? handleDeselectAll : handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 w-16">STT</th>
              <th className="px-4 py-3 w-20">Danh xưng</th>
              <th className="px-4 py-3 w-40">Họ và tên</th>
              <th className="px-4 py-3 w-24">Vai trò</th>
              <th className="px-4 py-3 w-32">Tổ chức</th>
              <th className="px-4 py-3 w-24">Tag</th>
              <th className="px-4 py-3 w-32">Trạng thái</th>
              <th className="px-4 py-3 w-40">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagination.currentItems.map((guest, index) => (
              <tr 
                key={guest.id} 
                className={`border-b transition-all duration-500 ${
                  isNewestGuest(guest.id)
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/40 shadow-lg shadow-cyan-500/20 animate-pulse'
                    : 'border-white/10 hover:bg-black/20'
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedGuests.has(guest.id)}
                    onChange={() => handleGuestToggle(guest.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-3 text-white/60">
                  {(pagination.state.currentPage - 1) * pagination.state.itemsPerPage + index + 1}
                </td>
                <td className="px-4 py-3 text-white/80">{guest.title || ''}</td>
                <td className="px-4 py-3 text-white font-medium">
                  <div className="flex items-center gap-2">
                    <span>{guest.name}</span>
                    {isNewestGuest(guest.id) && (
                      <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full animate-bounce">
                        MỚI
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/80">{guest.role || ''}</td>
                <td className="px-4 py-3 text-white/80">{guest.organization || ''}</td>
                <td className="px-4 py-3 text-white/80">{guest.tag || ''}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    guest.rsvp_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    guest.rsvp_status === 'declined' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {guest.rsvp_status === 'accepted' ? 'Đã chấp nhận' :
                     guest.rsvp_status === 'declined' ? 'Đã từ chối' : 'Chờ phản hồi'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onGuestEdit?.(guest)}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onGuestSelect?.(guest)}
                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                    >
                      Thiệp
                    </button>
                    <button
                      onClick={() => onGuestDelete?.(guest)}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
  
  // Render mobile card view
  const renderMobileView = () => (
    <div className="lg:hidden space-y-3">
      {pagination.currentItems.map((guest, index) => renderGuestItem(guest, index))}
    </div>
  )
  
  // Render loading state
  if (pagination.isInitialLoading) {
    return (
      <div className={className}>
        <SkeletonLoader count={6} variant="card" className="space-y-3" />
      </div>
    )
  }
  
  // Render error state
  if (pagination.hasError) {
    return (
      <div className={className}>
        <ErrorState
          message={pagination.state.error || 'Có lỗi xảy ra khi tải danh sách khách mời'}
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
          message="Không có khách mời nào"
          icon={
            <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
