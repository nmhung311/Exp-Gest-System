"use client"
import React, { useEffect, useMemo, useState } from "react"
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
  checkin_status: string
  event_id?: number
  event_name?: string
}

interface Event {
  id: number
  name: string
  date: string
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
}

interface Notification {
  id: string
  message: string
  type: "success" | "error" | "warning" | "info"
  visible: boolean
  undoAction?: () => void
}

interface EditCheckinState {
  isOpen: boolean
  guest: CheckedInGuest | null
  loading: boolean
}

const guestsPerPage = 6

const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children as React.ReactElement, document.body)
}

export default function CheckinPage() {
  // data
  const [events, setEvents] = useState<Event[]>([])
  const [allGuests, setAllGuests] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  // ui state
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // scanner
  const [qrCode, setQrCode] = useState("")
  const [isScannerActive, setIsScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  // notifications
  const [notifications, setNotifications] = useState<Notification[]>([])

  // edit/multiselect
  const [editCheckin, setEditCheckin] = useState<EditCheckinState>({ isOpen: false, guest: null, loading: false })
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedGuests, setSelectedGuests] = useState<Set<number>>(new Set())
  const [showActionBubble, setShowActionBubble] = useState(false)
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // cards
  const [selectedCard, setSelectedCard] = useState<"total" | "checkedIn" | "notCheckedIn" | "checkedOut" | null>(null)
  
  // Touch handlers for horizontal swipe navigation
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  
  // recently checked in guest
  const [recentlyCheckedInGuest, setRecentlyCheckedInGuest] = useState<CheckedInGuest | null>(null)

  // Touch handlers for horizontal swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentCardIndex < 2) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else if (isRightSwipe && currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  // Card types array for navigation
  const cardTypes: ("total" | "checkedIn" | "notCheckedIn" | "checkedOut")[] = ["total", "checkedIn", "notCheckedIn", "checkedOut"]
  
  // Update selected card based on current index
  useEffect(() => {
    setSelectedCard(cardTypes[currentCardIndex])
  }, [currentCardIndex])

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // read selected event once per storage change
  const selectedEventId = useMemo(() => {
    if (!mounted) return null
    try {
      const saved = localStorage.getItem("exp_selected_event")
      if (saved && saved !== '""' && saved !== "null" && saved !== "undefined") {
        const parsed = Number(saved.replace(/"/g, ""))
        if (!Number.isNaN(parsed)) return parsed
      }
    } catch {}
    return null
  }, [events, allGuests, mounted])

  // load events
  useEffect(() => {
    ;(async () => {
      try {
        const response = await api.getEvents()
        const data = await response.json()
        const sorted = data.sort((a: Event, b: Event) => +new Date(a.date) - +new Date(b.date))
        setEvents(sorted)
      } catch {
        setEvents([])
      }
    })()
  }, [])

  // core loader for guests
  const loadGuests = async () => {
    setLoading(true)
    try {
      const response = await api.getGuests()
      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const payload = await response.json()
      const list = Array.isArray(payload?.guests) ? payload.guests : []
      setAllGuests(list)
    } catch (e) {
      console.error('Error loading guests:', e)
      addNotification("Lỗi khi tải dữ liệu khách. Vui lòng thử lại.", "error")
      setAllGuests([])
    } finally {
      setLoading(false)
    }
  }

  // initial + refresh on storage signals
  useEffect(() => {
    loadGuests()
  }, [])

  // Auto switch to scanned view if there are checked-in guests
  useEffect(() => {
    if (allGuests.length > 0) {
      const guestsForEvent = allGuests.filter((g: any) =>
        selectedEventId ? g?.event_id === selectedEventId : true
      )
      const scanned = guestsForEvent.filter((g: any) => g?.checkin_status === "checked_in")
      
      // If there are checked-in guests and no card is selected, auto-select checkedIn view
      if (scanned.length > 0 && selectedCard === null) {
        setSelectedCard("checkedIn")
      }
    }
  }, [allGuests, selectedEventId, selectedCard])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "exp_selected_event" || e.key === "exp_guests_updated") {
        loadGuests()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // when camera toggles on, ensure fresh data
  useEffect(() => {
    if (isScannerActive) loadGuests()
  }, [isScannerActive])

  // notifications
  const addNotification = (
    message: string,
    type: Notification["type"] = "info",
    undoAction?: () => void
  ) => {
    const id = Date.now().toString()
    const n: Notification = { id, message, type, visible: true, undoAction }
    setNotifications(prev => [...prev, n].slice(-4))

    // auto hide
    const autoHideMs = undoAction ? 6000 : 4000
    setTimeout(() => {
      setNotifications(prev => prev.map(x => (x.id === id ? { ...x, visible: false } : x)))
      setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== id)), 300)
    }, autoHideMs)
  }

  // manual checkin
  const handleCheckIn = async () => {
    if (!qrCode.trim()) {
      addNotification("Vui lòng nhập mã QR", "warning")
      return
    }
    try {
      const response = await api.checkinGuest({ qr_code: qrCode })
      const data = await response.json()

      if (data && data.message === "ok") {
        console.log('=== CHECKIN SUCCESS DATA ===')
        console.log('Full API Response:', data)
        console.log('Guest data:', data.guest)
        console.log('checked_in_at:', data.checked_in_at)
        
        const time = new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
        addNotification(`Check-in thành công!\nChào mừng ${data.guest.name}\n${time}`, "success")
        setQrCode("")
        
        // Lưu thông tin khách hàng vừa check-in
        const checkedInGuest: CheckedInGuest = {
          id: data.guest.id,
          name: data.guest.name,
          title: data.guest.title,
          position: data.guest.position,
          company: data.guest.company,
          tag: data.guest.tag,
          email: data.guest.email,
          phone: data.guest.phone,
          checked_in_at: data.checked_in_at,
          checkin_method: "manual",
          checkin_status: "checked_in",
          event_id: data.guest.event_id,
          event_name: data.guest.event_name
        }
        console.log('=== CHECKED IN GUEST OBJECT ===')
        console.log('checkedInGuest:', checkedInGuest)
        setRecentlyCheckedInGuest(checkedInGuest)
        
        // Ẩn thông tin sau 10 giây
        setTimeout(() => {
          setRecentlyCheckedInGuest(null)
        }, 10000)
        
        await loadGuests()
        
        // Auto switch to checkedIn view after successful check-in
        setSelectedCard("checkedIn")
      } else if (response.status === 409) {
        console.log('=== GUEST ALREADY CHECKED IN ===')
        console.log('API Response:', data)
        
        const checkinTime = new Date(data.checked_in_at).toLocaleString("vi-VN", { 
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit", 
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
        addNotification(`⚠️ ${data.guest?.name || "Khách"} đã check-in trước đó\nThời gian: ${checkinTime}`, "warning")
        
        // Hiển thị thông tin khách đã check-in trước đó
        if (data.guest) {
          const checkedInGuest: CheckedInGuest = {
            id: data.guest.id,
            name: data.guest.name,
            title: data.guest.title,
            position: data.guest.position,
            company: data.guest.company,
            tag: data.guest.tag,
            email: data.guest.email,
            phone: data.guest.phone,
            checked_in_at: data.checked_in_at,
            checkin_method: "qr",
            checkin_status: "checked_in",
            event_id: data.guest.event_id,
            event_name: data.guest.event_name
          }
          console.log('Setting recentlyCheckedInGuest for already checked-in:', checkedInGuest)
          setRecentlyCheckedInGuest(checkedInGuest)
          
          // Ẩn thông tin sau 10 giây
          setTimeout(() => {
            setRecentlyCheckedInGuest(null)
          }, 10000)
        }
      } else if (response.status === 410) {
        addNotification("Token đã hết hạn\nVui lòng tạo mã QR mới", "error")
      } else {
        addNotification(`Check-in thất bại\n${data.message || "Lỗi không xác định"}`, "error")
      }
    } catch {
      addNotification("Lỗi kết nối\nVui lòng thử lại", "error")
    }
  }

  // scanner checkin
  const handleQRScan = async (qrData: string) => {
    try {
      const token = qrData.trim()
      
      // Hiển thị instant feedback ngay lập tức
      console.log('=== INSTANT CHECKIN FEEDBACK ===')
      const instantCheckinEvent = new CustomEvent('instant-checkin', {
        detail: { token, guestName: 'Đang xử lý...' }
      })
      window.dispatchEvent(instantCheckinEvent)
      
      // BroadcastChannel để thông báo instant check-in
      console.log('=== SENDING INSTANT CHECKIN BROADCAST ===')
      const channel = new BroadcastChannel('checkin-channel')
      const instantMessage = {
        type: 'instant-checkin',
        token: token,
        guestId: null, // Sẽ cập nhật sau khi có response
        timestamp: Date.now()
      }
      console.log('Sending instant message:', instantMessage)
      channel.postMessage(instantMessage)
      channel.close()
      
      // Trigger localStorage event để đảm bảo trang thiệp mời nhận được
      console.log('=== TRIGGERING INSTANT STORAGE EVENT ===')
      localStorage.setItem('exp_instant_checkin', JSON.stringify({
        type: 'instant-checkin',
        token: token,
        timestamp: Date.now()
      }))
      
      // Trigger URL hash để đảm bảo trang thiệp mời nhận được
      console.log('=== TRIGGERING URL HASH EVENT ===')
      const hashValue = `instant-checkin-${Date.now()}`
      window.location.hash = hashValue
      setTimeout(() => {
        window.location.hash = ''
      }, 100)
      
      // Trigger document.title để đảm bảo trang thiệp mời nhận được
      console.log('=== TRIGGERING DOCUMENT TITLE EVENT ===')
      const originalTitle = document.title
      document.title = `INSTANT_CHECKIN_${Date.now()}`
      setTimeout(() => {
        document.title = originalTitle
      }, 100)
      
      const response = await api.checkinGuest({ qr_code: token })
      const data = await response.json()

      console.log('=== QR SCAN API RESPONSE ===')
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Full API Response:', data)
      console.log('Guest data:', data.guest)
      console.log('checked_in_at:', data.checked_in_at)

      if (data && response.ok) {
        console.log('=== CHECKIN SUCCESS DEBUG ===')
        console.log('API Response:', data)
        console.log('Guest data:', data.guest)
        
        const time = new Date().toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
        addNotification(`Check-in thành công!\nChào mừng ${data.guest.name}\n${time}`, "success")
        setShowSuccessAnimation(true)
        setTimeout(() => setShowSuccessAnimation(false), 1500)
        
        // Lưu thông tin khách hàng vừa check-in
        const checkedInGuest: CheckedInGuest = {
          id: data.guest.id,
          name: data.guest.name,
          title: data.guest.title,
          position: data.guest.position,
          company: data.guest.company,
          tag: data.guest.tag,
          email: data.guest.email,
          phone: data.guest.phone,
          checked_in_at: data.checked_in_at,
          checkin_method: "qr",
          checkin_status: "checked_in",
          event_id: data.guest.event_id,
          event_name: data.guest.event_name
        }
        console.log('=== CREATING CHECKED IN GUEST OBJECT ===')
        console.log('data.guest.id:', data.guest.id)
        console.log('data.guest.name:', data.guest.name)
        console.log('data.guest.title:', data.guest.title)
        console.log('data.guest.position:', data.guest.position)
        console.log('data.guest.company:', data.guest.company)
        console.log('data.guest.tag:', data.guest.tag)
        console.log('data.guest.email:', data.guest.email)
        console.log('data.guest.phone:', data.guest.phone)
        console.log('data.checked_in_at:', data.checked_in_at)
        console.log('data.guest.event_id:', data.guest.event_id)
        console.log('data.guest.event_name:', data.guest.event_name)
        console.log('Final checkedInGuest object:', checkedInGuest)
        setRecentlyCheckedInGuest(checkedInGuest)
        
        // BroadcastChannel để thông báo check-in thành công với guestId thực
        console.log('=== SENDING SUCCESS CHECKIN BROADCAST ===')
        const successChannel = new BroadcastChannel('checkin-channel')
        const successMessage = {
          type: 'instant-checkin',
          token: token,
          guestId: data.guest.id,
          guestName: data.guest.name,
          timestamp: Date.now()
        }
        console.log('Sending success message:', successMessage)
        successChannel.postMessage(successMessage)
        successChannel.close()
        
        // Ẩn thông tin sau 10 giây
        setTimeout(() => {
          setRecentlyCheckedInGuest(null)
        }, 10000)
        
        await loadGuests()
        
        // Auto switch to checkedIn view after successful check-in
        setSelectedCard("checkedIn")
      } else if (response.status === 409) {
        console.log('=== GUEST ALREADY CHECKED IN ===')
        console.log('API Response:', data)
        
        const checkinTime = new Date(data.checked_in_at).toLocaleString("vi-VN", { 
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit", 
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        })
        addNotification(`⚠️ ${data.guest?.name || "Khách"} đã check-in trước đó\nThời gian: ${checkinTime}`, "warning")
        
        // Hiển thị thông tin khách đã check-in trước đó
        if (data.guest) {
          const checkedInGuest: CheckedInGuest = {
            id: data.guest.id,
            name: data.guest.name,
            title: data.guest.title,
            position: data.guest.position,
            company: data.guest.company,
            tag: data.guest.tag,
            email: data.guest.email,
            phone: data.guest.phone,
            checked_in_at: data.checked_in_at,
            checkin_method: "qr",
            checkin_status: "checked_in",
            event_id: data.guest.event_id,
            event_name: data.guest.event_name
          }
          console.log('Setting recentlyCheckedInGuest for already checked-in:', checkedInGuest)
          setRecentlyCheckedInGuest(checkedInGuest)
          
          // Ẩn thông tin sau 10 giây
          setTimeout(() => {
            setRecentlyCheckedInGuest(null)
          }, 10000)
        }
      } else if (response.status === 410) {
        addNotification("Token đã hết hạn\nVui lòng tạo mã QR mới", "error")
      } else {
        addNotification(`Check-in thất bại\n${data.message || "Lỗi không xác định"}`, "error")
      }
    } catch {
      addNotification("Lỗi kết nối\nVui lòng thử lại", "error")
    }
  }

  const handleScannerError = (error: string) => {
    setScannerError(error)
    if (/camera|permission|access/i.test(error)) setIsScannerActive(false)
  }

  // edit/checkin status
  const openEditPopup = async (guest: CheckedInGuest) => {
    setEditCheckin({ isOpen: true, guest, loading: true })
    
    try {
      // Fetch all guests to get detailed information
      const response = await api.getGuests()
      if (!response.ok) throw new Error("Failed to fetch guest details")
      
      const payload = await response.json()
      const allGuests = Array.isArray(payload?.guests) ? payload.guests : []
      
      // Find the specific guest with detailed information
      const detailedGuestData = allGuests.find((g: any) => g.id === guest.id)
      
      if (detailedGuestData) {
        // Update the guest with detailed information from database
        const detailedGuest: CheckedInGuest = {
          ...guest,
          title: detailedGuestData.title || guest.title,
          position: detailedGuestData.role || guest.position,
          company: detailedGuestData.organization || guest.company,
          email: detailedGuestData.email || guest.email,
          phone: detailedGuestData.phone || guest.phone,
          tag: detailedGuestData.tag || guest.tag,
        }
        
        setEditCheckin({ isOpen: true, guest: detailedGuest, loading: false })
      } else {
        // If guest not found in detailed data, use existing data
        setEditCheckin({ isOpen: true, guest, loading: false })
      }
    } catch (error) {
      console.error("Error fetching guest details:", error)
      addNotification("Lỗi khi tải thông tin chi tiết khách", "error")
      setEditCheckin({ isOpen: false, guest: null, loading: false })
    }
  }
  
  const closeEditPopup = () => setEditCheckin({ isOpen: false, guest: null, loading: false })

  const handleUpdateGuest = async (guest: CheckedInGuest) => {
    try {
      const res = await api.updateGuest(guest.id.toString(), {
        name: guest.name,
        title: guest.title || "",
        role: guest.position || "",
        organization: guest.company || "",
        tag: guest.tag || "",
        email: guest.email || "",
        phone: guest.phone || "",
        checkin_status: "checked_in",
        checked_in_at: guest.checked_in_at
      })
      
      if (!res.ok) throw new Error("Update failed")

      // Refresh data after update
      await loadGuests()
      addNotification(
        `Đã cập nhật thông tin ${guest.name}\nThành công`,
        "success"
      )
      closeEditPopup()
    } catch {
      addNotification("Lỗi khi cập nhật thông tin\nVui lòng thử lại", "error")
    }
  }

  const handleCheckout = async (guest: CheckedInGuest) => {
    try {
      const res = await api.updateGuest(guest.id.toString(), {
        name: guest.name,
        title: guest.title || "",
        role: guest.position || "",
        organization: guest.company || "",
        tag: guest.tag || "",
        email: guest.email || "",
        phone: guest.phone || "",
        checkin_status: "checked_out",
      })
      
      if (!res.ok) throw new Error("Checkout failed")

      // Refresh data after checkout
      await loadGuests()
      addNotification(
        `Đã check-out ${guest.name}\nThành công`,
        "success"
      )
      closeEditPopup()
    } catch {
      addNotification("Lỗi khi check-out\nVui lòng thử lại", "error")
    }
  }

  // bulk
  const toggleGuestSelection = (guestId: number) => {
    setSelectedGuests(prev => {
      const s = new Set(prev)
      s.has(guestId) ? s.delete(guestId) : s.add(guestId)
      return s
    })
  }
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(v => !v)
    setSelectedGuests(new Set())
    setShowActionBubble(false)
  }
  useEffect(() => {
    setShowActionBubble(isMultiSelectMode && selectedGuests.size > 0)
  }, [isMultiSelectMode, selectedGuests])

  const currentDisplayList = useMemo(() => {
    // derived lists for cards
    const guestsForEvent = allGuests.filter((g: any) =>
      selectedEventId ? g?.event_id === selectedEventId : true
    )
    const acceptedForEvent = guestsForEvent.filter((g: any) => g?.rsvp_status === "accepted")
    const checkedIn = guestsForEvent.filter((g: any) => g?.checkin_status === "checked_in")
    const checkedOut = guestsForEvent.filter((g: any) => g?.checkin_status === "checked_out")
    const notCheckedIn = acceptedForEvent.filter((g: any) => g?.checkin_status === "not_arrived")

    if (selectedCard === "checkedIn") return checkedIn.map(mapGuest)
    if (selectedCard === "notCheckedIn") return notCheckedIn.map(mapGuestWithoutCheckinTime)
    if (selectedCard === "checkedOut") return checkedOut.map(mapGuest)
    if (selectedCard === "total") return [...checkedIn, ...checkedOut].map(mapGuest)
    // Default: show all checked-in guests (both checked_in and checked_out)
    return [...checkedIn, ...checkedOut].map(mapGuest)
  }, [selectedCard, allGuests, selectedEventId])

  // stats
  const stats = useMemo(() => {
    const guestsForEvent = allGuests.filter((g: any) =>
      selectedEventId ? g?.event_id === selectedEventId : true
    )
    const acceptedForEvent = guestsForEvent.filter((g: any) => g?.rsvp_status === "accepted")
    const checkedIn = guestsForEvent.filter((g: any) => g?.checkin_status === "checked_in").length
    const checkedOut = guestsForEvent.filter((g: any) => g?.checkin_status === "checked_out").length
    const totalCheckedIn = checkedIn + checkedOut
    const total = acceptedForEvent.length
    const notCheckedIn = acceptedForEvent.filter((g: any) => g?.checkin_status === "not_arrived").length
    return { total, checkedIn, checkedOut, totalCheckedIn, notCheckedIn }
  }, [allGuests, selectedEventId])

  // search + pagination
  const filteredGuests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return currentDisplayList
    return currentDisplayList.filter(g => {
      // Search in all relevant fields including position and company
      const searchFields = [g.name, g.title, g.position, g.company, g.tag, g.email, g.phone]
        .filter(Boolean)
        .some((v: string) => v.toLowerCase().includes(q))
      
      return searchFields
    })
  }, [currentDisplayList, searchTerm])

  const totalPages = Math.ceil(filteredGuests.length / guestsPerPage) || 1
  const startIndex = (currentPage - 1) * guestsPerPage
  const endIndex = startIndex + guestsPerPage
  const pageGuests = filteredGuests.slice(startIndex, endIndex)

  useEffect(() => setCurrentPage(1), [searchTerm, selectedCard])

  // helpers to map guest shapes
  function mapGuest(g: any): CheckedInGuest {
    return {
      id: g.id,
      name: g.name,
      title: g.title,
      position: g.position || "", // Use position directly from API
      company: g.company || "", // Use company directly from API
      tag: g.tag,
      email: g.email,
      phone: g.phone,
      checked_in_at: g.checked_in_at || "",
      checkin_method: g.checkin_method || "manual",
      checkin_status: g.checkin_status || "not_arrived", // Add checkin_status
      event_id: g.event_id,
      event_name: g.event_name,
    }
  }
  function mapGuestWithoutCheckinTime(g: any): CheckedInGuest {
    return {
      id: g.id,
      name: g.name,
      title: g.title,
      position: g.position || "", // Use position directly from API
      company: g.company || "", // Use company directly from API
      tag: g.tag,
      email: g.email,
      phone: g.phone,
      checked_in_at: "",
      checkin_method: g.checkin_method || "manual",
      checkin_status: g.checkin_status || "not_arrived", // Add checkin_status
      event_id: g.event_id,
      event_name: g.event_name,
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Đang tải...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Notifications */}
      <Portal>
        <div className="fixed top-4 right-4 sm:top-16 sm:right-0 z-[60] space-y-2 w-[calc(100vw-2rem)] sm:w-[200px] sm:max-w-xs max-w-sm">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-l-2xl shadow-2xl backdrop-blur-md border transition-all duration-500 transform ${
                n.visible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
              } ${
                n.type === "success"
                  ? "border-emerald-400/30 bg-gradient-to-br from-emerald-600/40 via-emerald-500/30 to-emerald-400/20 text-white"
                  : n.type === "error"
                  ? "border-rose-400/30 bg-gradient-to-br from-rose-600/40 via-rose-500/30 to-rose-400/20 text-white"
                  : n.type === "warning"
                  ? "border-amber-400/30 bg-gradient-to-br from-amber-600/40 via-amber-500/30 to-amber-400/20 text-white"
                  : "border-cyan-400/30 bg-gradient-to-br from-cyan-600/40 via-cyan-500/30 to-cyan-400/20 text-white"
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {n.type === "success" && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-emerald-500/20 rounded-full flex-none flex items-center justify-center border border-emerald-400/30">
                    <Icons.Success className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />
                  </span>
                )}
                {n.type === "error" && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-rose-500/20 rounded-full flex-none flex items-center justify-center border border-rose-400/30">
                    <Icons.Error className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" />
                  </span>
                )}
                {n.type === "warning" && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-amber-500/20 rounded-full flex-none flex items-center justify-center border border-amber-400/30">
                    <Icons.Warning className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
                  </span>
                )}
                {n.type === "info" && (
                  <span className="w-6 h-6 sm:w-8 sm:h-8 aspect-square bg-cyan-500/20 rounded-full flex-none flex items-center justify-center border border-cyan-400/30">
                    <Icons.Info className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
                  </span>
                )}
                <div className="relative overflow-hidden flex-1 min-w-0">
                  <div className="text-sm font-medium leading-relaxed whitespace-pre-line">{n.message}</div>
                  {n.undoAction && (
                    <button
                      onClick={() => {
                        n.undoAction?.()
                        setNotifications(prev => prev.filter(x => x.id !== n.id))
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

      {/* Success animation */}
      {showSuccessAnimation && (
        <Portal>
          <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
            <div className="relative">
              <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">
            Check-in
          </h1>
          {selectedEventId && (
            <div className="text-sm text-white/60 mt-1">
              Event ID: {selectedEventId}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadGuests}
            className="refresh-btn px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm mới</span>
          </button>



          {/* Multi-select toggle */}
          <button
            onClick={toggleMultiSelectMode}
            className="multi-select-btn px-3 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-indigo-500/30 hover:border-blue-400/50 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{isMultiSelectMode ? "Hủy" : "Chọn"}</span>
          </button>
        </div>
      </div>

      {/* Cards - Desktop Grid Layout, Mobile Horizontal Scroll */}
      <div className="relative mb-8 mt-4">
      {/* Desktop: Grid Layout */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 lg:gap-6 py-4">
          {/* Total */}
          <div
            className={`checkin-card-total group relative backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedCard === "total"
                ? "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-400/60 shadow-lg shadow-blue-500/30"
                : "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
            }`}
            onClick={() => setSelectedCard(selectedCard === "total" ? null : "total")}
          >
            <div className="relative flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 lg:p-3 bg-cyan-500/20 rounded-xl">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-sm lg:text-base text-cyan-300/80 font-medium">Tổng (RSVP)</div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="mt-2 h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Checked In */}
          <div
            className={`checkin-card-checkedIn group relative backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedCard === "checkedIn"
                ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/60 shadow-lg shadow-green-500/30"
                : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
            }`}
            onClick={() => setSelectedCard(selectedCard === "checkedIn" ? null : "checkedIn")}
          >
            <div className="relative flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 lg:p-3 bg-green-500/20 rounded-xl">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="text-sm lg:text-base text-green-300/80 font-medium">Đã check-in</div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.checkedIn}</div>
            </div>
            <div className="mt-2 h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{ width: `${stats.total ? (stats.checkedIn / stats.total) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Not Checked In */}
          <div
            className={`checkin-card-notCheckedIn group relative backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedCard === "notCheckedIn"
                ? "bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-400/60 shadow-lg shadow-orange-500/30"
                : "bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
            }`}
            onClick={() => setSelectedCard(selectedCard === "notCheckedIn" ? null : "notCheckedIn")}
          >
            <div className="relative flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 lg:p-3 bg-orange-500/20 rounded-xl">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm lg:text-base text-orange-300/80 font-medium">Chưa check-in</div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.notCheckedIn}</div>
            </div>
            <div className="mt-2 h-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full" style={{ width: `${stats.total ? (stats.notCheckedIn / stats.total) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Checked Out */}
          <div
            className={`checkin-card-checkedOut group relative backdrop-blur-sm rounded-xl lg:rounded-2xl p-4 lg:p-6 transition-all duration-300 cursor-pointer overflow-hidden ${
              selectedCard === "checkedOut"
                ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/60 shadow-lg shadow-blue-500/30"
                : "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
            }`}
            onClick={() => setSelectedCard(selectedCard === "checkedOut" ? null : "checkedOut")}
          >
            <div className="relative flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 lg:p-3 bg-blue-500/20 rounded-xl">
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm lg:text-base text-blue-300/80 font-medium">Đã check-out</div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-white">{stats.checkedOut}</div>
            </div>
            <div className="mt-2 h-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" style={{ width: `${stats.total ? (stats.checkedOut / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* Mobile: Horizontal Scrollable */}
        <div 
          className="md:hidden overflow-x-auto scrollbar-hide py-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex gap-3 min-w-max px-2">
            {/* Total */}
            <div
              className={`checkin-card-total group relative backdrop-blur-sm rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 w-64 ${
                selectedCard === "total"
                  ? "bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-400/60 shadow-lg shadow-blue-500/30"
                  : "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
              }`}
              onClick={() => setSelectedCard(selectedCard === "total" ? null : "total")}
            >
              <div className="relative flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-xs text-cyan-300/80 font-medium">Tổng (RSVP)</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Checked In */}
            <div
              className={`checkin-card-checkedIn group relative backdrop-blur-sm rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 w-64 ${
                selectedCard === "checkedIn"
                  ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-400/60 shadow-lg shadow-green-500/30"
                  : "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
              }`}
              onClick={() => setSelectedCard(selectedCard === "checkedIn" ? null : "checkedIn")}
            >
              <div className="relative flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="text-xs text-green-300/80 font-medium">Đã check-in</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.checkedIn}</div>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{ width: `${stats.total ? (stats.checkedIn / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Not Checked In */}
            <div
              className={`checkin-card-notCheckedIn group relative backdrop-blur-sm rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 w-64 ${
                selectedCard === "notCheckedIn"
                  ? "bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-400/60 shadow-lg shadow-orange-500/30"
                  : "bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20"
              }`}
              onClick={() => setSelectedCard(selectedCard === "notCheckedIn" ? null : "notCheckedIn")}
            >
              <div className="relative flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-xs text-orange-300/80 font-medium">Chưa check-in</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.notCheckedIn}</div>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full" style={{ width: `${stats.total ? (stats.notCheckedIn / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Checked Out */}
            <div
              className={`checkin-card-checkedOut group relative backdrop-blur-sm rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden flex-shrink-0 w-64 ${
                selectedCard === "checkedOut"
                  ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-400/60 shadow-lg shadow-blue-500/30"
                  : "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20"
              }`}
              onClick={() => setSelectedCard(selectedCard === "checkedOut" ? null : "checkedOut")}
            >
              <div className="relative flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-xs text-blue-300/80 font-medium">Đã check-out</div>
                </div>
                <div className="text-2xl font-bold text-white">{stats.checkedOut}</div>
              </div>
              <div className="mt-2 h-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full" style={{ width: `${stats.total ? (stats.checkedOut / stats.total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Indicators - Mobile Only */}
        <div className="md:hidden absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full flex justify-center gap-2 mt-6">
          {cardTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentCardIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Search and Scanner - Mobile Inline */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="flex-1">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 text-sm"
            placeholder="Tìm khách..."
          />
        </div>
        
        {/* Scanner Button - Mobile Inline */}
        <button
          className={`scanner-btn px-3 py-2 rounded-lg border transition-all duration-300 flex items-center gap-1 text-sm font-medium ${
            isScannerActive 
              ? "bg-green-500/20 border-green-400/40 text-green-300 hover:bg-green-500/30" 
              : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
          }`}
          onClick={() => setIsScannerActive(v => !v)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="hidden sm:inline">{isScannerActive ? "Tắt camera" : "Bật camera"}</span>
        </button>
      </div>

      {/* Guests list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {pageGuests.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-white/60 text-lg mb-2">
              {selectedCard === "checkedIn" ? "Chưa có khách nào đã check-in" : 
               selectedCard === "notCheckedIn" ? "Chưa có khách nào chưa check-in" :
               selectedCard === "checkedOut" ? "Chưa có khách nào đã check-out" :
               selectedCard === "total" ? "Chưa có khách nào đã check-in hoặc check-out" : "Chưa có dữ liệu"}
            </div>
            <div className="text-white/40 text-sm">
              {selectedEventId ? `Event ID: ${selectedEventId}` : "Vui lòng chọn sự kiện"}
            </div>
          </div>
        ) : (
          pageGuests.map(guest => (
          <div
            key={guest.id}
            className={`guest-card rounded-xl p-3 sm:p-4 border bg-white/5 border-white/10 text-white transition-all duration-300 ${
              selectedGuests.has(guest.id) ? "ring-2 ring-cyan-400/60 bg-cyan-500/10" : ""
            } ${isMultiSelectMode ? "cursor-pointer" : ""}`}
            onClick={() => isMultiSelectMode && toggleGuestSelection(guest.id)}
          >
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-white text-sm sm:text-base truncate">{guest.name}</div>
                  {guest.checked_in_at && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      guest.checkin_status === "checked_out" 
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "bg-green-500/20 border border-green-500/30"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        guest.checkin_status === "checked_out" 
                          ? "bg-blue-400" 
                          : "bg-green-400"
                      }`}></div>
                      <span className={`text-xs font-medium ${
                        guest.checkin_status === "checked_out" 
                          ? "text-blue-300" 
                          : "text-green-300"
                      }`}>
                        {guest.checkin_status === "checked_out" ? "Đã check-out" : "Đã check-in"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-white/70 truncate">
                  {guest.title && `${guest.title}. `}
                  {guest.position && `${guest.position}`}
                </div>
                <div className="text-xs sm:text-sm text-white/60 truncate">
                  {guest.company && `🏢 ${guest.company}`}
                </div>
                {guest.checked_in_at && (
                  <div className="mt-1 text-xs text-white/60">{new Date(guest.checked_in_at).toLocaleString("vi-VN", {
                    timeZone: "Asia/Bangkok",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false
                  })}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isMultiSelectMode && (
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedGuests.has(guest.id) 
                      ? "bg-cyan-500 border-cyan-500" 
                      : "border-white/30"
                  }`}>
                    {selectedGuests.has(guest.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
                {!isMultiSelectMode && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      openEditPopup(guest)
                    }}
                    className="action-btn px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs sm:text-sm hover:bg-white/20 transition-colors"
                  >
                    Sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="pagination-btn px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm"
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <div className="text-white/70 text-sm px-3">
            Trang {currentPage} / {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="pagination-btn px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 transition-colors text-sm"
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      )}

      {/* Action bubble (only one real bubble) */}
      {isMultiSelectMode && selectedGuests.size > 0 && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[65]">
          <button
            className="action-bubble-btn w-14 h-14 sm:w-16 sm:h-16 bg-blue-500 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
            onClick={() => setShowActionBubble(v => !v)}
            aria-label="Mở thao tác nhiều mục"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {showActionBubble && (
            <div className="absolute bottom-16 sm:bottom-20 right-0 bg-black/95 backdrop-blur-md border border-white/30 rounded-2xl p-3 sm:p-4 shadow-2xl min-w-[280px] max-w-[calc(100vw-2rem)]">
              <div className="text-center mb-3 text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2">
                {isBulkProcessing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  `Đã chọn ${selectedGuests.size} khách`
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <ActionBtn 
                  label="Chấp nhận" 
                  color="green" 
                  onClick={() => bulk("accept", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Từ chối" 
                  color="red" 
                  onClick={() => bulk("reject", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Chờ phản hồi" 
                  color="yellow" 
                  onClick={() => bulk("pending", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Check-in" 
                  color="blue" 
                  onClick={() => bulk("checkin", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Check-out" 
                  color="orange" 
                  onClick={() => bulk("checkout", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Xóa" 
                  color="red" 
                  onClick={() => bulk("delete", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Export" 
                  color="purple" 
                  onClick={() => bulk("export", selectedGuests, setSelectedGuests, addNotification, loadGuests, setIsBulkProcessing, setSelectedCard, selectedEventId)} 
                  disabled={isBulkProcessing}
                />
                <ActionBtn 
                  label="Bỏ chọn" 
                  color="gray" 
                  onClick={() => setSelectedGuests(new Set())} 
                  disabled={isBulkProcessing}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scanner Panel - Show on all devices */}
      <div className="mt-6 space-y-4">
        {/* Desktop Scanner Button - Hidden on mobile */}
        <div className="hidden sm:block">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              className={`scanner-btn px-4 py-2.5 rounded-lg border transition-all duration-300 flex items-center gap-2 text-sm font-medium ${
                isScannerActive 
                  ? "bg-green-500/20 border-green-400/40 text-green-300 hover:bg-green-500/30" 
                  : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
              }`}
              onClick={() => setIsScannerActive(v => !v)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isScannerActive ? "Tắt camera" : "Bật camera"}
            </button>
            {scannerError && (
              <div className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                {scannerError}
              </div>
            )}
          </div>
        </div>

        {isScannerActive && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Camera Scanner */}
            <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <WorkingQRScanner onScan={handleQRScan} onError={handleScannerError} isActive={isScannerActive} />
            </div>
            
            {/* Recently Checked In Guest Card */}
            {recentlyCheckedInGuest ? (
              <div className="recently-checked-in-card rounded-xl border border-green-400/40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6 shadow-lg shadow-green-500/20">
                {(() => {
                  console.log('=== RENDERING GUEST INFO ===');
                  console.log('recentlyCheckedInGuest:', recentlyCheckedInGuest);
                  console.log('Title:', recentlyCheckedInGuest.title);
                  console.log('Position:', recentlyCheckedInGuest.position);
                  console.log('Company:', recentlyCheckedInGuest.company);
                  console.log('Email:', recentlyCheckedInGuest.email);
                  console.log('Phone:', recentlyCheckedInGuest.phone);
                  return null;
                })()}
                {(() => {
                  console.log('Event name:', recentlyCheckedInGuest.event_name);
                  console.log('checked_in_at:', recentlyCheckedInGuest.checked_in_at);
                  return null;
                })()}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <h3 className="text-green-200 font-semibold text-lg">Khách vừa check-in</h3>
                  <button
                    onClick={() => setRecentlyCheckedInGuest(null)}
                    className="ml-auto text-white/60 hover:text-white/80 transition-colors"
                  >
                    <Icons.x className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Name & Title */}
                  <div className="text-white font-medium text-lg">
                    {recentlyCheckedInGuest.title && `${recentlyCheckedInGuest.title} `}
                    {recentlyCheckedInGuest.name}
                  </div>
                  
                  {/* Position */}
                  {recentlyCheckedInGuest.position && (
                    <div className="text-green-100">
                      {recentlyCheckedInGuest.position}
                    </div>
                  )}
                  
                  {/* Company */}
                  {recentlyCheckedInGuest.company && (
                    <div className="text-green-100 text-sm">
                      {recentlyCheckedInGuest.company}
                    </div>
                  )}
                  
                  {/* Tag */}
                  {recentlyCheckedInGuest.tag && (
                    <div className="px-2 py-1 bg-green-500/30 text-green-200 text-xs rounded-full inline-block">
                      {recentlyCheckedInGuest.tag}
                    </div>
                  )}
                  
                  {/* Contact Info */}
                  <div className="space-y-1 pt-2 border-t border-green-400/20">
                    {recentlyCheckedInGuest.email && (
                      <div className="text-green-100 text-sm">
                        Email: {recentlyCheckedInGuest.email}
                      </div>
                    )}
                    
                    {recentlyCheckedInGuest.phone && (
                      <div className="text-green-100 text-sm">
                        Phone: {recentlyCheckedInGuest.phone}
                      </div>
                    )}
                  </div>
                  
                  {/* Event Info */}
                  {recentlyCheckedInGuest.event_name && (
                    <div className="text-green-100 text-sm pt-2 border-t border-green-400/20">
                      Sự kiện: {recentlyCheckedInGuest.event_name}
                    </div>
                  )}
                  
                  {/* Check-in Method */}
                  <div className="text-green-100 text-sm">
                    Phương thức: {recentlyCheckedInGuest.checkin_method === 'qr' ? 'Quét QR' : 'Thủ công'}
                  </div>
                  
                  {/* Check-in Time */}
                  <div className="text-green-200 text-sm pt-2 border-t border-green-400/20">
                    Check-in: {recentlyCheckedInGuest.checked_in_at ? 
                      new Date(recentlyCheckedInGuest.checked_in_at).toLocaleString("vi-VN", {
                        timeZone: "Asia/Bangkok",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      }) : 
                      new Date().toLocaleString("vi-VN", {
                        timeZone: "Asia/Bangkok",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 flex items-center justify-center">
                <div className="text-center text-white/60">
                  <Icons.QRCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Chờ quét mã QR để hiển thị thông tin khách</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual input */}
        <div className="space-y-3">
          <div className="text-sm text-white/70 font-medium">Hoặc nhập mã QR thủ công:</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 text-sm"
              placeholder="Nhập mã QR thủ công"
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
            />
            <button 
              onClick={handleCheckIn} 
              className="checkin-btn px-4 py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30 hover:border-cyan-400/60 transition-all duration-300 text-sm font-medium"
            >
              Check-in
            </button>
          </div>
        </div>
      </div>

      {/* CSS cho Check-in Cards với hiệu ứng hover */}
      <style jsx>{`
        /* Check-in Cards với hiệu ứng hover nhẹ */
        .checkin-card-total:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.2));
          border-color: rgba(6, 182, 212, 0.5);
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 20px rgba(6, 182, 212, 0.2);
        }
        
        .checkin-card-scanned:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
          border-color: rgba(34, 197, 94, 0.5);
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
        }
        
        .checkin-card-not-scanned:hover {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(239, 68, 68, 0.2));
          border-color: rgba(249, 115, 22, 0.5);
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2);
        }

        /* Hiệu ứng hover mạnh cho guest cards */
        .guest-card:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(8, 145, 178, 0.3));
          border-color: rgba(6, 182, 212, 0.8);
          transform: translateY(-5px) scale(1.05);
          box-shadow: 
            0 20px 40px rgba(6, 182, 212, 0.4), 
            0 0 30px rgba(6, 182, 212, 0.3),
            0 0 60px rgba(6, 182, 212, 0.2);
          z-index: 10;
        }

        /* Hiệu ứng glow cho guest cards */
        .guest-card:hover::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, 
            rgba(6, 182, 212, 0.5), 
            rgba(8, 145, 178, 0.5), 
            rgba(6, 182, 212, 0.5));
          border-radius: inherit;
          z-index: -1;
          animation: glow-pulse 2s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        /* Hiệu ứng hover mạnh cho tất cả buttons */
        button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Hiệu ứng hover cho refresh button */
        .refresh-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.3));
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-3px) scale(1.08);
          box-shadow: 
            0 15px 30px rgba(255, 255, 255, 0.2),
            0 0 25px rgba(255, 255, 255, 0.15);
        }

        /* Hiệu ứng hover cho multi-select button */
        .multi-select-btn:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(99, 102, 241, 0.4));
          border-color: rgba(59, 130, 246, 0.6);
          transform: translateY(-3px) scale(1.08);
          box-shadow: 
            0 15px 30px rgba(59, 130, 246, 0.3),
            0 0 25px rgba(59, 130, 246, 0.2);
        }

        /* Hiệu ứng hover cho scanner button */
        .scanner-btn:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
          border-color: rgba(34, 197, 94, 0.6);
          transform: translateY(-3px) scale(1.08);
          box-shadow: 
            0 15px 30px rgba(34, 197, 94, 0.3),
            0 0 25px rgba(34, 197, 94, 0.2);
        }

        /* Hiệu ứng hover cho check-in button */
        .checkin-btn:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(8, 145, 178, 0.4));
          border-color: rgba(6, 182, 212, 0.6);
          transform: translateY(-3px) scale(1.08);
          box-shadow: 
            0 15px 30px rgba(6, 182, 212, 0.3),
            0 0 25px rgba(6, 182, 212, 0.2);
        }

        /* Hiệu ứng hover cho action buttons trong guest cards */
        .action-btn:hover {
          transform: translateY(-2px) scale(1.1);
          box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.3),
            0 0 15px rgba(255, 255, 255, 0.1);
        }

        /* Hiệu ứng hover cho pagination buttons */
        .pagination-btn:hover {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.25));
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 
            0 8px 20px rgba(255, 255, 255, 0.1),
            0 0 15px rgba(255, 255, 255, 0.05);
        }

        /* Hiệu ứng hover cho action bubble button */
        .action-bubble-btn:hover {
          transform: translateY(-3px) scale(1.1);
          box-shadow: 
            0 20px 40px rgba(59, 130, 246, 0.4),
            0 0 30px rgba(59, 130, 246, 0.3);
        }

        /* Recently Checked In Guest Card */
        .recently-checked-in-card {
          animation: slideInFromRight 0.5s ease-out;
          border: 2px solid rgba(34, 197, 94, 0.4);
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
          box-shadow: 
            0 10px 25px rgba(34, 197, 94, 0.2),
            0 0 20px rgba(34, 197, 94, 0.1);
        }

        .recently-checked-in-card:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 
            0 15px 35px rgba(34, 197, 94, 0.3),
            0 0 30px rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.6);
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Horizontal scrollable cards */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Mobile touch effects */
        @media (max-width: 768px) {
          .checkin-card-total:active,
          .checkin-card-scanned:active,
          .checkin-card-not-scanned:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
          }
        }
        
        /* Desktop hover effects */
        @media (min-width: 769px) {
          .checkin-card-total:hover,
          .checkin-card-scanned:hover,
          .checkin-card-not-scanned:hover {
            cursor: pointer;
          }
        }
      `}</style>

      {/* Edit Guest Modal */}
      {editCheckin.isOpen && editCheckin.guest && mounted && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Thông tin chi tiết khách</h2>
                <button
                  onClick={closeEditPopup}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {editCheckin.loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <p className="text-white/70">Đang tải thông tin chi tiết...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Guest Information */}
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Tên khách</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.name}</div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Chức danh</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.title || 'Chưa có'}</div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Vị trí</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.position || 'Chưa có'}</div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Công ty</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.company || 'Chưa có'}</div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Email</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.email || 'Chưa có'}</div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Số điện thoại</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.phone || 'Chưa có'}</div>
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Tag</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.tag || 'Chưa có'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Thời gian check-in</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">
                          {editCheckin.guest.checked_in_at 
                            ? new Date(editCheckin.guest.checked_in_at).toLocaleString("vi-VN", { 
                                timeZone: "Asia/Bangkok",
                                year: "numeric",
                                month: "2-digit", 
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })
                            : 'Chưa có thông tin'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-white/70 text-sm font-medium mb-2">Phương thức check-in</label>
                        <div className="p-3 bg-white/5 rounded-lg text-white">{editCheckin.guest.checkin_method}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={closeEditPopup}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => handleCheckout(editCheckin.guest!)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Check-out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

function ActionBtn({ 
  label, 
  color, 
  onClick, 
  disabled = false 
}: { 
  label: string
  color: "green" | "red" | "yellow" | "blue" | "orange" | "purple" | "gray"
  onClick: () => void
  disabled?: boolean
}) {
  const colorMap: Record<string, string> = {
    green: "bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30",
    red: "bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30",
    yellow: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30",
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30",
    gray: "bg-gray-500/20 border-gray-500/30 text-gray-300 hover:bg-gray-500/30",
  }
  
  const disabledClasses = disabled 
    ? "opacity-50 cursor-not-allowed hover:scale-100" 
    : "hover:scale-105 active:scale-95"
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 sm:gap-2 rounded-xl px-2 sm:px-3 py-3 sm:py-4 border transition-all duration-300 transform ${colorMap[color]} ${disabledClasses}`}
    >
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${label === "Xóa" ? "bg-red-500" : "bg-white/10"}`}>
        {disabled ? (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : (
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-xs font-medium text-center leading-tight">{label}</span>
    </button>
  )
}

// bulk handler
async function bulk(
  kind: "accept" | "reject" | "pending" | "checkin" | "checkout" | "delete" | "export",
  selectedGuests: Set<number>,
  setSelectedGuests: (guests: Set<number>) => void,
  addNotification: (message: string, type: Notification["type"]) => void,
  loadGuests: () => Promise<void>,
  setIsBulkProcessing: (loading: boolean) => void,
  setSelectedCard: (card: "total" | "checkedIn" | "notCheckedIn" | "checkedOut" | null) => void,
  selectedEventId: number | null
) {
  if (selectedGuests.size === 0) {
    addNotification("Vui lòng chọn ít nhất một khách", "warning")
    return
  }

  if (!selectedEventId) {
    addNotification("Vui lòng chọn sự kiện trước khi thực hiện thao tác", "warning")
    return
  }

  // Confirmation for destructive actions
  if (kind === "delete") {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedGuests.size} khách đã chọn?`)) {
      return
    }
  }

  const guestIds = Array.from(selectedGuests)
  setIsBulkProcessing(true)
  
  try {
    let response: Response
    let message: string

    switch (kind) {
      case "checkin":
        const checkinData = { 
          guest_ids: guestIds,
          event_id: selectedEventId 
        }
        console.log("Sending bulk checkin data:", checkinData)
        response = await api.bulkCheckinGuests(checkinData)
        const result = await response.json()
        
        if (result.already_checked_in_count > 0) {
          const alreadyCheckedInDetails = result.already_checked_in.map((g: any) => {
            const checkinTime = new Date(g.checkin_time).toLocaleString("vi-VN", {
              timeZone: "Asia/Bangkok",
              year: "numeric",
              month: "2-digit", 
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
            return `${g.name} (${checkinTime})`
          }).join("\n")
          
          message = `✅ ${result.message}\n\n⚠️ Khách đã check-in trước đó:\n${alreadyCheckedInDetails}`
        } else {
          message = `✅ ${result.message}`
        }
        break
      case "checkout":
        response = await api.bulkCheckoutGuests({ guest_ids: guestIds })
        message = `Check-out thành công cho ${guestIds.length} khách`
        break
      case "delete":
        response = await api.bulkDeleteGuests({ guest_ids: guestIds })
        message = `Xóa thành công ${guestIds.length} khách`
        break
      case "export":
        // Export functionality - you can implement CSV export here
        addNotification("Chức năng export đang được phát triển", "info")
        return
      default:
        addNotification(`Chức năng ${kind} chưa được hỗ trợ`, "warning")
        return
    }

    if (response.ok) {
      addNotification(message, "success")
      setSelectedGuests(new Set())
      // Force refresh data
      await loadGuests()
      
      // Auto switch to checkedIn view after check-in
      if (kind === "checkin") {
        setSelectedCard("checkedIn")
      }
      
      console.log(`Bulk ${kind} successful for guests:`, guestIds)
    } else {
      const errorData = await response.json()
      console.error(`Bulk ${kind} failed:`, {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      })
      addNotification(
        `Lỗi ${response.status}: ${errorData.error || errorData.details || "Không thể thực hiện thao tác"}`,
        "error"
      )
    }
  } catch (error) {
    console.error(`Bulk ${kind} error:`, error)
    addNotification(`Lỗi kết nối khi thực hiện ${kind}`, "error")
  } finally {
    setIsBulkProcessing(false)
  }
}

