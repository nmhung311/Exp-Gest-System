"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import CustomDropdown from "../../../components/CustomDropdown"
import CustomCheckbox from "../../../components/CustomCheckbox"
import Portal from "../../../components/Portal"
import SystemModal from "../../../components/SystemModal"
import CopyLinkModal from "../../../components/CopyLinkModal"
import { api, API_ENDPOINTS } from "@/lib/api"
interface Guest {
  id: number
  name: string
  title?: string
  role?: string
  organization?: string
  tag?: string
  email?: string
  phone?: string
  rsvp_status: string
  checkin_status: string
  created_at: string
  event_id?: number
  event_name?: string
  event_content?: string
}

interface Event {
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
  max_guests: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

interface DuplicateGuest {
  newGuest: Guest
  existingGuest: Guest
  index: number
}

interface DuplicateModalData {
  newGuests: Guest[]
  existingGuests: Guest[]
  importType: 'json' | 'csv'
  jsonData?: any[]
  csvFile?: File
}

export default function GuestsPage(){
  // Import states
  const [text, setText] = useState(`[]`)
  const [result, setResult] = useState<string>("")
  const [importType, setImportType] = useState<"json" | "csv">("json")
  const [isImporting, setIsImporting] = useState(false)
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false)
  const [backgroundProgress, setBackgroundProgress] = useState({ current: 0, total: 0 })
  const [selectedJsonFile, setSelectedJsonFile] = useState<string>("")
  const [selectedCsvFile, setSelectedCsvFile] = useState<string>("")
  const [guests, setGuests] = useState<Guest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "declined">("all")
  const [eventFilter, setEventFilter] = useState<string>("")
  const [tagFilter, setTagFilter] = useState<string>("all")
  const [organizationFilter, setOrganizationFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [copyMessage, setCopyMessage] = useState("")
  const [copyType, setCopyType] = useState<'success' | 'error' | 'warning' | 'info'>('success')
  const [showPopup, setShowPopup] = useState(false)
  const [popupVisible, setPopupVisible] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [showInvitePreview, setShowInvitePreview] = useState(false)
  const [selectedGuestForPreview, setSelectedGuestForPreview] = useState<Guest | null>(null)
  const [inviteLink, setInviteLink] = useState<string>("")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
  } | null>(null)
  const [mobileActionDropdown, setMobileActionDropdown] = useState<number | null>(null)
  
  // Copy link modal states
  const [showCopyLinkModal, setShowCopyLinkModal] = useState(false)
  const [copyLinkData, setCopyLinkData] = useState<{
    inviteLink: string
    qrCodeUrl?: string
    eventName?: string
  } | null>(null)

