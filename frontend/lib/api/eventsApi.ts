// Events API functions for preload pagination
// Tối ưu API calls cho events page

import { api } from '@/lib/api'
import { Event } from '@/lib/types/guest'

export interface EventsApiResponse {
  events: Event[]
  totalItems: number
  totalPages: number
  currentPage: number
  itemsPerPage: number
}

export interface EventsApiParams {
  page: number
  itemsPerPage: number
  searchTerm?: string
  statusFilter?: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  dateFilter?: 'all' | 'today' | 'week' | 'month' | 'year'
}

// Fetch events with pagination
export async function fetchEventsPage({
  page,
  itemsPerPage,
  searchTerm = '',
  statusFilter = 'all',
  dateFilter = 'all'
}: EventsApiParams): Promise<EventsApiResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      search: searchTerm,
      status: statusFilter,
      date: dateFilter
    })
    
    const response = await api.getEvents(`?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Transform response to match our interface
    const events = data.events || []
    const totalItems = data.total || events.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    
    return {
      events,
      totalItems,
      totalPages,
      currentPage: page,
      itemsPerPage
    }
  } catch (error) {
    console.error('Error fetching events page:', error)
    throw error
  }
}

// Fetch multiple pages at once (for preloading)
export async function fetchEventsPages(
  pages: number[],
  itemsPerPage: number,
  filters: Omit<EventsApiParams, 'page' | 'itemsPerPage'>
): Promise<{ [page: number]: Event[] }> {
  try {
    // Fetch all pages in parallel
    const promises = pages.map(page => 
      fetchEventsPage({ ...filters, page, itemsPerPage })
    )
    
    const results = await Promise.all(promises)
    
    // Combine results
    const pageData: { [page: number]: Event[] } = {}
    results.forEach((result, index) => {
      pageData[pages[index]] = result.events
    })
    
    return pageData
  } catch (error) {
    console.error('Error fetching multiple events pages:', error)
    throw error
  }
}

// Get event statistics
export async function getEventsStats(): Promise<{
  total: number
  upcoming: number
  ongoing: number
  completed: number
  cancelled: number
  thisWeek: number
  thisMonth: number
}> {
  try {
    const response = await api.getEvents()
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    const events = data.events || []
    
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    return {
      total: events.length,
      upcoming: events.filter(e => e.status === 'upcoming').length,
      ongoing: events.filter(e => e.status === 'ongoing').length,
      completed: events.filter(e => e.status === 'completed').length,
      cancelled: events.filter(e => e.status === 'cancelled').length,
      thisWeek: events.filter(e => {
        const eventDate = new Date(e.date)
        return eventDate >= startOfWeek && eventDate <= now
      }).length,
      thisMonth: events.filter(e => {
        const eventDate = new Date(e.date)
        return eventDate >= startOfMonth && eventDate <= now
      }).length
    }
  } catch (error) {
    console.error('Error fetching events stats:', error)
    throw error
  }
}

// Create new event
export async function createEvent(eventData: Partial<Event>): Promise<{
  success: boolean
  event: Event
  message: string
}> {
  try {
    const response = await api.createEvent(eventData)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create event')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      event: data.event,
      message: data.message || 'Event created successfully'
    }
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

// Update event
export async function updateEvent(eventId: number, eventData: Partial<Event>): Promise<{
  success: boolean
  event: Event
  message: string
}> {
  try {
    const response = await api.updateEvent(eventId, eventData)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update event')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      event: data.event,
      message: data.message || 'Event updated successfully'
    }
  } catch (error) {
    console.error('Error updating event:', error)
    throw error
  }
}

// Delete event
export async function deleteEvent(eventId: number): Promise<{
  success: boolean
  message: string
}> {
  try {
    const response = await api.deleteEvent(eventId)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to delete event')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      message: data.message || 'Event deleted successfully'
    }
  } catch (error) {
    console.error('Error deleting event:', error)
    throw error
  }
}

// Get event by ID
export async function getEventById(eventId: number): Promise<Event> {
  try {
    const response = await api.getEventById(eventId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.event
  } catch (error) {
    console.error('Error fetching event by ID:', error)
    throw error
  }
}

// Get event guests
export async function getEventGuests(eventId: number): Promise<{
  guests: any[]
  total: number
  stats: {
    accepted: number
    declined: number
    pending: number
    checkedIn: number
  }
}> {
  try {
    const response = await api.getEventGuests(eventId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      guests: data.guests || [],
      total: data.total || 0,
      stats: {
        accepted: data.stats?.accepted || 0,
        declined: data.stats?.declined || 0,
        pending: data.stats?.pending || 0,
        checkedIn: data.stats?.checkedIn || 0
      }
    }
  } catch (error) {
    console.error('Error fetching event guests:', error)
    throw error
  }
}

// Update event status
export async function updateEventStatus(eventId: number, status: Event['status']): Promise<{
  success: boolean
  event: Event
  message: string
}> {
  try {
    const response = await api.updateEventStatus(eventId, status)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to update event status')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      event: data.event,
      message: data.message || 'Event status updated successfully'
    }
  } catch (error) {
    console.error('Error updating event status:', error)
    throw error
  }
}

// Export events
export async function exportEvents(
  events: Event[],
  format: 'excel' | 'csv' = 'excel'
): Promise<void> {
  try {
    if (format === 'excel') {
      await api.exportEventsExcel(events)
    } else {
      await api.exportEventsCSV(events)
    }
  } catch (error) {
    console.error('Error exporting events:', error)
    throw error
  }
}

// Get upcoming events
export async function getUpcomingEvents(limit: number = 5): Promise<Event[]> {
  try {
    const response = await fetchEventsPage({
      page: 1,
      itemsPerPage: limit,
      statusFilter: 'upcoming'
    })
    
    return response.events
  } catch (error) {
    console.error('Error fetching upcoming events:', error)
    throw error
  }
}

// Get events by date range
export async function getEventsByDateRange(
  startDate: string,
  endDate: string
): Promise<Event[]> {
  try {
    const response = await api.getEventsByDateRange(startDate, endDate)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.events || []
  } catch (error) {
    console.error('Error fetching events by date range:', error)
    throw error
  }
}

// Duplicate event
export async function duplicateEvent(eventId: number): Promise<{
  success: boolean
  event: Event
  message: string
}> {
  try {
    const response = await api.duplicateEvent(eventId)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to duplicate event')
    }
    
    const data = await response.json()
    
    return {
      success: true,
      event: data.event,
      message: data.message || 'Event duplicated successfully'
    }
  } catch (error) {
    console.error('Error duplicating event:', error)
    throw error
  }
}
