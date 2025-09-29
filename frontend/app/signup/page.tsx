"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignupAlias() {
  // 🚫 CHẶN REDIRECT - Không redirect từ signup đến register nữa
  // Hiển thị trang signup thay vì redirect
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Signup Page</h1>
        <p className="text-gray-600">This is the signup page (no redirect)</p>
      </div>
    </div>
  )
}


