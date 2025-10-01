import { useEffect, useState } from "react"

export function useIsMobile(breakpoint = 768) {
  const [isMobile, set] = useState(false)
  
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${breakpoint}px)`)
    const fn = () => set(mq.matches)
    fn()
    mq.addEventListener?.("change", fn)
    return () => mq.removeEventListener?.("change", fn)
  }, [breakpoint])
  
  return isMobile
}
