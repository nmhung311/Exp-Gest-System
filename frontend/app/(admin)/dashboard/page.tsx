"use client"
import React, { useState, useEffect } from "react"

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

  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Load guests data
      const guestsRes = await fetch("http://localhost:5001/api/guests")
      const guests = guestsRes.ok ? await guestsRes.json() : []
      
      // Load checked-in guests
      const checkinRes = await fetch("http://localhost:5001/api/guests/checked-in")
      const checkedInGuests = checkinRes.ok ? await checkinRes.json() : []
      
      // Load events data
      const eventsRes = await fetch("http://localhost:5001/api/events")
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Bảng điều khiển</h1>

      {/* Quick Actions moved to top */}
      <div className="grid gap-4 md:grid-cols-4">
        <a className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20" href="/dashboard/guests">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-lg">Quản lý khách mời</div>
                <div className="text-sm text-blue-300/80">Import danh sách, phát QR</div>
              </div>
            </div>
            <div className="text-xs text-blue-400/60">Nhấn để quản lý khách mời</div>
          </div>
        </a>
        
        <a className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20" href="/dashboard/checkin">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-lg">Check-in</div>
                <div className="text-sm text-green-300/80">Quét QR, ghi nhận nhanh</div>
              </div>
            </div>
            <div className="text-xs text-green-400/60">Nhấn để check-in khách</div>
          </div>
        </a>
        
        <a className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20" href="/dashboard/stats">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-lg">Thống kê</div>
                <div className="text-sm text-purple-300/80">Tổng hợp lượt phản hồi, check-in</div>
              </div>
            </div>
            <div className="text-xs text-purple-400/60">Nhấn để xem thống kê chi tiết</div>
          </div>
        </a>
        
        <a className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-6 hover:from-amber-500/20 hover:to-orange-500/20 hover:border-amber-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20" href="/dashboard/events">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white text-lg">Sự kiện</div>
                <div className="text-sm text-amber-300/80">Tạo, sửa, quản lý sự kiện</div>
              </div>
            </div>
            <div className="text-xs text-amber-400/60">Nhấn để quản lý sự kiện</div>
          </div>
        </a>
      </div>



      {/* All Events */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Tất cả sự kiện ({events.length})
          </h2>
          <a 
            href="/dashboard/events"
            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            Quản lý sự kiện
          </a>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-white/60 text-lg">Chưa có sự kiện nào</p>
            <p className="text-white/40 text-sm mt-2">Tạo sự kiện đầu tiên để bắt đầu</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="group bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-black/40 hover:border-white/20 transition-all duration-200">
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
                <div className="space-y-2">
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
              </div>
            ))}
            {events.length > 6 && (
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