  // Duplicate handling states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateData, setDuplicateData] = useState<DuplicateModalData | null>(null)
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set())
  
  // Confirmation popup states
  const [showDuplicateConfirmModal, setShowDuplicateConfirmModal] = useState(false)
  const [duplicateConfirmData, setDuplicateConfirmData] = useState<{
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
  } | null>(null)

  // Helper function để hiển thị toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setCopyMessage(message)
    setCopyType(type)
    setShowPopup(true)
    setPopupVisible(true)
    setTimeout(() => {
      setPopupVisible(false)
      setTimeout(() => setShowPopup(false), 300)
    }, 3000)
  }

  // Helper function để hiển thị popup confirmation
  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmData({
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setShowConfirmModal(false)
        setConfirmData(null)
      },
      onCancel: () => {
        if (onCancel) onCancel()
        setShowConfirmModal(false)
        setConfirmData(null)
      }
    })
    setShowConfirmModal(true)
  }

  // Close mobile action dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileActionDropdown !== null) {
        const target = event.target as HTMLElement
        if (!target.closest('.mobile-action-dropdown')) {
          setMobileActionDropdown(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileActionDropdown])

  // Touch handlers for swipe to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isUpSwipe = distance > 50

    if (isUpSwipe) {
      // Haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      setPopupVisible(false)
      setTimeout(() => setShowPopup(false), 300)
    }
  }

  // Haptic feedback helper
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      }
      navigator.vibrate(patterns[type])
    }
  }
  const [showImportModal, setShowImportModal] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [guestForm, setGuestForm] = useState({
    name: "",
    title: "",
    role: "",
    organization: "",
    tag: "",
    email: "",
    phone: "",
    event_id: "",
    checkin_status: "not_arrived",
    rsvp_status: "pending",
    event_content: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const guestsPerPage = 6
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [backupCode, setBackupCode] = useState("")
  
  // Multiple selection states
  const [selectedGuests, setSelectedGuests] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Export states
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel')
  const [showExportPopup, setShowExportPopup] = useState(false)
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('selected')
  // Import functionality enabled

  // Load guests and events on component mount
  useEffect(() => {
    console.log("GuestsPage mounted, loading data...")
    
    // Khôi phục sự kiện đã chọn từ localStorage (nếu có)
    try {
      const saved = localStorage.getItem("exp_selected_event")
      console.log("Saved event from localStorage on mount:", saved)
      if (saved) setEventFilter(saved)
    } catch {}
    loadGuests()
    loadEvents()
  }, [])

  // Set default event filter when events are loaded
  useEffect(() => {
    if (events.length > 0 && (!eventFilter || eventFilter === "")) {
      console.log("Setting default event filter to first event:", events[0].id)
      setEventFilter(events[0].id.toString())
    }
  }, [events]) // Remove eventFilter from dependency to prevent infinite loop

  async function loadGuests() {
    setLoading(true)
    try {
      console.log("=== LOADING GUESTS ===")
      const res = await fetch(API_ENDPOINTS.GUESTS)
      console.log("Load guests response:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("Guests data received:", data)
        console.log("Guests with rsvp_status:", data.guests?.map((g: any) => ({
          id: g.id,
          name: g.name,
          position: g.position,
          company: g.company,
          rsvp_status: g.rsvp_status,
          checkin_status: g.checkin_status
        })))
        setGuests(data.guests || [])
        console.log("Guests state updated with", data.guests?.length || 0, "guests")
      } else {
        console.error("Failed to load guests:", res.status, res.statusText)
      }
    } catch (e) {
      console.error("Error loading guests:", e)
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh guests data immediately (for real-time updates)
  const refreshGuests = useCallback(() => {
    console.log("Manual refresh of guests data...")
    loadGuests()
    // Show a brief notification that data is being refreshed
    const notification = document.createElement('div')
    notification.textContent = 'Đang cập nhật dữ liệu khách mời...'
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    document.body.appendChild(notification)
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 2000)
  }, [])

  const loadEvents = async () => {
    try {
      console.log("Loading events...")
      const res = await api.getEvents()
      console.log("Events response:", res.status, res.statusText)
      if (res.ok) {
        const data = await res.json()
        console.log("Events data received:", data)
        // Sắp xếp sự kiện theo ngày gần nhất (upcoming events first)
        const sortedEvents = data.sort((a: Event, b: Event) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })
        console.log("Sorted events:", sortedEvents)
        setEvents(sortedEvents)
        // Nếu có sự kiện đã lưu và còn tồn tại, giữ nguyên; nếu không, để trống
        try {
          const saved = localStorage.getItem("exp_selected_event")
          console.log("Saved event from localStorage:", saved)
          if (saved && sortedEvents.some((e: Event) => e.id.toString() === saved)) {
            setEventFilter(saved)
            console.log("Set eventFilter to saved value:", saved)
          } else if (sortedEvents.length > 0) {
            // Tự động chọn sự kiện đầu tiên nếu chưa có sự kiện nào được chọn
            setEventFilter(sortedEvents[0].id.toString())
            console.log("Auto-selected first event:", sortedEvents[0].id.toString())
          }
        } catch {}
      } else {
        console.error("Failed to load events:", res.status, res.statusText)
        // Fallback to empty array if API fails
        setEvents([])
      }
    } catch (error) {
      console.error("Error loading events:", error)
      // Fallback to empty array if API fails
      setEvents([])
    }
  }

  async function openQRPopup(guest: Guest) {
    try {
      setSelectedGuest(guest)
      
      console.log('=== OPEN COPY LINK MODAL ===')
      console.log('Guest ID:', guest.id)
      console.log('Guest name:', guest.name)
      
      // Lấy token mới và thông tin thời gian hết hạn
      const tokenResponse = await fetch(`/api/guests/${guest.id}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('Token response status:', tokenResponse.status)
      console.log('Token response ok:', tokenResponse.ok)
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        console.log("Token data received:", tokenData)
        console.log("Token value:", tokenData.token)
        console.log("Token length:", tokenData.token?.length)
        
        const inviteUrl = `${window.location.origin}/invite/${tokenData.token}`
        console.log('Generated invite URL:', inviteUrl)
        
        // Tạo QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`
        
        // Lấy tên sự kiện hiện tại
        const currentEvent = events.find(e => e.id === guest.event_id)
        const eventName = currentEvent?.name || 'Sự kiện'
        
        // Mở popup copy link modal
        setCopyLinkData({
          inviteLink: inviteUrl,
          qrCodeUrl: qrCodeUrl,
          eventName: eventName
        })
        setShowCopyLinkModal(true)
      } else {
        const errorText = await tokenResponse.text()
        console.error("Token creation failed:", errorText)
        showToast("Lỗi tạo QR: " + errorText, "error")
      }
    } catch (e) {
      console.error("Error in openQRPopup:", e)
      showToast("Lỗi kết nối: " + e.message, "error")
    }
  }


  async function downloadQR(guestId: number, guestName: string) {
    try {
      const response = await api.getGuestQRImage(guestId.toString())
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `qr_${guestName}_${guestId}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        showToast("Lỗi tải QR", "error")
        setTimeout(() => {
          setPopupVisible(false)
        }, 3000)
      }
    } catch (e) {
      showToast("Lỗi tải QR", "error")
    }
  }


  // Bulk Actions
  const bulkCheckIn = async () => {
    if (!eventFilter) {
      setResult("Vui lòng chọn sự kiện trước khi thực hiện hành động")
      return
    }
    if (selectedGuests.size === 0) return
    
    try {
      const response = await fetch("/api/guests/bulk-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_ids: Array.from(selectedGuests),
          event_id: parseInt(eventFilter)
        })
      })
      
      if (response.ok) {
        showToast(`Check-in ${selectedGuests.size}!`, "success")
        clearSelection()
        loadGuests()
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`Lỗi: ${error}`)
    }
  }

  const bulkCheckOut = async () => {
    if (!eventFilter) {
      setResult("Vui lòng chọn sự kiện trước khi thực hiện hành động")
      return
    }
    if (selectedGuests.size === 0) return
    
    try {
      const response = await fetch("/api/guests/bulk-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_ids: Array.from(selectedGuests)
        })
      })
      
      if (response.ok) {
        showToast(`Check-out ${selectedGuests.size}!`, "success")
        clearSelection()
        loadGuests()
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`Lỗi: ${error}`)
    }
  }

  const bulkDelete = async () => {
    if (selectedGuests.size === 0) {
      setResult("Vui lòng chọn khách cần xóa")
      return
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedGuests.size} khách đã chọn?`)) {
      return
    }
    
    try {
      console.log("Bulk delete - Selected guests:", Array.from(selectedGuests))
      const response = await api.bulkDeleteGuests({
        guest_ids: Array.from(selectedGuests)
      })
      
      console.log("Bulk delete response status:", response.status)
      const responseData = await response.json()
      console.log("Bulk delete response data:", responseData)
      
      if (response.ok) {
        showToast(`Xóa ${selectedGuests.size}!`, "success")
        clearSelection()
        loadGuests()
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`Lỗi: ${error}`)
    }
  }

  // Bulk RSVP Status Functions
  const bulkUpdateRSVP = async (rsvpStatus: string) => {
    if (!eventFilter) {
      setResult("Vui lòng chọn sự kiện trước khi thực hiện hành động")
      return
    }
    if (selectedGuests.size === 0) return
    
    const statusLabels = {
      'accepted': 'Đã chấp nhận',
      'declined': 'Đã từ chối', 
      'pending': 'Chờ phản hồi'
    }
    
    if (!confirm(`Bạn có chắc chắn muốn cập nhật ${selectedGuests.size} khách thành "${statusLabels[rsvpStatus as keyof typeof statusLabels]}"?`)) {
      return
    }
    
    try {
      const response = await fetch("/api/guests/bulk-rsvp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_ids: Array.from(selectedGuests),
          rsvp_status: rsvpStatus
        })
      })
      
      if (response.ok) {
        showToast(`Cập nhật ${selectedGuests.size} khách thành "${statusLabels[rsvpStatus as keyof typeof statusLabels]}"!`, "success")
        clearSelection()
        loadGuests()
        
        // Thông báo cho trang check-in về thay đổi dữ liệu
        localStorage.setItem('exp_guests_updated', Date.now().toString())
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'exp_guests_updated',
          newValue: Date.now().toString()
        }))
        
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`Lỗi: ${error}`)
    }
  }

  // CRUD Functions
  const openGuestModal = useCallback((guest?: Guest) => {
    console.log("Opening guest modal...")
    console.log("Current eventFilter:", eventFilter)
    console.log("Available events:", events)
    console.log("Is editing guest:", !!guest)
    
    // Validation: Yêu cầu có sự kiện và chọn sự kiện trước khi thêm khách mới
    if (!guest) {
      if (events.length === 0) {
        setResult("Vui lòng tạo sự kiện trước khi thêm khách mời")
        return
      }
      if (!eventFilter || eventFilter === "") {
        setResult("Vui lòng chọn sự kiện trước khi thêm khách mời")
        return
      }
    }
    
    if (guest) {
      console.log("Guest data for editing:", guest)
      console.log("Guest checkin_status:", guest.checkin_status)
      setEditingGuest(guest)
      setGuestForm({
        name: guest.name || "",
        title: guest.title || "",
        role: guest.role || "",
        organization: guest.organization || "",
        tag: guest.tag || "",
        email: guest.email || "",
        phone: guest.phone || "",
        event_id: guest.event_id?.toString() || "",
        checkin_status: guest.checkin_status, // Sử dụng trạng thái thực tế của khách
        rsvp_status: guest.rsvp_status || "pending",
        event_content: guest.event_content || ""
      })
    } else {
      setEditingGuest(null)
      // Chọn sự kiện đầu tiên nếu không có eventFilter
      const defaultEventId = eventFilter || (events.length > 0 ? events[0].id.toString() : "")
      console.log("Default event ID for new guest:", defaultEventId)
      setGuestForm({
        name: "",
        title: "",
        role: "",
        organization: "",
        tag: "",
        email: "",
        phone: "",
        event_id: defaultEventId,
        checkin_status: "not_arrived", // Mặc định chưa đến khi thêm mới
        rsvp_status: "pending", // Mặc định chưa phản hồi khi thêm mới
        event_content: ""
      })
    }
    setShowGuestModal(true)
  }, [eventFilter, events])

  // Function để tiếp tục thêm khách sau khi xử lý trùng lặp
  async function continueAddGuest(guestData: any) {
    try {
      console.log("Continuing to add guest:", guestData)
      
      const response = await api.createGuest(guestData)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log("API response data:", responseData)
        setShowGuestModal(false)
        loadGuests()
        showToast("Thêm khách mời thành công!", "success")
        
        // Thông báo cho trang check-in về thay đổi dữ liệu
        localStorage.setItem('exp_guests_updated', Date.now().toString())
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'exp_guests_updated',
          newValue: Date.now().toString()
        }))
        
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        console.error("API error:", error)
        setResult(`Lỗi: ${error}`)
      }
    } catch (e: any) {
      console.error("Continue add guest error:", e)
      setResult(`Lỗi kết nối: ${e.message}`)
    }
  }

  async function saveGuest() {
    console.log("Saving guest...")
    console.log("Guest form data:", guestForm)
    console.log("Current eventFilter:", eventFilter)
    console.log("Available events:", events)
    
    try {
      // Validation: Kiểm tra có sự kiện không
      if (events.length === 0) {
        setResult("Vui lòng tạo sự kiện trước khi thêm khách mời")
        return
      }
      
      // Đảm bảo luôn gán vào sự kiện được chọn
      let eventId = guestForm.event_id ? parseInt(guestForm.event_id) : (eventFilter ? parseInt(eventFilter) : null)
      console.log("Event ID for guest:", eventId)
      
      // Nếu không có sự kiện nào được chọn, chọn sự kiện đầu tiên
      if (!eventId || isNaN(eventId)) {
        if (events.length > 0) {
          eventId = events[0].id
          setGuestForm(prev => ({ ...prev, event_id: eventId.toString() }))
          console.log("Using first available event:", eventId)
        } else {
          console.error("No events available")
          setResult("Vui lòng tạo sự kiện trước khi thêm khách mời")
          return
        }
      }
      
      const guestData = {
        name: guestForm.name,
        title: guestForm.title,
        role: guestForm.role,
        organization: guestForm.organization,
        tag: guestForm.tag,
        email: guestForm.email,
        phone: guestForm.phone,
        event_id: eventId,
        checkin_status: guestForm.checkin_status,
        rsvp_status: guestForm.rsvp_status,
        event_content: guestForm.event_content
      }
      
      // Xử lý trùng lặp chỉ khi thêm khách mới (không phải edit)
      if (!editingGuest) {
        // Kiểm tra trùng lặp với khách hiện có
        const existingDuplicate = guests.find(existing => 
          isDuplicateGuest(guestData, existing)
        )
        
        if (existingDuplicate) {
          // Hiển thị popup confirmation thay vì browser confirm
          showConfirm(
            "Khách mời trùng lặp",
            `Đã có khách mời "${existingDuplicate.name}" từ "${existingDuplicate.organization || 'N/A'}" trong hệ thống.\n\nBạn có muốn thay thế thông tin khách cũ bằng thông tin mới không?`,
            async () => {
              // Xóa khách cũ trước khi thêm khách mới
              const deleteSuccess = await deleteGuestSilent(existingDuplicate.id)
              if (!deleteSuccess) {
                setResult("Lỗi khi xóa khách mời trùng lặp. Vui lòng thử lại.")
                return
              }
              // Reload danh sách khách sau khi xóa
              await loadGuests()
              // Tiếp tục thêm khách mới
              await continueAddGuest(guestData)
            },
            () => {
              setResult("Đã hủy thêm khách mời do trùng lặp.")
            }
          )
          return
        }
      }
      
      console.log("Sending guest data:", guestData)
      console.log("RSVP status being sent:", guestData.rsvp_status)
      
      // Sử dụng API utility thay vì hardcoded URL
      const response = editingGuest 
        ? await api.updateGuest(editingGuest.id.toString(), guestData)
        : await api.createGuest(guestData)
      
      console.log("API response status:", response.status)
      console.log("API response ok:", response.ok)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log("API response data:", responseData)
        setShowGuestModal(false)
        loadGuests()
        
        // Thông báo khác nhau tùy theo trường hợp
        if (editingGuest) {
          showToast("Cập nhật thành công!", "success")
        } else {
          showToast("Thêm khách mời thành công!", "success")
        }
        
        // Thông báo cho trang check-in về thay đổi dữ liệu
        localStorage.setItem('exp_guests_updated', Date.now().toString())
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'exp_guests_updated',
          newValue: Date.now().toString()
        }))
        
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        console.error("API error:", error)
        setResult(`Lỗi: ${error}`)
      }
    } catch (e: any) {
      console.error("Save guest error:", e)
      setResult(`Lỗi kết nối: ${e.message}`)
    }
  }

  // Helper function để xóa guest mà không cần confirmation dialog
  async function deleteGuestSilent(guestId: number): Promise<boolean> {
    try {
      console.log("🚀 Starting silent delete request for guest ID:", guestId)
      const response = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log("📊 Delete response status:", response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log("✅ Delete result:", result)
        return true
      } else {
        console.error("❌ Delete failed with status:", response.status)
        const errorText = await response.text()
        console.error("❌ Delete error response:", errorText)
        return false
      }
    } catch (error) {
      console.error("❌ Delete error:", error)
      return false
    }
  }

  async function deleteGuest(guestId: number, guestName: string) {
    console.log("📋 deleteGuest called with:", { guestId, guestName })
    
    const confirmed = confirm(`Bạn có chắc chắn muốn xóa khách mời "${guestName}"?`)
    console.log("🤔 User confirmed:", confirmed)
    
    if (!confirmed) {
      console.log("❌ User cancelled deletion")
      return
    }
    
    try {
      console.log("🚀 Starting delete request for guest ID:", guestId)
      console.log("🌐 API URL:", `/api/guests/${guestId}`)
      const response = await fetch(`/api/guests/${guestId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log("📊 Delete response status:", response.status)
      console.log("📊 Delete response headers:", Object.fromEntries(response.headers.entries()))
      
      if (response.status >= 200 && response.status < 300) {
        let result
        try {
          result = await response.json()
          console.log("✅ Delete result:", result)
        } catch (parseError) {
          console.error("❌ Failed to parse response as JSON:", parseError)
          result = { message: "Failed to parse response" }
        }
        
        await loadGuests()
        showToast("Xóa khách mời thành công!", "success")
        
        // Thông báo cho trang check-in về thay đổi dữ liệu
        localStorage.setItem('exp_guests_updated', Date.now().toString())
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'exp_guests_updated',
          newValue: Date.now().toString()
        }))
        
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        let errorText
        try {
          errorText = await response.text()
          console.error("❌ Delete error:", { status: response.status, errorText })
        } catch (textError) {
          console.error("❌ Failed to read error text:", textError)
          errorText = "Unknown error"
        }
        showToast(`Lỗi khi xóa khách mời: ${response.status} - ${errorText}`, "error")
      }
    } catch (e: any) {
      console.error("💥 Error deleting guest:", e)
      showToast("Lỗi kết nối khi xóa khách mời", "error")
    }
  }

  async function copyInviteLinkOld(guestId: number, guestName: string) {
    try {
      // Tạo token mới cho khách mời
      const response = await fetch(`/api/guests/${guestId}/qr`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const inviteLink = `${window.location.origin}/invite/${data.token}`
        
        // Copy vào clipboard
        await navigator.clipboard.writeText(inviteLink)
        triggerHaptic('light')
        showToast(`Copy ${guestName}!`, "success")
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      } else {
        showToast("Lỗi link", "error")
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
          }, 300)
        }, 2000)
      }
    } catch (e) {
      showToast("Lỗi copy", "error")
      setTimeout(() => {
        setPopupVisible(false)
        setTimeout(() => {
          setShowPopup(false)
        }, 300)
      }, 2000)
    }
  }

  // Function để mở modal preview thiệp mời
  async function openInvitePreview(guest: Guest) {
    setSelectedGuestForPreview(guest)
    setShowInvitePreview(true)
    
    // Tạo link thiệp mời
    try {
      const response = await fetch(`/api/guests/${guest.id}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const link = `${window.location.origin}/invite/${data.token}`
        setInviteLink(link)
      } else {
        setInviteLink("")
      }
    } catch (error) {
      console.error('Error generating invite link:', error)
      setInviteLink("")
    }
  }

  // Function để đóng modal preview thiệp mời
  function closeInvitePreview() {
    setShowInvitePreview(false)
    setSelectedGuestForPreview(null)
    setInviteLink("")
  }

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'RSVP_UPDATE') {
        // Refresh guests data when RSVP is updated
        loadGuests()
        showToast("RSVP đã được cập nhật!", "success")
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [loadGuests])

  // Function để copy link thiệp mời từ modal
  async function copyInviteLinkFromModal() {
    if (!inviteLink) {
      showToast("Chưa có link thiệp mời", "error")
      return
    }

    try {
      await navigator.clipboard.writeText(inviteLink)
      triggerHaptic('light')
      showToast("Đã copy link thiệp mời!", "success")
    } catch (error) {
      console.error('Error copying invite link:', error)
      triggerHaptic('heavy')
      showToast("Lỗi khi copy link", "error")
    }
  }

  // Function để mở popup copy link thiệp mời trực tiếp
  async function copyInviteLinkDirect(guest: Guest) {
    try {
      console.log('=== OPEN COPY LINK MODAL DIRECT ===')
      console.log('Guest ID:', guest.id)
      console.log('Guest name:', guest.name)
      
      // Tạo token mới cho khách mời qua Next.js API route
      const response = await fetch(`/api/guests/${guest.id}/qr`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const inviteUrl = `${window.location.origin}/invite/${data.token}`
        
        console.log('Generated invite URL:', inviteUrl)
        
        // Tạo QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`
        
        // Lấy tên sự kiện hiện tại
        const currentEvent = events.find(e => e.id === guest.event_id)
        const eventName = currentEvent?.name || 'Sự kiện'
        
        // Mở popup copy link modal thay vì copy trực tiếp
        setCopyLinkData({
          inviteLink: inviteUrl,
          qrCodeUrl: qrCodeUrl,
          eventName: eventName
        })
        setShowCopyLinkModal(true)
      } else {
        const errorData = await response.json()
        console.error("Token creation failed:", errorData)
        showToast("Lỗi tạo link thiệp mời", "error")
      }
    } catch (e) {
      console.error("Error in copyInviteLinkDirect:", e)
      showToast("Lỗi tạo link thiệp mời", "error")
    }
  }

  // Function để mở popup copy link thiệp mời
  async function copyInviteLink() {
    try {
      console.log('=== OPEN COPY LINK MODAL ===')
      console.log('backupCode:', backupCode)
      
      if (!backupCode) {
        console.log('No backupCode available')
        showToast("Chưa có token để copy", "error")
        return
      }
      
      const inviteUrl = `${window.location.origin}/invite/${backupCode}`
      console.log('Generated invite URL:', inviteUrl)
      
      // Tạo QR code URL (có thể sử dụng service như qr-server.com)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`
      
      // Lấy tên sự kiện hiện tại
      const currentEvent = events.find(e => e.id === parseInt(eventFilter))
      const eventName = currentEvent?.name || 'Sự kiện'
      
      // Mở popup copy link modal
      setCopyLinkData({
        inviteLink: inviteUrl,
        qrCodeUrl: qrCodeUrl,
        eventName: eventName
      })
      setShowCopyLinkModal(true)
      
    } catch (error) {
      console.error('Error opening copy link modal:', error)
      showToast("Lỗi khi mở popup copy link", "error")
    }
  }

  // Function để so sánh khách mời dựa trên tên và tag
  function isDuplicateGuest(guest1: any, guest2: any): boolean {
    const name1 = (guest1.name || '').toLowerCase().trim()
    const name2 = (guest2.name || '').toLowerCase().trim()
    const tag1 = (guest1.tag || '').toLowerCase().trim()
    const tag2 = (guest2.tag || '').toLowerCase().trim()
    
    return name1 === name2 && tag1 === tag2
  }

  // Function để tìm khách trùng lặp cho import (chỉ trong cùng sự kiện)
  function findDuplicateGuestsForImport(newGuests: Guest[], eventId: number): {
    duplicates: { newGuest: Guest, existingGuest: Guest, index: number }[]
    nonDuplicates: Guest[]
  } {
    // Lấy danh sách khách hiện có trong sự kiện được chọn
    const existingGuestsInEvent = guests.filter(guest => guest.event_id === eventId)
    
    const duplicates: { newGuest: Guest, existingGuest: Guest, index: number }[] = []
    const nonDuplicates: Guest[] = []
    
    newGuests.forEach((newGuest, index) => {
      const existingGuest = existingGuestsInEvent.find(existing => 
        isDuplicateGuest(newGuest, existing)
      )
      
      if (existingGuest) {
        duplicates.push({ newGuest, existingGuest, index })
      } else {
        nonDuplicates.push(newGuest)
      }
    })
    
    return { duplicates, nonDuplicates }
  }

  // Function để load các trang còn lại trong background
  async function loadRemainingPagesInBackground(eventId: number, totalPages: number) {
    try {
      setIsBackgroundLoading(true)
      setBackgroundProgress({ current: 0, total: totalPages - 1 })
      
      const pagesToLoad = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
      
      for (let i = 0; i < pagesToLoad.length; i++) {
        const page = pagesToLoad[i]
        
        try {
          const response = await fetch(`/api/guests?page=${page}&itemsPerPage=6&eventFilter=${eventId}`)
          if (response.ok) {
            const pageData = await response.json()
            // Cập nhật state với dữ liệu mới
            setGuests(prev => [...prev, ...pageData.guests])
          }
          
          // Cập nhật progress
          setBackgroundProgress({ current: i + 1, total: pagesToLoad.length })
          
          // Delay nhỏ để không overload server
          await new Promise(resolve => setTimeout(resolve, 200))
        } catch (error) {
          console.error(`Error loading page ${page}:`, error)
          // Tiếp tục load trang tiếp theo
          continue
        }
      }
    } catch (error) {
      console.error('Error in background loading:', error)
    } finally {
      setIsBackgroundLoading(false)
      setBackgroundProgress({ current: 0, total: 0 })
    }
  }

  // Function để xử lý import với logic mới - OPTIMIZED VERSION
  async function processImportWithDuplicates(
    newGuests: Guest[], 
    eventId: number, 
    selectedDuplicates: Set<number>,
    duplicateData: DuplicateModalData,
    actionType: 'keep' | 'merge' | 'merge_and_import' = 'keep'
  ) {
    try {
      setIsImporting(true)
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Tối ưu hóa: Load trang đầu tiên ngay lập tức
      if (actionType === 'merge_and_import') {
        // Bước 1: Load trang đầu tiên để hiển thị ngay
        try {
          const firstPageResponse = await fetch(`/api/guests?page=1&itemsPerPage=6&eventFilter=${eventId}`)
          if (firstPageResponse.ok) {
            const firstPageData = await firstPageResponse.json()
            setGuests(firstPageData.guests)
            // Tắt popup import ngay sau khi load xong trang đầu
            setShowDuplicateModal(false)
            setShowDuplicateConfirmModal(false)
            
            // Bước 2: Chạy ngầm để load các trang còn lại
            if (firstPageData.totalPages > 1) {
              loadRemainingPagesInBackground(eventId, firstPageData.totalPages)
            }
          }
        } catch (error) {
          console.error('Error loading first page:', error)
        }
      }

      // 0. Kiểm tra giới hạn khách trước khi xử lý
      const currentEvent = events.find(e => e.id === eventId)
      const currentGuestCount = guests.filter(g => g.event_id === eventId).length
      
      // Tính số khách sẽ được thêm vào (không phải merge)
      let guestsToAdd = 0
      
      if (actionType === 'keep') {
        // "Giữ lại": Chỉ thêm những khách được chọn
        guestsToAdd = selectedDuplicates.size
      } else if (actionType === 'merge') {
        // "Hợp nhất": Không thêm khách mới, chỉ merge
        guestsToAdd = 0
      } else if (actionType === 'merge_and_import') {
        // "Hợp nhất": Merge những khách được chọn + thêm những khách không được chọn
        guestsToAdd = newGuests.length - selectedDuplicates.size
      }
      
      // Thêm số khách không trùng lặp
      const { duplicates, nonDuplicates } = findDuplicateGuestsForImport(newGuests, eventId)
      guestsToAdd += nonDuplicates.length
      
      const totalAfterImport = currentGuestCount + guestsToAdd
      
      if (currentEvent && totalAfterImport > currentEvent.max_guests) {
        const remainingSlots = currentEvent.max_guests - currentGuestCount
        setResult(`Không thể import: Sự kiện chỉ còn ${remainingSlots} chỗ trống nhưng bạn đang cố thêm ${guestsToAdd} khách. Tổng sẽ là ${totalAfterImport} khách, vượt quá giới hạn ${currentEvent.max_guests} khách.`)
        setIsImporting(false)
        return
      }

      // 1. Xử lý khách không trùng lặp - import bình thường
      
      for (const guest of nonDuplicates) {
        try {
          const guestData = {
            ...guest,
            position: guest.role,
            company: guest.organization,
            event_id: eventId,
            checkin_status: 'not_arrived',
            rsvp_status: 'pending'
          }
          
          const response = await api.createGuest(guestData)
          if (response.ok) {
            successCount++
          } else {
            errorCount++
            errors.push(`Lỗi import khách ${guest.name}: ${await response.text()}`)
          }
        } catch (error) {
          errorCount++
          errors.push(`Lỗi import khách ${guest.name}: ${error}`)
        }
      }

      // 2. Xử lý khách trùng lặp
      // Logic mới: Phân biệt 3 loại hành động
      // - "keep": Import những khách được chọn vào danh sách (tạo khách mới)
      // - "merge": Hợp nhất những khách được chọn (cập nhật khách hiện có)
      // - "merge_and_import": Hợp nhất những khách được chọn + Import những khách còn lại
      
      for (const duplicate of duplicates) {
        if (selectedDuplicates.has(duplicate.index)) {
          if (actionType === 'keep') {
            // Logic "Giữ lại": Import vào danh sách (tạo khách mới)
            try {
              const guestData = {
                ...duplicate.newGuest,
                position: duplicate.newGuest.role,
                company: duplicate.newGuest.organization,
                event_id: eventId,
                checkin_status: 'not_arrived',
                rsvp_status: 'pending'
              }
              
              const response = await api.createGuest(guestData)
              if (response.ok) {
                successCount++
              } else {
                errorCount++
                errors.push(`Lỗi import khách ${duplicate.newGuest.name}: ${await response.text()}`)
              }
            } catch (error) {
              errorCount++
              errors.push(`Lỗi import khách ${duplicate.newGuest.name}: ${error}`)
            }
          } else if (actionType === 'merge' || actionType === 'merge_and_import') {
            // Logic "Hợp nhất": Cập nhật khách hiện có
            try {
              const updatedGuestData = {
                ...duplicate.newGuest,
                position: duplicate.newGuest.role,
                company: duplicate.newGuest.organization,
                id: duplicate.existingGuest.id, // Giữ ID của khách hiện có
                event_id: eventId,
                checkin_status: duplicate.existingGuest.checkin_status, // Giữ trạng thái check-in
                rsvp_status: duplicate.existingGuest.rsvp_status // Giữ trạng thái RSVP
              }
              
              const response = await api.updateGuest(duplicate.existingGuest.id.toString(), updatedGuestData)
              if (response.ok) {
                successCount++
              } else {
                errorCount++
                errors.push(`Lỗi cập nhật khách ${duplicate.newGuest.name}: ${await response.text()}`)
              }
            } catch (error) {
              errorCount++
              errors.push(`Lỗi cập nhật khách ${duplicate.newGuest.name}: ${error}`)
            }
          }
        } else {
          // Khách không được chọn
          if (actionType === 'merge_and_import') {
            // Logic "Hợp nhất": Import những khách không được chọn vào danh sách
            try {
              const guestData = {
                ...duplicate.newGuest,
                event_id: eventId,
                checkin_status: 'not_arrived',
                rsvp_status: 'pending'
              }
              
              const response = await api.createGuest(guestData)
              if (response.ok) {
                successCount++
              } else {
                errorCount++
                errors.push(`Lỗi import khách ${duplicate.newGuest.name}: ${await response.text()}`)
              }
            } catch (error) {
              errorCount++
              errors.push(`Lỗi import khách ${duplicate.newGuest.name}: ${error}`)
            }
          }
          // Các actionType khác: bỏ qua khách không được chọn
        }
      }

      // 3. Hiển thị kết quả
      if (errorCount === 0) {
        setResult(`Import thành công! Đã xử lý ${successCount} khách mời.`)
        showToast(`Import thành công ${successCount} khách mời!`, 'success')
      } else {
        setResult(`Import một phần: ${successCount} thành công, ${errorCount} thất bại.\n\nLỗi chi tiết:\n${errors.join('\n')}`)
        showToast(`Import một phần: ${successCount} thành công, ${errorCount} thất bại`, 'warning')
      }

      // 4. Reload danh sách khách
      await loadGuests()

    } catch (error) {
      console.error('Import error:', error)
      setResult(`Lỗi import: ${error}`)
      showToast('Lỗi import dữ liệu', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  // Function để xử lý khách mời trùng lặp (xóa khách cũ, thay thế bằng khách mới)
  // Removed deduplicateGuests function - import functionality disabled

  // Function để tìm và xóa khách mời trùng lặp trong danh sách hiện có (chỉ trong sự kiện đã chọn)
  // Removed findDuplicatesInExistingGuests function - import functionality disabled

  // Removed deleteDuplicateGuests function - import functionality disabled

  // Handle JSON file upload
  function handleJsonFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedJsonFile("")
      return
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setResult("Vui lòng chọn file JSON")
      setSelectedJsonFile("")
      return
    }

    setSelectedJsonFile(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // Validate JSON
        JSON.parse(content)
        setText(content)
        setResult("File JSON đã được tải thành công!")
      } catch (error) {
        setResult("File JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.")
        setSelectedJsonFile("")
      }
    }
    reader.readAsText(file)
  }

  // Handle CSV file upload
  function handleCsvFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedCsvFile("")
      return
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setResult("Vui lòng chọn file CSV")
      setSelectedCsvFile("")
      return
    }

    setSelectedCsvFile(file.name)
    setResult("File CSV đã được chọn!")
  }

  // Reset import modal state
  function resetImportModal() {
    setSelectedJsonFile("")
    setSelectedCsvFile("")
    setText("[]")
    setResult("")
    setIsImporting(false)
  }

  // Enhanced import function with duplicate handling
  async function onImport() {
    if (isImporting) return
    
    setIsImporting(true)
    setResult("Đang import...")
    
    try {
      if (!eventFilter) {
        setResult("Vui lòng chọn sự kiện trước khi import")
        return
      }

      let newGuests: Guest[] = []
      let csvFile: File | undefined

      if (importType === "json") {
        // Parse JSON first to validate
        let jsonData
        try {
          jsonData = JSON.parse(text)
        } catch (e) {
          setResult("JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.")
          return
        }
        
        // Convert JSON data to Guest format
        newGuests = jsonData.map((guest: any) => ({
          id: guest.id || 0, // Temporary ID, will be assigned by backend
          name: guest.name || '',
          title: guest.title || '',
          role: guest.role || '',
          organization: guest.organization || '',
          tag: guest.tag || '',
          email: guest.email || '',
          phone: guest.phone || '',
          event_id: parseInt(eventFilter),
          checkin_status: 'not_arrived',
          rsvp_status: 'pending',
          created_at: guest.created_at || new Date().toISOString()
        }))
        
      } else {
        // CSV import - parse CSV first to get guest data
        const fileInput = document.getElementById('csvFile') as HTMLInputElement
        if (!fileInput?.files?.[0] || !selectedCsvFile) {
          setResult("Vui lòng chọn file CSV")
          return
        }
        
        csvFile = fileInput.files[0]
        
        // Parse CSV content to get guest data
        const csvContent = await csvFile.text()
        const lines = csvContent.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setResult("File CSV không hợp lệ hoặc trống")
          return
        }
        
        const headers = lines[0].split(',').map(h => h.trim())
        const csvData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const guest: any = {}
          headers.forEach((header, index) => {
            guest[header] = values[index] || ''
          })
          return guest
        })
        
        // Convert CSV data to Guest format
        newGuests = csvData.map((guest: any) => ({
          id: 0, // Temporary ID, will be assigned by backend
          name: guest.name || '',
          title: guest.title || '',
          role: guest.role || '',
          organization: guest.organization || '',
          tag: guest.tag || '',
          email: guest.email || '',
          phone: guest.phone || '',
          event_id: parseInt(eventFilter),
          checkin_status: 'not_arrived',
          rsvp_status: 'pending',
          created_at: new Date().toISOString()
        }))
      }

      // Check if import would exceed max guests limit
      const currentEvent = events.find(e => e.id === parseInt(eventFilter))
      const currentGuestCount = guests.filter(g => g.event_id === parseInt(eventFilter)).length
      const totalAfterImport = currentGuestCount + newGuests.length
      
      if (currentEvent && totalAfterImport > currentEvent.max_guests) {
        const remainingSlots = currentEvent.max_guests - currentGuestCount
        setResult(`Không thể import: Sự kiện chỉ còn ${remainingSlots} chỗ trống nhưng bạn đang cố import ${newGuests.length} khách. Tổng sẽ là ${totalAfterImport} khách, vượt quá giới hạn ${currentEvent.max_guests} khách.`)
        setIsImporting(false)
        return
      }

      // Check for duplicates
      const { duplicates, nonDuplicates } = findDuplicateGuestsForImport(newGuests, parseInt(eventFilter))
      
      if (duplicates.length > 0) {
        // Show duplicate modal and close import modal
        setDuplicateData({
          newGuests: duplicates.map(d => d.newGuest),
          existingGuests: duplicates.map(d => d.existingGuest),
          importType,
          jsonData: importType === 'json' ? JSON.parse(text) : undefined,
          csvFile
        })
        setShowDuplicateModal(true)
        setShowImportModal(false) // Close import modal to avoid conflicts
        setResult(`Phát hiện ${duplicates.length} khách mời trùng lặp. Vui lòng chọn cách xử lý.`)
        setIsImporting(false) // Reset importing state
        return
      }

      // No duplicates, proceed with normal import
      if (importType === "json") {
        // Send guests directly without mapping
        const res = await fetch("/api/guests/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newGuests)
        })
        
        if (!res.ok) {
          const errorText = await res.text()
          setResult(`Lỗi server: ${res.status} - ${errorText}`)
          return
        }
        
        const data = await res.json()
        console.log("Import response:", data)
        
        if (data.imported > 0 && data.failed === 0) {
          setResult(`Thành công! Đã import ${data.imported} khách mời.`)
          showToast(`Import thành công ${data.imported} khách mời!`, 'success')
        } else if (data.imported > 0 && data.failed > 0) {
          setResult(`Import một phần: ${data.imported} thành công, ${data.failed} thất bại.`)
          if (data.errors && data.errors.length > 0) {
            setResult(prev => prev + `\n\nLỗi chi tiết:\n${data.errors.join('\n')}`)
          }
          showToast(`Import một phần: ${data.imported} thành công, ${data.failed} thất bại`, 'warning')
        } else {
          setResult(`Import thất bại: ${data.failed} khách không thể import.`)
          if (data.errors && data.errors.length > 0) {
            setResult(prev => prev + `\n\nLỗi chi tiết:\n${data.errors.join('\n')}`)
          }
          showToast('Import thất bại', 'error')
        }
        
      } else {
        // CSV import without duplicates
        const formData = new FormData()
        formData.append('file', csvFile!)
        formData.append('event_id', eventFilter)
        
        const res = await fetch("/api/guests/import-csv", {
          method: "POST",
          body: formData
        })
        
        if (!res.ok) {
          const errorText = await res.text()
          setResult(`Lỗi server: ${res.status} - ${errorText}`)
          return
        }
        
        const data = await res.json()
        console.log("Import response:", data)
        
        if (data.imported > 0 && data.failed === 0) {
          setResult(`Thành công! Đã import ${data.imported} khách mời.`)
          showToast(`Import thành công ${data.imported} khách mời!`, 'success')
        } else if (data.imported > 0 && data.failed > 0) {
          setResult(`Import một phần: ${data.imported} thành công, ${data.failed} thất bại.`)
          if (data.errors && data.errors.length > 0) {
            setResult(prev => prev + `\n\nLỗi chi tiết:\n${data.errors.join('\n')}`)
          }
          showToast(`Import một phần: ${data.imported} thành công, ${data.failed} thất bại`, 'warning')
        } else {
          setResult(`Import thất bại: ${data.failed} khách không thể import.`)
          if (data.errors && data.errors.length > 0) {
            setResult(prev => prev + `\n\nLỗi chi tiết:\n${data.errors.join('\n')}`)
          }
          showToast('Import thất bại', 'error')
        }
      }
      
      // Reload guests after import
      await loadGuests()
      
      // Close modal after successful import
      if (result.includes('Thành công')) {
        setTimeout(() => {
          setShowImportModal(false)
        }, 2000)
      }
      
    } catch (e: any) {
      console.error("Import error:", e)
      setResult("Lỗi kết nối: " + e?.message)
      showToast('Lỗi import dữ liệu', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  // Filter and search guests
  const filteredGuests = useMemo(() => {
    console.log("=== FILTERING GUESTS ===")
    console.log("Total guests:", guests.length)
    console.log("Event filter:", eventFilter)
    console.log("Status filter:", statusFilter)
    
    const filtered = guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || guest.rsvp_status === statusFilter
      const matchesTag = tagFilter === "all" || guest.tag === tagFilter
      const matchesOrganization = organizationFilter === "all" || guest.organization === organizationFilter
      const matchesRole = roleFilter === "all" || guest.role === roleFilter
      // Hiển thị khách của sự kiện được chọn, hoặc tất cả khách nếu không chọn sự kiện
      const matchesEvent = !eventFilter || eventFilter === "" || guest.event_id?.toString() === eventFilter
      
      console.log(`Guest ${guest.id} (${guest.name}):`, {
        event_id: guest.event_id,
        rsvp_status: guest.rsvp_status,
        matchesEvent,
        matchesStatus,
        matchesSearch,
        matchesTag,
        matchesOrganization,
        matchesRole
      })
      
      return matchesSearch && matchesStatus && matchesTag && matchesOrganization && matchesRole && matchesEvent
    })
    
    console.log("Filtered guests:", filtered.length)
    return filtered
  }, [guests, searchTerm, statusFilter, tagFilter, organizationFilter, roleFilter, eventFilter])

  // Memoized form update functions
  const updateGuestForm = useCallback((field: string, value: string) => {
    setGuestForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Memoized dropdown options
  const titleOptions = useMemo(() => [
    { value: "", label: "Chọn danh xưng" },
    { value: "Mr", label: "Mr" },
    { value: "Ms", label: "Ms" },
    { value: "Mrs", label: "Mrs" },
    { value: "Dr", label: "Dr" },
    { value: "Prof", label: "Prof" }
  ], [])

  const tagOptions = useMemo(() => [
    { value: "", label: "Chọn tag" },
    { value: "VIP", label: "VIP" },
    { value: "Regular", label: "Regular" },
    { value: "Speaker", label: "Speaker" },
    { value: "Sponsor", label: "Sponsor" },
    { value: "Media", label: "Media" }
  ], [])

  const checkinStatusOptions = useMemo(() => [
    { value: "not_arrived", label: "Chưa đến" },
    { value: "arrived", label: "Đã đến" }
  ], [])

  const rsvpStatusOptions = useMemo(() => [
    { value: "pending", label: "Chưa phản hồi" },
    { value: "accepted", label: "Đã chấp nhận" },
    { value: "declined", label: "Đã từ chối" }
  ], [])

  // Filter options from guest data
  const tagFilterOptions = useMemo(() => {
    const uniqueTags = [...new Set(guests.map(guest => guest.tag).filter(Boolean))]
    return [
      { value: "all", label: "Tất cả tag" },
      ...uniqueTags.map(tag => ({ value: tag, label: tag }))
    ]
  }, [guests])

  const organizationFilterOptions = useMemo(() => {
    const uniqueOrgs = [...new Set(guests.map(guest => guest.organization).filter(Boolean))]
    return [
      { value: "all", label: "Tất cả tổ chức" },
      ...uniqueOrgs.map(org => ({ value: org, label: org }))
    ]
  }, [guests])

  const roleFilterOptions = useMemo(() => {
    const uniqueRoles = [...new Set(guests.map(guest => guest.role).filter(Boolean))]
    return [
      { value: "all", label: "Tất cả vai trò" },
      ...uniqueRoles.map(role => ({ value: role, label: role }))
    ]
  }, [guests])

  // Pagination logic
  const totalPages = Math.ceil(filteredGuests.length / guestsPerPage)
  const startIndex = (currentPage - 1) * guestsPerPage
  const endIndex = startIndex + guestsPerPage
  const currentGuests = filteredGuests.slice(startIndex, endIndex)

  // Multiple Selection Functions
  const toggleGuestSelection = (guestId: number) => {
    setSelectedGuests(prev => {
      const newSet = new Set(prev)
      if (newSet.has(guestId)) {
        newSet.delete(guestId)
      } else {
        newSet.add(guestId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedGuests(new Set())
      setSelectAll(false)
    } else {
      const allGuestIds = new Set(filteredGuests.map(guest => guest.id))
      setSelectedGuests(allGuestIds)
      setSelectAll(true)
    }
  }

  const clearSelection = () => {
    setSelectedGuests(new Set())
    setSelectAll(false)
  }

  // Scroll to top of guest list on mobile when changing pages
  const scrollToGuestList = () => {
    // Only scroll on mobile (screen width < 640px)
    if (window.innerWidth < 640) {
      const guestListElement = document.querySelector('[data-guest-list]')
      if (guestListElement) {
        guestListElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }
  }

  // Export Functions
  const exportSelectedGuests = () => {
    if (selectedGuests.size === 0) return
    setExportScope('selected')
    setShowExportPopup(true)
  }

  const handleExportConfirm = async () => {
    let listToExport: Guest[] = []
    let filename = ''
    const today = new Date().toISOString().split('T')[0]
    
    if (exportScope === 'selected') {
      listToExport = filteredGuests.filter(guest => selectedGuests.has(guest.id))
    } else {
      listToExport = filteredGuests
    }
    
    // Lấy tên sự kiện
    const selectedEvent = events.find(e => e.id.toString() === eventFilter)
    const eventName = selectedEvent ? selectedEvent.name : 'Tat_ca_su_kien'
    
    // Tạo tên file: Tên sự kiện + ngày (không thêm gì khác)
    filename = `${eventName}_${today}`
    
    // Làm sạch tên file nhưng giữ lại ký tự tiếng Việt
    filename = filename
      .replace(/[<>:"/\\|?*]/g, '_') // Loại bỏ ký tự không hợp lệ cho tên file
      .replace(/\s+/g, '_') // Thay thế khoảng trắng bằng dấu gạch dưới
      .replace(/_+/g, '_') // Loại bỏ dấu gạch dưới liên tiếp
      .replace(/^_|_$/g, '') // Loại bỏ dấu gạch dưới ở đầu và cuối
    
    console.log('Export filename:', filename)
    await exportGuests(listToExport, filename)
    setShowExportPopup(false)
  }

  const exportAllGuests = async () => {
    setExportScope('all')
    setShowExportPopup(true)
  }

  const exportGuests = async (guestsToExport: Guest[], filename: string) => {
    try {
      if (exportFormat === 'excel') {
        await exportToExcel(guestsToExport, filename)
      } else {
        await exportToCSV(guestsToExport, filename)
      }
      
      showToast(`Xuất ${guestsToExport.length}!`, "success")
      setTimeout(() => {
        setPopupVisible(false)
        setTimeout(() => {
          setShowPopup(false)
        }, 300)
      }, 2000)
    } catch (error) {
      setResult(`Lỗi xuất file: ${error}`)
    }
  }

  const exportToExcel = async (guests: Guest[], filename: string) => {
    // Tạo dữ liệu Excel
    const headers = [
      'STT', 'Danh xưng', 'Họ và tên', 'Vai trò', 'Tổ chức', 'Tag', 
      'Email', 'Số điện thoại', 'Trạng thái RSVP', 'Trạng thái Check-in', 'Sự kiện', 'Ngày tạo'
    ]
    
    const data = guests.map((guest, index) => [
      index + 1,
      guest.title || '',
      guest.name,
      guest.role || '',
      guest.organization || '',
      guest.tag || '',
      guest.email || '',
      guest.phone || '',
      guest.rsvp_status || '',
      guest.checkin_status || '',
      guest.event_name || '',
      guest.created_at ? new Date(guest.created_at).toLocaleDateString('vi-VN') : ''
    ])
    
    // Tạo file Excel
    const workbook = {
      SheetNames: ['Danh sách khách mời'],
      Sheets: {
        'Danh sách khách mời': {
          '!ref': `A1:L${data.length + 1}`,
          A1: { v: 'STT' },
          B1: { v: 'Danh xưng' },
          C1: { v: 'Họ và tên' },
          D1: { v: 'Vai trò' },
          E1: { v: 'Tổ chức' },
          F1: { v: 'Tag' },
          G1: { v: 'Email' },
          H1: { v: 'Số điện thoại' },
          I1: { v: 'Trạng thái RSVP' },
          J1: { v: 'Trạng thái Check-in' },
          K1: { v: 'Sự kiện' },
          L1: { v: 'Ngày tạo' },
          ...data.reduce((acc, row, rowIndex) => {
            row.forEach((cell, colIndex) => {
              const cellRef = String.fromCharCode(65 + colIndex) + (rowIndex + 2)
              acc[cellRef] = { v: cell }
            })
            return acc
          }, {} as any)
        }
      }
    }
    
    // Sử dụng thư viện xlsx để tạo file
    try {
      const xlsxModule: any = await import('xlsx')
      const XLSX = xlsxModule?.default ?? xlsxModule
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
      XLSX.utils.book_append_sheet(wb, ws, 'Danh sách khách mời')
      // Dùng write -> array + tạo Blob + tải về để giảm khả năng bị chặn bởi trình duyệt
      const wbArray = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array', 
        cellStyles: true, 
        compression: true,
        cellNF: true,
        cellHTML: false
      })
      const blob = new Blob([wbArray], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      // Fallback: nếu import xlsx thất bại, xuất CSV để không chặn người dùng
      await exportToCSV(guests, filename)
    }
  }

  const exportToCSV = async (guests: Guest[], filename: string) => {
    const headers = [
      'STT', 'Danh xưng', 'Họ và tên', 'Vai trò', 'Tổ chức', 'Tag', 
      'Email', 'Số điện thoại', 'Trạng thái RSVP', 'Trạng thái Check-in', 'Sự kiện', 'Ngày tạo'
    ]
    
    const data = guests.map((guest, index) => [
      index + 1,
      guest.title || '',
      guest.name,
      guest.role || '',
      guest.organization || '',
      guest.tag || '',
      guest.email || '',
      guest.phone || '',
      guest.rsvp_status || '',
      guest.checkin_status || '',
      guest.event_name || '',
      guest.created_at ? new Date(guest.created_at).toLocaleDateString('vi-VN') : ''
    ])
    
    // Thêm BOM để Excel nhận đúng UTF-8 (hiển thị tiếng Việt chuẩn)
    const bom = '\ufeff'
    const csvBody = [headers, ...data]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const csvContent = bom + csvBody
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Update showBulkActions when selectedGuests changes
  useEffect(() => {
    setShowBulkActions(selectedGuests.size > 0)
  }, [selectedGuests])

  // Update selectAll when filteredGuests or selectedGuests changes
  useEffect(() => {
    if (filteredGuests.length === 0) {
      setSelectAll(false)
    } else {
      setSelectAll(selectedGuests.size === filteredGuests.length && filteredGuests.length > 0)
    }
  }, [selectedGuests, filteredGuests])

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, eventFilter])

  // Persist selected event across navigation
  useEffect(() => {
    try {
      if (eventFilter) {
        localStorage.setItem("exp_selected_event", eventFilter)
      }
    } catch {}
  }, [eventFilter])

  // Calculate statistics - chỉ tính cho sự kiện được chọn
  const eventGuests = guests.filter(guest => guest.event_id?.toString() === eventFilter)
  const stats = {
    total: eventGuests.length,
    pending: eventGuests.filter(g => g.rsvp_status === 'pending').length,
    accepted: eventGuests.filter(g => g.rsvp_status === 'accepted').length,
    declined: eventGuests.filter(g => g.rsvp_status === 'declined').length
  }

  return (
    <div className="space-y-6">
      <style jsx>{`
        .guests-card-total,
        .guests-card-pending,
        .guests-card-accepted,
        .guests-card-declined {
          box-shadow: none !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        .guests-card-total:active,
        .guests-card-pending:active,
        .guests-card-accepted:active,
        .guests-card-declined:active {
          box-shadow: none !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          transform: none !important;
        }
        .guests-card-total:focus,
        .guests-card-pending:focus,
        .guests-card-accepted:focus,
        .guests-card-declined:focus {
          box-shadow: none !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          outline: none !important;
        }
        .guests-card-total:hover,
        .guests-card-pending:hover,
        .guests-card-accepted:hover,
        .guests-card-declined:hover {
          box-shadow: none !important;
          filter: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
      `}</style>
      {/* Background Loading Progress Indicator */}
      {isBackgroundLoading && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <div className="text-sm text-white">
              <div>Đang tải thêm dữ liệu...</div>
              <div className="text-xs text-gray-400">
                {backgroundProgress.current} / {backgroundProgress.total} trang
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Quản lý khách mời</h1>
        <div className="grid grid-cols-2 sm:flex gap-2">
          {(() => {
            // Kiểm tra số lượng khách hiện tại trong sự kiện
            const currentEvent = events.find(e => e.id === parseInt(eventFilter))
            const currentGuestCount = guests.filter(g => g.event_id === parseInt(eventFilter)).length
            const isMaxGuestsReached = currentEvent && currentGuestCount >= currentEvent.max_guests
            const isNoEventSelected = !eventFilter || eventFilter === ""
            const isNoEvents = events.length === 0
            
            return (
              <button 
                onClick={() => openGuestModal()}
                disabled={isMaxGuestsReached || isNoEventSelected || isNoEvents}
                className={`group relative px-3 py-2 border rounded-lg transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm text-sm ${
                  isMaxGuestsReached || isNoEventSelected || isNoEvents
                    ? 'bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20'
                }`}
                title={
                  isNoEvents
                    ? 'Vui lòng tạo sự kiện trước khi thêm khách'
                    : isNoEventSelected 
                      ? 'Vui lòng chọn sự kiện trước khi thêm khách' 
                      : isMaxGuestsReached 
                        ? `Số lượng khách đã đạt tối đa (${currentEvent?.max_guests} khách)` 
                        : ''
                }
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  {isNoEvents
                    ? 'Tạo sự kiện'
                    : isNoEventSelected 
                      ? 'Chọn sự kiện' 
                      : isMaxGuestsReached 
                        ? `Đã đạt tối đa (${currentGuestCount}/${currentEvent?.max_guests})` 
                        : 'Thêm khách'
                  }
                </span>
              </button>
            )
          })()}
          {(() => {
            // Kiểm tra số lượng khách hiện tại trong sự kiện
            const currentEvent = events.find(e => e.id === parseInt(eventFilter))
            const currentGuestCount = guests.filter(g => g.event_id === parseInt(eventFilter)).length
            const isMaxGuestsReached = currentEvent && currentGuestCount >= currentEvent.max_guests
            
            return (
              <button 
                onClick={() => setShowImportModal(true)}
                disabled={isMaxGuestsReached}
                className={`group relative px-3 py-2 border rounded-lg transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm text-sm ${
                  isMaxGuestsReached
                    ? 'bg-gray-500/20 border-gray-500/30 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20'
                }`}
                title={isMaxGuestsReached ? `Số lượng khách đã đạt tối đa (${currentEvent?.max_guests} khách)` : ''}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  {isMaxGuestsReached ? `Đã đạt tối đa (${currentGuestCount}/${currentEvent?.max_guests})` : 'Import'}
                </span>
              </button>
            )
          })()}
          <button 
            onClick={exportAllGuests}
            className="group relative px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-indigo-500/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Export</span>
          </button>
          <button 
            onClick={refreshGuests}
            className="group relative px-3 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-gray-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

        
      {/* Statistics Cards */}
      <div className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 pb-2 py-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent scroll-smooth snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-x-visible md:snap-none">
        {/* Total Guests Card */}
        <div 
          onClick={() => setStatusFilter("all")}
          className={`guests-card-total group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-7 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 md:flex-shrink w-[140px] sm:w-[160px] md:w-full h-[100px] sm:h-[120px] md:h-[140px] snap-start md:snap-none shadow-none ${
            statusFilter === "all" 
              ? "bg-gradient-to-br from-cyan-500/25 to-blue-500/25 border border-cyan-400/50" 
              : "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl sm:rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-cyan-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-xs sm:text-sm text-cyan-300/80 font-medium">
                  <span className="sm:hidden">Tổng</span>
                  <span className="hidden sm:inline">Tổng khách mời</span>
                </div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => setStatusFilter("pending")}
          className={`guests-card-pending group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-7 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 md:flex-shrink w-[140px] sm:w-[160px] md:w-full h-[100px] sm:h-[120px] md:h-[140px] snap-start md:snap-none shadow-none ${
            statusFilter === "pending" 
              ? "bg-gradient-to-br from-yellow-500/25 to-orange-500/25 border border-yellow-400/50" 
              : "bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{stats.pending}</div>
                <div className="text-xs sm:text-sm text-yellow-300/80 font-medium">Chờ phản hồi</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>

        {/* Accepted Card */}
        <div 
          onClick={() => setStatusFilter("accepted")}
          className={`guests-card-accepted group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-7 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 md:flex-shrink w-[140px] sm:w-[160px] md:w-full h-[100px] sm:h-[120px] md:h-[140px] snap-start md:snap-none shadow-none ${
            statusFilter === "accepted" 
              ? "bg-gradient-to-br from-green-500/25 to-emerald-500/25 border border-green-400/50" 
              : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-green-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{stats.accepted}</div>
                <div className="text-xs sm:text-sm text-green-300/80 font-medium">Đã xác nhận</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>

        {/* Declined Card */}
        <div 
          onClick={() => setStatusFilter("declined")}
          className={`guests-card-declined group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-7 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 md:flex-shrink w-[140px] sm:w-[160px] md:w-full h-[100px] sm:h-[120px] md:h-[140px] snap-start md:snap-none shadow-none ${
            statusFilter === "declined" 
              ? "bg-gradient-to-br from-red-500/25 to-pink-500/25 border border-red-400/50" 
              : "bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2 sm:p-3 bg-red-500/20 rounded-lg sm:rounded-xl">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">{stats.declined}</div>
                <div className="text-xs sm:text-sm text-red-300/80 font-medium">Đã từ chối</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-400 to-pink-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.declined / stats.total) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white font-medium text-sm sm:text-base">
                  Đã chọn {selectedGuests.size} khách
                </span>
              </div>
              
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:items-center gap-2">
              {/* RSVP Status Buttons */}
              <button
                onClick={() => bulkUpdateRSVP('accepted')}
                className="group relative px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-green-500/20"
                title="Đánh dấu tất cả khách đã chọn là Đã chấp nhận"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Chấp nhận</span>
              </button>
              
              <button
                onClick={() => bulkUpdateRSVP('declined')}
                className="group relative px-3 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-red-500/20"
                title="Đánh dấu tất cả khách đã chọn là Đã từ chối"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Từ chối</span>
              </button>
              
              <button
                onClick={() => bulkUpdateRSVP('pending')}
                className="group relative px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:from-yellow-500/30 hover:to-orange-500/30 hover:border-yellow-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-yellow-500/20"
                title="Đánh dấu tất cả khách đã chọn là Chờ phản hồi"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Chờ phản hồi</span>
              </button>
              
              {/* Check-in/out Buttons */}
              <button
                onClick={bulkCheckIn}
                className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-cyan-500/20"
                title="Check-in tất cả khách đã chọn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Check-in</span>
              </button>
              
              <button
                onClick={bulkCheckOut}
                className="group relative px-3 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 rounded-lg hover:from-orange-500/30 hover:to-red-500/30 hover:border-orange-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-orange-500/20"
                title="Check-out tất cả khách đã chọn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Check-out</span>
              </button>
              
              {/* Other Actions */}
              <button
                onClick={bulkDelete}
                className="group relative px-3 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-red-500/20"
                title="Xóa tất cả khách đã chọn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Xóa</span>
              </button>
              
              <button
                onClick={exportSelectedGuests}
                className="group relative px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-indigo-500/20"
                title="Xuất danh sách khách đã chọn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Export</span>
              </button>
              
              <button
                onClick={clearSelection}
                className="group relative px-3 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-gray-500/20"
                title="Bỏ chọn tất cả"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Bỏ chọn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guests List Section */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 md:p-6" data-guest-list>
        {/* Desktop Layout */}
        <div className="hidden lg:block space-y-4 mb-6">
          {/* Header Row with Event Dropdown */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-white">Danh sách khách mời</span>
              </h2>
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                <span className="text-blue-400 text-sm font-semibold">{filteredGuests.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm font-medium">Chọn sự kiện -</span>
              <CustomDropdown
                options={events.map(event => ({
                  value: event.id.toString(),
                  label: `${event.name} - ${event.date ? new Date(event.date).toLocaleDateString('vi-VN') : 'Không có ngày'}`
                }))}
                value={eventFilter}
                onChange={(value) => setEventFilter(value)}
                placeholder="Chọn sự kiện..."
                className="min-w-60 max-w-96 w-auto"
              />
            </div>
          </div>
          
          {/* Search Bar with Filters */}
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Tìm kiếm khách mời..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm w-80"
            />
            <div className="flex gap-3">
              <CustomDropdown
                options={tagFilterOptions}
                value={tagFilter}
                onChange={(value) => setTagFilter(value)}
                placeholder="Chọn tag"
                className="w-40"
              />
              <CustomDropdown
                options={organizationFilterOptions}
                value={organizationFilter}
                onChange={(value) => setOrganizationFilter(value)}
                placeholder="Chọn tổ chức"
                className="w-40"
              />
              <CustomDropdown
                options={roleFilterOptions}
                value={roleFilter}
                onChange={(value) => setRoleFilter(value)}
                placeholder="Chọn vai trò"
                className="w-40"
              />
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTagFilter("all")
                  setOrganizationFilter("all")
                  setRoleFilter("all")
                }}
                className="group relative px-3 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 hover:text-red-300 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-xl hover:shadow-red-500/30 text-sm whitespace-nowrap"
                title="Xóa tất cả bộ lọc"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Xóa lọc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-white">Danh sách khách mời</span>
            </h2>
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
              <span className="text-blue-400 text-sm font-semibold">{filteredGuests.length}</span>
            </div>
          </div>
          
          {/* Search Bar - Always visible */}
          <input
            type="text"
            placeholder="Tìm kiếm khách mời..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm w-full"
          />
          
          {/* Other Filters - Hidden when bulk actions are active */}
          {!showBulkActions && (
            <>
              {/* Event Dropdown */}
              <CustomDropdown
                options={events.map(event => ({
                  value: event.id.toString(),
                  label: `${event.name} - ${event.date ? new Date(event.date).toLocaleDateString('vi-VN') : 'Không có ngày'}`
                }))}
                value={eventFilter}
                onChange={(value) => setEventFilter(value)}
                placeholder="Chọn sự kiện"
                className="w-full"
              />
              
              {/* Filters Grid */}
              <div className="grid grid-cols-2 gap-2">
                <CustomDropdown
                  options={[
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "pending", label: "Chờ phản hồi" },
                    { value: "accepted", label: "Đã xác nhận" },
                    { value: "declined", label: "Đã từ chối" }
                  ]}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value as any)}
                  placeholder="Chọn trạng thái"
                  className="w-full"
                />
                <CustomDropdown
                  options={tagFilterOptions}
                  value={tagFilter}
                  onChange={(value) => setTagFilter(value)}
                  placeholder="Chọn tag"
                  className="w-full"
                />
                <CustomDropdown
                  options={organizationFilterOptions}
                  value={organizationFilter}
                  onChange={(value) => setOrganizationFilter(value)}
                  placeholder="Chọn tổ chức"
                  className="w-full"
                />
                <CustomDropdown
                  options={roleFilterOptions}
                  value={roleFilter}
                  onChange={(value) => setRoleFilter(value)}
                  placeholder="Chọn vai trò"
                  className="w-full"
                />
              </div>
              
              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTagFilter("all")
                  setOrganizationFilter("all")
                  setRoleFilter("all")
                }}
                className="group relative px-3 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg text-sm hover:shadow-gray-500/20 w-full"
                title="Xóa tất cả bộ lọc"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Xóa lọc</span>
              </button>
            </>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-white/60">Đang tải...</div>
          </div>
        ) : !eventFilter ? (
          <div className="text-center py-8">
            <div className="text-white/60 mb-2">Vui lòng chọn sự kiện để xem danh sách khách mời</div>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-white/60 mb-4">
              {guests.length === 0 ? "Chưa có khách mời nào" : "Không tìm thấy khách mời phù hợp"}
            </div>
            <div className="text-sm text-white/40">
              {guests.length === 0 ? "Thêm khách mời để bắt đầu" : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white/60 uppercase bg-black/30">
                  <tr>
                    <th className="px-4 py-3 w-12">
                      <CustomCheckbox
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 w-16">STT</th>
                    <th className="px-4 py-3 w-20">Danh xưng</th>
                    <th className="px-4 py-3 w-40">Họ và tên</th>
                    <th className="px-4 py-3 w-24">Vai trò</th>
                    <th className="px-4 py-3 w-32">Tổ chức</th>
                    <th className="px-4 py-3 w-24">Tag</th>
                    <th className="px-4 py-3 w-32">Trạng thái</th>
                    <th className="px-4 py-3 w-40">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                {currentGuests.map((guest, index) => (
                  <tr key={guest.id} className="bg-black/20 border-b border-white/10 hover:bg-black/30 transition-colors">
                    <td className="px-4 py-4">
                      <CustomCheckbox
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleGuestSelection(guest.id)}
                      />
                    </td>
                    <td className="px-4 py-4 text-white/80">{startIndex + index + 1}</td>
                    <td className="px-4 py-4 text-white/80">{guest.title || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="text-white font-medium">{guest.name}</div>
                      {guest.email && (
                        <div className="text-white/60 text-xs">{guest.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-white/80">{guest.role || '-'}</td>
                    <td className="px-4 py-4 text-white/80">{guest.organization || '-'}</td>
                    <td className="px-4 py-4">
                      {guest.tag ? (
                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-full">
                          {guest.tag}
                        </span>
                      ) : (
                        <span className="text-white/40">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                        guest.rsvp_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        guest.rsvp_status === 'declined' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {guest.rsvp_status === 'accepted' ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : guest.rsvp_status === 'declined' ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className="hidden sm:inline">
                          {guest.rsvp_status === 'accepted' ? 'Đã xác nhận' :
                           guest.rsvp_status === 'declined' ? 'Đã từ chối' : 'Chờ phản hồi'}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <button 
                          onClick={() => openGuestModal(guest)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/20"
                          title="Chỉnh sửa thông tin khách mời"
                        >
                          <svg className="w-3.5 h-3.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          <span className="hidden sm:inline font-medium">Sửa</span>
                        </button>
                        
                        <button 
                          onClick={() => openInvitePreview(guest)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/20"
                          title="Xem trước thiệp mời"
                        >
                          <svg className="w-3.5 h-3.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="hidden sm:inline font-medium">Thiệp</span>
                        </button>
                        
                        <button 
                          onClick={() => openQRPopup(guest)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
                          title="Copy link thiệp"
                        >
                          <svg className="w-3.5 h-3.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="hidden sm:inline font-medium">Link</span>
                        </button>
                        
                        <button 
                          onClick={() => deleteGuest(guest.id, guest.name)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
                          title="Xóa khách mời"
                        >
                          <svg className="w-3.5 h-3.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="hidden sm:inline font-medium">Xóa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {/* Mobile Select All Button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CustomCheckbox
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-white font-medium text-sm">
                    {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </span>
                </div>
                <span className="text-white/60 text-sm">
                  {selectedGuests.size} / {filteredGuests.length} khách
                </span>
              </div>
              
              {currentGuests.map((guest, index) => (
                <div key={guest.id} className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-black/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CustomCheckbox
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleGuestSelection(guest.id)}
                      />
                      <div>
                        <div className="text-white font-medium text-sm">{guest.name}</div>
                        {guest.email && (
                          <div className="text-white/60 text-xs">{guest.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                        guest.rsvp_status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        guest.rsvp_status === 'declined' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {guest.rsvp_status === 'accepted' ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : guest.rsvp_status === 'declined' ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>
                          {guest.rsvp_status === 'accepted' ? 'Đã xác nhận' :
                           guest.rsvp_status === 'declined' ? 'Đã từ chối' : 'Chờ phản hồi'}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/80 mb-3">
                    <div>
                      <span className="text-white/60">Danh xưng:</span> {guest.title || '-'}
                    </div>
                    <div>
                      <span className="text-white/60">Vai trò:</span> {guest.role || '-'}
                    </div>
                    <div>
                      <span className="text-white/60">Tổ chức:</span> {guest.organization || '-'}
                    </div>
                    <div>
                      <span className="text-white/60">Tag:</span> {guest.tag || '-'}
                    </div>
                  </div>

                  {/* Mobile Actions - Single Button with Dropdown */}
                  <div className="relative mobile-action-dropdown">
                    <button 
                      onClick={() => setMobileActionDropdown(mobileActionDropdown === guest.id ? null : guest.id)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
                      title="Thao tác"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                      <span className="font-medium">Thao tác</span>
                      <svg className={`w-3 h-3 transition-transform duration-200 ${mobileActionDropdown === guest.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    
                    {/* Dropup Menu */}
                    {mobileActionDropdown === guest.id && (
                      <div className="absolute bottom-full left-0 right-0 mb-1 bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-10 overflow-hidden">
                        <button 
                          onClick={() => {
                            openGuestModal(guest)
                            setMobileActionDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          <span>Sửa thông tin</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            openInvitePreview(guest)
                            setMobileActionDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Xem thiệp mời</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            openQRPopup(guest)
                            setMobileActionDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                          </svg>
                          <span>Chia sẻ thiệp mời</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            deleteGuest(guest.id, guest.name)
                            setMobileActionDropdown(null)
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span>Xóa khách mời</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredGuests.length)} trong tổng số {filteredGuests.length} khách mời
            </div>
            
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {/* Previous Button */}
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1))
                  scrollToGuestList()
                }}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Show first page, last page, current page, and pages around current
                  const shouldShow = page === 1 || 
                                   page === totalPages || 
                                   (page >= currentPage - 1 && page <= currentPage + 1)
                  
                  if (!shouldShow) {
                    // Show ellipsis
                    if (page === 2 && currentPage > 3) {
                      return <span key={`ellipsis-${page}`} className="px-2 text-white/40">...</span>
                    }
                    if (page === totalPages - 1 && currentPage < totalPages - 2) {
                      return <span key={`ellipsis-${page}`} className="px-2 text-white/40">...</span>
                    }
                    return null
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page)
                        scrollToGuestList()
                      }}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages))
                  scrollToGuestList()
                }}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Sau</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <Portal>
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
              setShowImportModal(false)
              resetImportModal()
            }}></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Import khách mời</h2>
                <button onClick={() => {
                  setShowImportModal(false)
                  resetImportModal()
                }} className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {/* Import Type Selection */}
              <div className="flex gap-6 mb-6">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input type="radio" checked={importType === "json"} onChange={() => setImportType("json")} className="w-4 h-4" />
                  <span>JSON</span>
                </label>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input type="radio" checked={importType === "csv"} onChange={() => setImportType("csv")} className="w-4 h-4" />
                  <span>CSV File</span>
                </label>
              </div>

              {/* JSON Input */}
              {importType === "json" && (
                <div className="space-y-4 mb-6">
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-shrink-0">
                      <input 
                        type="file" 
                        id="jsonFile" 
                        accept=".json" 
                        onChange={handleJsonFileUpload} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <label 
                        htmlFor="jsonFile"
                        className="group relative py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>Chọn file</span>
                      </label>
                    </div>
                    <div className="flex-1 bg-black/30 border border-white/20 rounded-lg p-3 min-h-[48px] flex items-center">
                      {selectedJsonFile ? (
                        <div className="flex items-center gap-2 text-white">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">{selectedJsonFile}</span>
                        </div>
                      ) : (
                        <span className="text-white/50 text-sm">Chưa chọn file JSON</span>
                      )}
                    </div>
                  </div>
                  <textarea 
                    className="w-full h-40 bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 font-mono text-sm" 
                    value={text} 
                    onChange={e=>setText(e.target.value)}
                    placeholder='[{"title":"Mr","name":"Tên khách","role":"CEO","organization":"Công ty ABC","tag":"VIP","email":"email@example.com","phone":"0900000000"}]'
                  />
                </div>
              )}

              {/* CSV Upload */}
              {importType === "csv" && (
                <div className="space-y-4 mb-6">
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-shrink-0">
                      <input 
                        type="file" 
                        id="csvFile" 
                        accept=".csv" 
                        onChange={handleCsvFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <label 
                        htmlFor="csvFile"
                        className="group relative py-2 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>Chọn file</span>
                      </label>
                    </div>
                    <div className="flex-1 bg-black/30 border border-white/20 rounded-lg p-3 min-h-[48px] flex items-center">
                      {selectedCsvFile ? (
                        <div className="flex items-center gap-2 text-white">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium">{selectedCsvFile}</span>
                        </div>
                      ) : (
                        <span className="text-white/50 text-sm">Chưa chọn file CSV</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    <p className="mb-2">Mẫu CSV:</p>
                    <pre className="bg-black/40 p-3 rounded-lg text-white/80 overflow-x-auto">title,name,role,organization,tag,email,phone
Mr,Tên khách,CEO,Công ty ABC,Tag,email@example.com,0900000000</pre>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {(() => {
                  // Kiểm tra số lượng khách hiện tại trong sự kiện
                  const currentEvent = events.find(e => e.id === parseInt(eventFilter))
                  const currentGuestCount = guests.filter(g => g.event_id === parseInt(eventFilter)).length
                  
                  // Tính số khách sẽ được import (ước tính từ text/file)
                  let estimatedImportCount = 0
                  if (importType === 'json' && text.trim()) {
                    try {
                      const jsonData = JSON.parse(text)
                      estimatedImportCount = Array.isArray(jsonData) ? jsonData.length : 0
                    } catch (e) {
                      estimatedImportCount = 0
                    }
                  } else if (importType === 'csv') {
                    // Ước tính từ số dòng trong CSV (trừ header)
                    const lines = text.split('\n').filter(line => line.trim())
                    estimatedImportCount = Math.max(0, lines.length - 1)
                  }
                  
                  const totalAfterImport = currentGuestCount + estimatedImportCount
                  const isMaxGuestsReached = currentEvent && totalAfterImport > currentEvent.max_guests
                  const isAtMaxCapacity = currentEvent && currentGuestCount >= currentEvent.max_guests
                  
                  return (
                    <button 
                      onClick={onImport}
                      disabled={isImporting || isAtMaxCapacity}
                      className={`group relative flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm ${
                        isImporting || isAtMaxCapacity
                          ? 'bg-gray-500/20 border border-gray-500/30 text-gray-400 cursor-not-allowed'
                          : isMaxGuestsReached
                            ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 hover:from-orange-500/30 hover:to-red-500/30 hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/20'
                            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20'
                      }`}
                      title={
                        isAtMaxCapacity 
                          ? `Số lượng khách đã đạt tối đa (${currentEvent?.max_guests} khách)` 
                          : isMaxGuestsReached 
                            ? `Cảnh báo: Import ${estimatedImportCount} khách sẽ vượt quá giới hạn ${currentEvent?.max_guests} khách (hiện tại: ${currentGuestCount}, sau import: ${totalAfterImport})`
                            : ''
                      }
                    >
                      {importType === 'json' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span>
                        {isImporting 
                          ? 'Đang import...' 
                          : isAtMaxCapacity 
                            ? `Đã đạt tối đa (${currentGuestCount}/${currentEvent?.max_guests})`
                            : isMaxGuestsReached
                              ? `Cảnh báo: ${estimatedImportCount} khách (${currentGuestCount}/${currentEvent?.max_guests})`
                              : `Import ${importType.toUpperCase()}`
                        }
                      </span>
                    </button>
                  )
                })()}
                <button 
                  onClick={() => {
                    setShowImportModal(false)
                    resetImportModal()
                  }} 
                  className="group relative py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 hover:shadow-lg hover:shadow-gray-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Hủy</span>
                </button>
              </div>
              
              {result && (
                <div className="mt-6 p-4 bg-black/30 border border-white/20 rounded-lg">
                  <pre className="text-sm text-white whitespace-pre-wrap">{result}</pre>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Guest Modal */}
      {showGuestModal && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-[100dvw] z-[9998] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowGuestModal(false)}></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[90dvh] overflow-y-auto scrollbar-glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                {editingGuest ? 'Chỉnh sửa khách mời' : 'Thêm khách mời mới'}
              </h2>
              <button
                onClick={() => setShowGuestModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Họ và tên *</label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => updateGuestForm('name', e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Danh xưng</label>
                  <input
                    type="text"
                    value={guestForm.title}
                    onChange={(e) => updateGuestForm('title', e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-xs"
                    placeholder="Nhập danh xưng (VD: Ông, Bà, Anh, Chị...)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Tag</label>
                  <input
                    type="text"
                    value={guestForm.tag}
                    onChange={(e) => updateGuestForm('tag', e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder:text-xs"
                    placeholder="Nhập tag (VD: VIP, Speaker, Sponsor...)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Vai trò</label>
                <input
                  type="text"
                  value={guestForm.role}
                  onChange={(e) => updateGuestForm('role', e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                  placeholder="CEO, Manager, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tổ chức</label>
                <input
                  type="text"
                  value={guestForm.organization}
                  onChange={(e) => updateGuestForm('organization', e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                  placeholder="Tên công ty hoặc trường học"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => updateGuestForm('email', e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Số điện thoại</label>
                <input
                  type="tel"
                  value={guestForm.phone}
                  onChange={(e) => updateGuestForm('phone', e.target.value)}
                  className="w-full bg-black/30 border border-white/20 rounded-lg p-3 text-white placeholder-white/50"
                  placeholder="0900000000"
                />
              </div>
            </div>

            {/* Event Content */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-white/80">Nội dung sự kiện</label>
                <span className={`text-xs ${Array.from(guestForm.event_content).length > 230 ? 'text-red-400' : 'text-white/60'}`}>
                  {Array.from(guestForm.event_content).length}/230
                </span>
              </div>
              <textarea
                value={guestForm.event_content}
                onChange={(e) => {
                  const value = e.target.value
                  // Sử dụng Array.from để đếm ký tự UTF-8 chính xác
                  const charCount = Array.from(value).length
                  
                  if (charCount <= 230) {
                    updateGuestForm('event_content', value)
                    // Auto resize textarea
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }
                  // Nếu vượt quá giới hạn, không cập nhật giá trị (giữ nguyên nội dung cũ)
                }}
                onKeyDown={(e) => {
                  // Ngăn chặn nhập thêm ký tự khi đã đạt giới hạn
                  const currentValue = guestForm.event_content
                  const charCount = Array.from(currentValue).length
                  
                  // Cho phép các phím điều khiển (Backspace, Delete, Arrow keys, etc.)
                  const allowedKeys = [
                    'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                    'Home', 'End', 'Tab', 'Enter', 'Control', 'Meta', 'Alt'
                  ]
                  
                  if (charCount >= 230 && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                  }
                }}
                onInput={(e) => {
                  // Auto resize on input
                  e.currentTarget.style.height = 'auto'
                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'
                }}
                className={`w-full px-4 py-3 bg-black/30 border rounded-lg text-white placeholder-white/50 focus:outline-none text-sm transition-all duration-200 resize-none min-h-[80px] overflow-hidden leading-relaxed ${
                  Array.from(guestForm.event_content).length > 230 
                    ? 'border-red-400/50 focus:border-red-400/50' 
                    : 'border-white/20 focus:border-blue-400/50'
                }`}
                placeholder="Nhập nội dung sự kiện cho khách mời này..."
                rows={3}
              />
            </div>

            {/* RSVP Status and Check-in Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Trạng thái RSVP</label>
                <CustomDropdown
                  options={rsvpStatusOptions}
                  value={guestForm.rsvp_status}
                  onChange={(value) => updateGuestForm('rsvp_status', value)}
                  placeholder="Chọn trạng thái RSVP"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Trạng thái check-in</label>
                <CustomDropdown
                  options={checkinStatusOptions}
                  value={guestForm.checkin_status}
                  onChange={(value) => updateGuestForm('checkin_status', value)}
                  placeholder="Chọn trạng thái check-in"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={saveGuest}
                className="group relative flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 text-sm" 
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {editingGuest ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button
                onClick={() => setShowGuestModal(false)}
                className="group relative px-6 py-3 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-xl hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20"
              >
                Hủy
              </button>
            </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Toast Notification - Optimized for 370px width */}
      {showPopup && (
        <div className={`fixed top-16 right-0 z-[10001] transform transition-all duration-300 ease-out ${
          popupVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div 
            className={`px-3 py-2 sm:px-4 sm:py-3 rounded-l-lg sm:rounded-l-2xl shadow-2xl w-[200px] sm:max-w-xs h-auto backdrop-blur-md border ${
              copyType === 'success' ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-600/30 via-emerald-500/20 to-emerald-400/10' :
              copyType === 'error' ? 'border-rose-400/30 bg-gradient-to-br from-rose-600/30 via-rose-500/20 to-rose-400/10' :
              copyType === 'warning' ? 'border-amber-400/30 bg-gradient-to-br from-amber-600/30 via-amber-500/20 to-amber-400/10' :
              'border-cyan-400/30 bg-gradient-to-br from-cyan-600/30 via-cyan-500/20 to-cyan-400/10'
            } text-white select-none`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                {copyType === 'success' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500/20 rounded sm:rounded-xl flex items-center justify-center border border-emerald-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {copyType === 'error' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-rose-500/20 rounded sm:rounded-xl flex items-center justify-center border border-rose-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {copyType === 'warning' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-500/20 rounded sm:rounded-xl flex items-center justify-center border border-amber-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.293 19.293a1 1 0 001.414 0L12 13l6.293 6.293a1 1 0 001.414-1.414l-7-7a1 1 0 00-1.414 0l-7 7a1 1 0 000 1.414z" />
                    </svg>
                  </div>
                )}
                {copyType === 'info' && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-cyan-500/20 rounded sm:rounded-xl flex items-center justify-center border border-cyan-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words leading-relaxed">{copyMessage}</p>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => {
                  setPopupVisible(false)
                  setTimeout(() => setShowPopup(false), 300)
                }}
                className="flex-shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors duration-200 sm:hidden"
              >
                <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`mt-1 h-0.5 rounded-full ${
              copyType === 'success' ? 'bg-gradient-to-r from-emerald-400/60 to-emerald-300/40' :
              copyType === 'error' ? 'bg-gradient-to-r from-rose-400/60 to-rose-300/40' :
              copyType === 'warning' ? 'bg-gradient-to-r from-amber-400/60 to-amber-300/40' :
              'bg-gradient-to-r from-cyan-400/60 to-cyan-300/40'
            }`}></div>
          </div>
        </div>
      )}


      {/* Export Format Popup */}
      {showExportPopup && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-[100dvw] bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998]">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 backdrop-blur-sm max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Chọn định dạng xuất file</h3>
              <p className="text-white/80 mb-6">
                {exportScope === 'all' ? 'Bạn sẽ xuất tất cả khách trong danh sách hiện tại.' : 'Bạn sẽ xuất các khách đã chọn.'}
              </p>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`w-full p-3 rounded-lg border transition-all duration-300 flex items-center justify-center gap-3 ${
                    exportFormat === 'excel'
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-400'
                      : 'bg-black/20 border-white/20 text-white/80 hover:border-white/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clipRule="evenodd" />
                    <path d="M7 7h6v2H7V7zm0 4h6v2H7v-2z" />
                  </svg>
                  Excel (.xlsx)
                </button>
                
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`w-full p-3 rounded-lg border transition-all duration-300 flex items-center justify-center gap-3 ${
                    exportFormat === 'csv'
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-400'
                      : 'bg-black/20 border-white/20 text-white/80 hover:border-white/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v10h10V5H5z" clipRule="evenodd" />
                    <path d="M7 7h6v1H7V7zm0 2h6v1H7V9zm0 2h6v1H7v-1z" />
                  </svg>
                  CSV (.csv)
                </button>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportPopup(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300"
                >
                  Hủy
                </button>
                <button
                  onClick={handleExportConfirm}
                  className="group relative flex-1 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 11-2 0V4H5v12h4a1 1 0 110 2H4a1 1 0 01-1-1V3zm10.293 6.293a1 1 0 011.414 0L18 12.586V11a1 1 0 112 0v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-3.293-3.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Xuất file
                </button>
              </div>
            </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Preview Thiệp Mời */}
      <SystemModal
        isOpen={showInvitePreview}
        onClose={closeInvitePreview}
        title={`Xem trước thiệp mời - ${selectedGuestForPreview?.name || ''}`}
        size="5xl"
        className="h-[95vh]"
      >
        <div className="space-y-4">
          {/* Copy Link Button */}
          {inviteLink && (
            <div className="flex justify-end">
              <button
                onClick={copyInviteLinkFromModal}
                className="group relative px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/20"
                title="Copy link thiệp mời"
              >
                <svg className="w-3.5 h-3.5 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                <span className="hidden sm:inline font-medium">Link</span>
              </button>
            </div>
          )}
          
          {/* Hiển thị trang thiệp mời chính */}
          {inviteLink && (
            <div className="w-full h-[80vh] border border-white/20 rounded-xl overflow-hidden">
              <iframe
                src={`${window.location.origin}/invite/${inviteLink.split('/').pop()}`}
                className="w-full h-full"
                title="Xem trước thiệp mời"
                sandbox="allow-same-origin allow-scripts allow-forms allow-top-navigation allow-popups allow-modals"
                allow="fullscreen"
              />
            </div>
          )}
        </div>
      </SystemModal>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmData && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{confirmData.title}</h3>
                </div>
                <p className="text-white/80 text-sm mb-6 whitespace-pre-line">{confirmData.message}</p>
                <div className="flex gap-3">
                  <button
                    onClick={confirmData.onCancel}
                    className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-300 rounded-lg hover:bg-gray-500/30 hover:border-gray-400/50 transition-all duration-300 text-sm font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmData.onConfirm}
                    className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 hover:border-blue-400/50 transition-all duration-300 text-sm font-medium"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Duplicate Guest Modal */}
      {showDuplicateModal && duplicateData && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10001] overflow-y-auto">
            <div className="bg-gray-900 border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] min-h-[60vh] overflow-hidden flex flex-col my-auto">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-white">
                    Phát hiện khách mời trùng lặp
                  </h2>
                  <button
                    onClick={() => {
                      setShowDuplicateModal(false)
                      setDuplicateData(null)
                      setSelectedDuplicates(new Set())
                      setResult("Import đã bị hủy do phát hiện trùng lặp.")
                      showToast("Import đã bị hủy", "info")
                    }}
                    className="text-white/60 hover:text-white/80 transition-colors p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-white/70 text-sm">
                  Đã phát hiện {duplicateData.newGuests.length} khách mời có thể trùng lặp với khách hiện có. 
                  Vui lòng chọn cách xử lý cho từng khách.
                </p>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {duplicateData.newGuests.map((newGuest, index) => {
                    const existingGuest = duplicateData.existingGuests[index]
                    const isSelected = selectedDuplicates.has(index)
                    
                    return (
                      <div key={index} className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSelected = new Set(selectedDuplicates)
                              if (e.target.checked) {
                                newSelected.add(index)
                              } else {
                                newSelected.delete(index)
                              }
                              setSelectedDuplicates(newSelected)
                            }}
                            className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-white mb-1">Khách mới (từ file)</h4>
                                <div className="text-sm text-white/80">
                                  <div><span className="font-medium">Tên:</span> {newGuest.title} {newGuest.name}</div>
                                  <div><span className="font-medium">Vai trò:</span> {newGuest.role || 'N/A'}</div>
                                  <div><span className="font-medium">Tổ chức:</span> {newGuest.organization || 'N/A'}</div>
                                  <div><span className="font-medium">Tag:</span> {newGuest.tag || 'N/A'}</div>
                                  {newGuest.email && <div><span className="font-medium">Email:</span> {newGuest.email}</div>}
                                  {newGuest.phone && <div><span className="font-medium">SĐT:</span> {newGuest.phone}</div>}
                                </div>
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-white mb-1">Khách hiện có</h4>
                                <div className="text-sm text-white/80">
                                  <div><span className="font-medium">Tên:</span> {existingGuest.title} {existingGuest.name}</div>
                                  <div><span className="font-medium">Vai trò:</span> {existingGuest.role || 'N/A'}</div>
                                  <div><span className="font-medium">Tổ chức:</span> {existingGuest.organization || 'N/A'}</div>
                                  <div><span className="font-medium">Tag:</span> {existingGuest.tag || 'N/A'}</div>
                                  {existingGuest.email && <div><span className="font-medium">Email:</span> {existingGuest.email}</div>}
                                  {existingGuest.phone && <div><span className="font-medium">SĐT:</span> {existingGuest.phone}</div>}
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-blue-300 text-sm">
                                  <span className="font-medium">Hành động:</span> Hợp nhất - Thông tin khách hiện có sẽ được cập nhật bằng thông tin mới từ file.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="p-6 border-t border-white/10 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    if (!duplicateData) return
                    
                    // Hiển thị popup xác nhận cho "Giữ lại"
                    const selectedCount = selectedDuplicates.size
                    setDuplicateConfirmData({
                      title: "Xác nhận Giữ lại",
                      message: `Có ${selectedCount} khách hàng sẽ được giữ lại để import vào danh sách.`,
                      onConfirm: () => {
                        // Xử lý import với logic giữ lại những khách được chọn
                        processImportWithDuplicates(
                          duplicateData.newGuests,
                          parseInt(eventFilter),
                          selectedDuplicates, // Giữ lại những khách được chọn
                          duplicateData,
                          'keep' // Action type: keep (import vào danh sách)
                        )
                        
                        // Đóng modal
                        setShowDuplicateModal(false)
                        setShowDuplicateConfirmModal(false)
                        setDuplicateData(null)
                        setSelectedDuplicates(new Set())
                        setShowImportModal(false)
                        setDuplicateConfirmData(null)
                      },
                      onCancel: () => {
                        setShowDuplicateConfirmModal(false)
                        setDuplicateConfirmData(null)
                      }
                    })
                    setShowDuplicateConfirmModal(true)
                  }}
                  className="group relative flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Giữ lại</span>
                </button>
                <button
                  onClick={() => {
                    if (!duplicateData) return
                    
                    const selectedCount = selectedDuplicates.size
                    const totalCount = duplicateData.newGuests.length
                    const remainingCount = totalCount - selectedCount
                    
                    // Hiển thị popup xác nhận cho "Hợp nhất"
                    setDuplicateConfirmData({
                      title: "Xác nhận Hợp nhất",
                      message: `Có ${selectedCount} khách hàng sẽ được hợp nhất và ${remainingCount} khách hàng còn lại sẽ được import vào danh sách.`,
                      onConfirm: async () => {
                        // Xử lý import với logic mới: hợp nhất + import còn lại
                        await processImportWithDuplicates(
                          duplicateData.newGuests,
                          parseInt(eventFilter),
                          selectedDuplicates,
                          duplicateData,
                          'merge_and_import' // Action type: merge + import còn lại
                        )
                        
                        // Đóng modal
                        setShowDuplicateModal(false)
                        setShowDuplicateConfirmModal(false)
                        setDuplicateData(null)
                        setSelectedDuplicates(new Set())
                        setShowImportModal(false)
                        setDuplicateConfirmData(null)
                      },
                      onCancel: () => {
                        setShowDuplicateConfirmModal(false)
                        setDuplicateConfirmData(null)
                      }
                    })
                    setShowDuplicateConfirmModal(true)
                  }}
                  className="group relative flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Hợp nhất</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Duplicate Confirmation Modal */}
      {showDuplicateConfirmModal && duplicateConfirmData && (
        <Portal>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10002]">
            <div className="bg-gray-900 border border-white/20 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {duplicateConfirmData.title}
                </h3>
                <button
                  onClick={duplicateConfirmData.onCancel}
                  className="text-white/60 hover:text-white/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-white/80 text-sm mb-6">
                {duplicateConfirmData.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={duplicateConfirmData.onCancel}
                  className="group relative flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 hover:shadow-lg hover:shadow-gray-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Không</span>
                </button>
                <button
                  onClick={duplicateConfirmData.onConfirm}
                  className="group relative flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Đúng</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Copy Link Modal */}
      {showCopyLinkModal && copyLinkData && (
        <CopyLinkModal
          isOpen={showCopyLinkModal}
          onClose={() => {
            setShowCopyLinkModal(false)
            setCopyLinkData(null)
          }}
          inviteLink={copyLinkData.inviteLink}
          qrCodeUrl={copyLinkData.qrCodeUrl}
          eventName={copyLinkData.eventName}
          showToast={showToast}
        />
      )}

      {/* CSS cho Guests Cards với hiệu ứng hover RSVP */}
      <style jsx>{`
        /* Guests Cards với hiệu ứng hover RSVP */
        .guests-card-total:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.4));
          border-color: rgba(59, 130, 246, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4), 0 0 25px rgba(59, 130, 246, 0.2);
        }
        
        .guests-card-pending:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.4));
          border-color: rgba(245, 158, 11, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(245, 158, 11, 0.4), 0 0 25px rgba(245, 158, 11, 0.2);
        }
        
        .guests-card-accepted:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
          border-color: rgba(34, 197, 94, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 0 25px rgba(34, 197, 94, 0.2);
        }
        
        .guests-card-declined:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4));
          border-color: rgba(239, 68, 68, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4), 0 0 25px rgba(239, 68, 68, 0.2);
        }
        
        /* Hiệu ứng shimmer cho guests cards */
        .guests-card-total::before,
        .guests-card-pending::before,
        .guests-card-accepted::before,
        .guests-card-declined::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .guests-card-total:hover::before,
        .guests-card-pending:hover::before,
        .guests-card-accepted:hover::before,
        .guests-card-declined:hover::before {
          left: 100%;
        }
      `}</style>
    </div>
  )}
