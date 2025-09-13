'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import CustomDropdown from '../../../components/CustomDropdown'
import MeshBackground from '../../../components/MeshBackground'

interface Event {
  id: number
  name: string
  description: string
  date: string
  time: string
  location: string
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [mounted, setMounted] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [editEventId, setEditEventId] = useState<number | null>(null)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
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
      const res = await fetch("http://localhost:5001/api/events")
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
        location: event.location,
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
        location: '',
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
      location: '',
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
      
      if (!formData.location?.trim()) {
        setToastMsg('Vui lòng nhập địa điểm sự kiện')
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
        const res = await fetch(`http://localhost:5001/api/events/${editingEvent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            date: formData.date,
            time: formData.time,
            location: formData.location.trim(),
            venue_address: formData.venue_address?.trim() || '',
            venue_map_url: formData.venue_map_url?.trim() || '',
            program_outline: program_outline_payload,
            dress_code: useDressCode ? formData.dress_code?.trim() || '' : '',
            status: formData.status,
            max_guests: parseInt(formData.max_guests.toString())
          })
        })
        
        if (!res.ok) {
          let errorMessage = 'Lỗi server'
          try {
            const errorData = await res.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            const errorText = await res.text()
            errorMessage = errorText || errorMessage
          }
          throw new Error(errorMessage)
        }
        
        setToastMsg('Cập nhật sự kiện thành công')
        setToastType('success')
        setToastVisible(true)
      } else {
        // Create new event in backend
        const res = await fetch('http://localhost:5001/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            date: formData.date,
            time: formData.time,
            location: formData.location.trim(),
            venue_address: formData.venue_address?.trim() || '',
            venue_map_url: formData.venue_map_url?.trim() || '',
            program_outline: program_outline_payload,
            dress_code: useDressCode ? formData.dress_code?.trim() || '' : '',
            status: formData.status,
            max_guests: parseInt(formData.max_guests.toString())
          })
        })
        
        if (!res.ok) {
          let errorMessage = 'Lỗi server'
          try {
            const errorData = await res.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            const errorText = await res.text()
            errorMessage = errorText || errorMessage
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
      const guestsRes = await fetch(`http://localhost:5001/api/guests?event_id=${eventId}`)
      const guestsData = await guestsRes.json()
      const guestCount = guestsData.guests ? guestsData.guests.length : 0
      
      let confirmMessage = `Bạn có chắc chắn muốn xóa sự kiện "${eventName}"?`
      if (guestCount > 0) {
        confirmMessage += `\n\n⚠️ CẢNH BÁO: Sẽ xóa ${guestCount} khách mời thuộc sự kiện này!`
      }
      
      if (confirm(confirmMessage)) {
        const res = await fetch(`http://localhost:5001/api/events/${eventId}`, { method: 'DELETE' })
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
                         event.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter
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

  // Quick update status inline
  const updateEventStatus = async (eventId: number, newStatus: 'upcoming'|'ongoing'|'completed'|'cancelled') => {
    try {
      const res = await fetch(`http://localhost:5001/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
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
    <div className="space-y-6">
      {toastVisible && mounted && createPortal(
        <div className={`fixed top-4 right-4 z-[99999] transform transition-all duration-300 ${toastVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-2xl max-w-xs backdrop-blur-md border text-white ${
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 text-transparent bg-clip-text mb-2">
          Quản Lý Sự Kiện
        </h1>
        <p className="text-white/70 text-lg">Tạo và quản lý các sự kiện của công ty</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {/* Total Events */}
        <div className="group relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:from-blue-500/20 hover:to-cyan-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
                <div className="text-sm text-blue-300/80 font-medium">Tổng sự kiện</div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming */}
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
                <div className="text-3xl font-bold text-white mb-1">{stats.upcoming}</div>
                <div className="text-sm text-yellow-300/80 font-medium">Sắp diễn ra</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ongoing */}
        <div className="group relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 hover:from-green-500/20 hover:to-emerald-500/20 hover:border-green-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">{stats.ongoing}</div>
                <div className="text-sm text-green-300/80 font-medium">Đang diễn ra</div>
              </div>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="group relative bg-gradient-to-br from-gray-500/10 to-slate-500/10 backdrop-blur-sm border border-gray-500/20 rounded-2xl p-6 hover:from-gray-500/20 hover:to-slate-500/20 hover:border-gray-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/20">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gray-500/20 rounded-xl">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white mb-1">{stats.completed}</div>
                <div className="text-sm text-gray-300/80 font-medium">Đã hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancelled */}
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
                <div className="text-3xl font-bold text-white mb-1">{stats.cancelled}</div>
                <div className="text-sm text-red-300/80 font-medium">Đã hủy</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2">
          <button 
            onClick={() => openEventModal()}
            className="group relative px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Tạo sự kiện
          </button>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
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
            className="min-w-[160px]"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="bg-black/20 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-white/80 font-medium w-1/4">Tên sự kiện</th>
                <th className="text-left py-4 px-4 text-white/80 font-medium w-1/6">Ngày & Giờ</th>
                <th className="text-left py-4 px-4 text-white/80 font-medium w-1/6">Địa điểm</th>
                <th className="text-left py-4 px-4 text-white/80 font-medium w-20">Số khách</th>
                <th className="text-left py-4 px-4 text-white/80 font-medium w-32">Trạng thái</th>
                <th className="text-left py-4 px-4 text-white/80 font-medium w-32">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.map((event) => (
                <tr key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 w-1/4">
                    <div>
                      <h3 className="text-white font-medium truncate">{event.name}</h3>
                      <p className="text-white/60 text-sm mt-1 line-clamp-2">{event.description}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 w-1/6">
                    <div className="text-white/80">
                      <div>{new Date(event.date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-sm text-white/60">{event.time}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white/80 w-1/6 truncate">{event.location}</td>
                  <td className="py-4 px-4 text-white/80 w-20 text-center">{event.max_guests}</td>
                  <td className="py-4 px-4 w-32">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(event.status)}`}>
                      {getStatusText(event.status)}
                    </span>
                  </td>
                  <td className="py-4 px-4 w-32">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEventModal(event)}
                        className="group relative px-3 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs hover:from-amber-500/30 hover:to-orange-500/30 hover:border-amber-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/20"
                        title="Chỉnh sửa sự kiện"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Sửa
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id, event.name)}
                        className="group relative px-3 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
                        title="Xóa sự kiện"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
      </div>

      {/* Event Modal */}
      {showEventModal && !showPreviewModal && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingEvent ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
              </h2>
              <button
                onClick={closeEventModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Tên sự kiện</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  placeholder="Nhập tên sự kiện"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50 h-24 resize-none"
                  placeholder="Nhập mô tả sự kiện"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Ngày</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Giờ</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Địa điểm</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  placeholder="Nhập địa điểm tổ chức"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    value={formData.venue_address}
                    onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                    placeholder="Ví dụ: 123 Lê Lợi, Quận 1, TP.HCM"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Link Google Maps</label>
                  <input
                    type="url"
                    value={formData.venue_map_url}
                    onChange={(e) => setFormData({ ...formData, venue_map_url: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Số khách tối đa</label>
                  <input
                    type="number"
                    value={formData.max_guests}
                    onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Trạng thái</label>
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
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  placeholder="Ví dụ: 123 Lê Lợi, Quận 1, TP.HCM"
                />
              </div>

              {/* Dress Code */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDressCode}
                      onChange={(e) => setUseDressCode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-transparent border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-white/80 text-sm font-medium">Đề nghị trang phục cho sự kiện</span>
                  </label>
                </div>
                {useDressCode && (
                  <div className="mt-3">
                    <label className="block text-white/80 text-sm font-medium mb-2">Trang phục</label>
                    <input
                      type="text"
                      value={formData.dress_code}
                      onChange={(e) => setFormData({ ...formData, dress_code: e.target.value })}
                      className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                      placeholder="Ví dụ: Trang phục lịch sự, Áo dài truyền thống, Business casual..."
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Timeline chương trình</label>
                <div className="bg-black/20 border border-white/20 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left text-white/70 text-xs font-medium px-4 py-2 w-32">Giờ</th>
                        <th className="text-left text-white/70 text-xs font-medium px-4 py-2">Nội dung</th>
                        <th className="px-2 py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {programRows.map((row, idx) => (
                        <tr key={idx} className="border-t border-white/10">
                          <td className="px-4 py-2">
                            <input
                              type="time"
                              value={row.time}
                              onChange={(e) => {
                                const v = e.target.value
                                setProgramRows(prev => prev.map((r,i)=> i===idx?{...r,time:v}:r))
                              }}
                              className="w-full px-2 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.item}
                              onChange={(e) => {
                                const v = e.target.value
                                setProgramRows(prev => prev.map((r,i)=> i===idx?{...r,item:v}:r))
                              }}
                              className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50"
                              placeholder="Nội dung chương trình"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              onClick={() => setProgramRows(prev => prev.filter((_,i)=>i!==idx))}
                              className="px-2 py-2 text-red-300 hover:text-red-200"
                              title="Xóa dòng"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 border-t border-white/10 flex justify-between">
                    <button
                      onClick={() => setProgramRows(prev => [...prev, { time: '', item: '' }])}
                      className="px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15"
                    >
                      Thêm dòng
                    </button>
                    {programRows.length>0 && (
                      <span className="text-white/40 text-xs self-center">{programRows.length} mục</span>
                    )}
                  </div>
                </div>
               
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={openPreviewModal}
                className="group relative px-6 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-xl hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/20"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Xem trước
              </button>
              <button
                onClick={saveEvent}
                className="group relative flex-1 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 font-medium flex items-center justify-center gap-2 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {editingEvent ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button
                onClick={closeEventModal}
                className="group relative px-6 py-3 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-xl hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20"
              >
                Hủy
              </button>
            </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Preview Modal */}
      {showPreviewModal && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Xem trước thiệp mời
              </h2>
              <button
                onClick={closePreviewModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto max-h-[calc(90vh-120px)]">
              <MeshBackground>
                <div className="min-h-screen">
                  <div className="max-w-2xl mx-auto p-6 space-y-6 py-12">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      {/* Logo công ty */}
                      <img
                        src="/assets/logo-DytfE-Xm.png"
                        alt="Company Logo"
                        className="h-16 w-16 object-contain"
                      />

                      {/* Text bên cạnh */}
                      <div>
                        <h1 className="text-2xl font-bold text-white">EXP Technology</h1>
                        <p className="text-lg text-white/80">15 Years of Excellence</p>
                        <p className="text-sm text-white/60">EXP Technology Company Limited</p>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-white mb-2">{formData.name || 'Sự kiện'}</h2>
                      <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"></div>
                    </div>
                  </div>

                  <div className="border border-white/20 rounded-xl p-6 space-y-6 bg-black/20 backdrop-blur-sm relative z-0">
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-white mb-2">Kính gửi [Tên khách mời]</h2>
                      <p className="text-white/80 text-lg">Trân trọng mời quý khách tham dự chương trình</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">
                          Thời gian & Địa điểm
                        </h3>
                        <div className="space-y-2 text-white/80">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>{formData.date || 'Ngày'} {formData.time || 'Giờ'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <a
                              href={formData.venue_map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location || 'Địa điểm sự kiện')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-300 hover:text-cyan-200 underline decoration-dotted underline-offset-4"
                            >
                              {formData.location || 'Địa điểm sự kiện'}
                            </a>
                          </div>
                          {formData.venue_address && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                              <span className="text-white/70">{formData.venue_address}</span>
                            </div>
                          )}
                          {useDressCode && formData.dress_code && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-white/60"></div>
                              <span className="text-white/70">Trang phục: {formData.dress_code}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-white">
                          Chương trình
                        </h3>
                        <div className="relative pl-6 text-sm">
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                          {programRows.length > 0 ? (
                            programRows.map((item, index) => (
                              <div key={index} className="relative flex items-start gap-3 py-2">
                                <div className="text-cyan-400 w-16 font-medium">{item.time || ''}</div>
                                <div className="text-white/85 flex-1">{item.item || ''}</div>
                              </div>
                            ))
                          ) : (
                            <div className="text-white/60 italic">Chương trình sẽ được cập nhật</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-4 border-t border-white/10">
                      
                      <p className="text-white/60 text-sm mt-1">
                        Vui lòng xác nhận tham dự trước hạn chót
                      </p>
                    </div>
                  </div>

                  <div className="border border-white/20 rounded-xl p-8 bg-black/20 backdrop-blur-sm text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">Xác nhận tham dự</h3>
                    <p className="text-white/60 mb-6">Vui lòng cho chúng tôi biết bạn có thể tham dự sự kiện không?</p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <button className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 hover:from-emerald-500/30 hover:to-cyan-500/30 hover:border-emerald-300/60 transition-all duration-300 flex items-center justify-center gap-3 font-medium backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/20">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>Tôi sẽ tham dự</span>
                      </button>
                      <button className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-400/40 text-rose-300 hover:from-rose-500/20 hover:to-red-500/20 hover:border-rose-300/60 transition-all duration-300 flex items-center justify-center gap-3 font-medium backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/20">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>Không thể tham dự</span>
                      </button>
                    </div>
                    <p className="text-white/50 text-sm mt-4">
                      Hạn chót xác nhận: Hạn chót
                    </p>
                  </div>
                  
                  {/* Footer */}
                  <div className="text-center pt-8 border-t border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <img
                        src="/assets/logo-DytfE-Xm.png"
                        alt="Company Logo"
                        className="h-8 w-8 object-contain"
                      />
                      <span className="text-white/80 font-medium">EXP Technology Company Limited</span>
                    </div>
                    <p className="text-white/60 text-sm mb-2">15 Years of Excellence</p>
                    <p className="text-white/50 text-xs">
                      Thiệp mời điện tử • Mã ID: DEMO • Tạo lúc: {new Date().toLocaleString('vi-VN')}
                    </p>
                  </div>
                  </div>
                </div>
              </MeshBackground>
            </div>
          </div>
        </div>, document.body
      )}

      {/* Event Detail Modal */}
      {selectedEventId && mounted && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        
                        {event.location && (
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-white/60 text-sm">Địa điểm</div>
                              <div className="text-white font-medium">{event.location}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
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
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
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
    </div>
  )
}