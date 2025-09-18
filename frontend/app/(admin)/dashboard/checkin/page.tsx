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
  const [allGuests, setAllGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [qrCode, setQrCode] = useState("")
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedCard, setSelectedCard] = useState<'total' | 'scanned' | 'notScanned' | null>(null)
  
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
      const response = await api.getEvents()
      const data = await response.json()
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

  // Handle refresh button click
  const handleRefresh = () => {
    loadCheckedInGuests(true)
  }

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

  async function loadCheckedInGuests(showNotification: boolean = false) {
    setLoading(true)
    try {
      console.log('Refreshing checked-in guests...')
      // Đồng bộ nguồn dữ liệu với trang Khách mời: dùng /api/guests rồi lọc
      const response = await api.getGuests()
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const payload = await response.json()
      console.log('API payload:', payload)
      const allGuestsData = Array.isArray(payload?.guests) ? payload.guests : []
      console.log('All guests count:', allGuestsData.length)
      setAllGuests(allGuestsData)
        // Đọc sự kiện người dùng đã chọn ở trang Khách mời (nếu có)
        let selectedEventId: number | null = null
        try {
          const saved = localStorage.getItem('exp_selected_event')
          if (saved && saved !== '""' && saved !== 'null' && saved !== 'undefined') {
            const parsed = Number(saved.replace(/"/g, ''))
            if (!Number.isNaN(parsed)) selectedEventId = parsed
          }
        } catch {}

        const arrived = allGuestsData
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
        
        console.log('Selected event ID:', selectedEventId)
        console.log('Filtered arrived guests count:', arrived.length)
        console.log('Arrived guests:', arrived)
        setCheckedInGuests(arrived)
        
        // Thông báo refresh thành công (chỉ khi được yêu cầu)
        if (showNotification) {
          addNotification(`Đã làm mới danh sách\nTìm thấy ${arrived.length} khách đã check-in`, "success")
        }
    } catch (error) {
      console.error("Error loading guests:", error)
      setCheckedInGuests([])
      addNotification("Lỗi khi làm mới danh sách\nVui lòng thử lại", "error")
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

  // Lắng nghe thay đổi dữ liệu khách mời từ các trang khác
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'exp_guests_updated') {
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
      console.log('=== MANUAL CHECK-IN START ===')
      console.log('QR Code input:', qrCode)
      console.log('QR Code length:', qrCode.length)
      
      const response = await api.checkinGuest({ qr_code: qrCode })
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      const data = await response.json()
      console.log('Response data:', data)

      if (data && data.message === "ok") {
        const checkinTime = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        addNotification(`Check-in thành công!\nChào mừng ${data.guest.name}\n${checkinTime}`, "success")
        setQrCode("")
        loadCheckedInGuests()
      } else {
        if (response.status === 409) {
          const checkinTime = new Date(data.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          addNotification(`${data.guest?.name || "Khách"} đã check-in\nLúc: ${checkinTime}`, "warning")
        } else if (response.status === 410) {
          addNotification("Token đã hết hạn\nVui lòng tạo mã QR mới", "error")
        } else {
          addNotification(`Check-in thất bại\n${data.message || "Lỗi không xác định"}`, "error")
        }
      }
    } catch (error) {
      console.error("Check-in error:", error)
      addNotification("Lỗi kết nối\nVui lòng thử lại", "error")
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
      
      const response = await api.checkinGuest({ qr_code: token })
      const data = await response.json()
      console.log('Check-in data:', data)

      if (data) {
        const checkinTime = new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        addNotification(`Check-in thành công!\nChào mừng ${data.guest.name}\n${checkinTime}`, "success")
        loadCheckedInGuests()
      } else {
        if (response.status === 409) {
          const checkinTime = new Date(data.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
          addNotification(`${data.guest?.name || "Khách"} đã check-in\nLúc: ${checkinTime}`, "warning")
        } else if (response.status === 410) {
          addNotification("Token đã hết hạn\nVui lòng tạo mã QR mới", "error")
        } else {
          addNotification(`Check-in thất bại\n${data.message || "Lỗi không xác định"}`, "error")
        }
      }
    } catch (error) {
      console.error("Check-in error:", error)
      addNotification("Lỗi kết nối\nVui lòng thử lại", "error")
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
      const response = await fetch(`http://192.168.1.135:9009/api/checkin/${guest.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Lưu thông tin để hoàn tác
        const originalGuest = { ...guest }
        
        // Xóa khỏi danh sách hiện tại
        setCheckedInGuests(prev => prev.filter(g => g.id !== guest.id))
        
        // Thêm thông báo với chức năng hoàn tác
        addNotification(
          `Đã xóa ${guest.name}\nKhỏi danh sách check-in`,
          'success',
          () => {
            // Hoàn tác: thêm lại vào danh sách
            setCheckedInGuests(prev => [...prev, originalGuest])
          }
        )
        
        closeEditPopup()
      } else {
        addNotification('Lỗi khi xóa check-in\nVui lòng thử lại', 'error')
      }
    } catch (error) {
      console.error('Error deleting check-in:', error)
      addNotification('Lỗi kết nối khi xóa check-in\nVui lòng thử lại', 'error')
    }
  }

  // Calculate statistics - across all checked-in guests
  const eventCheckedInGuests = checkedInGuests
  
  // Lấy sự kiện đã chọn từ localStorage
  let selectedEventId: number | null = null
  try {
    const saved = localStorage.getItem('exp_selected_event')
    if (saved && saved !== '""' && saved !== 'null' && saved !== 'undefined') {
      const parsed = Number(saved.replace(/"/g, ''))
      if (!Number.isNaN(parsed)) selectedEventId = parsed
    }
  } catch {}
  
  // Tính số khách đã xác nhận nhưng chưa check-in
  const acceptedButNotCheckedIn = allGuests.filter((g: any) => {
    const isAccepted = g?.rsvp_status === 'accepted'
    const isNotCheckedIn = g?.checkin_status !== 'arrived'
    const isForSelectedEvent = selectedEventId ? (g?.event_id === selectedEventId) : true
    const result = isAccepted && isNotCheckedIn && isForSelectedEvent
    
    // Debug log
    if (result) {
      console.log('Found accepted but not checked in guest:', {
        name: g.name,
        rsvp_status: g.rsvp_status,
        checkin_status: g.checkin_status,
        event_id: g.event_id,
        selectedEventId
      })
    }
    
    return result
  }).length
  
  console.log('Debug stats calculation:', {
    allGuestsCount: allGuests.length,
    selectedEventId,
    acceptedButNotCheckedIn,
    allGuests: allGuests.map(g => ({
      name: g.name,
      rsvp_status: g.rsvp_status,
      checkin_status: g.checkin_status,
      event_id: g.event_id
    }))
  })

  // Tính danh sách khách đã xác nhận và đã check-in
  const scannedGuests = allGuests.filter((g: any) => {
    const isAccepted = g?.rsvp_status === 'accepted'
    const isCheckedIn = g?.checkin_status === 'arrived'
    const isForSelectedEvent = selectedEventId ? (g?.event_id === selectedEventId) : true
    return isAccepted && isCheckedIn && isForSelectedEvent
  }).map((g: any) => ({
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

  // Tính danh sách khách đã xác nhận nhưng chưa check-in
  const notScannedGuests = allGuests.filter((g: any) => {
    const isAccepted = g?.rsvp_status === 'accepted'
    const isNotCheckedIn = g?.checkin_status !== 'arrived'
    const isForSelectedEvent = selectedEventId ? (g?.event_id === selectedEventId) : true
    return isAccepted && isNotCheckedIn && isForSelectedEvent
  }).map((g: any) => ({
    id: g.id,
    name: g.name,
    title: g.title,
    position: g.position,
    company: g.company,
    tag: g.tag,
    email: g.email,
    phone: g.phone,
    rsvp_status: g.rsvp_status,
    event_id: g.event_id,
    event_name: g.event_name,
  }))
    
  const stats = {
    total: eventCheckedInGuests.length,
    scanned: eventCheckedInGuests.length,
    notScanned: acceptedButNotCheckedIn
  }

  // Lấy danh sách hiển thị dựa trên card được chọn
  const getDisplayGuests = () => {
    if (selectedCard === 'scanned') return scannedGuests
    if (selectedCard === 'notScanned') return notScannedGuests
    return checkedInGuests // Mặc định hiển thị danh sách đã check-in
  }

  const displayGuests = getDisplayGuests()

  // Filter guests based on search term
  const filteredGuests = displayGuests.filter(guest => {
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
        <div className="fixed top-16 right-0 z-[99999] space-y-2 w-[200px] sm:max-w-xs">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-3 sm:px-4 py-3 sm:py-4 rounded-l-xl sm:rounded-l-2xl shadow-2xl backdrop-blur-md border transition-all duration-500 transform ${
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
              <div className="flex items-start gap-2 sm:gap-3">
                {notification.type === 'success' && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-emerald-500/20 rounded-full flex-none flex items-center justify-center border border-emerald-400/30">
                    <Icons.Success className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />
                  </span>
                )}
                {notification.type === 'error' && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-rose-500/20 rounded-full flex-none flex items-center justify-center border border-rose-400/30">
                    <Icons.Error className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" />
                  </span>
                )}
                {notification.type === 'warning' && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-amber-500/20 rounded-full flex-none flex items-center justify-center border border-amber-400/30">
                    <Icons.Warning className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
                  </span>
                )}
                {notification.type === 'info' && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-cyan-500/20 rounded-full flex-none flex items-center justify-center border border-cyan-400/30">
                    <Icons.Info className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
                  </span>
                )}
                <div className="relative overflow-hidden flex-1 min-w-0">
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-line">
                    {notification.message}
                  </div>
                  {notification.undoAction && (
                    <button
                      onClick={() => {
                        notification.undoAction?.()
                        // Đóng thông báo ngay lập tức
                        setNotifications(prev => prev.filter(notif => notif.id !== notification.id))
                      }}
                      className="mt-2 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors items-center gap-1.5 flex w-fit"
                    >
                      <Icons.Undo className="w-3 h-3" />
                      <span>Hoàn tác</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Portal>
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Check-in</h1>
        <button 
          onClick={handleRefresh}
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
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Total Check-ins Card */}
        <div 
          className={`group relative backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-300 cursor-pointer ${
            selectedCard === 'total' 
              ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-400/60 shadow-lg shadow-blue-500/30' 
              : 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/20'
          }`}
          onClick={() => setSelectedCard(selectedCard === 'total' ? null : 'total')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
              {/* Mobile: Text above, icon+number below */}
              <div className="text-center sm:text-left mb-2 sm:mb-0 sm:hidden">
                <div className="text-xs text-cyan-300/80 font-medium">Tổng</div>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:hidden">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-white">{stats.scanned}</div>
              </div>
              
              {/* Desktop: Icon - Text - Number */}
              <div className="hidden sm:flex sm:items-center sm:justify-between sm:w-full">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-sm text-cyan-300/80 font-medium">Tổng</div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.scanned}</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Đã quét Card */}
        <div 
          className={`group relative backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-300 cursor-pointer ${
            selectedCard === 'scanned' 
              ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/60 shadow-lg shadow-green-500/30' 
              : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-500/20'
          }`}
          onClick={() => setSelectedCard(selectedCard === 'scanned' ? null : 'scanned')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
              {/* Mobile: Text above, icon+number below */}
              <div className="text-center sm:text-left mb-2 sm:mb-0 sm:hidden">
                <div className="text-xs text-green-300/80 font-medium">Đã quét</div>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:hidden">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-white">{stats.scanned}</div>
              </div>
              
              {/* Desktop: Icon - Text - Number */}
              <div className="hidden sm:flex sm:items-center sm:justify-between sm:w-full">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="text-sm text-green-300/80 font-medium">Đã quét</div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.scanned}</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Chưa quét Card */}
        <div 
          className={`group relative backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 transition-all duration-300 cursor-pointer ${
            selectedCard === 'notScanned' 
              ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-400/60 shadow-lg shadow-orange-500/30' 
              : 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:from-orange-500/20 hover:to-red-500/20 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/20'
          }`}
          onClick={() => setSelectedCard(selectedCard === 'notScanned' ? null : 'notScanned')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
              {/* Mobile: Text above, icon+number below */}
              <div className="text-center sm:text-left mb-2 sm:mb-0 sm:hidden">
                <div className="text-xs text-orange-300/80 font-medium">Chưa quét</div>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:hidden">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="text-xl font-bold text-white">{stats.notScanned}</div>
              </div>
              
              {/* Desktop: Icon - Text - Number */}
              <div className="hidden sm:flex sm:items-center sm:justify-between sm:w-full">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="text-sm text-orange-300/80 font-medium">Chưa quét</div>
                </div>
                <div className="text-3xl font-bold text-white">{stats.notScanned}</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full" style={{width: `${stats.scanned + stats.notScanned > 0 ? (stats.notScanned / (stats.scanned + stats.notScanned)) * 100 : 0}%`}}></div>
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
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl hover:from-cyan-500/40 hover:to-blue-500/40 hover:border-cyan-400/50 hover:text-cyan-200 transition-all duration-300 font-semibold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:shadow-cyan-500/30 text-base backdrop-blur-sm transform hover:scale-105"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Bật camera quét QR</span>
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
                className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:from-cyan-500/30 hover:to-indigo-500/30 hover:border-cyan-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm sm:text-base">Xác nhận check-in</span>
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
            <span className="text-sm sm:text-base">
              {selectedCard === 'scanned' ? 'Danh sách đã quét' : 
               selectedCard === 'notScanned' ? 'Danh sách chưa quét' : 
               'Danh sách đã check-in'}
            </span>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
              {filteredGuests.length}
            </span>
          </h2>
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Tìm kiếm khách mời..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="relative mb-6">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white/20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
            </div>
            <h3 className="text-white/80 text-lg sm:text-xl font-medium mb-2">Chưa ai check-in</h3>
            <p className="text-white/60 text-sm sm:text-base mb-4">Quét QR để bắt đầu nhé</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-lg">
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white/60 text-xs">Sử dụng nút "Bật camera quét QR" ở trên</span>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {currentGuests.map((guest, index) => (
                <div key={guest.id} className="bg-black/20 border border-white/10 rounded-2xl p-4 hover:bg-black/30 transition-colors">
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
                    {selectedCard !== 'notScanned' && 'checked_in_at' in guest && (
                      <button
                        onClick={() => openEditPopup(guest as CheckedInGuest)}
                        className="flex-shrink-0 p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">Vai trò:</span>
                      <span className="text-white/80 truncate">{guest.position || '-'}</span>
                      <span className="text-white/40">•</span>
                      <span className="text-white/60">Tổ chức:</span>
                      <span className="text-white/80 truncate">{guest.company || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCard === 'notScanned' ? (
                        <>
                          <span className="text-white/60">Trạng thái:</span>
                          <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                            Chưa check-in
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-white/60">Check-in:</span>
                          <span className="text-white/80">
                            {'checked_in_at' in guest && guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleString('vi-VN', { 
                              timeZone: 'Asia/Ho_Chi_Minh',
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60">Phương thức:</span>
                          <span className="px-2 py-0.5 text-xs bg-white/10 text-white/80 rounded-full border border-white/20">
                            {'checkin_method' in guest ? (guest.checkin_method || '-') : '-'}
                          </span>
                        </>
                      )}
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
                        {selectedCard === 'notScanned' ? (
                          <span className="text-white/40">-</span>
                        ) : (
                          <>
                            <div className="text-sm">
                              {'checked_in_at' in guest && guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
                            </div>
                            <div className="text-xs text-white/60">
                              {'checked_in_at' in guest && guest.checked_in_at ? new Date(guest.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '-'}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {selectedCard === 'notScanned' ? (
                          <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1 w-fit">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Chưa check-in
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full flex items-center gap-1 w-fit">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                            </svg>
                            QR Code
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {selectedCard === 'notScanned' ? (
                          <span className="text-white/40 text-xs">-</span>
                        ) : (
                          'checked_in_at' in guest && (
                            <button
                              onClick={() => openEditPopup(guest as CheckedInGuest)}
                              className="group relative px-3 py-1 text-xs bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 rounded-full transition-all duration-300 flex items-center gap-1 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Chỉnh sửa
                            </button>
                          )
                        )}
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




