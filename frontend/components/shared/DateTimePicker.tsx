'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface DateTimePickerProps {
  type: 'date' | 'time'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function DateTimePicker({ 
  type, 
  value, 
  onChange, 
  placeholder = "Chọn ngày/giờ",
  className = ""
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom')
  const [inputRef, setInputRef] = useState<HTMLDivElement | null>(null)

  // Generate time options (every 15 minutes) with AM/PM
  const generateTimeOptions = () => {
    const amOptions = []
    const pmOptions = []
    
    // AM hours (0-11)
    for (let hour = 0; hour < 12; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayStr = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        amOptions.push({ value: timeStr, label: displayStr })
      }
    }
    
    // PM hours (12-23)
    for (let hour = 12; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayStr = new Date(2000, 0, 1, hour, minute).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        pmOptions.push({ value: timeStr, label: displayStr })
      }
    }
    
    return { amOptions, pmOptions }
  }

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // First day of the week (Sunday = 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  // Calculate position
  const calculatePosition = () => {
    if (typeof window === 'undefined' || !inputRef) return 'bottom'
    
    const rect = inputRef.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const spaceBelow = viewportHeight - rect.bottom
    const spaceAbove = rect.top
    
    // Check if DateTimePicker is inside a table (timeline)
    const isInTable = inputRef.closest('table') !== null
    
    // For time pickers in tables, prefer showing above to avoid overflow
    if (isInTable && type === 'time') {
      // Check if this is near the bottom of the table
      const table = inputRef.closest('table')
      if (table) {
        const tableRect = table.getBoundingClientRect()
        const isNearBottom = rect.bottom > tableRect.bottom - 100
        
        // If near bottom of table or not enough space below, show on top
        if (isNearBottom || spaceBelow < 200) {
          return 'top'
        }
      }
      
      // If there's space above (more than 200px), show on top
      if (spaceAbove > 200) {
        return 'top'
      }
      // Otherwise show below but with adjusted positioning
      return 'bottom'
    }
    
    // Original logic for other cases
    if (spaceBelow < 250 && spaceAbove > spaceBelow) {
      return 'top'
    }
    
    return 'bottom'
  }

  // Calculate horizontal position for time picker
  const calculateTimePickerPosition = () => {
    if (typeof window === 'undefined' || !inputRef) return { left: 0 }
    
    const rect = inputRef.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const pickerWidth = 320 // w-80 = 320px
    
    // Check if DateTimePicker is inside a table (timeline)
    const isInTable = inputRef.closest('table') !== null
    
    let left: number
    
    if (isInTable && type === 'time') {
      // For timeline table, center the popup relative to the input
      left = rect.left + (rect.width / 2) - (pickerWidth / 2)
    } else {
      // For other cases, try to align with right edge of input
      left = rect.right - pickerWidth
    }
    
    // If popup would go off-screen to the left, align with left edge of input
    if (left < 8) {
      left = rect.left
    }
    
    // If popup would go off-screen to the right, align with right edge of viewport
    if (left + pickerWidth > viewportWidth - 8) {
      left = viewportWidth - pickerWidth - 8
    }
    
    return { left: Math.max(8, left) }
  }

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as HTMLElement
        // Check if click is outside both the input and the portal popup
        if (!target.closest(`.datetime-picker-${type}`) && !target.closest('[data-time-picker-portal]')) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, type])

  // Update position when picker opens
  useEffect(() => {
    if (isOpen && inputRef) {
      const newPosition = calculatePosition()
      setPosition(newPosition)
    }
  }, [isOpen, inputRef])

  // Format display value
  const getDisplayValue = () => {
    if (!value) return ''
    
    if (type === 'date') {
      return new Date(value).toLocaleDateString('vi-VN')
    } else {
      return new Date(2000, 0, 1, parseInt(value.split(':')[0]), parseInt(value.split(':')[1])).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }

  // Handle date selection
  const handleDateSelect = (day: Date) => {
    if (day && day.getMonth() === currentMonth.getMonth()) {
      // Sử dụng local date thay vì UTC để tránh timezone offset
      const year = day.getFullYear()
      const month = String(day.getMonth() + 1).padStart(2, '0')
      const date = String(day.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${date}`
      onChange(dateStr)
      setIsOpen(false)
    }
  }

  // Handle time selection
  const handleTimeSelect = (timeValue: string) => {
    onChange(timeValue)
    setIsOpen(false)
  }

  return (
    <div ref={setInputRef} className={`relative datetime-picker-${type} ${className}`}>
      {/* Input Field */}
      <input
        type="text"
        value={getDisplayValue()}
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 text-sm cursor-pointer"
        placeholder={placeholder}
      />
      
      {/* Calendar/Clock Icon */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        {type === 'date' ? (
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      
      {/* Date Picker */}
      {type === 'date' && isOpen && (
        <div className={`absolute left-0 z-50 w-64 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-xl ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1.5 hover:bg-white/10 rounded transition-all duration-200"
              >
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-sm font-semibold text-white">
                {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1.5 hover:bg-white/10 rounded transition-all duration-200"
              >
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-white/60 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((day, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  className={`w-7 h-7 text-xs rounded transition-all duration-200 ${
                    day && day.getMonth() === currentMonth.getMonth()
                      ? 'text-white hover:bg-white/20 hover:text-cyan-400'
                      : 'text-white/40'
                  } ${
                    value && day && day.toISOString().split('T')[0] === value
                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-500/20'
                      : ''
                  }`}
                  disabled={!day || day.getMonth() !== currentMonth.getMonth()}
                >
                  {day ? day.getDate() : ''}
                </button>
              ))}
            </div>
            
            {/* Footer */}
            <div className="flex justify-between mt-3 pt-2 border-t border-white/20">
              <button
                onClick={() => {
                  const today = new Date()
                  // Sử dụng local date thay vì UTC để tránh timezone offset
                  const year = today.getFullYear()
                  const month = String(today.getMonth() + 1).padStart(2, '0')
                  const date = String(today.getDate()).padStart(2, '0')
                  const todayStr = `${year}-${month}-${date}`
                  onChange(todayStr)
                  setIsOpen(false)
                }}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors duration-200"
              >
                Hôm nay
              </button>
              <button
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className="text-white/60 hover:text-white/80 text-xs font-medium transition-colors duration-200"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Time Picker */}
      {type === 'time' && isOpen && createPortal(
        <div 
          data-time-picker-portal
          className="fixed z-[9999] w-80 bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-xl"
          style={{
            top: position === 'top' 
              ? `${(inputRef?.getBoundingClientRect().top || 0) - 264}px`
              : `${(inputRef?.getBoundingClientRect().bottom || 0) + 8}px`,
            left: `${calculateTimePickerPosition().left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 max-h-64 overflow-hidden">
            <div className="grid grid-cols-2 gap-3 h-full">
              {/* AM Column */}
              <div className="overflow-y-auto scrollbar-glass max-h-56">
                <div className="text-xs font-semibold text-cyan-400 mb-2 px-2 py-1 bg-cyan-500/10 rounded text-center">
                  SÁNG (AM)
                </div>
                <div className="space-y-1">
                  {generateTimeOptions().amOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTimeSelect(option.value)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded transition-all duration-200 ${
                        value === option.value
                          ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-cyan-300'
                          : 'text-white hover:bg-white/10 hover:text-cyan-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* PM Column */}
              <div className="overflow-y-auto scrollbar-glass max-h-56">
                <div className="text-xs font-semibold text-orange-400 mb-2 px-2 py-1 bg-orange-500/10 rounded text-center">
                  CHIỀU (PM)
                </div>
                <div className="space-y-1">
                  {generateTimeOptions().pmOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTimeSelect(option.value)
                      }}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded transition-all duration-200 ${
                        value === option.value
                          ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50 text-cyan-300'
                          : 'text-white hover:bg-white/10 hover:text-cyan-400'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
