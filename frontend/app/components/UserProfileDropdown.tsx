"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "../../lib/api"

interface User {
  id: number
  username: string
  email: string | null
  created_at: string | null
}

interface UserProfileDropdownProps {
  isInMobileMenu?: boolean
}

export default function UserProfileDropdown({ isInMobileMenu = false }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Lấy thông tin user hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // Thử lấy từ localStorage trước
        const savedUser = localStorage.getItem('current_user')
        if (savedUser) {
          setUser(JSON.parse(savedUser))
          setLoading(false)
          return
        }

        // Nếu không có, gọi API
        const response = await api.getCurrentUser()
        if (response.ok) {
          setUser(response.data.user)
          // Lưu vào localStorage để dùng lần sau
          localStorage.setItem('current_user', JSON.stringify(response.data.user))
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  // Đóng dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    // Xóa token và user info khỏi localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('current_user')
    
    // Chuyển hướng về trang đăng nhập
    router.push('/login')
    
    // Đóng dropdown
    setIsOpen(false)
  }

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="relative">
        <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span className="hidden lg:inline">Đăng nhập</span>
      </button>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-white/80 hover:text-white"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {getInitials(user.username)}
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium">{user.username}</div>
          <div className="text-xs text-white/60">{user.email || 'No email'}</div>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`${isInMobileMenu ? 'relative mt-2 w-full' : 'absolute right-0 mt-2 w-64'} bg-black/90 backdrop-blur-md border border-white/20 rounded-lg shadow-xl ${isInMobileMenu ? 'z-10' : 'z-50'}`}>
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                {getInitials(user.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium truncate">{user.username}</div>
                <div className="text-white/60 text-sm truncate">{user.email || 'No email'}</div>
                <div className="text-white/40 text-xs">
                  ID: {user.id}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Navigate to profile page
              }}
              className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Thông tin cá nhân
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Navigate to settings page
              }}
              className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Cài đặt
            </button>
          </div>

          {/* Logout Button */}
          <div className="border-t border-white/10 py-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
