// Guest type definitions
// Định nghĩa types cho Guest entity

export interface Guest {
  id: number
  name: string
  title?: string
  role?: string
  organization?: string
  tag?: string
  email?: string
  phone?: string
  rsvp_status: 'pending' | 'accepted' | 'declined'
  checkin_status: 'not_arrived' | 'checked_in' | 'checked_out'
  created_at: string
  event_id?: number
  event_name?: string
  event_content?: string
}

export interface GuestForm {
  name: string
  title: string
  role: string
  organization: string
  tag: string
  email: string
  phone: string
  rsvp_status: 'pending' | 'accepted' | 'declined'
  checkin_status: 'not_arrived' | 'checked_in' | 'checked_out'
  event_content: string
}

export interface GuestFilters {
  eventFilter: string
  searchTerm: string
  statusFilter: string
  tagFilter: string
  organizationFilter: string
  roleFilter: string
}

export interface GuestStats {
  total: number
  accepted: number
  declined: number
  pending: number
  checkedIn: number
}

export interface DuplicateGuest {
  newGuest: Guest
  existingGuest: Guest
  index: number
}

export interface DuplicateModalData {
  newGuests: Guest[]
  existingGuests: Guest[]
  importType: 'json' | 'csv'
  jsonData?: any[]
  csvFile?: File
}

// Export/Import types
export interface GuestExportData {
  guests: Guest[]
  filename: string
  format: 'excel' | 'csv'
  totalItems: number
  exportDate: string
}

export interface GuestImportResult {
  success: number
  errors: string[]
  duplicates: DuplicateGuest[]
  totalProcessed: number
}

// Bulk operations types
export interface BulkOperation {
  type: 'update' | 'delete' | 'checkin' | 'checkout'
  guestIds: number[]
  updates?: Partial<Guest>
}

export interface BulkOperationResult {
  success: number
  errors: string[]
  totalProcessed: number
}

// Search and filter types
export interface GuestSearchParams {
  query: string
  fields: ('name' | 'email' | 'phone' | 'role' | 'organization' | 'tag')[]
  caseSensitive?: boolean
}

export interface GuestFilterParams {
  rsvp_status?: string[]
  checkin_status?: string[]
  event_id?: number[]
  tag?: string[]
  organization?: string[]
  role?: string[]
  dateRange?: {
    start: string
    end: string
  }
}

// Pagination types for guests
export interface GuestsPaginationParams {
  page: number
  itemsPerPage: number
  sortBy?: 'name' | 'created_at' | 'rsvp_status' | 'checkin_status'
  sortOrder?: 'asc' | 'desc'
}

export interface GuestsPaginationResponse {
  guests: Guest[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// QR Code types
export interface GuestQRData {
  guestId: number
  guestName: string
  eventId: number
  eventName: string
  qrCode: string
  inviteUrl: string
}

// Check-in types
export interface CheckinData {
  guestId: number
  checkinTime: string
  checkinMethod: 'qr' | 'manual' | 'bulk'
  notes?: string
}

export interface CheckinResult {
  success: boolean
  guest: Guest
  message: string
  checkinTime: string
}

// Event types
export interface Event {
  id: number
  name: string
  description: string
  date: string
  time: string
  location: string
  venue_address?: string
  venue_map_url?: string
  dress_code?: string
  program_outline?: string
  created_at?: string
  max_guests: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

// Form validation types
export interface GuestFormErrors {
  name?: string
  email?: string
  phone?: string
  role?: string
  organization?: string
  tag?: string
}

export interface GuestFormValidation {
  isValid: boolean
  errors: GuestFormErrors
}

// API response types
export interface GuestsApiResponse {
  guests: Guest[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface GuestApiResponse {
  guest: Guest
  success: boolean
  message: string
}

// Statistics types
export interface GuestStatistics {
  totalGuests: number
  rsvpStats: {
    accepted: number
    declined: number
    pending: number
  }
  checkinStats: {
    arrived: number
    notArrived: number
    checkedIn: number
  }
  eventStats: {
    [eventId: number]: {
      eventName: string
      totalGuests: number
      accepted: number
      declined: number
      pending: number
      arrived: number
    }
  }
  tagStats: {
    [tag: string]: number
  }
  organizationStats: {
    [organization: string]: number
  }
  roleStats: {
    [role: string]: number
  }
}

// Default values
export const DEFAULT_GUEST_FORM: GuestForm = {
  name: '',
  title: '',
  role: '',
  organization: '',
  tag: '',
  email: '',
  phone: '',
  rsvp_status: 'pending',
  checkin_status: 'not_arrived',
  event_content: ''
}

export const DEFAULT_GUEST_FILTERS: GuestFilters = {
  eventFilter: '',
  searchTerm: '',
  statusFilter: 'all',
  tagFilter: 'all',
  organizationFilter: 'all',
  roleFilter: 'all'
}

export const DEFAULT_PAGINATION_PARAMS: GuestsPaginationParams = {
  page: 1,
  itemsPerPage: 6,
  sortBy: 'created_at',
  sortOrder: 'desc'
}
