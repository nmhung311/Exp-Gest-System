"use client"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useIsMobile } from "@/src/hooks/use-is-mobile"
import AppleStyleDateTimePicker from "./AppleStyleDateTimePicker"
import dayjs from "dayjs"
import "dayjs/locale/vi"

type Props = {
  mode?: "date" | "time" | "datetime"
  value?: Date
  onChange?: (d: Date) => void
  minuteStep?: number
  buttonClassName?: string
  placeholder?: string
}

export default function DesktopDateTimePicker({
  mode = "datetime",
  value,
  onChange,
  minuteStep = 5,
  buttonClassName = "w-full h-10 rounded-md border border-white/20 bg-black/30 px-3 text-left text-white focus:outline-none focus:border-blue-400/50 inline-flex items-center justify-between",
  placeholder = "Chọn ngày/giờ"
}: Props) {
  const [openDate, setOpenDate] = useState(false)
  const [openTime, setOpenTime] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value)
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number }>(() => {
    if (value) {
      return { hour: value.getHours(), minute: value.getMinutes() }
    }
    return { hour: 0, minute: 0 }
  })
  const [mounted, setMounted] = useState(false)
  const dateButtonRef = useRef<HTMLButtonElement>(null)
  const timeButtonRef = useRef<HTMLButtonElement>(null)
  
  const isMobile = useIsMobile()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setSelectedTime({ hour: value.getHours(), minute: value.getMinutes() })
    }
  }, [value])

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      setSelectedDate(date)
      if (mode === "date") {
        onChange?.(date)
        setOpenDate(false)
      } else if (mode === "datetime") {
        // Combine with existing time
        const newDate = new Date(date)
        newDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0)
        onChange?.(newDate)
      }
    }
  }

  function handleTimeSelect(hour: number, minute: number) {
    setSelectedTime({ hour, minute })
    if (mode === "time") {
      const today = new Date()
      today.setHours(hour, minute, 0, 0)
      onChange?.(today)
      setOpenTime(false)
    } else if (mode === "datetime" && selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(hour, minute, 0, 0)
      onChange?.(newDate)
    }
  }

  function getDisplayValue() {
    if (!value) return placeholder

    const date = new Date(value)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    if (mode === "date") {
      return `${day}/${month}/${year}`
    }
    if (mode === "time") {
      return `${hours}:${minutes}`
    }
    if (mode === "datetime") {
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    return placeholder
  }

  // Modern Calendar component using react-day-picker
  const ModernCalendar = ({ selected, onSelect }: { selected?: Date; onSelect: (date: Date) => void }) => {
    return (
      <div className="rdp">
        <div className="rdp-months">
          <div className="rdp-month">
            <div className="rdp-caption">
              <div className="rdp-caption_label text-white">
                {selected ? dayjs(selected).format("MMMM YYYY") : dayjs().format("MMMM YYYY")}
              </div>
            </div>
            <div className="rdp-head">
              <div className="rdp-head_row">
                <div className="rdp-head_cell text-gray-400">S</div>
                <div className="rdp-head_cell text-gray-400">M</div>
                <div className="rdp-head_cell text-gray-400">T</div>
                <div className="rdp-head_cell text-gray-400">W</div>
                <div className="rdp-head_cell text-gray-400">T</div>
                <div className="rdp-head_cell text-gray-400">F</div>
                <div className="rdp-head_cell text-gray-400">S</div>
              </div>
            </div>
            <div className="rdp-body">
              {(() => {
                const currentMonth = selected || new Date()
                const year = currentMonth.getFullYear()
                const month = currentMonth.getMonth()
                const firstDay = new Date(year, month, 1)
                const lastDay = new Date(year, month + 1, 0)
                const daysInMonth = lastDay.getDate()
                const startingDayOfWeek = firstDay.getDay()
                
                const days = []
                
                // Add empty cells for days before the first day of the month
                for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(null)
                }
                
                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  days.push(new Date(year, month, day))
                }
                
                // Group into weeks
                const weeks = []
                for (let i = 0; i < days.length; i += 7) {
                  weeks.push(days.slice(i, i + 7))
                }
                
                return weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="rdp-row">
                    {week.map((day, dayIndex) => {
                      const isSelected = day && selected && 
                        day.getDate() === selected.getDate() &&
                        day.getMonth() === selected.getMonth() &&
                        day.getFullYear() === selected.getFullYear()
                      
                      const isToday = day && 
                        day.getDate() === new Date().getDate() &&
                        day.getMonth() === new Date().getMonth() &&
                        day.getFullYear() === new Date().getFullYear()

                      return (
                        <button
                          key={dayIndex}
                          onClick={() => day && onSelect(day)}
                          className={`rdp-day ${
                            day
                              ? 'text-white hover:bg-gray-700'
                              : 'text-transparent'
                          } ${
                            isSelected
                              ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                              : isToday
                              ? 'border-2 border-cyan-500 text-cyan-400 font-semibold'
                              : ''
                          }`}
                          disabled={!day}
                        >
                          {day ? day.getDate() : ''}
                        </button>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Popover components
  const DatePopover = () => {
    if (!mounted || !openDate) return null

    return createPortal(
      <div className="fixed inset-0 z-[9999]" onClick={() => setOpenDate(false)}>
        <div 
          className="absolute bg-gray-900 rounded-lg shadow-lg overflow-hidden w-[380px]"
          style={{
            top: dateButtonRef.current ? dateButtonRef.current.offsetTop + dateButtonRef.current.offsetHeight + 6 : 0,
            left: dateButtonRef.current ? dateButtonRef.current.offsetLeft : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="p-4 pb-2">
            <div className="text-xs text-gray-400 uppercase mb-2">SELECT DATE</div>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">
                {selectedDate ? dayjs(selectedDate).format("ddd, MMM D") : "Chọn ngày"}
              </h2>
              <button className="p-1 rounded-full hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="px-4 pb-4">
            <ModernCalendar
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date)
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end p-3 border-t border-gray-700">
            <button
              onClick={() => setOpenDate(false)}
              className="px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedDate) {
                  handleDateSelect(selectedDate)
                } else {
                  setOpenDate(false)
                }
              }}
              className="ml-2 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-gray-700 rounded-md transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  const TimePopover = () => {
    if (!mounted || !openTime) return null

    const [hour, setHour] = useState(selectedTime.hour)
    const [minute, setMinute] = useState(selectedTime.minute)
    const [isAM, setIsAM] = useState(selectedTime.hour < 12)

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value)
      if (value >= 0 && value <= 23) {
        setHour(value)
        setIsAM(value < 12)
      }
    }

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value)
      if (value >= 0 && value <= 59) {
        setMinute(value)
      }
    }

    const handleAMPMChange = (am: boolean) => {
      setIsAM(am)
      if (am && hour >= 12) {
        setHour(hour - 12)
      } else if (!am && hour < 12) {
        setHour(hour + 12)
      }
    }

    const handleOK = () => {
      handleTimeSelect(hour, minute)
      setOpenTime(false)
    }

    return createPortal(
      <div className="fixed inset-0 z-[9999]" onClick={() => setOpenTime(false)}>
        <div 
          className="absolute bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[280px] p-3"
          style={{
            top: timeButtonRef.current ? timeButtonRef.current.offsetTop + timeButtonRef.current.offsetHeight + 6 : 0,
            left: timeButtonRef.current ? timeButtonRef.current.offsetLeft : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-sm text-gray-400 mb-4">Chọn giờ</div>

          {/* Time Input Fields */}
          <div className="flex items-center gap-2 mb-4">
            {/* Hour Input */}
            <div className="flex flex-col">
              <input
                type="number"
                value={String(hour).padStart(2, "0")}
                onChange={handleHourChange}
                className="w-16 h-12 text-center text-lg font-bold bg-cyan-500/20 border-2 border-cyan-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white"
                min="0"
                max="23"
              />
              <div className="text-xs text-gray-400 mt-1">Giờ</div>
            </div>

            {/* Separator */}
            <div className="text-2xl font-bold text-white">:</div>

            {/* Minute Input */}
            <div className="flex flex-col">
              <input
                type="number"
                value={String(minute).padStart(2, "0")}
                onChange={handleMinuteChange}
                className="w-16 h-12 text-center text-lg font-bold bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 text-white"
                min="0"
                max="59"
              />
              <div className="text-xs text-gray-400 mt-1">Phút</div>
            </div>

            {/* AM/PM Selector */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleAMPMChange(true)}
                className={`w-12 h-6 text-xs font-medium rounded border transition-colors ${
                  isAM 
                    ? 'bg-cyan-500 border-cyan-400 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
              >
                AM
              </button>
              <button
                onClick={() => handleAMPMChange(false)}
                className={`w-12 h-6 text-xs font-medium rounded border transition-colors ${
                  !isAM 
                    ? 'bg-cyan-500 border-cyan-400 text-white' 
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex gap-3">
              <button
                onClick={() => setOpenTime(false)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleOK}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Use mobile picker for mobile devices
  if (isMobile) {
    return (
      <AppleStyleDateTimePicker
        mode={mode}
        value={value}
        onChange={onChange}
        minuteStep={minuteStep}
        buttonClassName={buttonClassName} 
        placeholder={placeholder}
      />
    )
  }

  if (mode === "date") {
    return (
      <>
        <button
          ref={dateButtonRef}
          type="button"
          className={buttonClassName}
          onClick={() => setOpenDate(true)}
          aria-haspopup="dialog"
          aria-expanded={openDate}
        >
          <span>{selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : "Chọn ngày"}</span>
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <DatePopover />
      </>
    )
  }

  if (mode === "time") {
    return (
      <>
        <button
          ref={timeButtonRef}
          type="button"
          className={buttonClassName}
          onClick={() => setOpenTime(true)}
          aria-haspopup="dialog"
          aria-expanded={openTime}
        >
          <span>{value ? dayjs(value).format("HH:mm") : "Chọn giờ"}</span>
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <TimePopover />
      </>
    )
  }

  // datetime mode - show both inputs with popovers
  return (
    <>
      <div className="flex gap-2">
        <button
          ref={dateButtonRef}
          type="button"
          className={`flex-1 ${buttonClassName}`}
          onClick={() => setOpenDate(true)}
          aria-haspopup="dialog"
          aria-expanded={openDate}
        >
          <span>{selectedDate ? dayjs(selectedDate).format("DD/MM/YYYY") : "Chọn ngày"}</span>
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          ref={timeButtonRef}
          type="button"
          className={`flex-1 ${buttonClassName}`}
          onClick={() => setOpenTime(true)}
          aria-haspopup="dialog"
          aria-expanded={openTime}
        >
          <span>{value ? dayjs(value).format("HH:mm") : "Chọn giờ"}</span>
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
      <DatePopover />
      <TimePopover />
    </>
  )
}