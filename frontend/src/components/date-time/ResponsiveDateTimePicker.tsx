"use client"
import { useIsMobile } from "@/src/hooks/use-is-mobile"
import AppleStyleDateTimePicker from "./AppleStyleDateTimePicker"
import DesktopDateTimePicker from "./DesktopDateTimePicker"

type Props = {
  mode?: "date" | "time" | "datetime"
  value?: Date
  onChange?: (d: Date) => void
  minuteStep?: number
  buttonClassName?: string
  placeholder?: string
}

export default function ResponsiveDateTimePicker(props: Props) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <AppleStyleDateTimePicker {...props} />
  }

  return <DesktopDateTimePicker {...props} />
}
