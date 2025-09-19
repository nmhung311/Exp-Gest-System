// CheckinList Component with Preload Pagination
// Component hiển thị danh sách check-in với preload pagination

import React, { useState } from 'react'
import { Guest } from '@/lib/types/guest'
import { useCheckinPagination } from '@/lib/hooks/useCheckinPagination'
import { CheckinFilters } from '@/lib/hooks/useCheckinPagination'
import PreloadPagination from '@/components/pagination/PreloadPagination'
import SkeletonLoader from '@/components/pagination/SkeletonLoader'
import { LoadingState, ErrorState, EmptyState } from '@/components/pagination/SkeletonLoader'

interface CheckinListProps {
  filters: CheckinFilters
  onFiltersChange: (filters: CheckinFilters) => void
  onGuestCheckin?: (guest: Guest) => void
  onGuestCheckout?: (guest: Guest) => void
  onGuestSelect?: (guest: Guest) => void
  selectedGuests?: Set<number>
  onGuestToggle?: (guestId: number) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  className?: string
}

export default function CheckinList({
  filters,
  onFiltersChange,
  onGuestCheckin,
  onGuestCheckout,
  onGuestSelect,
  selectedGuests = new Set(),
  onGuestToggle,
  onSelectAll,
  onDeselectAll,
  className = ''
}: CheckinListProps) {
  
  const [checkingIn, setCheckingIn] = useState<Set<number>>(new Set())
  const [checkingOut, setCheckingOut] = useState<Set<number>>(new Set())
  
  // Use check-in pagination hook
  const pagination = useCheckinPagination({
    filters,
    onFiltersChange,
    onError: (error, page) => {
      console.error(`Error loading check-in page ${page}:`, error)
    },
    onSuccess: (guests, page) => {
      console.log(`Loaded ${guests.length} checked-in guests for page ${page}`)
    },
    onCheckinUpdate: (guest) => {
      console.log('Check-in update received:', guest)
    }
  })
  
  // Handle page change
  const handlePageChange = (page: number) => {
    pagination.actions.goToPage(page)
  }
  
  // Handle guest check-in
  const handleCheckin = async (guest: Guest) => {
    if (checkingIn.has(guest.id)) return
    
    setCheckingIn(prev => new Set(prev).add(guest.id))
    
    try {
      const result = await pagination.actions.checkinGuest(guest.id, 'manual')
      if (result.success) {
        onGuestCheckin?.(result.guest)
        // Refresh current page to show updated data
        pagination.actions.refreshPage()
      }
    } catch (error) {
      console.error('Error checking in guest:', error)
    } finally {
      setCheckingIn(prev => {
        const newSet = new Set(prev)
        newSet.delete(guest.id)
        return newSet
      })
    }
  }
  
  // Handle guest check-out
  const handleCheckout = async (guest: Guest) => {
    if (checkingOut.has(guest.id)) return
    
    setCheckingOut(prev => new Set(prev).add(guest.id))
    
    try {
      const result = await pagination.actions.checkoutGuest(guest.id)
      if (result.success) {
        onGuestCheckout?.(result.guest)
        // Refresh current page to show updated data
        pagination.actions.refreshPage()
      }
    } catch (error) {
      console.error('Error checking out guest:', error)
    } finally {
      setCheckingOut(prev => {
        const newSet = new Set(prev)
        newSet.delete(guest.id)
        return newSet
      })
    }
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
  
  // Get check-in status
  const getCheckinStatus = (guest: Guest) => {
    if (guest.checkin_status === 'arrived' || guest.checkin_status === 'checked_in') {
      return 'checked_in'
    }
    return 'not_checked_in'
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
  const renderGuestItem = (guest: Guest, index: number) => {
    const isCheckedIn = getCheckinStatus(guest) === 'checked_in'
    const isCheckingIn = checkingIn.has(guest.id)
    const isCheckingOut = checkingOut.has(guest.id)
    
    return (
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
              isCheckedIn ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {isCheckedIn ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-xs">
                {isCheckedIn ? 'Đã check-in' : 'Chưa check-in'}
              </span>
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          {guest.position && (
            <div className="text-white/80 text-xs">
              <span className="text-white/60">Vai trò:</span> {guest.position}
            </div>
          )}
          {guest.company && (
            <div className="text-white/80 text-xs">
              <span className="text-white/60">Tổ chức:</span> {guest.company}
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
            {!isCheckedIn ? (
              <button
                onClick={() => handleCheckin(guest)}
                disabled={isCheckingIn}
                className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isCheckingIn ? (
                  <>
                    <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                    Đang check-in...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Check-in
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(guest)}
                disabled={isCheckingOut}
                className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded text-xs hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isCheckingOut ? (
                  <>
                    <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                    Đang check-out...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Check-out
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => onGuestSelect?.(guest)}
              className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
            >
              Thiệp
            </button>
          </div>
          <div className="text-white/40 text-xs">
            {new Date(guest.created_at).toLocaleDateString('vi-VN')}
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
                  checked={selectedGuests.size === pagination.currentItems.length && pagination.currentItems.length > 0}
                  onChange={selectedGuests.size === pagination.currentItems.length ? handleDeselectAll : handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 w-16">STT</th>
              <th className="px-4 py-3 w-40">Họ và tên</th>
              <th className="px-4 py-3 w-24">Vai trò</th>
              <th className="px-4 py-3 w-32">Tổ chức</th>
              <th className="px-4 py-3 w-24">Tag</th>
              <th className="px-4 py-3 w-32">Trạng thái</th>
              <th className="px-4 py-3 w-40">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagination.currentItems.map((guest, index) => {
              const isCheckedIn = getCheckinStatus(guest) === 'checked_in'
              const isCheckingIn = checkingIn.has(guest.id)
              const isCheckingOut = checkingOut.has(guest.id)
              
              return (
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
                  <td className="px-4 py-3 text-white/80">{guest.position || ''}</td>
                  <td className="px-4 py-3 text-white/80">{guest.company || ''}</td>
                  <td className="px-4 py-3 text-white/80">{guest.tag || ''}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isCheckedIn ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {isCheckedIn ? 'Đã check-in' : 'Chưa check-in'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!isCheckedIn ? (
                        <button
                          onClick={() => handleCheckin(guest)}
                          disabled={isCheckingIn}
                          className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingIn ? '...' : 'Check-in'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckout(guest)}
                          disabled={isCheckingOut}
                          className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs hover:bg-orange-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingOut ? '...' : 'Check-out'}
                        </button>
                      )}
                      <button
                        onClick={() => onGuestSelect?.(guest)}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                      >
                        Thiệp
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
      {pagination.currentItems.map((guest, index) => renderGuestItem(guest, index))}
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
          message={pagination.state.error || 'Có lỗi xảy ra khi tải danh sách check-in'}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
