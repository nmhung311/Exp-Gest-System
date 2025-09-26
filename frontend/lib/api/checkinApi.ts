// Check-in API functions for preload pagination
// Tối ưu API calls cho check-in page

import { api, apiCall } from '@/lib/api'
import { Guest } from '@/lib/types/guest'

export interface CheckinApiResponse {
  guests: Guest[]
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
}

export interface CheckinApiParams {
  page: number
  itemsPerPage: number
  searchTerm?: string
  statusFilter?: 'all' | 'checked_in' | 'not_checked_in'
  eventFilter?: string
}

// Fetch checked-in guests with pagination
export async function fetchCheckedInGuestsPage({
  page,
  itemsPerPage,
  searchTerm = '',
  statusFilter = 'all',
  eventFilter
}: CheckinApiParams): Promise<CheckinApiResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      search: searchTerm,
      status: statusFilter
    })
    
    if (eventFilter && eventFilter !== '') {
      params.append('event_id', eventFilter)
    }
    
    const response = await api.getGuestsCheckedIn()
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform response to match our interface
    const guests = data.guests || []
    const totalItems = data.total || guests.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    return {
      guests,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage
    }
  } catch (error) {
    console.error('Error fetching checked-in guests page:', error)
    throw error
  }
}

// Fetch multiple pages at once (for preloading)
export async function fetchCheckedInGuestsPages(
  pages: number[],
  itemsPerPage: number,
  filters: Omit<CheckinApiParams, 'page' | 'itemsPerPage'>
): Promise<{ [page: number]: Guest[] }> {
  try {
    // Fetch all pages in parallel
    const promises = pages.map(page => 
      fetchCheckedInGuestsPage({ ...filters, page, itemsPerPage })
    )
    
    const results = await Promise.all(promises)
    
    // Combine results
    const pageData: { [page: number]: Guest[] } = {}
    results.forEach((result, index) => {
      pageData[pages[index]] = result.guests
    })
    
    return pageData
  } catch (error) {
    console.error('Error fetching multiple checked-in guests pages:', error)
    throw error
  }
}

// Get check-in statistics
export async function getCheckinStats(eventFilter?: string): Promise<{
  totalGuests: number
  checkedIn: number
  notCheckedIn: number
  checkinRate: number
  recentCheckins: Guest[]
}> {
  try {
    const response = await api.getGuestsCheckedIn()
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    const allGuests = data.guests || []
    
    // Filter by event if specified
    const filteredGuests = eventFilter && eventFilter !== '' 
      ? allGuests.filter((guest: Guest) => guest.event_id?.toString() === eventFilter)
      : allGuests
    
    const checkedIn = filteredGuests.filter((guest: Guest) => 
      guest.checkin_status === 'checked_in' || guest.checkin_status === 'checked_out'
    )
    
    const notCheckedIn = filteredGuests.filter((guest: Guest) => 
      guest.checkin_status === 'not_arrived'
    )
    
    const checkinRate = filteredGuests.length > 0 
      ? (checkedIn.length / filteredGuests.length) * 100 
      : 0
    
    // Get recent check-ins (last 10)
    const recentCheckins = checkedIn
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
    
    return {
      totalGuests: filteredGuests.length,
      checkedIn: checkedIn.length,
      notCheckedIn: notCheckedIn.length,
      checkinRate: Math.round(checkinRate * 100) / 100,
      recentCheckins
    }
  } catch (error) {
    console.error('Error fetching check-in stats:', error)
    throw error
  }
}

// Check-in a guest
export async function checkinGuest(guestId: number, method: 'qr' | 'manual' = 'manual'): Promise<{
  success: boolean
  guest: Guest
  message: string
  checkinTime: string
}> {
  try {
    const response = await api.checkinGuest({ guest_id: guestId, method })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Check-in failed')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      guest: data.guest,
      message: data.message || 'Check-in thành công',
      checkinTime: data.checkinTime || new Date().toISOString()
    }
  } catch (error) {
    console.error('Error checking in guest:', error)
    throw error
  }
}

// Check-out a guest
export async function checkoutGuest(guestId: number): Promise<{
  success: boolean
  guest: Guest
  message: string
}> {
  try {
    const response = await api.checkoutGuest(guestId)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Check-out failed')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      guest: data.guest,
      message: data.message || 'Check-out thành công'
    }
  } catch (error) {
    console.error('Error checking out guest:', error)
    throw error
  }
}

// Bulk check-in guests
export async function bulkCheckinGuests(guestIds: number[]): Promise<{
  success: number
  errors: string[]
  totalProcessed: number
}> {
  try {
    const response = await api.bulkCheckinGuests({ guest_ids: guestIds })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: data.success || 0,
      errors: data.errors || [],
      totalProcessed: data.totalProcessed || guestIds.length
    }
  } catch (error) {
    console.error('Error bulk checking in guests:', error)
    throw error
  }
}

// Bulk check-out guests
export async function bulkCheckoutGuests(guestIds: number[]): Promise<{
  success: number
  errors: string[]
  totalProcessed: number
}> {
  try {
    const response = await api.bulkCheckoutGuests({ guest_ids: guestIds })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      success: data.success || 0,
      errors: data.errors || [],
      totalProcessed: data.totalProcessed || guestIds.length
    }
  } catch (error) {
    console.error('Error bulk checking out guests:', error)
    throw error
  }
}

// Get check-in history
export async function getCheckinHistory(guestId: number): Promise<{
  checkins: Array<{
    id: number
    guestId: number
    checkinTime: string
    checkoutTime?: string
    method: 'qr' | 'manual' | 'bulk'
    notes?: string
  }>
}> {
  try {
    const response = await apiCall(`/api/checkin?guest_id=${guestId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      checkins: data.checkins || []
    }
  } catch (error) {
    console.error('Error fetching check-in history:', error)
    throw error
  }
}

// Export checked-in guests
export async function exportCheckedInGuests(
  guests: Guest[],
  format: 'excel' | 'csv' = 'excel'
): Promise<void> {
  try {
    if (format === 'excel') {
      await apiCall('/api/guests/export-excel', {
        method: 'POST',
        body: JSON.stringify({ guests })
      })
    } else {
      await apiCall('/api/guests/export-csv', {
        method: 'POST',
        body: JSON.stringify({ guests })
      })
    }
  } catch (error) {
    console.error('Error exporting checked-in guests:', error)
    throw error
  }
}

// Real-time check-in updates
export function subscribeToCheckinUpdates(
  callback: (guest: Guest) => void
): () => void {
  // Listen for check-in success events
  const handleCheckinSuccess = (event: CustomEvent) => {
    const guest = event.detail.guest
    if (guest) {
      callback(guest)
    }
  }
  
  // Listen for localStorage changes
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'exp_guests_updated' && event.newValue) {
      // Trigger refresh
      window.dispatchEvent(new CustomEvent('checkin-refresh'))
    }
  }
  
  // Add event listeners
  window.addEventListener('checkin-success', handleCheckinSuccess as EventListener)
  window.addEventListener('storage', handleStorageChange)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('checkin-success', handleCheckinSuccess as EventListener)
    window.removeEventListener('storage', handleStorageChange)
  }
}

// Get QR code for guest
export async function getGuestQRCode(guestId: number): Promise<{
  qrCode: string
  inviteUrl: string
}> {
  try {
    const response = await api.getGuestQR(guestId.toString())
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      qrCode: data.qrCode,
      inviteUrl: data.inviteUrl
    }
  } catch (error) {
    console.error('Error getting guest QR code:', error)
    throw error
  }
}
