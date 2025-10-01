// Cấu hình API và URLs cho ứng dụng
// Tự động chuyển đổi giữa development và production

const isDevelopment = process.env.NODE_ENV === 'development'

// SEPARATED SERVICES: API Base URL for external backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (isDevelopment ? 'http://localhost:5008' : 'https://apievent.expsolution.io')

// Frontend Base URL  
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ||
  (isDevelopment ? 'http://192.168.1.135:3000' : 'https://event.expsolution.io')

// API Endpoints - Sử dụng Next.js API routes
export const API_ENDPOINTS = {
  // Events
  EVENTS: '/api/events',
  
  // Guests - Sử dụng Next.js API routes
  GUESTS: '/api/guests',
  GUEST_BY_ID: (id: string) => `/api/guests/${id}`,
  GUEST_QR: (id: string) => `/api/guests/${id}/qr`,
  GUEST_QR_IMAGE: (id: string) => `/api/guests/${id}/qr-image`,
  GUEST_BULK_CHECKIN: '/api/guests/bulk-checkin',
  GUEST_BULK_CHECKOUT: '/api/guests/bulk-checkout',
  GUEST_BULK_DELETE: '/api/guests/bulk-delete',
  GUEST_BULK_RSVP: '/api/guests/bulk-rsvp',
  GUEST_BULK_HOST: '/api/guests/bulk-host',
  GUEST_IMPORT: '/api/guests/import',
  GUEST_IMPORT_CSV: '/api/guests/import-csv',
  GUESTS_CHECKED_IN: '/api/guests/checked-in',
  
  // Check-in - Sử dụng Next.js API routes
  CHECKIN: '/api/checkin',
  CHECKIN_BY_ID: (id: string) => `/api/checkin/${id}`,
  
  // Auth - Sử dụng Next.js API routes
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    USERS: '/api/auth/users',
    ME: '/api/auth/me',
  },
} as const

// Utility functions
export const getApiUrl = (endpoint: string) => {
  // Force trả về relative URL cho Next.js API routes
  if (endpoint.startsWith('/api/')) {
    return endpoint
  }
  // Nếu endpoint đã là full URL thì trả về nguyên vẹn
  if (endpoint.startsWith('http')) {
    return endpoint
  }
  // Các trường hợp khác - trả về endpoint gốc
  return endpoint
}

export const getFrontendUrl = (path: string) => {
  return `${FRONTEND_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Debug info (chỉ hiển thị trong development)
if (isDevelopment) {
  // Silent in production - config info not needed in console
}
