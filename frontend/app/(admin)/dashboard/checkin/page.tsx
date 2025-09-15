"use client"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import WorkingQRScanner from "../../../components/WorkingQRScanner"
import { Icons } from "../../../components/icons"
import { api } from "@/lib/api"
 

interface CheckedInGuest {
  id: number
  name: string
  title?: string
  position?: string
  company?: string
  tag?: string
  email?: string
  phone?: string
  checked_in_at: string
  checkin_method: string
  event_id?: number
  event_name?: string
}

interface Event {
  id: number
  name: string
  date: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  visible: boolean
  undoAction?: () => void
}

interface EditCheckinState {
  isOpen: boolean
  guest: CheckedInGuest | null
}

export default function CheckinPage(){
  const [checkedInGuests, setCheckedInGuests] = useState<CheckedInGuest[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [qrCode, setQrCode] = useState("")
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  
  // Debug log khi isScannerActive thay đổi
  useEffect(() => {
    console.log('isScannerActive changed to:', isScannerActive)
  }, [isScannerActive])
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [editCheckin, setEditCheckin] = useState<EditCheckinState>({ isOpen: false, guest: null })
  const [selectedStatus, setSelectedStatus] = useState<'not_arrived' | 'arrived'>('arrived')
  const guestsPerPage = 6

  const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])
    if (!mounted) return null
    return createPortal(children as React.ReactElement, document.body)
  }

  // Load events
  const loadEvents = async () => {
    try {
      const data = await api.getEvents()
      // Sắp xếp sự kiện theo ngày gần nhất (upcoming events first)
      const sortedEvents = data.sort((a: Event, b: Event) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })
      setEvents(sortedEvents)
    } catch (error) {
      console.error("Error loading events:", error)
      setEvents([])
    }
  }

  // Load events on component mount (optional for display elsewhere)
  useEffect(() => { loadEvents() }, [])

  // Initial load checked-in guests
  useEffect(() => { loadCheckedInGuests() }, [])

  // Function to add notification with enhanced features
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', undoAction?: () => void) => {
    const id = Date.now().toString()
    const newNotification: Notification = {
      id,
      message,
      type,
      visible: true,
      undoAction
    }
    
    setNotifications(prev => {
      const updated = [...prev, newNotification]
      // Giữ tối đa 4 thông báo cho mobile
      return updated.slice(-4)
    })
    
    // Play sound feedback based on notification type
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        // Different frequencies for different types
        const frequencies = {
          success: 800,
          error: 300,
          warning: 600,
          info: 500
        }
        
        oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      } catch (error) {
        // Silently fail if audio context is not available
        console.log('Audio feedback not available')
      }
    }
    
    // Tự động ẩn: 6s nếu có hoàn tác, 4s nếu không
    const autoHideMs = undoAction ? 6000 : 4000
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, visible: false } : notif
        )
      )
      
      // Xóa khỏi state sau khi animation hoàn thành
      setTimeout(() => {
        setNotifications(prev => prev.filter(notif => notif.id !== id))
      }, 300)
    }, autoHideMs)
  }

  async function loadCheckedInGuests() {
    setLoading(true)
    try {
      // Đồng bộ nguồn dữ liệu với trang Khách mời: dùng /api/guests rồi lọc
      const payload = await api.getGuests()
      const allGuests = Array.isArray(payload?.guests) ? payload.guests : []
        // Đọc sự kiện người dùng đã chọn ở trang Khách mời (nếu có)
        let selectedEventId: number | null = null
        try {
          const saved = localStorage.getItem('exp_selected_event')
          if (saved && saved !== '""' && saved !== 'null' && saved !== 'undefined') {
            const parsed = Number(saved.replace(/"/g, ''))
            if (!Number.isNaN(parsed)) selectedEventId = parsed
          }
        } catch {}

        const arrived = allGuests
          .filter((g: any) => g?.checkin_status === 'arrived')
          .filter((g: any) => selectedEventId ? (g?.event_id === selectedEventId) : true)
          .map((g: any) => ({
            id: g.id,
            name: g.name,
            title: g.title,
            position: g.position,
            company: g.company,
            tag: g.tag,
            email: g.email,
            phone: g.phone,
            checked_in_at: g.checked_in_at || '',
            checkin_method: g.checkin_method || 'manual',
            event_id: g.event_id,
            event_name: g.event_name,
          }))
        setCheckedInGuests(arrived)
    } catch (error) {
      console.error("Error loading guests:", error)
      setCheckedInGuests([])
    } finally {
      setLoading(false)
    }
  }

  // Lắng nghe thay đổi sự kiện đã chọn từ các trang khác và tự refresh
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'exp_selected_event') {
        loadCheckedInGuests()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function handleCheckIn() {
    if (!qrCode.trim()) {
      addNotification("Vui lòng nhập mã QR", "warning")
      return
    }
    
    try {
      const data = await api.checkinGuest({ qr_code: qrCode })

      if (data) {
        const checkinTime = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        addNotification(`✅ Check-in thành công!\n👋 Chào mừng ${data.guest.name}\n🕐 ${checkinTime}`, "success")
        setQrCode("")
        loadCheckedInGuests()
      } else {
        if (response.status === 409) {
          const checkinTime = new Date(data.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          addNotification(`⚠️ ${data.guest?.name || "Khách"} đã check-in\n🕐 Lúc: ${checkinTime}`, "warning")
        } else if (response.status === 410) {
          addNotification("❌ Token đã hết hạn\n🔄 Vui lòng tạo mã QR mới", "error")
        } else {
          addNotification(`❌ Check-in thất bại\n📝 ${data.message || "Lỗi không xác định"}`, "error")
        }
      }
    } catch (error) {
      console.error("Check-in error:", error)
      addNotification("❌ Lỗi kết nối\n🔄 Vui lòng thử lại", "error")
    }
  }

  const handleQRScan = async (qrData: string) => {
    try {
      console.log('=== QR SCAN START ===')
      console.log('QR Data received:', qrData)
      console.log('QR Data type:', typeof qrData)
      console.log('QR Data length:', qrData.length)
      
      // QR code bây giờ chứa trực tiếp token
      const token = qrData.trim()
      console.log('Using token:', token)
      console.log('Token length:', token.length)
      
      // Debounce đã được xử lý trong WorkingQRScanner component
      
      const data = await api.checkinGuest({ qr_code: token })
      console.log('Check-in data:', data)

      if (data) {
        const checkinTime = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        addNotification(`✅ Check-in thành công!\n👋 Chào mừng ${data.guest.name}\n🕐 ${checkinTime}`, "success")
        loadCheckedInGuests()
      } else {
        if (response.status === 409) {
          const checkinTime = new Date(data.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          addNotification(`⚠️ ${data.guest?.name || "Khách"} đã check-in\n🕐 Lúc: ${checkinTime}`, "warning")
        } else if (response.status === 410) {
          addNotification("❌ Token đã hết hạn\n🔄 Vui lòng tạo mã QR mới", "error")
        } else {
          addNotification(`❌ Check-in thất bại\n📝 ${data.message || "Lỗi không xác định"}`, "error")
        }
      }
    } catch (error) {
      console.error("Check-in error:", error)
      addNotification("❌ Lỗi kết nối\n🔄 Vui lòng thử lại", "error")
    }
  }

  const handleScannerError = (error: string) => {
    console.log('Scanner error received:', error)
    setScannerError(error)
    // Chỉ tắt camera khi có lỗi thực sự của camera (không phải lỗi business logic)
    if (error.includes('camera') || error.includes('permission') || error.includes('access')) {
      console.log('Tắt camera do lỗi camera')
      setIsScannerActive(false)
    } else {
      console.log('Không tắt camera, chỉ là lỗi business logic')
    }
  }

  // Function to open edit popup
  const openEditPopup = (guest: CheckedInGuest) => {
    setEditCheckin({ isOpen: true, guest })
    setSelectedStatus('arrived')
  }

  // Function to close edit popup
  const closeEditPopup = () => {
    setEditCheckin({ isOpen: false, guest: null })
    setSelectedStatus('arrived')
  }

  // Function to delete check-in
  const deleteCheckin = async (guest: CheckedInGuest) => {
    try {
      const response = await fetch(`http://localhost:5001/api/checkin/${guest.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Lưu thông tin để hoàn tác
        const originalGuest = { ...guest }
        
        // Xóa khỏi danh sách hiện tại
        setCheckedInGuests(prev => prev.filter(g => g.id !== guest.id))
        
        // Thêm thông báo với chức năng hoàn tác
        addNotification(
          `🗑️ Đã xóa ${guest.name}\n↩️ Khỏi danh sách check-in`,
          'success',
          () => {
            // Hoàn tác: thêm lại vào danh sách
            setCheckedInGuests(prev => [...prev, originalGuest])
            addNotification(`↩️ Đã hoàn tác\n👋 ${guest.name} đã được thêm lại`, 'info')
          }
        )
        
        closeEditPopup()
      } else {
        addNotification('❌ Lỗi khi xóa check-in\n🔄 Vui lòng thử lại', 'error')
      }
    } catch (error) {
      console.error('Error deleting check-in:', error)
      addNotification('❌ Lỗi kết nối khi xóa check-in\n🔄 Vui lòng thử lại', 'error')
    }
  }

  // Filter guests based on search term
  const filteredGuests = checkedInGuests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredGuests.length / guestsPerPage)
  const startIndex = (currentPage - 1) * guestsPerPage
  const endIndex = startIndex + guestsPerPage
  const currentGuests = filteredGuests.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Calculate statistics - across all checked-in guests
  const eventCheckedInGuests = checkedInGuests
    
  const stats = {
    total: eventCheckedInGuests.length,
    today: eventCheckedInGuests.filter(g => {
      const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      const checkinDate = new Date(g.checked_in_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
      return today === checkinDate
    }).length,
    thisWeek: eventCheckedInGuests.filter(g => {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const checkinTime = new Date(g.checked_in_at)
      return checkinTime >= weekAgo
    }).length,
    thisMonth: eventCheckedInGuests.filter(g => {
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const checkinTime = new Date(g.checked_in_at)
      return checkinTime >= monthAgo
    }).length
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Event selection section removed as requested */}

      {/* Notification Container (portal to body to avoid overlay stacking issues) */}
      <style jsx global>{`
        @keyframes c_marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <Portal>
        <div className="fixed top-2 sm:top-4 right-2 sm:right-4 left-2 sm:left-auto z-[99999] space-y-2 max-w-[95vw] sm:max-w-xs">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-md border transition-all duration-500 transform ${
                notification.visible 
                  ? 'translate-x-0 opacity-100 scale-100' 
                  : 'translate-x-full opacity-0 scale-95'
              } ${
                notification.type === 'success' 
                  ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-600/40 via-emerald-500/30 to-emerald-400/20 text-white' 
                  : notification.type === 'error'
                  ? 'border-rose-400/30 bg-gradient-to-br from-rose-600/40 via-rose-500/30 to-rose-400/20 text-white'
                  : notification.type === 'warning'
                  ? 'border-amber-400/30 bg-gradient-to-br from-amber-600/40 via-amber-500/30 to-amber-400/20 text-white'
                  : 'border-cyan-400/30 bg-gradient-to-br from-cyan-600/40 via-cyan-500/30 to-cyan-400/20 text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  {notification.type === 'success' && (
                    <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-emerald-500/20 rounded-full flex-none flex items-center justify-center border border-emerald-400/30 mt-0.5">
                      <Icons.Success className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />
                    </span>
                  )}
                  {notification.type === 'error' && (
                    <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-rose-500/20 rounded-full flex-none flex items-center justify-center border border-rose-400/30 mt-0.5">
                      <Icons.Error className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" />
                    </span>
                  )}
                  {notification.type === 'warning' && (
                    <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-amber-500/20 rounded-full flex-none flex items-center justify-center border border-amber-400/30 mt-0.5">
                      <Icons.Warning className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
                    </span>
                  )}
                  {notification.type === 'info' && (
                    <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-cyan-500/20 rounded-full flex-none flex items-center justify-center border border-cyan-400/30 mt-0.5">
                      <Icons.Info className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
                    </span>
                  )}
                  <div className="relative overflow-hidden flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                      {notification.message}
                    </div>
                  </div>
                </div>
                {notification.undoAction && (
                  <button
                    onClick={notification.undoAction}
                    className="flex-shrink-0 text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap mt-0.5"
                  >
                    <Icons.Undo className="w-3 h-3" />
                    <span className="hidden sm:inline">Hoàn tác</span>
                    <span className="sm:hidden">↩️</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Portal>
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Check-in</h1>
        <button 
          onClick={loadCheckedInGuests}
          className="px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Làm mới</span>
        </button>
      </div>

      {/* Main Content */}
      <>

      {/* Statistics Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Check-ins Card */}
        <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-cyan-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-xs sm:text-sm text-cyan-300/80 font-medium">Tổng</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Today Card */}
        <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{stats.today}</div>
                <div className="text-xs sm:text-sm text-green-300/80 font-medium">Hôm nay</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.today / stats.total) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>

        {/* This Week Card */}
        <div className="group relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:from-blue-500/20 hover:to-indigo-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{stats.thisWeek}</div>
                <div className="text-xs sm:text-sm text-blue-300/80 font-medium">Tuần này</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.thisWeek / stats.total) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>

        {/* This Month Card */}
        <div className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{stats.thisMonth}</div>
                <div className="text-xs sm:text-sm text-purple-300/80 font-medium">Tháng này</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.thisMonth / stats.total) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Section - Mobile Optimized */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2 mb-4 sm:mb-6">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
          </svg>
          Quét mã QR
        </h2>
        
        {!isScannerActive ? (
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => setIsScannerActive(true)}
              className="group relative w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/20"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="text-sm sm:text-base">Bật camera quét QR</span>
            </button>
            
            <div className="text-center text-white/60 text-xs sm:text-sm">
              Hoặc nhập mã QR thủ công
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <input
                type="text"
                placeholder="Nhập mã QR hoặc mã dự phòng..."
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm sm:text-base"
              />
              <button
                onClick={handleCheckIn}
                className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm sm:text-base">Ghi nhận</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <WorkingQRScanner
                onScan={handleQRScan}
                onError={handleScannerError}
                isActive={isScannerActive}
              />
              {/* Mobile overlay for better UX */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                  <p className="text-white text-xs text-center">Đưa mã QR vào khung hình</p>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 text-center">
                    <p className="text-white text-xs">Camera sẽ tự động quét mã QR</p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsScannerActive(false)}
              className="group relative w-full px-4 py-2 sm:py-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 font-medium backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
            >
              <span className="text-sm sm:text-base">Tắt camera</span>
            </button>
          </div>
        )}
        
        {scannerError && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="text-red-400 font-medium text-sm sm:text-base">Lỗi Scanner</div>
            <div className="text-red-300 text-xs sm:text-sm mt-1">{scannerError}</div>
            <button
              onClick={() => {
                setScannerError(null)
                setIsScannerActive(false)
              }}
              className="group relative mt-2 px-3 py-1 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded text-xs sm:text-sm hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Checked-in Guests List Section - Mobile Optimized */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-sm sm:text-base">Danh sách đã check-in</span>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
              {filteredGuests.length}
            </span>
          </h2>
          <div className="flex gap-2 sm:gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white/60 text-base sm:text-lg">Chưa có khách nào check-in</p>
            <p className="text-white/40 text-xs sm:text-sm mt-2">Sử dụng form check-in nhanh ở trên để check-in khách mời</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {currentGuests.map((guest, index) => (
                <div key={guest.id} className="bg-black/20 border border-white/10 rounded-lg p-4 hover:bg-black/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/60 text-xs font-medium">#{startIndex + index + 1}</span>
                        {guest.title && (
                          <span className="text-white/80 text-sm">{guest.title}</span>
                        )}
                      </div>
                      <h3 className="text-white font-medium text-sm sm:text-base truncate">{guest.name}</h3>
                      {guest.email && (
                        <p className="text-white/60 text-xs truncate">{guest.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => openEditPopup(guest)}
                      className="flex-shrink-0 p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/60">Vai trò:</span>
                      <p className="text-white/80 truncate">{guest.position || '-'}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Tổ chức:</span>
                      <p className="text-white/80 truncate">{guest.company || '-'}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Check-in:</span>
                      <p className="text-white/80">
                        {new Date(guest.checked_in_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </p>
                      <p className="text-white/60">
                        {new Date(guest.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Phương thức:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1 w-fit">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                          </svg>
                          QR
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {guest.tag && (
                    <div className="mt-3">
                      <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                        {guest.tag}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white/60 uppercase bg-black/30">
                  <tr>
                    <th className="px-4 py-3 w-16">STT</th>
                    <th className="px-4 py-3 w-20">Danh xưng</th>
                    <th className="px-4 py-3 w-40">Họ và tên</th>
                    <th className="px-4 py-3 w-24">Vai trò</th>
                    <th className="px-4 py-3 w-32">Tổ chức</th>
                    <th className="px-4 py-3 w-24">Tag</th>
                    <th className="px-4 py-3 w-32">Thời gian check-in</th>
                    <th className="px-4 py-3 w-24">Phương thức</th>
                    <th className="px-4 py-3 w-24">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentGuests.map((guest, index) => (
                    <tr key={guest.id} className="bg-black/20 border-b border-white/10 hover:bg-black/30 transition-colors">
                      <td className="px-4 py-4 text-white/80">{startIndex + index + 1}</td>
                      <td className="px-4 py-4 text-white/80">{guest.title || '-'}</td>
                      <td className="px-4 py-4">
                        <div className="text-white font-medium">{guest.name}</div>
                        {guest.email && (
                          <div className="text-white/60 text-xs">{guest.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white/80">{guest.position || '-'}</td>
                      <td className="px-4 py-4 text-white/80">{guest.company || '-'}</td>
                      <td className="px-4 py-4">
                        {guest.tag ? (
                          <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                            {guest.tag}
                          </span>
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-white/80">
                        <div className="text-sm">
                          {new Date(guest.checked_in_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                        </div>
                        <div className="text-xs text-white/60">
                          {new Date(guest.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1 w-fit">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                          </svg>
                          QR Code
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => openEditPopup(guest)}
                          className="group relative px-3 py-1 text-xs bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 rounded-full transition-all duration-300 flex items-center gap-1 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination - Mobile Optimized */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 px-2 sm:px-4">
            <div className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredGuests.length)} trong tổng số {filteredGuests.length} khách
            </div>
            
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page Numbers - Mobile: Show fewer pages */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Mobile: Show only current page and adjacent pages, plus first/last
                  const showPage = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                  
                  if (showPage) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  }
                  
                  // Show ellipsis for mobile
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={`ellipsis-${page}`} className="px-1 sm:px-2 text-white/40 text-xs">...</span>
                  }
                  
                  return null
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Sau</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      </>

      {/* Edit Check-in Popup - Mobile Optimized */}
      {editCheckin.isOpen && editCheckin.guest && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-[100dvw] bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
            <div className="relative z-10 bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-md sm:max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Chỉnh sửa trạng thái check-in</h3>
              <button
                onClick={closeEditPopup}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="text-white/80 mb-2 text-sm sm:text-base">Khách mời:</div>
              <div className="text-white font-medium text-sm sm:text-base">
                {editCheckin.guest.title} {editCheckin.guest.name}
              </div>
              <div className="text-white/60 text-xs sm:text-sm">
                {editCheckin.guest.company} • {editCheckin.guest.position}
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="text-white/80 mb-2 sm:mb-3 text-sm sm:text-base">Trạng thái hiện tại:</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1 w-fit">
                  <Icons.Success className="w-3 h-3" />
                  Đã check-in
                </span>
                <span className="text-white/60 text-xs sm:text-sm">
                  {new Date(editCheckin.guest.checked_in_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </span>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="text-white/80 mb-2 sm:mb-3 text-sm sm:text-base">Chọn trạng thái mới:</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 sm:gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                  onClick={() => setSelectedStatus('not_arrived')}
                >
                  <input
                    type="radio"
                    name="status"
                    value="not_arrived"
                    className="text-red-500"
                    id="status-not_arrived"
                    checked={selectedStatus === 'not_arrived'}
                    onChange={() => setSelectedStatus('not_arrived')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Icons.Error className="w-4 h-4 flex-shrink-0" />
                      Chưa đến
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm">Xóa khỏi danh sách check-in</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-2 sm:gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg cursor-pointer hover:bg-green-500/20 transition-colors"
                  onClick={() => setSelectedStatus('arrived')}
                >
                  <input
                    type="radio"
                    name="status"
                    value="arrived"
                    className="text-green-500"
                    id="status-arrived"
                    checked={selectedStatus === 'arrived'}
                    onChange={() => setSelectedStatus('arrived')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium flex items-center gap-2 text-sm sm:text-base">
                      <Icons.Success className="w-4 h-4 flex-shrink-0" />
                      Đã đến
                    </div>
                    <div className="text-white/60 text-xs sm:text-sm">Giữ nguyên trạng thái</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={closeEditPopup}
                className="group relative flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20 text-sm sm:text-base"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (selectedStatus === 'not_arrived') {
                    // Xóa check-in (server sẽ cập nhật checkin_status = not_arrived)
                    deleteCheckin(editCheckin.guest!)
                    // Làm mới danh sách theo nguồn khách mời để đồng bộ tức thì
                    setTimeout(() => {
                      loadCheckedInGuests()
                    }, 300)
                  } else {
                    closeEditPopup()
                  }
                }}
                className="group relative flex-1 px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 text-sm sm:text-base"
              >
                Xác nhận
              </button>
            </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}


