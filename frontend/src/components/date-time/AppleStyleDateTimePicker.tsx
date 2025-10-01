"use client"
import { useMemo, useState } from "react"
import WheelPicker from "@/src/components/ui/WheelPicker"
import { createPortal } from "react-dom"

function range(n: number) { return Array.from({ length: n }, (_, i) => i) }
const dowVI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

type Props = {
  mode?: "date" | "time" | "datetime"
  value?: Date
  onChange?: (d: Date) => void
  minuteStep?: number
  use12h?: boolean
  buttonClassName?: string
  placeholder?: string
}

export default function AppleStyleDateTimePicker({
  mode = "datetime",
  value,
  onChange,
  minuteStep = 5,
  use12h = false,
  buttonClassName = "w-full h-10 rounded-md border border-white/20 bg-black/30 px-3 text-left text-white focus:outline-none focus:border-blue-400/50",
  placeholder = "Chọn ngày/giờ"
}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Initialize with current date/time
  const now = new Date(value || new Date())
  const [y, setY] = useState(now.getFullYear())
  const [m, setM] = useState(now.getMonth() + 1) // 1..12
  const [d, setD] = useState(now.getDate())
  const [hour, setHour] = useState(use12h ? (now.getHours() % 12 || 12) : now.getHours())
  const [ampm, setAmPm] = useState(now.getHours() >= 12 ? "PM" : "AM")
  const [minute, setMinute] = useState(Math.round(now.getMinutes() / minuteStep) * minuteStep % 60)

  // Update states when value prop changes
  useState(() => {
    if (value) {
      const date = new Date(value)
      setY(date.getFullYear())
      setM(date.getMonth() + 1)
      setD(date.getDate())
      setHour(use12h ? (date.getHours() % 12 || 12) : date.getHours())
      setAmPm(date.getHours() >= 12 ? "PM" : "AM")
      setMinute(Math.round(date.getMinutes() / minuteStep) * minuteStep % 60)
    }
  })

  // Mount check for portal
  useState(() => {
    setMounted(true)
  })

  const years = useMemo(() => range(21).map(i => {
    const yy = new Date().getFullYear() - 10 + i
    return { value: yy, label: String(yy) }
  }), [])

  const months = useMemo(() => range(12).map(i => ({ 
    value: i + 1, 
    label: `Th${i + 1}` 
  })), [])

  const daysInMonth = new Date(y, m, 0).getDate()
  const days = useMemo(() => range(daysInMonth).map(i => {
    const dt = new Date(y, m - 1, i + 1)
    return { 
      value: i + 1, 
      label: `${String(i + 1).padStart(2, "0")} ${dowVI[dt.getDay()]}` 
    }
  }), [y, m, daysInMonth])

  const hours = useMemo(() => {
    if (use12h) {
      return range(12).map(i => {
        const h = (i + 1) // 1..12
        return { value: h, label: String(h).padStart(2, "0") }
      })
    }
    return range(24).map(h => ({ value: h, label: String(h).padStart(2, "0") }))
  }, [use12h])

  const minutes = useMemo(() => {
    const n = Math.floor(60 / minuteStep)
    return range(n).map(i => {
      const mm = i * minuteStep
      return { value: mm, label: String(mm).padStart(2, "0") }
    })
  }, [minuteStep])

  function emit() {
    let h = hour
    if (use12h) {
      h = hour % 12
      if (ampm === "PM") h += 12
    }
    const next = new Date(y, m - 1, Math.min(d, daysInMonth), h, minute, 0)
    onChange?.(next)
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
      if (use12h) {
        const h12 = date.getHours() % 12 || 12
        const ampm = date.getHours() >= 12 ? "PM" : "AM"
        return `${String(h12).padStart(2, "0")}:${minutes} ${ampm}`
      }
      return `${hours}:${minutes}`
    }
    if (mode === "datetime") {
      if (use12h) {
        const h12 = date.getHours() % 12 || 12
        const ampm = date.getHours() >= 12 ? "PM" : "AM"
        return `${day}/${month}/${year} ${String(h12).padStart(2, "0")}:${minutes} ${ampm}`
      }
      return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    return placeholder
  }

  const BottomSheet = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]">
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md rounded-t-xl border-t border-white/20 max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-white/60 hover:text-white/80 transition-colors duration-200"
          >
            Hủy
          </button>
          <div className="text-center">
            <h3 className="text-white font-medium">Chọn ngày giờ</h3>
            <div className="text-cyan-400 text-sm font-medium">
              {mode === "date" && `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`}
              {mode === "time" && `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}
              {mode === "datetime" && `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { emit(); setOpen(false) }}
            className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-200"
          >
            Xong
          </button>
        </div>

        {/* Wheel Pickers */}
        <div className="p-4">
          <div className="flex w-full items-stretch justify-center gap-3">
            {(mode === "date" || mode === "datetime") && (
              <>
                <WheelPicker items={days} value={d} onChange={(v) => setD(Number(v))} />
                <WheelPicker items={months} value={m} onChange={(v) => setM(Number(v))} />
                <WheelPicker items={years} value={y} onChange={(v) => setY(Number(v))} />
              </>
            )}

            {(mode === "time" || mode === "datetime") && (
              <>
                <WheelPicker items={hours} value={hour} onChange={(v) => setHour(Number(v))} />
                <WheelPicker items={minutes} value={minute} onChange={(v) => setMinute(Number(v))} />
                {use12h && (
                  <WheelPicker
                    items={[{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }]}
                    value={ampm}
                    onChange={(v) => setAmPm(String(v))}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName}
      >
        <span className={value ? 'text-white' : 'text-white/50'}>
          {getDisplayValue()}
        </span>
        {/* Calendar/Clock Icon */}
        {mode === "date" || mode === "datetime" ? (
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {open && mounted && createPortal(<BottomSheet />, document.body)}
    </>
  )
}
