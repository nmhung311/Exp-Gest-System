'use client'

import { useState, useEffect } from 'react'

interface Guest {
  id: number
  name: string
  email: string
  rsvp_status: 'pending' | 'accepted' | 'declined'
  checked_in_at?: string
  created_at: string
}

interface CheckinStats {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
}

interface GuestStats {
  total: number
  pending: number
  accepted: number
  declined: number
  responseRate: number
  acceptanceRate: number
}

export default function StatsPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [checkedInGuests, setCheckedInGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Load guests data
  useEffect(() => {
    loadGuests()
    loadCheckedInGuests()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('.dropdown-container')) {
          setIsDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const loadGuests = async () => {
    try {
      const response = await fetch('http://192.168.1.135:9009/api/guests')
      if (response.ok) {
        const data = await response.json()
        setGuests(data)
      }
    } catch (error) {
      console.error('Error loading guests:', error)
    }
  }

  const loadCheckedInGuests = async () => {
    try {
      const response = await fetch('http://192.168.1.135:9009/api/guests/checked-in')
      if (response.ok) {
        const data = await response.json()
        setCheckedInGuests(data)
      }
    } catch (error) {
      console.error('Error loading checked-in guests:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate guest statistics
  const safeGuests = Array.isArray(guests) ? guests : []
  const guestStats: GuestStats = {
    total: safeGuests.length,
    pending: safeGuests.filter(g => g.rsvp_status === 'pending').length,
    accepted: safeGuests.filter(g => g.rsvp_status === 'accepted').length,
    declined: safeGuests.filter(g => g.rsvp_status === 'declined').length,
    responseRate: safeGuests.length > 0 ? Math.round(((safeGuests.filter(g => g.rsvp_status !== 'pending').length) / safeGuests.length) * 100) : 0,
    acceptanceRate: safeGuests.filter(g => g.rsvp_status !== 'pending').length > 0 ? Math.round(((safeGuests.filter(g => g.rsvp_status === 'accepted').length) / safeGuests.filter(g => g.rsvp_status !== 'pending').length) * 100) : 0
  }

  // Calculate check-in statistics
  const safeCheckedInGuests = Array.isArray(checkedInGuests) ? checkedInGuests : []
  const checkinStats: CheckinStats = {
    total: safeCheckedInGuests.length,
    today: safeCheckedInGuests.filter(g => {
      const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      const checkinDate = new Date(g.checked_in_at!).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      return today === checkinDate
    }).length,
    thisWeek: safeCheckedInGuests.filter(g => {
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const checkinDate = new Date(g.checked_in_at!)
      return checkinDate >= weekStart
    }).length,
    thisMonth: safeCheckedInGuests.filter(g => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const checkinDate = new Date(g.checked_in_at!)
      return checkinDate >= monthStart
    }).length
  }

  // Filter data based on time range
  const getFilteredData = () => {
    if (safeCheckedInGuests.length === 0) return []
    
    const now = new Date()
    switch (timeRange) {
      case 'today':
        return safeCheckedInGuests.filter(g => {
          const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          const checkinDate = new Date(g.checked_in_at!).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          return today === checkinDate
        })
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        return safeCheckedInGuests.filter(g => {
          const checkinDate = new Date(g.checked_in_at!)
          return checkinDate >= weekStart
        })
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return safeCheckedInGuests.filter(g => {
          const checkinDate = new Date(g.checked_in_at!)
          return checkinDate >= monthStart
        })
      default:
        return safeCheckedInGuests
    }
  }

  const filteredData = getFilteredData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header - Desktop Optimized */}
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-3">
            Thống Kê Hệ Thống
          </h1>
          <p className="text-white/60 text-sm sm:text-base">Báo cáo chi tiết về khách mời và check-in</p>
        </div>

        {/* Time Range Dropdown - Mobile Optimized */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-xs sm:max-w-sm dropdown-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white text-left flex items-center justify-between hover:bg-black/30 hover:border-white/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <span className="text-sm sm:text-base">
                {timeRange === 'all' && 'Tất cả thời gian'}
                {timeRange === 'month' && 'Tháng này'}
                {timeRange === 'week' && 'Tuần này'}
                {timeRange === 'today' && 'Hôm nay'}
              </span>
              <svg 
                className={`w-5 h-5 text-white/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black/30 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden scrollbar-glass">
                {[
                  { 
                    key: 'all', 
                    label: 'Tất cả thời gian', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )
                  },
                  { 
                    key: 'month', 
                    label: 'Tháng này', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  { 
                    key: 'week', 
                    label: 'Tuần này', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    )
                  },
                  { 
                    key: 'today', 
                    label: 'Hôm nay', 
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  }
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeRange(key as any)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/10 transition-colors duration-200 ${
                      timeRange === key 
                        ? 'bg-blue-500/20 text-blue-400 border-l-2 border-blue-400' 
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <span className="text-blue-400">{icon}</span>
                    <span className="text-sm sm:text-base">{label}</span>
                    {timeRange === key && (
                      <svg className="w-4 h-4 ml-auto text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Guest Statistics - Desktop Optimized */}
        <div className="space-y-6">
          <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span>Thống Kê Khách Mời</span>
          </h2>

          {/* Desktop: 4 cards per row on ≥1280px, 2 cards per row on 1024px */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
            {/* Total Guests - Primary Card */}
            <div className="group relative bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-2 border-blue-400/50 rounded-2xl p-4 sm:p-6 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/70 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-blue-500/30 rounded-xl">
                    <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">{guestStats.total}</div>
                    <div className="text-sm sm:text-base text-blue-200 font-medium">Tổng khách mời</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-2 bg-gradient-to-r from-blue-500/40 to-cyan-500/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-4 sm:p-6 hover:from-yellow-500/20 hover:to-amber-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{guestStats.pending}</div>
                    <div className="text-sm text-yellow-300/80 font-medium">Chờ phản hồi</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full" style={{width: `${guestStats.total > 0 ? (guestStats.pending / guestStats.total) * 100 : 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accepted - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 sm:p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{guestStats.accepted}</div>
                    <div className="text-sm text-green-300/80 font-medium">Đã xác nhận</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${guestStats.total > 0 ? (guestStats.accepted / guestStats.total) * 100 : 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Declined - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 sm:p-6 hover:from-red-500/20 hover:to-rose-500/20 hover:border-red-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{guestStats.declined}</div>
                    <div className="text-sm text-red-300/80 font-medium">Đã từ chối</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-400 to-rose-400 rounded-full" style={{width: `${guestStats.total > 0 ? (guestStats.declined / guestStats.total) * 100 : 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Rate - Desktop Optimized with Progress Circle */}
            <div className="group relative bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-4 sm:p-6 hover:from-indigo-500/20 hover:to-purple-500/20 hover:border-indigo-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{guestStats.responseRate}%</div>
                    <div className="text-sm text-indigo-300/80 font-medium">Tỷ lệ phản hồi</div>
                  </div>
                </div>
                <div className="mt-auto">
                  {/* Circular Progress */}
                  <div className="relative w-16 h-16 mx-auto">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-indigo-500/20"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-indigo-400"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${guestStats.responseRate}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Acceptance Rate - Desktop Optimized with Progress Circle */}
            <div className="group relative bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-sm border border-teal-500/20 rounded-2xl p-4 sm:p-6 hover:from-teal-500/20 hover:to-cyan-500/20 hover:border-teal-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-teal-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{guestStats.acceptanceRate}%</div>
                    <div className="text-sm text-teal-300/80 font-medium">Tỷ lệ chấp nhận</div>
                  </div>
                </div>
                <div className="mt-auto">
                  {/* Circular Progress */}
                  <div className="relative w-16 h-16 mx-auto">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-teal-500/20"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-teal-400"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${guestStats.acceptanceRate}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Statistics - Desktop Optimized */}
        <div className="space-y-6">
          <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>Thống Kê Check-in</span>
          </h2>

          {/* Desktop: 4 cards per row on ≥1280px, 2 cards per row on 1024px */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Total Check-ins - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-4 sm:p-6 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-cyan-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{checkinStats.total}</div>
                    <div className="text-sm text-cyan-300/80 font-medium">Tổng check-in</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 sm:p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{checkinStats.today}</div>
                    <div className="text-sm text-green-300/80 font-medium">Hôm nay</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${checkinStats.total > 0 ? (checkinStats.today / checkinStats.total) * 100 : 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* This Week - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 sm:p-6 hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{checkinStats.thisWeek}</div>
                    <div className="text-sm text-blue-300/80 font-medium">Tuần này</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" style={{width: `${checkinStats.total > 0 ? (checkinStats.thisWeek / checkinStats.total) * 100 : 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* This Month - Desktop Optimized */}
            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 sm:p-6 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex flex-col h-full">
                <div className="flex items-start justify-between mb-4 flex-1">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{checkinStats.thisMonth}</div>
                    <div className="text-sm text-purple-300/80 font-medium">Tháng này</div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" style={{width: `${checkinStats.total > 0 ? (checkinStats.thisMonth / checkinStats.total) * 100 : 0}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Check-ins - Desktop Optimized */}
        <div className="space-y-6">
          <h2 className="text-lg sm:text-xl font-medium text-white flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span>
              Check-in Gần Đây 
              <span className="hidden sm:inline">({timeRange === 'all' ? 'Tất cả' : timeRange === 'month' ? 'Tháng này' : timeRange === 'week' ? 'Tuần này' : 'Hôm nay'})</span>
              <span className="sm:hidden">({timeRange === 'all' ? 'Tất cả' : timeRange === 'month' ? 'Tháng' : timeRange === 'week' ? 'Tuần' : 'Hôm nay'})</span>
            </span>
          </h2>

          <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 lg:p-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                {/* QR Code + Person Illustration */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg sm:text-xl mb-3">Hiện chưa có check-in nào</h3>
                <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto">
                  Chưa có khách mời nào check-in trong khoảng thời gian này
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredData.slice(0, 10).map((guest, index) => (
                  <div key={guest.id} className="flex items-center justify-between p-3 sm:p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm sm:text-base">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-medium text-sm sm:text-base truncate">{guest.name}</h3>
                        <p className="text-white/60 text-xs sm:text-sm truncate">{guest.email}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-white/80 text-xs sm:text-sm">
                        {new Date(guest.checked_in_at!).toLocaleString('vi-VN', { 
                          timeZone: 'Asia/Ho_Chi_Minh',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Đã check-in</span>
                        <span className="sm:hidden">✓</span>
                      </span>
                    </div>
                  </div>
                ))}
                {filteredData.length > 10 && (
                  <div className="text-center pt-3 sm:pt-4">
                    <p className="text-white/60 text-sm">Và {filteredData.length - 10} check-in khác...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
