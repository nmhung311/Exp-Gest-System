// Cấu hình API và URLs cho ứng dụng
// Tự động chuyển đổi giữa development và production

const isDevelopment = process.env.NODE_ENV === 'development'

// API Base URLs
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  (isDevelopment ? 'http://localhost:5008' : 'http://192.168.1.135:5008')

// Frontend Base URL  
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ||
  (isDevelopment ? 'http://192.168.1.135:5008' : 'http://192.168.1.135:5008')

// API Endpoints - Tất cả sử dụng Next.js API routes
export const API_ENDPOINTS = {
  // Events
  EVENTS: `/api/events`,
  
  // Guests - Sử dụng Next.js API routes làm proxy
  GUESTS: `/api/guests`,
  GUEST_BY_ID: (id: string) => `/api/guests/${id}`,
  GUEST_QR: (id: string) => `/api/guests/${id}/qr`,
  GUEST_QR_IMAGE: (id: string) => `/api/guests/${id}/qr-image`,
  GUEST_BULK_CHECKIN: `/api/guests/bulk-checkin`,
  GUEST_BULK_CHECKOUT: `/api/guests/bulk-checkout`,
  GUEST_BULK_DELETE: `/api/guests/bulk-delete`,
  GUEST_IMPORT: `/api/guests/import`,
  GUEST_IMPORT_CSV: `/api/guests/import-csv`,
  GUESTS_CHECKED_IN: `/api/guests/checked-in`,
  
  // Check-in - Sử dụng Next.js API routes làm proxy
  CHECKIN: `/api/checkin`,
  CHECKIN_BY_ID: (id: string) => `/api/checkin/${id}`,
  
  // Auth - Sử dụng Next.js API routes làm proxy
  AUTH: {
    LOGIN: `/api/auth/login`,
    REGISTER: `/api/auth/register`,
    USERS: `/api/auth/users`,
    ME: `/api/auth/me`,
  },
} as const

// Utility functions
export const getApiUrl = (endpoint: string) => {
  // Nếu endpoint bắt đầu với '/api/' thì đó là Next.js API route, không cần thêm API_BASE_URL
  if (endpoint.startsWith('/api/')) {
    return endpoint
  }
  // Nếu endpoint đã là full URL thì trả về nguyên vẹn
  if (endpoint.startsWith('http')) {
    return endpoint
  }
  // Các trường hợp khác - không sử dụng API_BASE_URL nữa
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
