// Cấu hình API và URLs cho ứng dụng
// Site marketing: expsolution.io — app sự kiện (subdomain): event.expsolution.io

const isDevelopment = process.env.NODE_ENV === 'development'

// Client gọi qua Next API routes (cùng origin); production mặc định là subdomain sự kiện
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (isDevelopment ? 'http://localhost:3000' : 'https://event.expsolution.io')

// URL gốc của chính app Next (không phải apex marketing)
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ||
  (isDevelopment ? 'http://localhost:3000' : 'https://event.expsolution.io')

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
  GUEST_BULK_RSVP: `/api/guests/bulk-rsvp`,
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
  console.log('Development Mode - API Config:', {
    API_BASE_URL,
    FRONTEND_URL,
    NODE_ENV: process.env.NODE_ENV
  })
}
