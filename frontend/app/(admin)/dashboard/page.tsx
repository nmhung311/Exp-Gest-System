"use client"
import React, { useState, useEffect } from "react"
import { API_ENDPOINTS } from '@/lib/api'

interface DashboardStats {
  totalGuests: number
  checkedInGuests: number
  pendingGuests: number
  acceptedGuests: number
  declinedGuests: number
  totalEvents: number
  upcomingEvents: number
  todayCheckins: number
}

interface Event {
  id: number
  name: string
  description: string
  date: string
  time: string
  location: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  max_guests: number
  created_at: string
}

export default function DashboardPage(){
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0,
    checkedInGuests: 0,
    pendingGuests: 0,
    acceptedGuests: 0,
    declinedGuests: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    todayCheckins: 0
  })
  const [events, setEvents] = useState<Event[]>([])
  const [upcomingEvent, setUpcomingEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '3days' | '7days' | 'month'>('all')
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])

  useEffect(() => {
    loadDashboardStats()
  }, [])

  useEffect(() => {
    loadUpcomingEvents()
  }, [selectedPeriod])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Load guests data
      const guestsRes = await fetch(API_ENDPOINTS.GUESTS.LIST)
      const guests = guestsRes.ok ? await guestsRes.json() : []
      
      // Load checked-in guests
      const checkinRes = await fetch(API_ENDPOINTS.GUESTS.CHECKED_IN)
      const checkedInGuests = checkinRes.ok ? await checkinRes.json() : []
      
      // Load events data
      const eventsRes = await fetch(API_ENDPOINTS.EVENTS.LIST)
      const events = eventsRes.ok ? await eventsRes.json() : []
      
      // Calculate today's check-ins
      const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      const todayCheckins = checkedInGuests.filter((guest: any) => {
        const checkinDate = new Date(guest.checked_in_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        return today === checkinDate
      }).length
      
      // Calculate upcoming events
      const now = new Date()
      const upcomingEvents = events.filter((event: any) => new Date(event.date) >= now).length
      
      // Sort events by date (không chọn mặc định sự kiện cụ thể)
      const sortedEvents = events.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setEvents(sortedEvents)
      setUpcomingEvent(null)
      setStats({
        totalGuests: guests.length,
        checkedInGuests: checkedInGuests.length,
        pendingGuests: guests.filter((g: any) => g.rsvp_status === 'pending').length,
        acceptedGuests: guests.filter((g: any) => g.rsvp_status === 'accepted').length,
        declinedGuests: guests.filter((g: any) => g.rsvp_status === 'declined').length,
        totalEvents: events.length,
        upcomingEvents,
        todayCheckins
      })
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUpcomingEvents = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EVENTS.UPCOMING(selectedPeriod))
      if (response.ok) {
        const events = await response.json()
        setUpcomingEvents(events)
      }
    } catch (error) {
      console.error("Error loading upcoming events:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Bảng điều khiển</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Bảng điều khiển</h1>

      {/* Quick Actions - Mobile Optimized */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <a className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-2 sm:p-4 hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/40 transition-all duration-300" href="/dashboard/guests">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-xs sm:text-sm truncate">Quản lý khách mời</div>
              <div className="text-xs text-blue-300/80 truncate">Import, phát QR</div>
            </div>
          </div>
        </a>
        
        <a className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-2 sm:p-4 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300" href="/dashboard/checkin">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-xs sm:text-sm truncate">Check-in</div>
              <div className="text-xs text-green-300/80 truncate">Quét QR, ghi nhận</div>
            </div>
          </div>
        </a>
        
        <a className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-2 sm:p-4 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/40 transition-all duration-300" href="/dashboard/stats">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-xs sm:text-sm truncate">Thống kê</div>
              <div className="text-xs text-purple-300/80 truncate">Tổng hợp, báo cáo</div>
            </div>
          </div>
        </a>
        
        <a className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-2 sm:p-4 hover:from-amber-500/20 hover:to-amber-500/20 hover:border-amber-400/40 transition-all duration-300" href="/dashboard/events">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-amber-500/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-xs sm:text-sm truncate">Sự kiện</div>
              <div className="text-xs text-amber-300/80 truncate">Tạo, quản lý sự kiện</div>
            </div>
          </div>
        </a>
      </div>



      {/* Upcoming Events with Period Filter */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-3 sm:gap-4">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">Sự kiện sắp tới ({upcomingEvents.length})</span>
          </h2>
          <a 
            href="/dashboard/events"
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium w-full sm:w-auto text-center"
          >
            Quản lý sự kiện
          </a>
        </div>

        {/* Period Filter Tabs - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mb-4 md:mb-6">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: '3days', label: '3 ngày tới' },
            { key: '7days', label: '7 ngày tới' },
            { key: 'month', label: 'Tháng này' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as any)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedPeriod === period.key
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
        
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-white/60 text-base sm:text-lg px-2">
              {selectedPeriod === 'all' ? 'Chưa có sự kiện nào' : 
               selectedPeriod === '3days' ? 'Không có sự kiện trong 3 ngày tới' :
               selectedPeriod === '7days' ? 'Không có sự kiện trong 7 ngày tới' :
               'Không có sự kiện trong tháng này'}
            </p>
            <p className="text-white/40 text-xs sm:text-sm mt-2 px-2">Tạo sự kiện để bắt đầu</p>
          </div>
        ) : (
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="group bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4 hover:bg-black/40 hover:border-white/20 transition-all duration-200 flex flex-col h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{event.name}</h3>
                    <p className="text-white/60 text-xs line-clamp-2">{event.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                    event.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-300' :
                    event.status === 'ongoing' ? 'bg-green-500/20 text-green-300' :
                    event.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {event.status === 'upcoming' ? 'Sắp diễn ra' : 
                     event.status === 'ongoing' ? 'Đang diễn ra' : 
                     event.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-white/80 text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(event.date).toLocaleDateString('vi-VN')}
                    {event.time && ` • ${event.time}`}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-white/60 text-xs">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}
                  <div className="text-white/60 text-xs">
                    Tối đa {event.max_guests} khách
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <a
                    href={`/dashboard/events?edit=${event.id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Chỉnh sửa
                  </a>
                </div>
              </div>
            ))}
            {upcomingEvents.length > 6 && (
              <div className="md:col-span-2 lg:col-span-3 flex justify-center mt-2">
                <a
                  href="/dashboard/events"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  Xem thêm
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


