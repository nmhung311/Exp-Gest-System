"use client"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import MeshBackground from "../components/MeshBackground"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    // Xóa token khỏi localStorage
    localStorage.removeItem('auth_token')
    
    // Chuyển hướng về trang đăng nhập
    router.push('/login')
    
    // Đóng mobile menu nếu đang mở
    setIsMobileMenuOpen(false)
  }

  return (
    <MeshBackground>
      <header className="sticky top-0 z-50 border-b border-white/20 bg-black backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="company-logo relative h-10 w-40 md:h-14 md:w-64 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Company Logo"
              fill
              sizes="(min-width: 768px) 256px, 160px"
              className="object-contain"
              priority
            />
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 text-sm text-white/80">
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard">Bảng điều khiển</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/guests">Khách mời</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/checkin">Check-in</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/events">Sự kiện</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/stats">Thống kê</a>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors border border-red-500/30"
              title="Đăng xuất"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden lg:inline">Đăng xuất</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/20 bg-black/95 backdrop-blur-md">
            <nav className="px-4 py-4 space-y-2">
              <a 
                className="block hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/80" 
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bảng điều khiển
              </a>
              <a 
                className="block hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/80" 
                href="/dashboard/guests"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Khách mời
              </a>
              <a 
                className="block hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/80" 
                href="/dashboard/checkin"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Check-in
              </a>
              <a 
                className="block hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/80" 
                href="/dashboard/events"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sự kiện
              </a>
              <a 
                className="block hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm text-white/80" 
                href="/dashboard/stats"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Thống kê
              </a>
              
              {/* Mobile Logout Button */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors text-sm text-red-400 border border-red-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="w-full px-4 md:px-14 py-4 md:py-8 space-y-4 md:space-y-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-white/60">© 2025 EXP Technology Company Limited</footer>
    </MeshBackground>
  )
}
