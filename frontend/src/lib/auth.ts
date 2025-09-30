// Authentication utilities with auto-refresh
import { getAccessToken, getValidAccessToken, refreshAccessToken } from './jwt'

export async function fetchJSON(input: RequestInfo, init: RequestInit = {}) {
  const withAuth = (t?: string): RequestInit => ({
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  let token = getAccessToken() || await getValidAccessToken()
  let res = await fetch(input, withAuth(token))

  if (res.status === 401) {
    console.log("🔄 Got 401, attempting refresh...")
    const newAccess = await refreshAccessToken()
    res = await fetch(input, withAuth(newAccess || undefined))
  }
  return res
}

// Specific API functions using the wrapper
export const authApi = {
  // Import guests
  importGuests: (data: any) => fetchJSON('/api/guests/import', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  importGuestsCSV: async (formData: FormData) => {
    // For FormData, we need to handle it differently
    let token = await getValidAccessToken()
    
    const withAuth = (t?: string): RequestInit => ({
      method: 'POST',
      body: formData,
      headers: {
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        // Don't set Content-Type for FormData, let browser set it
      },
      credentials: 'include' as RequestCredentials,
    })

    // 1st try
    let res = await fetch('/api/guests/import-csv', withAuth(token))
    if (res.status === 401) {
      console.log("🔄 Got 401, attempting refresh...")
      const newAccess = await refreshAccessToken()
      if (!newAccess) {
        console.log("❌ Refresh failed, returning 401")
        return res
      }
      token = newAccess
      console.log("✅ Refresh successful, retrying request...")
      res = await fetch('/api/guests/import-csv', withAuth(token))
    }
    return res
  },
  
  // Other API calls can be added here
  getGuests: () => fetchJSON('/api/guests'),
  
  bulkDeleteGuests: (data: any) => fetchJSON('/api/guests/bulk-delete', {
    method: 'DELETE',
    body: JSON.stringify(data),
  }),
  
  bulkUpdateRSVP: (data: any) => fetchJSON('/api/guests/bulk-rsvp', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}
