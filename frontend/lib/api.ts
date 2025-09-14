// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api'

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  
  // Guests
  GUESTS: {
    LIST: `${API_BASE_URL}/guests`,
    CREATE: `${API_BASE_URL}/guests`,
    UPDATE: (id: string) => `${API_BASE_URL}/guests/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/guests/${id}`,
    QR: (id: string) => `${API_BASE_URL}/guests/${id}/qr`,
    QR_IMAGE: (id: string) => `${API_BASE_URL}/guests/${id}/qr-image`,
    CHECKED_IN: `${API_BASE_URL}/guests/checked-in`,
    BULK_CHECKIN: `${API_BASE_URL}/guests/bulk-checkin`,
    BULK_CHECKOUT: `${API_BASE_URL}/guests/bulk-checkout`,
    BULK_DELETE: `${API_BASE_URL}/guests/bulk-delete`,
    IMPORT: `${API_BASE_URL}/guests/import`,
    IMPORT_CSV: `${API_BASE_URL}/guests/import-csv`,
  },
  
  // Events
  EVENTS: {
    LIST: `${API_BASE_URL}/events`,
    CREATE: `${API_BASE_URL}/events`,
    UPDATE: (id: string) => `${API_BASE_URL}/events/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/events/${id}`,
    UPCOMING: (period: string) => `${API_BASE_URL}/events/upcoming?period=${period}`,
    GUESTS: (eventId: string) => `${API_BASE_URL}/guests?event_id=${eventId}`,
  },
  
  // Check-in
  CHECKIN: {
    CHECKIN: `${API_BASE_URL}/checkin`,
    CHECKOUT: (id: string) => `${API_BASE_URL}/checkin/${id}`,
  },
  
  // Stats
  STATS: {
    GUESTS: `${API_BASE_URL}/guests`,
    CHECKED_IN: `${API_BASE_URL}/guests/checked-in`,
  }
}

// Helper function to make API calls
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}
