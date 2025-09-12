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

  // Load guests data
  useEffect(() => {
    loadGuests()
    loadCheckedInGuests()
  }, [])

  const loadGuests = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/guests')
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
      const response = await fetch('http://localhost:5001/api/guests/checked-in')
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
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text mb-2">
            Thống Kê Hệ Thống
          </h1>
          <p className="text-white/70 text-lg">Báo cáo chi tiết về khách mời và check-in</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-center">
          <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-2">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'month', label: 'Tháng này' },
                { key: 'week', label: 'Tuần này' },
                { key: 'today', label: 'Hôm nay' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTimeRange(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timeRange === key
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Guest Statistics */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Thống Kê Khách Mời
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Total Guests */}
            <div className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{guestStats.total}</div>
                    <div className="text-sm text-blue-300/80 font-medium">Tổng khách mời</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full w-full"></div>
                </div>
              </div>
            </div>

            {/* Pending */}
            <div className="group relative bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 hover:from-yellow-500/20 hover:to-amber-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{guestStats.pending}</div>
                    <div className="text-sm text-yellow-300/80 font-medium">Chờ phản hồi</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full" style={{width: `${guestStats.total > 0 ? (guestStats.pending / guestStats.total) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>

            {/* Accepted */}
            <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{guestStats.accepted}</div>
                    <div className="text-sm text-green-300/80 font-medium">Đã xác nhận</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${guestStats.total > 0 ? (guestStats.accepted / guestStats.total) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>

            {/* Declined */}
            <div className="group relative bg-gradient-to-br from-red-500/10 to-rose-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6 hover:from-red-500/20 hover:to-rose-500/20 hover:border-red-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{guestStats.declined}</div>
                    <div className="text-sm text-red-300/80 font-medium">Đã từ chối</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-400 to-rose-400 rounded-full" style={{width: `${guestStats.total > 0 ? (guestStats.declined / guestStats.total) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>

            {/* Response Rate */}
            <div className="group relative bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 hover:from-indigo-500/20 hover:to-purple-500/20 hover:border-indigo-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{guestStats.responseRate}%</div>
                    <div className="text-sm text-indigo-300/80 font-medium">Tỷ lệ phản hồi</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full" style={{width: `${guestStats.responseRate}%`}}></div>
                </div>
              </div>
            </div>

            {/* Acceptance Rate */}
            <div className="group relative bg-gradient-to-br from-teal-500/10 to-cyan-500/10 backdrop-blur-sm border border-teal-500/20 rounded-2xl p-6 hover:from-teal-500/20 hover:to-cyan-500/20 hover:border-teal-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-teal-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{guestStats.acceptanceRate}%</div>
                    <div className="text-sm text-teal-300/80 font-medium">Tỷ lệ chấp nhận</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-teal-500/30 to-cyan-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full" style={{width: `${guestStats.acceptanceRate}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Statistics */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Thống Kê Check-in
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Total Check-ins */}
            <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-cyan-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{checkinStats.total}</div>
                    <div className="text-sm text-cyan-300/80 font-medium">Tổng đã check-in</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full w-full"></div>
                </div>
              </div>
            </div>

            {/* Today */}
            <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{checkinStats.today}</div>
                    <div className="text-sm text-green-300/80 font-medium">Hôm nay</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${checkinStats.total > 0 ? (checkinStats.today / checkinStats.total) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>

            {/* This Week */}
            <div className="group relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{checkinStats.thisWeek}</div>
                    <div className="text-sm text-blue-300/80 font-medium">Tuần này</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" style={{width: `${checkinStats.total > 0 ? (checkinStats.thisWeek / checkinStats.total) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white mb-1">{checkinStats.thisMonth}</div>
                    <div className="text-sm text-purple-300/80 font-medium">Tháng này</div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" style={{width: `${checkinStats.total > 0 ? (checkinStats.thisMonth / checkinStats.total) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Check-in Gần Đây ({timeRange === 'all' ? 'Tất cả' : timeRange === 'month' ? 'Tháng này' : timeRange === 'week' ? 'Tuần này' : 'Hôm nay'})
          </h2>

          <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white/60 text-lg">Chưa có check-in nào trong khoảng thời gian này</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredData.slice(0, 10).map((guest, index) => (
                  <div key={guest.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{guest.name}</h3>
                        <p className="text-white/60 text-sm">{guest.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm">
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Đã check-in
                      </span>
                    </div>
                  </div>
                ))}
                {filteredData.length > 10 && (
                  <div className="text-center pt-4">
                    <p className="text-white/60">Và {filteredData.length - 10} check-in khác...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
