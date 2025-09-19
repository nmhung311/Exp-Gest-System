'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CustomDropdown from '../../components/CustomDropdown'
import CustomCheckbox from '../../components/CustomCheckbox'
import SimpleInvitePreview from '../../components/SimpleInvitePreview'
import DateTimePicker from '../../components/DateTimePicker'

import { api } from "@/lib/api"
interface Event {
  id: number
  name: string
  description: string
  date: string
  time: string
  venue_address?: string
  venue_map_url?: string
  program_outline?: string
  dress_code?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  max_guests: number
  created_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [toastType, setToastType] = useState<'success'|'error'|'warning'|'info'>("success")
  const [toastVisible, setToastVisible] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [mounted, setMounted] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [editEventId, setEditEventId] = useState<number | null>(null)
  const [showFAB, setShowFAB] = useState(false)


  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    venue_address: '',
    venue_map_url: '',
    program_outline: '',
    dress_code: '',
    max_guests: 100,
    status: 'upcoming' as 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  })

  type ProgramRow = { time: string; item: string }
  const [programRows, setProgramRows] = useState<ProgramRow[]>([])
  const [useDressCode, setUseDressCode] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  function parseProgramOutline(src: string | undefined | null): ProgramRow[] {
    if (!src) return []
    try {
      const parsed = JSON.parse(src)
      if (Array.isArray(parsed)) {
        return parsed
          .map((r: any) => ({ time: String(r[0] ?? r.time ?? ''), item: String(r[1] ?? r.item ?? '') }))
          .filter(r => r.time || r.item)
      }
    } catch {}
    // fallback: "18:00-Đón khách; 18:30-Khai mạc"
    return src.split(';').map(s => s.trim()).filter(Boolean).map(s => {
      const [t, ...rest] = s.split('-')
      return { time: (t || '').trim(), item: rest.join('-').trim() }
    })
  }


  // Load events
  useEffect(() => {
    loadEvents()
    setMounted(true)
    
    // Check for event ID in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const eventId = urlParams.get('event')
    const editId = urlParams.get('edit')
    
    if (eventId) {
      setSelectedEventId(parseInt(eventId))
    }
    
    if (editId) {
      setEditEventId(parseInt(editId))
    }
  }, [])

  // FAB scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowFAB(window.scrollY > 200)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-open edit form when editEventId is set
  useEffect(() => {
    if (editEventId && events.length > 0) {
      const eventToEdit = events.find(e => e.id === editEventId)
      if (eventToEdit) {
        setEditingEvent(eventToEdit)
        setShowEventModal(true)
        setEditEventId(null) // Reset after opening
      }
    }
  }, [editEventId, events])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const res = await api.getEvents()
      if (res.ok) {
        const data = await res.json()
        // Sắp xếp sự kiện theo ngày gần nhất (upcoming events first)
        const sortedEvents = data.sort((a: Event, b: Event) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })
        setEvents(sortedEvents)
      } else {
        console.error("Failed to load events:", res.status, res.statusText)
        setEvents([])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEventModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        name: event.name,
        description: event.description,
        date: event.date,
        time: event.time,
        venue_address: event.venue_address || '',
        venue_map_url: event.venue_map_url || '',
        program_outline: event.program_outline || '',
        dress_code: event.dress_code || '',
        max_guests: event.max_guests,
        status: event.status
      })
      setProgramRows(parseProgramOutline(event.program_outline))
      setUseDressCode(!!event.dress_code)
    } else {
      setEditingEvent(null)
      setFormData({
        name: '',
        description: '',
        date: '',
        time: '',
        venue_address: '',
        venue_map_url: '',
        program_outline: '',
        dress_code: '',
        max_guests: 100,
        status: 'upcoming'
      })
      setProgramRows([])
      setUseDressCode(false)
    }
    setShowEventModal(true)
  }

  const closeEventModal = () => {
    setShowEventModal(false)
    setEditingEvent(null)
    setFormData({
      name: '',
      description: '',
      date: '',
      time: '',
      venue_address: '',
      venue_map_url: '',
      program_outline: '',
      dress_code: '',
      max_guests: 100,
      status: 'upcoming'
    })
    setProgramRows([])
    setUseDressCode(false)
  }

  const openPreviewModal = () => {
    setShowPreviewModal(true)
  }

  const closePreviewModal = () => {
    setShowPreviewModal(false)
  }

  const saveEvent = async () => {
    try {
      setSaving(true)
      
      // Enhanced client-side validation
      if (!formData.name?.trim()) {
        setToastMsg('Vui lòng nhập tên sự kiện')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      if (!formData.date) {
        setToastMsg('Vui lòng chọn ngày sự kiện')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      if (!formData.time) {
        setToastMsg('Vui lòng chọn giờ sự kiện')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      if (!formData.venue_address?.trim()) {
        setToastMsg('Vui lòng nhập địa chỉ chi tiết sự kiện')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }

      if (formData.venue_map_url && !/^https?:\/\//.test(formData.venue_map_url)) {
        setToastMsg('Link Google Maps phải bắt đầu bằng http/https')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      if (!formData.status) {
        setToastMsg('Vui lòng chọn trạng thái sự kiện')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      if (!formData.max_guests || formData.max_guests < 1) {
        setToastMsg('Vui lòng nhập số lượng khách tối đa hợp lệ (>= 1)')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(formData.date)) {
        setToastMsg('Định dạng ngày không hợp lệ (YYYY-MM-DD)')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      // Validate time format
      const timeRegex = /^\d{2}:\d{2}$/
      if (!timeRegex.test(formData.time)) {
        setToastMsg('Định dạng giờ không hợp lệ (HH:MM)')
        setToastType('warning')
        setToastVisible(true)
        setSaving(false)
        setTimeout(() => setToastVisible(false), 3000)
        return
      }
      
      const program_outline_payload = JSON.stringify(
        programRows.filter(r => r.time || r.item)
      )

      if (editingEvent) {
        // Update event to backend
        const res = await api.updateEvent(editingEvent.id.toString(), {
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            date: formData.date,
            time: formData.time,
            venue_address: formData.venue_address?.trim() || '',
            venue_map_url: formData.venue_map_url?.trim() || '',
            program_outline: program_outline_payload,
            dress_code: useDressCode ? formData.dress_code?.trim() || '' : '',
            status: formData.status,
            max_guests: parseInt(formData.max_guests.toString())
        })
        
        if (!res.ok) {
          let errorMessage = 'Lỗi server'
          try {
            const errorData = await res.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await res.text()
              errorMessage = errorText || errorMessage
            } catch {
              errorMessage = `HTTP ${res.status}: ${res.statusText}`
            }
          }
          throw new Error(errorMessage)
        }
        
        setToastMsg('Cập nhật sự kiện thành công')
        setToastType('success')
        setToastVisible(true)
      } else {
        // Create new event in backend
        const res = await api.createEvent({
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            date: formData.date,
            time: formData.time,
            venue_address: formData.venue_address?.trim() || '',
            venue_map_url: formData.venue_map_url?.trim() || '',
            program_outline: program_outline_payload,
            dress_code: useDressCode ? formData.dress_code?.trim() || '' : '',
            status: formData.status,
            max_guests: parseInt(formData.max_guests.toString())
        })
        
        if (!res.ok) {
          let errorMessage = 'Lỗi server'
          try {
            const errorData = await res.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // If JSON parsing fails, try to get text
            try {
              const errorText = await res.text()
              errorMessage = errorText || errorMessage
            } catch {
              errorMessage = `HTTP ${res.status}: ${res.statusText}`
            }
          }
          throw new Error(errorMessage)
        }
        
        setToastMsg('Tạo sự kiện thành công')
        setToastType('success')
        setToastVisible(true)
      }
      await loadEvents()
      closeEventModal()
    } catch (error) {
      console.error('Error saving event:', error)
      setToastMsg(`Lỗi khi lưu sự kiện${(error as any)?.message ? ': ' + (error as any).message : ''}`)
      setToastType('error')
      setToastVisible(true)
    } finally {
      setSaving(false)
      setTimeout(() => setToastVisible(false), 2000)
    }
  }

  const deleteEvent = async (eventId: number, eventName: string) => {
    // Lấy thông tin về số lượng khách mời trước khi xóa
    try {
      const guestsRes = await api.getGuests(eventId.toString())
      const guestsData = await guestsRes.json()
      const guestCount = guestsData.guests ? guestsData.guests.length : 0
      
      let confirmMessage = `Bạn có chắc chắn muốn xóa sự kiện "${eventName}"?`
      if (guestCount > 0) {
        confirmMessage += `\n\nCẢNH BÁO: Sẽ xóa ${guestCount} khách mời thuộc sự kiện này!`
      }
      
      if (confirm(confirmMessage)) {
        const res = await api.deleteEvent(eventId.toString())
        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || await res.text())
        }
        
        const result = await res.json()
        await loadEvents()
        
        let successMsg = `Đã xóa sự kiện "${eventName}"`
        if (result.deleted_guests_count > 0) {
          successMsg += ` và ${result.deleted_guests_count} khách mời`
        }
        
        setToastMsg(successMsg) 
        setToastType('success')
        setToastVisible(true)
        setTimeout(() => setToastVisible(false), 3000)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      setToastMsg('Lỗi khi xóa sự kiện')
      setToastType('error')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    }
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.venue_address && event.venue_address.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // For mobile: use selectedStatuses, for desktop: use statusFilter
    const matchesStatus = selectedStatuses.length > 0 
      ? selectedStatuses.includes(event.status)
      : (statusFilter === 'all' || event.status === statusFilter)
    
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  // Calculate statistics
  const stats = {
    total: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    ongoing: events.filter(e => e.status === 'ongoing').length,
    completed: events.filter(e => e.status === 'completed').length,
    cancelled: events.filter(e => e.status === 'cancelled').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'text-blue-400 bg-blue-500/20'
      case 'ongoing': return 'text-green-400 bg-green-500/20'
      case 'completed': return 'text-gray-400 bg-gray-500/20'
      case 'cancelled': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Sắp diễn ra'
      case 'ongoing': return 'Đang diễn ra'
      case 'completed': return 'Đã hoàn thành'
      case 'cancelled': return 'Đã hủy'
      default: return 'Không xác định'
    }
  }

  // Handle status card selection
  const toggleStatusSelection = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }

  // Quick update status inline
  const updateEventStatus = async (eventId: number, newStatus: 'upcoming'|'ongoing'|'completed'|'cancelled') => {
    try {
      const res = await api.updateEvent(eventId.toString(), { status: newStatus })
      if (!res.ok) throw new Error(await res.text())
      await loadEvents()
      setToastMsg('Cập nhật trạng thái sự kiện thành công')
      setToastType('success')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    } catch (e) {
      setToastMsg('Lỗi khi cập nhật trạng thái')
      setToastType('error')
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Đang tải dữ liệu sự kiện...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-[420px] mx-auto md:max-w-none">
      {toastVisible && mounted && createPortal(
        <div className={`fixed top-16 right-0 z-[99999] transform transition-all duration-300 ${toastVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          <div className={`px-4 py-3 rounded-l-2xl shadow-2xl max-w-xs backdrop-blur-md border text-white ${
            toastType === 'success' ? 'border-emerald-400/30 bg-gradient-to-br from-emerald-600/30 via-emerald-500/20 to-emerald-400/10' :
            toastType === 'error' ? 'border-rose-400/30 bg-gradient-to-br from-rose-600/30 via-rose-500/20 to-rose-400/10' :
            toastType === 'warning' ? 'border-amber-400/30 bg-gradient-to-br from-amber-600/30 via-amber-500/20 to-amber-400/10' :
            'border-cyan-400/30 bg-gradient-to-br from-cyan-600/30 via-cyan-500/20 to-cyan-400/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {toastType === 'success' && (
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-400/30">
                    <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </div>
                )}
                {toastType === 'error' && (
                  <div className="w-8 h-8 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-400/30">
                    <svg className="w-4 h-4 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                )}
                {toastType === 'warning' && (
                  <div className="w-8 h-8 aspect-square bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-400/30">
                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86l-7.4 12.8A2 2 0 004.6 20h14.8a2 2 0 001.71-3.34l-7.4-12.8a2 2 0 00-3.42 0z" /></svg>
                  </div>
                )}
                {toastType === 'info' && (
                  <div className="w-8 h-8 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30">
                    <svg className="w-4 h-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{toastMsg}</p>
              </div>
            </div>
            <div className={`mt-3 h-[3px] rounded-full ${
              toastType === 'success' ? 'bg-gradient-to-r from-emerald-400/60 to-emerald-300/40' :
              toastType === 'error' ? 'bg-gradient-to-r from-rose-400/60 to-rose-300/40' :
              toastType === 'warning' ? 'bg-gradient-to-r from-amber-400/60 to-amber-300/40' :
              'bg-gradient-to-r from-cyan-400/60 to-cyan-300/40'
            }`}></div>
          </div>
        </div>, document.body
      )}
      {/* Header Section - Desktop Optimized */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
          Quản Lý Sự Kiện
        </h1>
        <p className="text-white/70 text-base">Tạo và quản lý các sự kiện của công ty</p>
      </div>

      {/* Primary CTA - Mobile First */}
      <div className="md:hidden">
        <button 
          onClick={() => openEventModal()}
          className="w-full rounded-xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50 text-blue-300 font-semibold py-3 shadow-lg hover:from-blue-500/40 hover:to-cyan-500/40 hover:border-blue-400/60 hover:shadow-blue-500/20 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Tạo sự kiện
        </button>
      </div>


      {/* Mobile Search Bar */}
      <div className="md:hidden">
          <div className="relative">
          <input
            type="text"
            placeholder="Tìm sự kiện…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-lg bg-white/5 border border-white/10 px-9 text-sm text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
          />
          <span className="absolute left-3 top-2.5 opacity-60">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
          </span>
              </div>
              </div>

      {/* Desktop Filter Bar - Optimized Layout */}
      <div className="hidden md:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
          <CustomDropdown
            options={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "upcoming", label: "Sắp diễn ra" },
              { value: "ongoing", label: "Đang diễn ra" },
              { value: "completed", label: "Đã hoàn thành" },
              { value: "cancelled", label: "Đã hủy" }
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            placeholder="Chọn trạng thái"
            className="min-w-[140px]"
          />
        </div>
        
        {/* Desktop CTA - Inline with search */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => openEventModal()}
            className="group relative px-4 py-3 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50 text-blue-300 rounded-lg hover:from-blue-500/40 hover:to-cyan-500/40 hover:border-blue-400/60 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20 text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Tạo sự kiện
          </button>
        </div>
      </div>

      {/* Statistics Cards - Mobile 2x2 Grid */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3">
          {/* Cancelled */}
          <div 
            className={`rounded-2xl border p-3 transition-all duration-300 cursor-pointer ${
              selectedStatuses.includes('cancelled') 
                ? 'border-red-400/50 bg-red-500/10 shadow-lg shadow-red-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => toggleStatusSelection('cancelled')}
          >
            <div className="flex items-center gap-2">
              <svg className={`w-6 h-6 transition-all duration-300 ${
                selectedStatuses.includes('cancelled') ? 'opacity-100 text-red-400' : 'opacity-80 text-red-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className={`ml-auto text-2xl font-semibold transition-all duration-300 ${
                selectedStatuses.includes('cancelled') ? 'text-red-300' : 'text-white'
              }`}>{stats.cancelled}</div>
          </div>
            <div className={`mt-1 text-xs transition-all duration-300 ${
              selectedStatuses.includes('cancelled') ? 'text-red-200' : 'text-white/70'
            }`}>Đã hủy</div>
        </div>

        {/* Upcoming */}
          <div 
            className={`rounded-2xl border p-3 transition-all duration-300 cursor-pointer ${
              selectedStatuses.includes('upcoming') 
                ? 'border-yellow-400/50 bg-yellow-500/10 shadow-lg shadow-yellow-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => toggleStatusSelection('upcoming')}
          >
            <div className="flex items-center gap-2">
              <svg className={`w-6 h-6 transition-all duration-300 ${
                selectedStatuses.includes('upcoming') ? 'opacity-100 text-yellow-400' : 'opacity-80 text-yellow-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              <div className={`ml-auto text-2xl font-semibold transition-all duration-300 ${
                selectedStatuses.includes('upcoming') ? 'text-yellow-300' : 'text-white'
              }`}>{stats.upcoming}</div>
            </div>
            <div className={`mt-1 text-xs transition-all duration-300 ${
              selectedStatuses.includes('upcoming') ? 'text-yellow-200' : 'text-white/70'
            }`}>Sắp diễn ra</div>
          </div>

          {/* Ongoing */}
          <div 
            className={`rounded-2xl border p-3 transition-all duration-300 cursor-pointer ${
              selectedStatuses.includes('ongoing') 
                ? 'border-green-400/50 bg-green-500/10 shadow-lg shadow-green-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => toggleStatusSelection('ongoing')}
          >
            <div className="flex items-center gap-2">
              <svg className={`w-6 h-6 transition-all duration-300 ${
                selectedStatuses.includes('ongoing') ? 'opacity-100 text-green-400' : 'opacity-80 text-green-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className={`ml-auto text-2xl font-semibold transition-all duration-300 ${
                selectedStatuses.includes('ongoing') ? 'text-green-300' : 'text-white'
              }`}>{stats.ongoing}</div>
            </div>
            <div className={`mt-1 text-xs transition-all duration-300 ${
              selectedStatuses.includes('ongoing') ? 'text-green-200' : 'text-white/70'
            }`}>Đang diễn ra</div>
          </div>

          {/* Completed */}
          <div 
            className={`rounded-2xl border p-3 transition-all duration-300 cursor-pointer ${
              selectedStatuses.includes('completed') 
                ? 'border-gray-400/50 bg-gray-500/10 shadow-lg shadow-gray-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            onClick={() => toggleStatusSelection('completed')}
          >
            <div className="flex items-center gap-2">
              <svg className={`w-6 h-6 transition-all duration-300 ${
                selectedStatuses.includes('completed') ? 'opacity-100 text-gray-400' : 'opacity-80 text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className={`ml-auto text-2xl font-semibold transition-all duration-300 ${
                selectedStatuses.includes('completed') ? 'text-gray-300' : 'text-white'
              }`}>{stats.completed}</div>
            </div>
            <div className={`mt-1 text-xs transition-all duration-300 ${
              selectedStatuses.includes('completed') ? 'text-gray-200' : 'text-white/70'
            }`}>Hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Desktop Statistics Cards - Optimized Layout */}
      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6">
        {/* Total Events */}
        <div className={`status-card-all group relative backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 overflow-hidden cursor-pointer ${
          statusFilter === 'all' 
            ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/50 shadow-lg shadow-blue-500/20' 
            : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20'
        }`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
              statusFilter === 'all' ? 'bg-blue-500/30' : 'bg-blue-500/20'
            }`}>
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all duration-300 ${
                statusFilter === 'all' ? 'text-blue-300' : 'text-blue-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 mb-1 ${
                statusFilter === 'all' ? 'text-blue-200' : 'text-white'
              }`}>{stats.total}</div>
              <div className={`text-xs sm:text-sm font-medium transition-all duration-300 ${
                statusFilter === 'all' ? 'text-blue-200' : 'text-blue-300/80'
              }`}>Tổng sự kiện</div>
              </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full w-full"></div>
          </div>
        </div>

        {/* Upcoming */}
        <div className={`status-card-upcoming group relative backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 overflow-hidden cursor-pointer ${
          statusFilter === 'upcoming' 
            ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/50 shadow-lg shadow-yellow-500/20' 
            : 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20'
        }`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
              statusFilter === 'upcoming' ? 'bg-yellow-500/30' : 'bg-yellow-500/20'
            }`}>
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all duration-300 ${
                statusFilter === 'upcoming' ? 'text-yellow-300' : 'text-yellow-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 mb-1 ${
                statusFilter === 'upcoming' ? 'text-yellow-200' : 'text-white'
              }`}>{stats.upcoming}</div>
              <div className={`text-xs sm:text-sm font-medium transition-all duration-300 ${
                statusFilter === 'upcoming' ? 'text-yellow-200' : 'text-yellow-300/80'
              }`}>Sắp diễn ra</div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.upcoming / stats.total) * 100 : 0}%`}}></div>
          </div>
        </div>

        {/* Ongoing */}
        <div className={`status-card-ongoing group relative backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 overflow-hidden cursor-pointer ${
          statusFilter === 'ongoing' 
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/50 shadow-lg shadow-green-500/20' 
            : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20'
        }`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
              statusFilter === 'ongoing' ? 'bg-green-500/30' : 'bg-green-500/20'
            }`}>
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all duration-300 ${
                statusFilter === 'ongoing' ? 'text-green-300' : 'text-green-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-right">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 mb-1 ${
                statusFilter === 'ongoing' ? 'text-green-200' : 'text-white'
              }`}>{stats.ongoing}</div>
              <div className={`text-xs sm:text-sm font-medium transition-all duration-300 ${
                statusFilter === 'ongoing' ? 'text-green-200' : 'text-green-300/80'
              }`}>Đang diễn ra</div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.ongoing / stats.total) * 100 : 0}%`}}></div>
          </div>
        </div>

        {/* Completed */}
        <div className={`status-card-completed group relative backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 overflow-hidden cursor-pointer ${
          statusFilter === 'completed' 
            ? 'bg-gradient-to-br from-gray-500/20 to-slate-500/20 border border-gray-400/50 shadow-lg shadow-gray-500/20' 
            : 'bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20'
        }`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
              statusFilter === 'completed' ? 'bg-gray-500/30' : 'bg-gray-500/20'
            }`}>
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all duration-300 ${
                statusFilter === 'completed' ? 'text-gray-300' : 'text-gray-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 mb-1 ${
                statusFilter === 'completed' ? 'text-gray-200' : 'text-white'
              }`}>{stats.completed}</div>
              <div className={`text-xs sm:text-sm font-medium transition-all duration-300 ${
                statusFilter === 'completed' ? 'text-gray-200' : 'text-gray-300/80'
              }`}>Hoàn thành</div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-gray-500/30 to-slate-500/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-400 to-slate-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`}}></div>
          </div>
        </div>

        {/* Cancelled */}
        <div className={`status-card-cancelled group relative backdrop-blur-sm rounded-xl p-4 sm:p-6 transition-all duration-300 overflow-hidden cursor-pointer ${
          statusFilter === 'cancelled' 
            ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/50 shadow-lg shadow-red-500/20' 
            : 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
              statusFilter === 'cancelled' ? 'bg-red-500/30' : 'bg-red-500/20'
            }`}>
              <svg className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all duration-300 ${
                statusFilter === 'cancelled' ? 'text-red-300' : 'text-red-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="text-right">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 mb-1 ${
                statusFilter === 'cancelled' ? 'text-red-200' : 'text-white'
              }`}>{stats.cancelled}</div>
              <div className={`text-xs sm:text-sm font-medium transition-all duration-300 ${
                statusFilter === 'cancelled' ? 'text-red-200' : 'text-red-300/80'
              }`}>Đã hủy</div>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-red-500/30 to-rose-500/30 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-400 to-rose-400 rounded-full" style={{width: `${stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0}%`}}></div>
          </div>
        </div>
      </div>


      {/* Events List Section - Desktop Optimized */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-3 sm:p-4 md:p-6">
        {/* Desktop Table View - Optimized Layout */}
        <div className="hidden md:block overflow-x-auto scrollbar-glass">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white/70 uppercase bg-black/40 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 w-1/4 font-semibold">Tên sự kiện</th>
                <th className="px-6 py-4 w-1/6 font-semibold">Ngày & Giờ</th>
                <th className="px-6 py-4 w-1/6 font-semibold">Địa điểm</th>
                <th className="px-6 py-4 w-16 font-semibold">Khách</th>
                <th className="px-6 py-4 w-35 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 w-28 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((event) => (
                <tr key={event.id} className="bg-black/20 border-b border-white/10 hover:bg-black/30 transition-colors">
                  <td className="px-6 py-4 w-1/4">
                    <div>
                      <h3 className="text-white font-medium text-sm">{event.name}</h3>
                      <p className="text-white/60 text-xs mt-1 line-clamp-1">{event.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-1/6 text-white/80">
                    <div className="text-sm">{new Date(event.date).toLocaleDateString('vi-VN')}</div>
                    <div className="text-xs text-white/60">{event.time}</div>
                  </td>
                  <td className="px-6 py-4 w-1/6 text-white/80 text-sm">{event.venue_address || 'Chưa có địa chỉ'}</td>
                  <td className="px-6 py-4 w-16 text-white/80 text-sm text-center">{event.max_guests}</td>
                  <td className="px-6 py-4 w-35">
                    <span className={`table-status-badge-${event.status} text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit transition-all duration-300 cursor-pointer overflow-hidden relative`}>
                      {event.status === 'upcoming' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      ) : event.status === 'ongoing' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M13 10V3L4 14h7v7l9-11h-7z" clipRule="evenodd" />
                        </svg>
                      ) : event.status === 'completed' ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="hidden sm:inline">
                        {event.status === 'upcoming' ? 'Sắp diễn ra' :
                         event.status === 'ongoing' ? 'Đang diễn ra' :
                         event.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 w-28">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEventModal(event)}
                        className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition-colors flex items-center gap-1"
                        title="Chỉnh sửa sự kiện"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        <span className="hidden sm:inline">Sửa</span>
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id, event.name)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors flex items-center gap-1"
                        title="Xóa sự kiện"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Xóa</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

        {/* Mobile Card View - Optimized */}
        <div className="md:hidden space-y-2 will-change-transform">
            {paginatedEvents.map((event) => (
            <div key={event.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                {/* Event Header */}
              <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm truncate">{event.name}</h3>
                  <p className="text-white/60 text-sm mt-0.5 line-clamp-1">{event.description}</p>
                  </div>
                <span className={`status-badge-${event.status} rounded-full border px-2 py-0.5 text-[11px] ml-2 flex-shrink-0 transition-all duration-300 cursor-pointer overflow-hidden relative`}>
                    {getStatusText(event.status)}
                  </span>
                </div>

              {/* Event Details - With Icons */}
              <div className="space-y-2 mb-3 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white/80">
                    {new Date(event.date).toLocaleDateString('vi-VN')} {event.time}
                    </span>
                  </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span className="text-white/80">{event.max_guests} khách</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-white/80 truncate">{event.venue_address || 'Chưa có địa chỉ'}</span>
                  </div>
                </div>

              {/* Action Buttons - Primary Edit + Menu */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEventModal(event)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteEvent(event.id, event.name)}
                  className="px-3 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination - Compact */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <div className="flex gap-2 overflow-x-auto">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                    currentPage === page
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Event Modal - Compact */}
      {showEventModal && !showPreviewModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]">
          <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-gray-900 border border-white/20 rounded-lg p-4 sm:p-6 w-full max-w-7xl max-h-[95dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">
                {editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
              </h2>
              <button
                onClick={closeEventModal}
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thông tin cơ bản
                  </h3>
                  <div className="space-y-4">
              <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Tên sự kiện</label>
                <textarea
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    // Auto resize textarea
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onInput={(e) => {
                    // Auto resize on input
                    e.currentTarget.style.height = 'auto'
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'
                  }}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 text-sm transition-all duration-200 resize-none min-h-[60px] overflow-hidden"
                  placeholder="Nhập tên sự kiện"
                  rows={1}
                />
              </div>

              <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value })
                    // Auto resize textarea
                    e.target.style.height = 'auto'
                    e.target.style.height = e.target.scrollHeight + 'px'
                  }}
                  onInput={(e) => {
                    // Auto resize on input
                    e.currentTarget.style.height = 'auto'
                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'
                  }}
                        className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 resize-none text-sm transition-all duration-200 overflow-hidden min-h-[96px]"
                  placeholder="Mục đích sự kiện, ghi chú nhanh..."
                  rows={1}
                />
              </div>

                <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Thời gian sự kiện</label>
                      <div className="grid grid-cols-2 gap-2">
                  <div>
                          <label className="block text-white/60 text-sm font-medium mb-1">Ngày</label>
                  <DateTimePicker
                    type="date"
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    placeholder="Chọn ngày"
                    className="w-full"
                  />
                </div>
                <div>
                          <label className="block text-white/60 text-sm font-medium mb-1">Giờ</label>
                  <DateTimePicker
                    type="time"
                    value={formData.time}
                    onChange={(value) => setFormData({ ...formData, time: value })}
                    placeholder="Chọn giờ"
                    className="w-full"
                  />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Location & Configuration */}
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Địa điểm & Cấu hình
                  </h3>
                  <div className="space-y-3">
              <div>
                      <label className="block text-white/80 text-sm font-medium mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                        className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 text-sm"
                  placeholder="Nhập địa chỉ chi tiết tổ chức"
                />
              </div>

                <div>
                      <label className="block text-white/60 text-sm font-medium mb-1">Link Google Maps</label>
                  <input
                    type="text"
                    value={formData.venue_map_url}
                    onChange={(e) => setFormData({ ...formData, venue_map_url: e.target.value })}
                        className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 text-sm transition-all duration-200"
                    placeholder="https://maps.google.com/..."
                  />
                </div>


                    <div className="grid grid-cols-2 gap-2">
                <div>
                        <label className="block text-white/60 text-sm font-medium mb-1">Số khách tối đa</label>
                  <input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 text-sm"
                    min="1"
                  />
                </div>
                <div>
                        <label className="block text-white/60 text-sm font-medium mb-1">Trạng thái</label>
                  <CustomDropdown
                    options={[
                      { value: "upcoming", label: "Sắp diễn ra" },
                      { value: "ongoing", label: "Đang diễn ra" },
                      { value: "completed", label: "Đã hoàn thành" },
                      { value: "cancelled", label: "Đã hủy" }
                    ]}
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value as any })}
                    placeholder="Chọn trạng thái"
                      className="w-full"
                  />
                      </div>
                    </div>
                </div>
              </div>
              </div>

              {/* Right Column - Additional Settings */}
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-6">
                  <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Cài đặt bổ sung
                  </h3>
                  <div className="space-y-3">
              {/* Dress Code */}
              <div>
                      <div className="mb-2">
                        <CustomCheckbox
                      checked={useDressCode}
                          onChange={setUseDressCode}
                          label="Đề nghị trang phục"
                    />
                </div>
                {useDressCode && (
                        <div>
                    <input
                      type="text"
                      value={formData.dress_code}
                      onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                            className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 text-sm"
                            placeholder="Ví dụ: Trang phục lịch sự, Áo dài truyền thống..."
                    />
                  </div>
                )}
                    </div>
                  </div>
              </div>

                <div className="bg-white/5 rounded-lg p-6 overflow-visible">
                  <h3 className="text-white font-medium text-sm mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline chương trình
                  </h3>
                <div className="bg-black/20 border border-white/20 rounded-lg overflow-visible">
                  <div className="overflow-x-auto overflow-y-visible scrollbar-thin">
                    <table className="w-full min-w-[500px]">
                    <thead className="bg-white/5">
                      <tr>
                          <th className="text-left text-white/70 text-sm font-medium px-3 py-2 w-32">Giờ</th>
                          <th className="text-left text-white/70 text-sm font-medium px-3 py-2">Nội dung</th>
                          <th className="px-1 py-1.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {programRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                            <td className="px-3 py-2">
                            <DateTimePicker
                              type="time"
                              value={row.time}
                              onChange={(v) => {
                                setProgramRows(prev => prev.map((r,i)=> i===idx?{...r,time:v}:r))
                              }}
                              placeholder="Chọn giờ "
                              className="w-full"
                            />
                          </td>
                            <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.item}
                              onChange={(e) => {
                                const v = e.target.value
                                setProgramRows(prev => prev.map((r,i)=> i===idx?{...r,item:v}:r))
                              }}
                                className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 text-sm transition-all duration-200"
                              placeholder="Khởi động chương trình, Ăn tối, Networking..."
                            />
                          </td>
                            <td className="px-1 py-1 text-right">
                            <button
                              onClick={() => setProgramRows(prev => prev.filter((_,i)=>i!==idx))}
                              className="remove-row-button p-1 transition-all duration-300 overflow-hidden"
                              title="Xóa dòng"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  <div className="p-2 border-t border-white/10 flex justify-between items-center">
                    <button
                      onClick={() => setProgramRows(prev => [...prev, { time: '', item: '' }])}
                      className="add-row-button px-3 py-2 text-sm rounded transition-all duration-300 overflow-hidden"
                    >
                      Thêm dòng
                    </button>
                    {programRows.length>0 && (
                        <span className="text-white/40 text-sm">{programRows.length} mục</span>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Sticky Footer */}
            <div className="sticky bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 sm:py-4 mt-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Secondary Actions - Left Side */}
                <div className="flex gap-2 sm:order-1">
                  <button
                    onClick={openPreviewModal}
                    className="preview-button group relative px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm overflow-hidden"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Xem trước</span>
                    <span className="sm:hidden">Xem thiệp</span>
                  </button>
                  <button
                    onClick={closeEventModal}
                    className="cancel-button group relative px-3 py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm overflow-hidden"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hủy
                  </button>
                </div>
                
                {/* Primary Action Button - Right Side */}
                <button
                  onClick={saveEvent}
                  className="save-event-button group relative flex-1 sm:flex-none sm:min-w-[200px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-all duration-300 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base overflow-hidden"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">{editingEvent ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}</span>
                  <span className="sm:hidden">{editingEvent ? 'Cập nhật' : 'Tạo mới'}</span>
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Preview Modal */}
      {showPreviewModal && mounted && createPortal(
        <SimpleInvitePreview 
          eventData={formData} 
          onClose={closePreviewModal} 
        />, 
        document.body
      )}

      {/* Event Detail Modal */}
      {selectedEventId && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-glass">
            {(() => {
              const event = events.find(e => e.id === selectedEventId)
              if (!event) return null
              
              return (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{event.name}</h2>
                    <button
                      onClick={() => setSelectedEventId(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Event Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-white/60 text-sm">Ngày diễn ra</div>
                            <div className="text-white font-medium">
                              {new Date(event.date).toLocaleDateString('vi-VN')}
                              {event.time && ` • ${event.time}`}
                            </div>
                          </div>
                        </div>
                        
                        {event.venue_address && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-white/60 text-sm">Địa chỉ chi tiết</div>
                              <div className="text-white font-medium">{event.venue_address}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-white/60 text-sm">Số khách tối đa</div>
                            <div className="text-white font-medium">{event.max_guests} khách</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-500/20 rounded-lg">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-white/60 text-sm">Trạng thái</div>
                            <div className={`font-medium ${
                              event.status === 'upcoming' ? 'text-yellow-300' :
                              event.status === 'ongoing' ? 'text-green-300' :
                              event.status === 'completed' ? 'text-blue-300' :
                              'text-red-300'
                            }`}>
                              {event.status === 'upcoming' ? 'Sắp diễn ra' : 
                               event.status === 'ongoing' ? 'Đang diễn ra' : 
                               event.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {event.description && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Mô tả sự kiện</h3>
                        <p className="text-white/80 leading-relaxed">{event.description}</p>
                      </div>
                    )}
                    
                    {/* Additional Details */}
                    {(event.venue_address || event.venue_map_url || event.program_outline || event.dress_code) && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Thông tin chi tiết</h3>
                        <div className="space-y-3">
                          {event.venue_address && (
                            <div>
                              <div className="text-white/60 text-sm mb-1">Địa chỉ chi tiết</div>
                              <div className="text-white/80">{event.venue_address}</div>
                            </div>
                          )}
                          
                          {event.venue_map_url && (
                            <div>
                              <div className="text-white/60 text-sm mb-1">Bản đồ</div>
                              <a 
                                href={event.venue_map_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                Xem trên bản đồ
                              </a>
                            </div>
                          )}
                          
                          {event.program_outline && (
                            <div>
                              <div className="text-white/60 text-sm mb-1">Chương trình</div>
                              <div className="text-white/80 whitespace-pre-line">{event.program_outline}</div>
                            </div>
                          )}
                          
                          {event.dress_code && (
                            <div>
                              <div className="text-white/60 text-sm mb-1">Trang phục</div>
                              <div className="text-white/80">{event.dress_code}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={() => {
                        setEditingEvent(event)
                        setShowEventModal(true)
                        setSelectedEventId(null)
                      }}
                      className="flex-1 py-3 px-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 rounded-lg transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setSelectedEventId(null)}
                      className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>, document.body
      )}

      {/* FAB for Mobile */}
      {showFAB && (
        <button
          onClick={() => openEventModal()}
          className="fixed bottom-5 right-5 rounded-full p-4 shadow-xl bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border border-blue-400/50 text-blue-300 hover:from-blue-500/40 hover:to-cyan-500/40 hover:border-blue-400/60 hover:shadow-blue-500/20 transition-all duration-300 z-50 md:hidden backdrop-blur-sm"
          aria-label="Tạo sự kiện"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* CSS Animation cho hiệu ứng shimmer */}
      <style jsx>{`
        /* Nút Save Event (xanh lá cây) */
        .save-event-button {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          position: relative;
          overflow: hidden;
          min-width: 200px;
          justify-content: center;
        }
        
        .save-event-button:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
          border-color: rgba(34, 197, 94, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 0 25px rgba(34, 197, 94, 0.2);
          color: #ffffff;
        }
        
        .save-event-button:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.5);
        }
        
        /* Nút Preview (xanh dương) */
        .preview-button {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          justify-content: center;
        }
        
        .preview-button:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.4));
          border-color: rgba(59, 130, 246, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4), 0 0 25px rgba(59, 130, 246, 0.2);
          color: #ffffff;
        }
        
        .preview-button:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }
        
        /* Nút Cancel (đỏ) */
        .cancel-button {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          justify-content: center;
        }
        
        .cancel-button:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4));
          border-color: rgba(239, 68, 68, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4), 0 0 25px rgba(239, 68, 68, 0.2);
          color: #ffffff;
        }
        
        .cancel-button:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
        }
        
        /* Nút Add Row (vàng cam) */
        .add-row-button {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2));
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #f59e0b;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          justify-content: center;
        }
        
        .add-row-button:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.4));
          border-color: rgba(245, 158, 11, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(245, 158, 11, 0.4), 0 0 25px rgba(245, 158, 11, 0.2);
          color: #ffffff;
        }
        
        .add-row-button:active {
          transform: translateY(-1px) scale(0.98);
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
        }
        
        /* Nút Remove Row (đỏ nhạt) */
        .remove-row-button {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          justify-content: center;
          border-radius: 6px;
        }
        
        .remove-row-button:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.3));
          border-color: rgba(239, 68, 68, 0.5);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3), 0 0 15px rgba(239, 68, 68, 0.2);
          color: #ffffff;
        }
        
        .remove-row-button:active {
          transform: translateY(-1px) scale(0.95);
          box-shadow: 0 5px 15px rgba(239, 68, 68, 0.4);
        }
        
        /* Status Badges với hiệu ứng hover RSVP - Updated */
        .status-badge-upcoming {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }
        
        .status-badge-upcoming:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.4));
          border-color: rgba(59, 130, 246, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2);
          color: #ffffff;
        }
        
        .status-badge-ongoing {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        
        .status-badge-ongoing:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
          border-color: rgba(34, 197, 94, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3), 0 0 15px rgba(34, 197, 94, 0.2);
          color: #ffffff;
        }
        
        .status-badge-completed {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2));
          border: 1px solid rgba(107, 114, 128, 0.3);
          color: #6b7280;
        }
        
        .status-badge-completed:hover {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.4));
          border-color: rgba(107, 114, 128, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(107, 114, 128, 0.3), 0 0 15px rgba(107, 114, 128, 0.2);
          color: #ffffff;
        }
        
        .status-badge-cancelled {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .status-badge-cancelled:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4));
          border-color: rgba(239, 68, 68, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3), 0 0 15px rgba(239, 68, 68, 0.2);
          color: #ffffff;
        }
        
        /* Table Status Badges với hiệu ứng hover RSVP */
        .table-status-badge-upcoming {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.2));
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        }
        
        .table-status-badge-upcoming:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.4));
          border-color: rgba(59, 130, 246, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2);
          color: #ffffff;
        }
        
        .table-status-badge-ongoing {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        
        .table-status-badge-ongoing:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
          border-color: rgba(34, 197, 94, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3), 0 0 15px rgba(34, 197, 94, 0.2);
          color: #ffffff;
        }
        
        .table-status-badge-completed {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2));
          border: 1px solid rgba(107, 114, 128, 0.3);
          color: #6b7280;
        }
        
        .table-status-badge-completed:hover {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.4));
          border-color: rgba(107, 114, 128, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(107, 114, 128, 0.3), 0 0 15px rgba(107, 114, 128, 0.2);
          color: #ffffff;
        }
        
        .table-status-badge-cancelled {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2));
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }
        
        .table-status-badge-cancelled:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4));
          border-color: rgba(239, 68, 68, 0.7);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3), 0 0 15px rgba(239, 68, 68, 0.2);
          color: #ffffff;
        }
        
        /* Status Cards với hiệu ứng hover RSVP */
        .status-card-all:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.4));
          border-color: rgba(59, 130, 246, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4), 0 0 25px rgba(59, 130, 246, 0.2);
        }
        
        .status-card-upcoming:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(217, 119, 6, 0.4));
          border-color: rgba(245, 158, 11, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(245, 158, 11, 0.4), 0 0 25px rgba(245, 158, 11, 0.2);
        }
        
        .status-card-ongoing:hover {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
          border-color: rgba(34, 197, 94, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 0 25px rgba(34, 197, 94, 0.2);
        }
        
        .status-card-completed:hover {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.4));
          border-color: rgba(107, 114, 128, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(107, 114, 128, 0.4), 0 0 25px rgba(107, 114, 128, 0.2);
        }
        
        .status-card-cancelled:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(220, 38, 38, 0.4));
          border-color: rgba(239, 68, 68, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4), 0 0 25px rgba(239, 68, 68, 0.2);
        }
        
        /* Hiệu ứng shimmer cho tất cả nút, status badges và status cards */
        .save-event-button::before,
        .preview-button::before,
        .cancel-button::before,
        .add-row-button::before,
        .remove-row-button::before,
        .status-badge-upcoming::before,
        .status-badge-ongoing::before,
        .status-badge-completed::before,
        .status-badge-cancelled::before,
        .table-status-badge-upcoming::before,
        .table-status-badge-ongoing::before,
        .table-status-badge-completed::before,
        .table-status-badge-cancelled::before,
        .status-card-all::before,
        .status-card-upcoming::before,
        .status-card-ongoing::before,
        .status-card-completed::before,
        .status-card-cancelled::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .save-event-button:hover::before,
        .preview-button:hover::before,
        .cancel-button:hover::before,
        .add-row-button:hover::before,
        .remove-row-button:hover::before,
        .status-badge-upcoming:hover::before,
        .status-badge-ongoing:hover::before,
        .status-badge-completed:hover::before,
        .status-badge-cancelled:hover::before,
        .table-status-badge-upcoming:hover::before,
        .table-status-badge-ongoing:hover::before,
        .table-status-badge-completed:hover::before,
        .table-status-badge-cancelled:hover::before,
        .status-card-all:hover::before,
        .status-card-upcoming:hover::before,
        .status-card-ongoing:hover::before,
        .status-card-completed:hover::before,
        .status-card-cancelled:hover::before {
          left: 100%;
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}