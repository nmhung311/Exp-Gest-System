import React, { useEffect, useMemo, useRef } from "react"

type Item = { value: string | number; label: string }
type Props = {
  items: Item[]
  value: string | number
  onChange: (v: string | number) => void
  height?: number
  itemHeight?: number
  className?: string
}

export default function WheelPicker({
  items, value, onChange, height = 220, itemHeight = 40, className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const pad = (height - itemHeight) / 2
  const indexOf = useMemo(
    () => Math.max(0, items.findIndex(i => i.value === value)),
    [items, value]
  )

  // scroll tới giá trị hiện tại
  useEffect(() => {
    ref.current?.scrollTo({ top: indexOf * itemHeight, behavior: "instant" as any })
  }, [indexOf, itemHeight])

  // snap và emit
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let t: any
    const onScroll = () => {
      clearTimeout(t)
      t = setTimeout(() => {
        const nearest = Math.round(el.scrollTop / itemHeight)
        const top = nearest * itemHeight
        el.scrollTo({ top, behavior: "smooth" })
        const picked = items[Math.min(items.length - 1, Math.max(0, nearest))]
        if (picked && picked.value !== value) onChange(picked.value)
      }, 80)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [itemHeight, items, onChange, value])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* lens giữa */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 border-y border-white/20 bg-black/10 backdrop-blur-[1px]" />
      {/* gradient mờ trên/dưới */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/90 to-transparent" />

      <div
        ref={ref}
        className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth scrollbar-none"
        style={{ scrollPaddingTop: pad, scrollPaddingBottom: pad }}
        role="listbox"
        aria-label="Chọn giá trị"
      >
        <ul style={{ paddingTop: pad, paddingBottom: pad }}>
          {items.map((it) => {
            const selected = it.value === value
            return (
              <li
                key={String(it.value)}
                aria-selected={selected}
                className={`h-10 flex items-center justify-center select-none snap-center transition-[opacity,transform] duration-150 ${
                  selected
                    ? "text-base font-semibold text-cyan-400 opacity-100 scale-105"
                    : "text-sm text-white/70 opacity-60 scale-95"
                }`}
              >
                {it.label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
