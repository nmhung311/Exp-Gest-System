"use client"
import React, { useState, useEffect } from "react"
import { API_ENDPOINTS } from '@/lib/api'
import CustomDropdown from '../../components/CustomDropdown'
import MobileStatusCardContainer from '../../../components/ui/MobileStatusCardContainer'

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
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backups, setBackups] = useState<any[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  useEffect(() => {
    if (showBackupModal) {
      loadBackups()
    }
  }, [showBackupModal])

  useEffect(() => {
    loadUpcomingEvents()
  }, [selectedPeriod])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      console.log('Loading dashboard stats...')
      
      // Load guests data
      console.log('Fetching guests from:', API_ENDPOINTS.GUESTS)
      const guestsRes = await fetch(API_ENDPOINTS.GUESTS)
      console.log('Guests response status:', guestsRes.status)
      let guests = []
      if (guestsRes.ok) {
        const guestsData = await guestsRes.json()
        guests = guestsData.guests || guestsData || []
        console.log('Guests data:', guests)
      } else {
        console.error('Failed to fetch guests:', guestsRes.status, await guestsRes.text())
      }
      
      // Load checked-in guests
      console.log('Fetching checked-in guests from:', API_ENDPOINTS.GUESTS_CHECKED_IN)
      const checkinRes = await fetch(API_ENDPOINTS.GUESTS_CHECKED_IN)
      console.log('Checked-in guests response status:', checkinRes.status)
      let checkedInGuests = []
      if (checkinRes.ok) {
        const checkinData = await checkinRes.json()
        checkedInGuests = checkinData.guests || checkinData || []
        console.log('Checked-in guests data:', checkedInGuests)
      } else {
        console.error('Failed to fetch checked-in guests:', checkinRes.status, await checkinRes.text())
      }
      
      // Load events data
      console.log('Fetching events from:', API_ENDPOINTS.EVENTS)
      const eventsRes = await fetch(API_ENDPOINTS.EVENTS)
      console.log('Events response status:', eventsRes.status)
      let events = []
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        events = eventsData.events || eventsData || []
        console.log('Events data:', events)
      } else {
        console.error('Failed to fetch events:', eventsRes.status, await eventsRes.text())
      }
      
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
      const response = await fetch(API_ENDPOINTS.EVENTS)
      if (response.ok) {
        const eventsData = await response.json()
        const allEvents = eventsData.events || eventsData || []
        
        // Filter events based on selected period
        const now = new Date()
        let filteredEvents = allEvents
        
        if (selectedPeriod === '3days') {
          const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
          filteredEvents = allEvents.filter((event: any) => {
            const eventDate = new Date(event.date)
            return eventDate >= now && eventDate <= threeDaysFromNow
          })
        } else if (selectedPeriod === '7days') {
          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          filteredEvents = allEvents.filter((event: any) => {
            const eventDate = new Date(event.date)
            return eventDate >= now && eventDate <= sevenDaysFromNow
          })
        } else if (selectedPeriod === 'month') {
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
          filteredEvents = allEvents.filter((event: any) => {
            const eventDate = new Date(event.date)
            return eventDate >= now && eventDate <= nextMonth
          })
        } else {
          // 'all' - show all upcoming events
          filteredEvents = allEvents.filter((event: any) => {
            const eventDate = new Date(event.date)
            return eventDate >= now
          })
        }
        
        setUpcomingEvents(filteredEvents)
      }
    } catch (error) {
      console.error("Error loading upcoming events:", error)
    }
  }

  const loadBackups = async () => {
    try {
      console.log('=== LOADING BACKUPS ===')
      const response = await fetch('/api/backup/list', {
        credentials: 'include'
      })
      console.log('Load backups response status:', response.status)
      console.log('Load backups response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Backups data:', data)
        setBackups(data.backups || [])
      } else {
        const error = await response.json()
        console.error('Failed to load backups:', error)
      }
    } catch (error) {
      console.error('Error loading backups:', error)
    }
  }

  const createBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Backup created successfully: ${data.filename}`)
        loadBackups()
      } else {
        const error = await response.json()
        alert(`Error creating backup: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('Error creating backup')
    } finally {
      setBackupLoading(false)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/backup/download/${filename}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Error downloading backup')
      }
    } catch (error) {
      console.error('Error downloading backup:', error)
      alert('Error downloading backup')
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/backup/delete/${filename}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        alert('Backup deleted successfully')
        loadBackups()
      } else {
        const error = await response.json()
        alert(`Error deleting backup: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      alert('Error deleting backup')
    }
  }

  const restoreBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to restore ${filename}? This will replace the current database.`)) {
      return
    }
    
    try {
      console.log('=== RESTORING BACKUP ===')
      console.log('Filename:', filename)
      
      const response = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ filename })
      })
      
      console.log('Restore response status:', response.status)
      console.log('Restore response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Restore result:', result)
        alert('Backup restored successfully')
        loadBackups()
      } else {
        const error = await response.json()
        console.error('Restore error:', error)
        alert(`Error restoring backup: ${error.message}`)
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      alert('Error restoring backup')
    }
  }

  const uploadBackup = async () => {
    if (!uploadFile) {
      alert('Please select a file to upload')
      return
    }
    
    if (!uploadFile.name.endsWith('.zip')) {
      alert('Only ZIP files are allowed')
      return
    }
    
    setUploadLoading(true)
    try {
      console.log('=== UPLOADING BACKUP ===')
      console.log('File:', uploadFile.name, uploadFile.size)
      
      const formData = new FormData()
      formData.append('file', uploadFile)
      
      const response = await fetch('/api/backup/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      console.log('Upload response status:', response.status)
      console.log('Upload response ok:', response.ok)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Upload result:', result)
        alert('Backup uploaded successfully')
        setShowUploadModal(false)
        setUploadFile(null)
        loadBackups()
      } else {
        const error = await response.json()
        console.error('Upload error:', error)
        alert(`Error uploading backup: ${error.message}`)
      }
    } catch (error) {
      console.error('Error uploading backup:', error)
      alert('Error uploading backup')
    } finally {
      setUploadLoading(false)
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

      {/* Quick Actions - Auto-spread inline */}
      <div className="hidden md:grid gap-3 sm:gap-4 grid-cols-5">
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
        
        <button 
          onClick={() => setShowBackupModal(true)}
          className="group relative bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-2 sm:p-4 hover:from-red-500/20 hover:to-pink-500/20 hover:border-red-400/40 transition-all duration-300"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-500/20 rounded-lg">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-white text-xs sm:text-sm truncate">Backup</div>
              <div className="text-xs text-red-300/80 truncate">Sao lưu, khôi phục</div>
            </div>
          </div>
        </button>
      </div>

      {/* Mobile Quick Actions - Horizontal Scroll */}
      <div className="md:hidden">
        <MobileStatusCardContainer 
          className="mobile-card-container"
          scrollbarStyle="default"
          gap="sm"
          padding="sm"
        >
          <a className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 min-w-[160px] hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/40 transition-all duration-300" href="/dashboard/guests">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-xs truncate">Quản lý khách mời</div>
                <div className="text-xs text-blue-300/80 truncate">Import, phát QR</div>
              </div>
            </div>
          </a>
          
          <a className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 min-w-[160px] hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300" href="/dashboard/checkin">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/20 rounded-lg">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-xs truncate">Check-in</div>
                <div className="text-xs text-green-300/80 truncate">Quét QR, ghi nhận</div>
              </div>
            </div>
          </a>
          
          <a className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 min-w-[160px] hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/40 transition-all duration-300" href="/dashboard/stats">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-lg">
                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-xs truncate">Thống kê</div>
                <div className="text-xs text-purple-300/80 truncate">Tổng hợp, báo cáo</div>
              </div>
            </div>
          </a>
          
          <a className="group relative bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 min-w-[160px] hover:from-amber-500/20 hover:to-amber-500/20 hover:border-amber-400/40 transition-all duration-300" href="/dashboard/events">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-xs truncate">Sự kiện</div>
                <div className="text-xs text-amber-300/80 truncate">Tạo, quản lý</div>
              </div>
            </div>
          </a>
          
          <button 
            onClick={() => setShowBackupModal(true)}
            className="group relative bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 min-w-[160px] hover:from-red-500/20 hover:to-pink-500/20 hover:border-red-400/40 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-xs truncate">Backup</div>
                <div className="text-xs text-red-300/80 truncate">Sao lưu, khôi phục</div>
              </div>
            </div>
          </button>
        </MobileStatusCardContainer>
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
          
          {/* Controls - Inline on mobile, separate on desktop */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            {/* Period Filter Dropdown - Only show on mobile (w 370px) */}
            <div className="sm:hidden flex-1">
              <CustomDropdown
                options={[
                  { 
                    value: 'all', 
                    label: 'Tất cả',
                    icon: (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  { 
                    value: '3days', 
                    label: '3 ngày tới',
                    icon: (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                  },
                  { 
                    value: '7days', 
                    label: '7 ngày tới',
                    icon: (
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  { 
                    value: 'month', 
                    label: 'Tháng này',
                    icon: (
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )
                  }
                ]}
                value={selectedPeriod}
                onChange={(value) => setSelectedPeriod(value as any)}
                className="w-full min-w-[140px]"
              />
            </div>
            
            <a 
              href="/dashboard/events"
              className="px-3 sm:px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium w-full sm:w-auto text-center min-w-[140px]"
            >
              Quản lý sự kiện
            </a>
          </div>
        </div>

        {/* Period Filter Tabs - Only show on desktop (hidden on mobile w 370px) */}
        <div className="hidden sm:flex sm:flex-wrap gap-1.5 sm:gap-2 mb-4 md:mb-6">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Xem thêm
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

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 h-[100dvh] w-[100dvw] z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowBackupModal(false)}></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Quản lý Backup Database
              </h2>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Create Backup and Upload Buttons */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={createBackup}
                disabled={backupLoading}
                className="group relative py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backupLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                <span>{backupLoading ? 'Đang tạo backup...' : 'Tạo backup mới'}</span>
              </button>
              
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Tải lên backup</span>
              </button>
            </div>

            {/* Backup List */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Danh sách backup</h3>
              {backups.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <svg className="w-12 h-12 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p>Chưa có backup nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div key={backup.filename} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">{backup.filename}</div>
                          <div className="text-xs text-white/60 mt-1">
                            Tạo lúc: {new Date(backup.created).toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xs text-white/60">
                            Kích thước: {(backup.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadBackup(backup.filename)}
                            className="p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="Tải xuống"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => restoreBackup(backup.filename)}
                            className="p-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                            title="Khôi phục"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteBackup(backup.filename)}
                            className="p-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Backup Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 h-[100dvh] w-[100dvw] z-[9998] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Tải lên Backup
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Chọn file backup (ZIP)
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
              />
              {uploadFile && (
                <div className="mt-2 text-sm text-white/60">
                  <p>File: {uploadFile.name}</p>
                  <p>Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={uploadBackup}
                disabled={!uploadFile || uploadLoading}
                className="flex-1 group relative py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
                <span>{uploadLoading ? 'Đang tải lên...' : 'Tải lên'}</span>
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setUploadFile(null)
                }}
                className="group relative py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 hover:shadow-lg hover:shadow-gray-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


