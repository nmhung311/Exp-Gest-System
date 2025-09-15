"use client"
import React, { useState, useEffect, useMemo, useCallback } from "react"
import CustomDropdown from "../../../components/CustomDropdown"
import Portal from "../../../components/Portal"
import { api, API_ENDPOINTS } from "@/lib/api"
interface Guest {
  id: number
  name: string
  title?: string
  position?: string
  company?: string
  tag?: string
  email?: string
  phone?: string
  rsvp_status: string
  checkin_status: string
  created_at: string
  event_id?: number
  event_name?: string
}

interface Event {
  id: number
  name: string
  date: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
}

export default function GuestsPage(){
  const [text, setText] = useState(`[]`)
  const [result, setResult] = useState<string>("")
  const [importType, setImportType] = useState<"json" | "csv">("json")
  const [guests, setGuests] = useState<Guest[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "declined">("all")
  const [eventFilter, setEventFilter] = useState<string>("")
  const [copyMessage, setCopyMessage] = useState("")
  const [copyType, setCopyType] = useState<'success' | 'error' | 'warning' | 'info'>('success')
  const [showPopup, setShowPopup] = useState(false)
  const [popupVisible, setPopupVisible] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

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
    checkin_status: "not_arrived"
  })
  const [currentPage, setCurrentPage] = useState(1)
  const guestsPerPage = 6
  const [showQRPopup, setShowQRPopup] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState("")
  
  // Multiple selection states
  const [selectedGuests, setSelectedGuests] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Export states
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel')
  const [showExportPopup, setShowExportPopup] = useState(false)
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('selected')

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

  // Cleanup timer on unmount

  async function loadGuests() {
    setLoading(true)
    try {
      const res = await fetch(API_ENDPOINTS.GUESTS)
      console.log("Load guests response:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("Guests data:", data)
        setGuests(data.guests || [])
      } else {
        console.error("Failed to load guests:", res.status, res.statusText)
      }
    } catch (e) {
      console.error("Error loading guests:", e)
    } finally {
      setLoading(false)
    }
  }

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
      setShowQRPopup(true)
      
      // Lấy token mới và thông tin thời gian hết hạn
      const tokenResponse = await fetch(`http://localhost:5001/api/guests/${guest.id}/qr`, {
        method: 'POST'
      })
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        console.log("Token data received:", tokenData)
        
        // Tạo URL cho QR code với timestamp để tránh cache
        const qrUrl = `http://localhost:5001/api/guests/${guest.id}/qr-image?t=${Date.now()}`
        setQrImageUrl(qrUrl)
      } else {
        showToast("Lỗi tạo QR", "error")
      }
    } catch (e) {
      showToast("Lỗi tải QR", "error")
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
      setResult("❌ Vui lòng chọn sự kiện trước khi thực hiện hành động")
      return
    }
    if (selectedGuests.size === 0) return
    
    try {
      const response = await fetch("http://localhost:5001/api/guests/bulk-checkin", {
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
            showToast("", "success")
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`❌ Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`❌ Lỗi: ${error}`)
    }
  }

  const bulkCheckOut = async () => {
    if (!eventFilter) {
      setResult("❌ Vui lòng chọn sự kiện trước khi thực hiện hành động")
      return
    }
    if (selectedGuests.size === 0) return
    
    try {
      const response = await fetch("http://localhost:5001/api/guests/bulk-checkout", {
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
            showToast("", "success")
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`❌ Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`❌ Lỗi: ${error}`)
    }
  }

  const bulkDelete = async () => {
    if (!eventFilter) {
      setResult("❌ Vui lòng chọn sự kiện trước khi thực hiện hành động")
      return
    }
    if (selectedGuests.size === 0) return
    
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedGuests.size} khách đã chọn?`)) {
      return
    }
    
    try {
      const response = await fetch("http://localhost:5001/api/guests/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_ids: Array.from(selectedGuests)
        })
      })
      
      if (response.ok) {
        showToast(`Xóa ${selectedGuests.size}!`, "success")
        clearSelection()
        loadGuests()
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
            showToast("", "success")
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`❌ Lỗi: ${error}`)
      }
    } catch (error) {
      setResult(`❌ Lỗi: ${error}`)
    }
  }


  // CRUD Functions
  const openGuestModal = useCallback((guest?: Guest) => {
    console.log("Opening guest modal...")
    console.log("Current eventFilter:", eventFilter)
    console.log("Available events:", events)
    console.log("Is editing guest:", !!guest)
    
    if (guest) {
      console.log("Guest data for editing:", guest)
      console.log("Guest checkin_status:", guest.checkin_status)
      setEditingGuest(guest)
      setGuestForm({
        name: guest.name || "",
        title: guest.title || "",
        role: guest.position || "",
        organization: guest.company || "",
        tag: guest.tag || "",
        email: guest.email || "",
        phone: guest.phone || "",
        event_id: guest.event_id?.toString() || "",
        checkin_status: guest.checkin_status // Sử dụng trạng thái thực tế của khách
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
        checkin_status: "not_arrived" // Mặc định chưa đến khi thêm mới
      })
    }
    setShowGuestModal(true)
  }, [eventFilter, events])

  async function saveGuest() {
    console.log("Saving guest...")
    console.log("Guest form data:", guestForm)
    console.log("Current eventFilter:", eventFilter)
    console.log("Available events:", events)
    
    try {
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
          setResult("❌ Vui lòng tạo sự kiện trước khi thêm khách mời")
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
        checkin_status: guestForm.checkin_status
      }
      
      console.log("Sending guest data:", guestData)
      
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
        showToast(editingGuest ? "Cập nhật!" : "Thêm!", "success")
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
            showToast("", "success")
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        console.error("API error:", error)
        setResult(`❌ Lỗi: ${error}`)
      }
    } catch (e: any) {
      console.error("Save guest error:", e)
      setResult(`❌ Lỗi kết nối: ${e.message}`)
    }
  }

  async function deleteGuest(guestId: number, guestName: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách mời "${guestName}"?`)) {
      return
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/guests/${guestId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        loadGuests()
        showToast("Xóa!", "success")
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
            showToast("", "success")
          }, 300)
        }, 2000)
      } else {
        const error = await response.text()
        setResult(`❌ Lỗi: ${error}`)
      }
    } catch (e: any) {
      setResult(`❌ Lỗi kết nối: ${e.message}`)
    }
  }

  async function copyInviteLink(guestId: number, guestName: string) {
    try {
      // Tạo token mới cho khách mời
      const response = await fetch(`http://localhost:5001/api/guests/${guestId}/qr`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const inviteLink = `http://localhost:3000/invite/${data.token}`
        
        // Copy vào clipboard
        await navigator.clipboard.writeText(inviteLink)
        triggerHaptic('light')
        showToast(`Copy ${guestName}!`, "success")
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
            showToast("", "success")
          }, 300)
        }, 2000)
      } else {
        showToast("Lỗi link", "error")
        setTimeout(() => {
          setPopupVisible(false)
          setTimeout(() => {
            setShowPopup(false)
            showToast("", "success")
          }, 300)
        }, 2000)
      }
    } catch (e) {
      showToast("Lỗi copy", "error")
      setTimeout(() => {
        setPopupVisible(false)
        setTimeout(() => {
          setShowPopup(false)
          showToast("", "success")
        }, 300)
      }, 2000)
    }
  }

  // Handle JSON file upload
  function handleJsonFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.json')) {
      setResult("❌ Vui lòng chọn file JSON")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // Validate JSON
        JSON.parse(content)
        setText(content)
        setResult("✅ File JSON đã được tải thành công!")
      } catch (error) {
        setResult("❌ File JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.")
      }
    }
    reader.readAsText(file)
  }

  async function onImport(){
    setResult("Đang import...")
    try{
      let res
      if (importType === "json") {
        // Parse JSON first to validate
        let jsonData
        try {
          jsonData = JSON.parse(text)
        } catch (e) {
          setResult("❌ JSON không hợp lệ. Vui lòng kiểm tra lại cú pháp.")
          return
        }
        
        if (!eventFilter) {
          setResult("❌ Vui lòng chọn sự kiện trước khi import")
          return
        }
        // Thêm event_id vào tất cả khách mời được import (luôn gán vào sự kiện hiện tại)
        const guestsWithEvent = jsonData.map((guest: any) => ({
          ...guest,
          event_id: parseInt(eventFilter)
        }))
        
        res = await fetch("http://localhost:5001/api/guests/import",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify(guestsWithEvent)
        })
      } else {
        // CSV import
        const fileInput = document.getElementById('csvFile') as HTMLInputElement
        if (!fileInput?.files?.[0]) {
          setResult("❌ Vui lòng chọn file CSV")
          return
        }
        if (!eventFilter) {
          setResult("❌ Vui lòng chọn sự kiện trước khi import")
          return
        }
        const formData = new FormData()
        formData.append('file', fileInput.files[0])
        formData.append('event_id', eventFilter) // Gửi event_id hiện tại
        res = await fetch("http://localhost:5001/api/guests/import-csv",{
          method:"POST",
          body: formData
        })
      }
      
      if (!res.ok) {
        const errorText = await res.text()
        setResult(`❌ Lỗi server: ${res.status} - ${errorText}`)
        return
      }
      
      const data = await res.json()
      console.log("Import response:", data)
      
      if (data.imported > 0 && data.failed === 0) {
        setResult(`✅ Thành công! Đã import ${data.imported} khách mời.`)
      } else if (data.imported > 0 && data.failed > 0) {
        setResult(`⚠️ Import một phần: ${data.imported} thành công, ${data.failed} thất bại.`)
        if (data.errors && data.errors.length > 0) {
          setResult(prev => prev + `\n\nLỗi chi tiết:\n${data.errors.join('\n')}`)
        }
      } else {
        setResult(`❌ Import thất bại: ${data.failed} khách không thể import.`)
        if (data.errors && data.errors.length > 0) {
          setResult(prev => prev + `\n\nLỗi chi tiết:\n${data.errors.join('\n')}`)
        }
      }
      // Reload guests after import
      loadGuests()
      
      // Close modal after successful import
      if (data.imported > 0) {
        setTimeout(() => {
          setShowImportModal(false)
        }, 2000)
      }
    }catch(e:any){
      console.error("Import error:", e)
      setResult("❌ Lỗi kết nối: " + e?.message)
    }
  }

  // Filter and search guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           guest.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || guest.rsvp_status === statusFilter
      // Chỉ hiển thị khách của sự kiện được chọn (không có "Tất cả sự kiện")
      const matchesEvent = guest.event_id?.toString() === eventFilter
      return matchesSearch && matchesStatus && matchesEvent
    })
  }, [guests, searchTerm, statusFilter, eventFilter])

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

  // Export Functions
  const exportSelectedGuests = () => {
    if (selectedGuests.size === 0) return
    setExportScope('selected')
    setShowExportPopup(true)
  }

  const handleExportConfirm = async () => {
    let listToExport: Guest[] = []
    let filename = ''
    if (exportScope === 'selected') {
      listToExport = filteredGuests.filter(guest => selectedGuests.has(guest.id))
      filename = `khach_da_chon_${new Date().toISOString().split('T')[0]}`
    } else {
      listToExport = filteredGuests
      const selectedEvent = events.find(e => e.id.toString() === eventFilter)
      const eventName = selectedEvent ? selectedEvent.name : 'tat_ca_khach'
      filename = `${eventName}_${new Date().toISOString().split('T')[0]}`
    }
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
          showToast("", "success")
        }, 300)
      }, 2000)
    } catch (error) {
      setResult(`❌ Lỗi xuất file: ${error}`)
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
      guest.position || '',
      guest.company || '',
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
      const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true, compression: true })
      const blob = new Blob([wbArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
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
      guest.position || '',
      guest.company || '',
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
    <div className="space-y-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text">Quản lý khách mời</h1>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <button 
            onClick={() => openGuestModal()}
            className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Thêm khách</span>
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/20"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Import</span>
          </button>
          <button 
            onClick={exportAllGuests}
            className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Export</span>
          </button>
          <button 
            onClick={loadGuests}
            className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

        
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {/* Total Guests Card */}
        <div className="group relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-cyan-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
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
                <div className="text-xs sm:text-sm text-cyan-300/80 font-medium">Tổng khách mời</div>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="group relative bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:from-yellow-500/20 hover:to-orange-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
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
        <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
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
        <div className="group relative bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:from-red-500/20 hover:to-pink-500/20 hover:border-red-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20">
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
            
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <button
                onClick={bulkCheckIn}
                className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-lg hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/20"
                title="Check-in tất cả khách đã chọn"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Check-in</span>
              </button>
              
              <button
                onClick={bulkCheckOut}
                className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 rounded-lg hover:from-orange-500/30 hover:to-red-500/30 hover:border-orange-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-orange-500/20"
                title="Check-out tất cả khách đã chọn"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Check-out</span>
              </button>
              
              <button
                onClick={bulkDelete}
                className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 rounded-lg hover:from-red-500/30 hover:to-red-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
                title="Xóa tất cả khách đã chọn"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Xóa</span>
              </button>
              
              <button
                onClick={exportSelectedGuests}
                className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:from-indigo-500/30 hover:to-purple-500/30 hover:border-indigo-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-indigo-500/20"
                title="Xuất danh sách khách đã chọn"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Export</span>
              </button>
              
              <button
                onClick={clearSelection}
                className="group relative px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20"
                title="Bỏ chọn tất cả"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Bỏ chọn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guests List Section */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="truncate">Danh sách khách mời ({filteredGuests.length})</span>
          </h2>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Tìm kiếm khách mời..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm w-full sm:w-auto"
            />
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
              className="w-full sm:min-w-[160px]"
            />
            <CustomDropdown
              options={events.map(event => ({
                value: event.id.toString(),
                label: `${event.name} - ${event.date ? new Date(event.date).toLocaleDateString('vi-VN') : 'Không có ngày'}`
              }))}
              value={eventFilter}
              onChange={(value) => setEventFilter(value)}
              placeholder="Chọn sự kiện"
              className="w-full sm:min-w-[200px]"
            />
          </div>
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
              {guests.length === 0 ? "Import danh sách khách để bắt đầu" : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc"}
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
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
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
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleGuestSelection(guest.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
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
                          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                          <span className="hidden sm:inline font-medium">Sửa</span>
                        </button>
                        
                        <button 
                          onClick={() => copyInviteLink(guest.id, guest.name)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/20"
                          title="Sao chép liên kết mời"
                        >
                          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                          <span className="hidden sm:inline font-medium">Link</span>
                        </button>
                        
                        <button 
                          onClick={() => openQRPopup(guest)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:from-purple-500/30 hover:to-indigo-500/30 hover:border-purple-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/20"
                          title="Xem mã QR"
                        >
                          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                          </svg>
                          <span className="hidden sm:inline font-medium">QR</span>
                        </button>
                        
                        <button 
                          onClick={() => deleteGuest(guest.id, guest.name)}
                          className="group relative px-3 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
                          title="Xóa khách mời"
                        >
                          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
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
              {currentGuests.map((guest, index) => (
                <div key={guest.id} className="bg-black/20 border border-white/10 rounded-xl p-4 hover:bg-black/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGuests.has(guest.id)}
                        onChange={() => toggleGuestSelection(guest.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <div>
                        <div className="text-white font-medium text-sm">{guest.name}</div>
                        {guest.email && (
                          <div className="text-white/60 text-xs">{guest.email}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/60">#{startIndex + index + 1}</div>
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit mt-1 ${
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
                      <span className="text-white/60">Vai trò:</span> {guest.position || '-'}
                    </div>
                    <div>
                      <span className="text-white/60">Tổ chức:</span> {guest.company || '-'}
                    </div>
                    <div>
                      <span className="text-white/60">Tag:</span> {guest.tag || '-'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => openGuestModal(guest)}
                      className="group relative px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/20"
                      title="Chỉnh sửa thông tin khách mời"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="font-medium">Sửa</span>
                    </button>
                    
                    <button 
                      onClick={() => copyInviteLink(guest.id, guest.name)}
                      className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-cyan-500/20"
                      title="Sao chép liên kết mời"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      <span className="font-medium">Link</span>
                    </button>
                    
                    <button 
                      onClick={() => openQRPopup(guest)}
                      className="group relative px-3 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:from-purple-500/30 hover:to-indigo-500/30 hover:border-purple-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-500/20"
                      title="Xem mã QR"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">QR</span>
                    </button>
                    
                    <button 
                      onClick={() => deleteGuest(guest.id, guest.name)}
                      className="group relative px-3 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
                      title="Xóa khách mời"
                    >
                      <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 px-2 sm:px-4">
            <div className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredGuests.length)} trong tổng số {filteredGuests.length} khách mời
            </div>
            
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
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
                      onClick={() => setCurrentPage(page)}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Sau</span>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="fixed inset-0 h-[100dvh] w-[100dvw] z-[9998] flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImportModal(false)}></div>
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[95dvh] sm:max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Import khách mời</span>
              </h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-gray-800"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Import Type Selection */}
            <div className="flex gap-4 sm:gap-6 mb-4 sm:mb-6">
              <label className="flex items-center gap-2 text-white cursor-pointer text-sm sm:text-base">
                <input 
                  type="radio" 
                  checked={importType === "json"} 
                  onChange={() => setImportType("json")} 
                  className="text-blue-500 w-4 h-4" 
                />
                <span>JSON</span>
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer text-sm sm:text-base">
                <input 
                  type="radio" 
                  checked={importType === "csv"} 
                  onChange={() => setImportType("csv")} 
                  className="text-blue-500 w-4 h-4" 
                />
                <span>CSV File</span>
              </label>
            </div>

            {/* JSON Input */}
            {importType === "json" && (
              <div className="space-y-3 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-white/60">Nhập JSON array của khách mời hoặc upload file JSON</p>
                
                {/* JSON Upload */}
                <div className="mb-3 sm:mb-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="file" 
                      id="jsonFile" 
                      accept=".json" 
                      onChange={handleJsonFileUpload}
                      className="flex-1 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 text-white file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-500 file:text-white hover:file:bg-purple-600 text-xs sm:text-sm" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById('jsonFile') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                        setText('')
                        setResult('')
                      }}
                      className="group relative px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg sm:rounded-xl hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20 text-xs sm:text-sm"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </div>
                </div>
                
                {/* JSON Textarea */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-white/80">Nội dung JSON:</label>
                  <textarea 
                    className="w-full h-32 sm:h-40 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 text-white placeholder-white/50 font-mono text-xs sm:text-sm" 
                    value={text} 
                    onChange={e=>setText(e.target.value)}
                    placeholder='[{"title":"Mr","name":"Tên khách","role":"CEO","organization":"Công ty ABC","tag":"VIP","email":"email@example.com","phone":"0900000000"}]'
                  />
                </div>
              </div>
            )}

            {/* CSV Upload */}
            {importType === "csv" && (
              <div className="space-y-3 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-white/60">Chọn file CSV với các cột: title, name, role, organization, tag, email, phone</p>
                <input 
                  type="file" 
                  id="csvFile" 
                  accept=".csv" 
                  className="w-full bg-black/30 border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 text-white file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 text-xs sm:text-sm" 
                />
                <div className="text-xs text-white/60">
                  <p className="mb-2">Mẫu CSV:</p>
                  <pre className="bg-black/40 p-2 sm:p-3 rounded-lg text-white/80 overflow-x-auto text-xs">title,name,role,organization,tag,email,phone
Mr,Tên khách,CEO,Công ty ABC,Tag,email@example.com,0900000000
Ms,Tên khách 2,Manager,Công ty XYZ,Tag2,email2@example.com,0900000001</pre>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                className="group relative flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-lg sm:rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-1 sm:gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 text-sm sm:text-base" 
                onClick={onImport}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="truncate">Import {importType.toUpperCase()}</span>
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg sm:rounded-xl hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20 text-sm sm:text-base"
              >
                Hủy
              </button>
            </div>
            
            {result && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-black/30 border border-white/20 rounded-lg sm:rounded-xl max-h-40 sm:max-h-60 overflow-y-auto">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.includes('✅') && (
                      <div className="w-4 h-4 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400/30">
                        <svg className="w-2.5 h-2.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {result.includes('❌') && (
                      <div className="w-4 h-4 bg-rose-500/20 rounded-full flex items-center justify-center border border-rose-400/30">
                        <svg className="w-2.5 h-2.5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    {result.includes('⚠️') && (
                      <div className="w-4 h-4 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-400/30">
                        <svg className="w-2.5 h-2.5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.293 19.293a1 1 0 001.414 0L12 13l6.293 6.293a1 1 0 001.414-1.414l-7-7a1 1 0 00-1.414 0l-7 7a1 1 0 000 1.414z" />
                        </svg>
                      </div>
                    )}
                    {!result.includes('✅') && !result.includes('❌') && !result.includes('⚠️') && (
                      <div className="w-4 h-4 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-400/30">
                        <svg className="w-2.5 h-2.5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <pre className="text-xs sm:text-sm text-white whitespace-pre-wrap break-words leading-relaxed font-mono">{result}</pre>
                  </div>
                </div>
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
            <div className="relative bg-gray-900 border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
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
              <div className="md:col-span-2">
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

            {/* Check-in Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/80 mb-2">Trạng thái check-in</label>
              <CustomDropdown
                options={checkinStatusOptions}
                value={guestForm.checkin_status}
                onChange={(value) => updateGuestForm('checkin_status', value)}
                placeholder="Chọn trạng thái check-in"
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={saveGuest}
                className="group relative flex-1 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20" 
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
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
        <div className={`fixed top-0 left-0 right-0 sm:top-4 sm:right-4 sm:left-auto z-[9999] transform transition-all duration-300 ease-out ${
          popupVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        } sm:translate-x-0 sm:translate-y-0 ${
          popupVisible ? 'sm:translate-x-0 sm:opacity-100' : 'sm:translate-x-full sm:opacity-0'
        }`}>
          <div 
            className={`mx-0.5 mt-0.5 sm:mx-0 sm:mt-0 px-1.5 py-1 sm:px-4 sm:py-3 rounded sm:rounded-2xl shadow-2xl w-full sm:max-w-xs backdrop-blur-md border ${
              copyType === 'success' ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-600/30 via-emerald-500/20 to-emerald-400/10' :
              copyType === 'error' ? 'border-rose-400/30 bg-gradient-to-br from-rose-600/30 via-rose-500/20 to-rose-400/10' :
              copyType === 'warning' ? 'border-amber-400/30 bg-gradient-to-br from-amber-600/30 via-amber-500/20 to-amber-400/10' :
              'border-cyan-400/30 bg-gradient-to-br from-cyan-600/30 via-cyan-500/20 to-cyan-400/10'
            } text-white select-none`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-0.5">
              <div className="flex-shrink-0">
                {copyType === 'success' && (
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-emerald-500/20 rounded sm:rounded-xl flex items-center justify-center border border-emerald-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {copyType === 'error' && (
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-rose-500/20 rounded sm:rounded-xl flex items-center justify-center border border-rose-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {copyType === 'warning' && (
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-amber-500/20 rounded sm:rounded-xl flex items-center justify-center border border-amber-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.293 19.293a1 1 0 001.414 0L12 13l6.293 6.293a1 1 0 001.414-1.414l-7-7a1 1 0 00-1.414 0l-7 7a1 1 0 000 1.414z" />
                    </svg>
                  </div>
                )}
                {copyType === 'info' && (
                  <div className="w-5 h-5 sm:w-8 sm:h-8 bg-cyan-500/20 rounded sm:rounded-xl flex items-center justify-center border border-cyan-400/30">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium break-words leading-tight sm:leading-relaxed truncate max-w-[200px] sm:max-w-none">{copyMessage}</p>
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

      {/* QR Code Popup */}
      {showQRPopup && selectedGuest && (
        <Portal>
          <div className="fixed inset-0 h-[100dvh] w-[100dvw] z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Mã QR - {selectedGuest.name}
              </h3>
              <button
                onClick={() => setShowQRPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center p-4 shadow-lg border-2 border-gray-100">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                    onError={() => setQrImageUrl("")}
                  />
                ) : (
                  <div className="text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1zM13 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2v-1h1v1h-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">Đang tải QR code...</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Mã QR cho {selectedGuest.name}
              </p>
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
  
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => downloadQR(selectedGuest.id, selectedGuest.name)}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Tải xuống
              </button>
              <button
                onClick={() => setShowQRPopup(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
            </div>
          </div>
        </Portal>
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
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  )
}