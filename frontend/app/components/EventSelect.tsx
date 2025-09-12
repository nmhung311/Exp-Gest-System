"use client"
import CustomDropdown from "./CustomDropdown"

type EventLike = { id: number; name: string; date: string }

interface EventSelectProps {
  events: EventLike[]
  value: string
  onChange: (value: string) => void
  className?: string
  persist?: boolean
  storageKey?: string
}

export default function EventSelect({
  events,
  value,
  onChange,
  className,
  persist = true,
  storageKey = "exp_selected_event"
}: EventSelectProps){
  function handleChange(v: string){
    onChange(v)
    if (persist && v){
      try { localStorage.setItem(storageKey, v) } catch {}
    }
  }

  return (
    <CustomDropdown
      options={events.map(event => ({
        value: event.id.toString(),
        label: `${event.name} - ${new Date(event.date).toLocaleDateString('vi-VN')}`
      }))}
      value={value}
      onChange={handleChange}
      placeholder="Chọn sự kiện"
      className={className || "min-w-[200px]"}
    />
  )
}


