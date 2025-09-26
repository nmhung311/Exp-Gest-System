"use client"

import { useEffect } from "react"

export default function HomePage() {
  useEffect(() => {
    // Redirect homepage to main site
    window.location.href = "https://expsolution.io/"
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Redirecting...</h1>
        <p className="text-gray-300">Đang chuyển hướng đến trang chính...</p>
      </div>
    </div>
  )
}