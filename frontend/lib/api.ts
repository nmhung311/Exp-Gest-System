// API utility functions
// Thay thế cho việc hardcode URLs trong components

import { API_ENDPOINTS, getApiUrl } from './config'

// Generic API call function
export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : getApiUrl(endpoint)
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  const response = await fetch(url, { ...defaultOptions, ...options })
  
  return response
}

// Specific API functions for different endpoints
export const api = {
  // Events
  getEvents: () => apiCall(API_ENDPOINTS.EVENTS),
  createEvent: (data: any) => apiCall(API_ENDPOINTS.EVENTS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEvent: (id: string, data: any) => apiCall(API_ENDPOINTS.EVENTS + `/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteEvent: (id: string) => apiCall(API_ENDPOINTS.EVENTS + `/${id}`, {
    method: 'DELETE',
  }),

  // Guests
  getGuests: (eventId?: string) => {
    const url = eventId ? `${API_ENDPOINTS.GUESTS}?event_id=${eventId}` : API_ENDPOINTS.GUESTS
    return apiCall(url)
  },
  getGuestsCheckedIn: () => apiCall(API_ENDPOINTS.GUESTS_CHECKED_IN),
  createGuest: (data: any) => apiCall(API_ENDPOINTS.GUESTS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateGuest: (id: string, data: any) => apiCall(API_ENDPOINTS.GUEST_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteGuest: (id: string) => apiCall(API_ENDPOINTS.GUEST_BY_ID(id), {
    method: 'DELETE',
  }),
  getGuestQR: (id: string) => apiCall(API_ENDPOINTS.GUEST_QR(id)),
  getGuestQRImage: (id: string) => apiCall(API_ENDPOINTS.GUEST_QR_IMAGE(id)),
  bulkCheckinGuests: (data: any) => apiCall(API_ENDPOINTS.GUEST_BULK_CHECKIN, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  bulkCheckoutGuests: (data: any) => apiCall(API_ENDPOINTS.GUEST_BULK_CHECKOUT, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  bulkDeleteGuests: (data: any) => apiCall(API_ENDPOINTS.GUEST_BULK_DELETE, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  importGuests: (formData: FormData) => apiCall(API_ENDPOINTS.GUEST_IMPORT, {
    method: 'POST',
    body: formData,
  }),
  importGuestsCSV: (formData: FormData) => apiCall(API_ENDPOINTS.GUEST_IMPORT_CSV, {
    method: 'POST',
    body: formData,
  }),

  // Check-in
  checkinGuest: (data: any) => apiCall(API_ENDPOINTS.CHECKIN, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkoutGuest: (data: any) => apiCall(API_ENDPOINTS.CHECKIN, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteCheckin: (id: string) => apiCall(API_ENDPOINTS.CHECKIN_BY_ID(id), {
    method: 'DELETE',
  }),

  // Auth
  login: (data: any) => apiCall(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  register: (data: any) => apiCall(API_ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getUsers: () => apiCall(API_ENDPOINTS.AUTH.USERS),
}

// Export API_ENDPOINTS for components that need it
export { API_ENDPOINTS } from './config'

// Legacy export for backward compatibility
export const API_BASE_URL = API_ENDPOINTS.EVENTS.replace('/api/events', '')