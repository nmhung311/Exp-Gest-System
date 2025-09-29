// Cấu hình API và URLs cho ứng dụng
// Tự động chuyển đổi giữa development và production

const isDevelopment = process.env.NODE_ENV === 'development'

// SEPARATED SERVICES: API Base URL for external backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (isDevelopment ? 'http://192.168.1.135:5008' : 'https://apievent.expsolution.io')

// Frontend Base URL  
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ||
  (isDevelopment ? 'http://192.168.1.135:3000' : 'https://event.expsolution.io')

// API Endpoints - Gọi trực tiếp đến external backend
export const API_ENDPOINTS = {
  // Events
  EVENTS: `${API_BASE_URL}/api/events`,
  
  // Guests - Gọi trực tiếp backend external
  GUESTS: `${API_BASE_URL}/api/guests`,
  GUEST_BY_ID: (id: string) => `${API_BASE_URL}/api/guests/${id}`,
  GUEST_QR: (id: string) => `${API_BASE_URL}/api/guests/${id}/qr`,
  GUEST_QR_IMAGE: (id: string) => `${API_BASE_URL}/api/guests/${id}/qr-image`,
  GUEST_BULK_CHECKIN: `${API_BASE_URL}/api/guests/bulk-checkin`,
  GUEST_BULK_CHECKOUT: `${API_BASE_URL}/api/guests/bulk-checkout`,
  GUEST_BULK_DELETE: `${API_BASE_URL}/api/guests/bulk-delete`,
  GUEST_BULK_RSVP: `${API_BASE_URL}/api/guests/bulk-rsvp`,
  GUEST_BULK_HOST: `${API_BASE_URL}/api/guests/bulk-host`,
  GUEST_IMPORT: `${API_BASE_URL}/api/guests/import`,
  GUEST_IMPORT_CSV: `${API_BASE_URL}/api/guests/import-csv`,
  GUESTS_CHECKED_IN: `${API_BASE_URL}/api/guests/checked-in`,
  
  // Check-in - Gọi trực tiếp backend external
  CHECKIN: `${API_BASE_URL}/api/checkin`,
  CHECKIN_BY_ID: (id: string) => `${API_BASE_URL}/api/checkin/${id}`,
  
  // Auth - Gọi trực tiếp backend external
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    USERS: `${API_BASE_URL}/api/auth/users`,
    ME: `${API_BASE_URL}/api/auth/me`,
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
  console.log('🔧 Development Mode - API Config:', {
    API_BASE_URL,
    FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV
  })
}
