// Guests API functions for preload pagination
// Tối ưu API calls cho pagination

import { api, apiCall } from '@/lib/api'
import { authApi } from '@/lib/auth'
import { Guest } from '@/lib/types/guest'

export interface GuestsApiResponse {
  guests: Guest[]
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
}

export interface GuestsApiParams {
  page: number
  itemsPerPage: number
  eventFilter?: string
  searchTerm?: string
  statusFilter?: string
  tagFilter?: string
  organizationFilter?: string
  roleFilter?: string
}

// Fetch guests with pagination
export async function fetchGuestsPage({
  page,
  itemsPerPage,
  eventFilter,
  searchTerm = '',
  statusFilter = 'all',
  tagFilter = 'all',
  organizationFilter = 'all',
  roleFilter = 'all'
}: GuestsApiParams): Promise<GuestsApiResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      search: searchTerm,
      status: statusFilter,
      tag: tagFilter,
      organization: organizationFilter,
      role: roleFilter
    })
    
    if (eventFilter && eventFilter !== '') {
      params.append('event_id', eventFilter)
    }
    
    const response = await api.getGuests(`?${params.toString()}`)
    
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
    console.error('Error fetching guests page:', error)
    throw error
  }
}

// Fetch multiple pages at once (for preloading)
export async function fetchGuestsPages(
  pages: number[],
  itemsPerPage: number,
  filters: Omit<GuestsApiParams, 'page' | 'itemsPerPage'>
): Promise<{ [page: number]: Guest[] }> {
  try {
    // Fetch all pages in parallel
    const promises = pages.map(page => 
      fetchGuestsPage({ ...filters, page, itemsPerPage })
    )
    
    const results = await Promise.all(promises)
    
    // Combine results
    const pageData: { [page: number]: Guest[] } = {}
    results.forEach((result, index) => {
      pageData[pages[index]] = result.guests
    })
    
    return pageData
  } catch (error) {
    console.error('Error fetching multiple guests pages:', error)
    throw error
  }
}

// Fetch guests with all filters applied
export async function fetchFilteredGuests(filters: Omit<GuestsApiParams, 'page' | 'itemsPerPage'>): Promise<Guest[]> {
  try {
    const response = await fetchGuestsPage({ ...filters, page: 1, itemsPerPage: 1000 })
    return response.guests
  } catch (error) {
    console.error('Error fetching filtered guests:', error)
    throw error
  }
}

// Get guest statistics
export async function getGuestsStats(eventFilter?: string): Promise<{
  total: number
  accepted: number
  declined: number
  pending: number
  checkedIn: number
}> {
  try {
    const response = await apiCall('/api/guests/stats')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Filter by event if specified
    if (eventFilter && eventFilter !== '') {
      const filteredGuests = data.guests?.filter((guest: Guest) => 
        guest.event_id?.toString() === eventFilter
      ) || []
      
      return {
        total: filteredGuests.length,
        accepted: filteredGuests.filter((g: Guest) => g.rsvp_status === 'accepted').length,
        declined: filteredGuests.filter((g: Guest) => g.rsvp_status === 'declined').length,
        pending: filteredGuests.filter((g: Guest) => g.rsvp_status === 'pending').length,
        checkedIn: filteredGuests.filter((g: Guest) => g.checkin_status === 'checked_in').length
      }
    }
    
    return {
      total: data.total || 0,
      accepted: data.accepted || 0,
      declined: data.declined || 0,
      pending: data.pending || 0,
      checkedIn: data.checkedIn || 0
    }
  } catch (error) {
    console.error('Error fetching guests stats:', error)
    throw error
  }
}

// Export guests to Excel/CSV
export async function exportGuests(
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
    console.error('Error exporting guests:', error)
    throw error
  }
}

// Bulk operations
export async function bulkUpdateGuests(
  guestIds: number[],
  updates: Partial<Guest>
): Promise<void> {
  try {
    const response = await apiCall('/api/guests/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ guestIds, updates })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error bulk updating guests:', error)
    throw error
  }
}

export async function bulkDeleteGuests(guestIds: number[]): Promise<void> {
  try {
    const response = await api.bulkDeleteGuests({ guest_ids: guestIds })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error bulk deleting guests:', error)
    throw error
  }
}

// Import guests
export async function importGuests(
  file: File,
  format: 'json' | 'csv'
): Promise<{ success: number; errors: string[] }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = format === 'json' 
      ? await authApi.importGuests(formData)
      : await authApi.importGuestsCSV(formData)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return {
      success: data.success || 0,
      errors: data.errors || []
    }
  } catch (error) {
    console.error('Error importing guests:', error)
    throw error
  }
}
