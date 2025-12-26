"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page
    router.push("/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Redirecting...</h1>
        <p className="text-gray-300">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    </div>
  )
}