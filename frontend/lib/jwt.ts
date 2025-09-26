// JWT utilities for frontend with proper security practices
export interface JWTPayload {
  user_id: number
  username: string
  email?: string
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

// Access token management (stored in localStorage for persistence)
const ACCESS_TOKEN_KEY = 'accessToken'

export function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1]
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
    const raw = JSON.parse(decoded)

    const normalizedType = raw?.type ?? raw?.typ // ưu tiên type
    if (normalizedType !== 'access' && normalizedType !== 'refresh') {
      console.log('❌ Unknown token type:', normalizedType)
      return null
    }

    // Ràng kiểu mềm cho payload
    if (typeof raw.user_id !== 'number' || typeof raw.username !== 'string') {
      console.log('❌ Invalid payload shape')
      return null
    }

    const normalized: JWTPayload = {
      user_id: raw.user_id,
      username: raw.username,
      email: raw.email,
      type: normalizedType,
      iat: raw.iat,
      exp: raw.exp,
    }

    // Fail-safe cho iat tương lai
    const now = Math.floor(Date.now() / 1000)
    if (normalized.iat && normalized.iat - now > 300) {
      console.log('⚠️ Client clock skew? iat is in the future:', normalized.iat, now)
    }

    console.log("🔍 Parsed JWT payload:", {
      type: normalized.type,
      user_id: normalized.user_id,
      username: normalized.username,
      exp: normalized.exp,
      iat: normalized.iat
    })

    return normalized
  } catch (e) {
    console.error('❌ Error parsing JWT:', e)
    return null
  }
}

const LEEWAY = 60 // seconds

export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token)
  if (!payload) {
    console.log("❌ Cannot parse token payload")
    return true
  }

  // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
  const currentTime = Math.floor(Date.now() / 1000)
  const isExpired = (payload.exp - currentTime) <= LEEWAY
  
  console.log("🕐 Token expiry check:", {
    currentTime,
    exp: payload.exp,
    isExpired,
    timeLeft: payload.exp - currentTime,
    leeway: LEEWAY
  })
  
  return isExpired
}

// Access token management (localStorage for persistence)
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    // Debug: Check token type before saving
    const payload = parseJWT(token)
    console.log('Setting access token:', {
      type: payload?.type,
      token: token.substring(0, 20) + '...',
      payload
    })
    
    if (payload?.type === 'refresh') {
      console.error('ERROR: Trying to save refresh token as access token!')
      return
    }
    
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  console.log("🔍 getAccessToken - Raw token:", token ? token.substring(0, 20) + "..." : "null")
  
  if (!token) {
    console.log("❌ No token in localStorage")
    return null
  }
  
  if (isTokenExpired(token)) {
    console.log("❌ Token expired, removing from localStorage")
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    return null
  }
  
  console.log("✅ Valid access token found")
  return token
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

// Refresh token management (HttpOnly cookie - handled by server)
export async function refreshAccessToken(): Promise<string | null> {
  console.log("🔄 Attempting to refresh access token...")
  try {
    const r = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
    if (!r.ok) {
      console.log("❌ Refresh request failed:", r.status)
      return null
    }
    
    const data = await r.json()  // { access_token: "<jwt>" }
    const access = data?.access_token || data?.access || data?.token
    
    if (!access || access.split(".").length !== 3) {
      console.log("❌ Invalid access token format in refresh response")
      return null
    }
    
    // parse + verify
    const p = JSON.parse(atob(access.split(".")[1]))
    const tokenType = p?.type ?? p?.typ
    if (tokenType !== "access") {
      console.log("❌ Refresh returned non-access token, type:", tokenType)
      return null
    }
    
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    console.log("✅ Refresh successful, access token saved")
    return access
  } catch (e) {
    console.log("❌ Refresh error:", e)
    return null
  }
}

// Simple token getter - no auto-refresh
export async function getValidAccessToken(): Promise<string | null> {
  const raw = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (!raw) {
    console.log("❌ No access token in localStorage")
    return null
  }
  
  try {
    const p = JSON.parse(atob(raw.split(".")[1]))
    const now = Math.floor(Date.now() / 1000)
    
    const tokenType = p?.type ?? p?.typ // chấp cả 2, ưu tiên 'type'
    if (tokenType !== "access") {
      console.log("❌ Token in localStorage is not access token, type:", tokenType)
      localStorage.removeItem(ACCESS_TOKEN_KEY) // Remove invalid token
      return null
    }
    
    if ((p.exp ?? 0) - now > 60) { // thay vì 30
      console.log("✅ Access token is still valid")
      return raw
    }
    
    console.log("🔄 Access token expired, refreshing...")
    const newAccess = await refreshAccessToken() // phải TRẢ ACCESS
    if (newAccess) {
      localStorage.setItem(ACCESS_TOKEN_KEY, newAccess)
      console.log("✅ Access token refreshed and saved")
    }
    return newAccess ?? null
  } catch (e) { 
    console.log("❌ Error validating access token:", e)
    localStorage.removeItem(ACCESS_TOKEN_KEY) // Remove invalid token
    return null 
  }
}

export function logout(): Promise<void> {
  return fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  })
  .then(() => {
    clearAccessToken()
  })
  .catch(error => {
    console.error('Logout failed:', error)
    clearAccessToken()
  })
}

export function getCurrentUser(): JWTPayload | null {
  const token = getAccessToken()
  if (!token) {
    return null
  }

  return parseJWT(token)
}

// Đồng bộ đa tab
export function enableAuthStorageSync() {
  if (typeof window === 'undefined') return
  window.addEventListener('storage', (e) => {
    if (e.key === ACCESS_TOKEN_KEY && e.newValue === null) {
      // token bị xóa ở tab khác
      console.log("🔄 Token cleared in another tab, redirecting to login...")
      window.location.href = '/login'
    }
  })
}

// Initialize token restoration on app startup
export function initializeTokenRestoration(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Check if we have a valid access token
  const token = getAccessToken()
  if (token) {
    console.log('Access token found in localStorage')
  } else {
    console.log('No access token found - user needs to login')
  }
}
