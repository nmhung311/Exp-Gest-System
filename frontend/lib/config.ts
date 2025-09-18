// Cấu hình API và URLs cho ứng dụng
// Tự động chuyển đổi giữa development và production

const isDevelopment = process.env.NODE_ENV === 'development'

// API Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (isDevelopment ? '' : 'http://192.168.1.135:5008')

// Frontend Base URL  
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ||
  (isDevelopment ? 'http://192.168.1.135:9009' : 'http://192.168.1.135:9009')

// API Endpoints
export const API_ENDPOINTS = {
  // Events
  EVENTS: `${API_BASE_URL}/api/events`,
  
  // Guests
  GUESTS: `${API_BASE_URL}/api/guests`,
  GUEST_BY_ID: (id: string) => `${API_BASE_URL}/api/guests/${id}`,
  GUEST_QR: (id: string) => `${API_BASE_URL}/api/guests/${id}/qr`,
  GUEST_QR_IMAGE: (id: string) => `${API_BASE_URL}/api/guests/${id}/qr-image`,
  GUEST_BULK_CHECKIN: `${API_BASE_URL}/api/guests/bulk-checkin`,
  GUEST_BULK_CHECKOUT: `${API_BASE_URL}/api/guests/bulk-checkout`,
  GUEST_BULK_DELETE: `${API_BASE_URL}/api/guests/bulk-delete`,
  GUEST_IMPORT: `${API_BASE_URL}/api/guests/import`,
  GUEST_IMPORT_CSV: `${API_BASE_URL}/api/guests/import-csv`,
  GUESTS_CHECKED_IN: `${API_BASE_URL}/api/guests/checked-in`,
  
  // Check-in
  CHECKIN: `${API_BASE_URL}/api/checkin`,
  CHECKIN_BY_ID: (id: string) => `${API_BASE_URL}/api/checkin/${id}`,
  
  // Auth - Gọi trực tiếp đến backend (không qua Next.js API routes)
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    USERS: `${API_BASE_URL}/api/auth/users`,
    ME: `${API_BASE_URL}/api/auth/me`,
  },
} as const

// Utility functions
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

export const getFrontendUrl = (path: string) => {
  return `${FRONTEND_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Debug info (chỉ hiển thị trong development)
if (isDevelopment) {
  console.log('🔧 Development Mode - API Config:', {
    API_BASE_URL,
    FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV
  })
}
