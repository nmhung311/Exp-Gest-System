"use client"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import BackgroundOverlay from "../components/BackgroundOverlay"
import UserProfileDropdown from "../components/UserProfileDropdown"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [menuAnimation, setMenuAnimation] = useState<'opening' | 'open' | 'closing' | 'closed'>('closed')
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(path)
  }

  // Handle menu toggle with animation
  const toggleMobileMenu = () => {
    if (menuAnimation === 'closed' || menuAnimation === 'closing') {
      setIsMobileMenuOpen(true)
      // Delay để đảm bảo DOM đã render
      setTimeout(() => {
        setMenuAnimation('opening')
      }, 10)
    } else {
      setMenuAnimation('closing')
    }
  }

  // Handle animation states
  useEffect(() => {
    if (menuAnimation === 'opening') {
      // Sử dụng requestAnimationFrame để đảm bảo smooth animation
      const timer = requestAnimationFrame(() => {
        setTimeout(() => setMenuAnimation('open'), 50)
      })
      return () => cancelAnimationFrame(timer)
    } else if (menuAnimation === 'closing') {
      const timer = setTimeout(() => {
        setIsMobileMenuOpen(false)
        setMenuAnimation('closed')
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [menuAnimation])

  // Calculate menu position based on button position
  const getMenuStyle = () => {
    if (!buttonRef.current) return {}
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    return {
      position: 'absolute' as const,
      top: buttonRect.bottom + 8,
      right: 0,
      width: '280px',
      maxWidth: 'calc(100vw - 16px)',
    }
  }

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuAnimation === 'open'
      ) {
        setMenuAnimation('closing')
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen, menuAnimation])

  return (
    <>
      <BackgroundOverlay />
      <header className="sticky top-0 z-50 border-b border-white/20 bg-black backdrop-blur-md">
        <div className="w-full py-3 flex items-center">
          {/* Logo - Sát trái */}
          <div className="company-logo relative h-10 w-40 md:h-14 md:w-64 overflow-hidden flex-shrink-0 ml-5">
            <Image
              src="/logo.png"
              alt="Company Logo"
              fill
              sizes="(min-width: 768px) 256px, 160px"
              className="object-contain"
              priority
            />
          </div>
          
          {/* Desktop Navigation - Sát phải */}
          <nav className="hidden md:flex items-center gap-4 text-sm text-white/80 ml-auto">
            <a 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
              href="/dashboard"
            >
              Bảng điều khiển
            </a>
            <a 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/guests') 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
              href="/dashboard/guests"
            >
              Khách mời
            </a>
            <a 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/checkin') 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
              href="/dashboard/checkin"
            >
              Check-in
            </a>
            <a 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/events') 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
              href="/dashboard/events"
            >
              Sự kiện
            </a>
            <a 
              className={`px-3 py-2 rounded-lg transition-colors ${
                isActive('/dashboard/stats') 
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                  : 'hover:text-white hover:bg-white/10'
              }`}
              href="/dashboard/stats"
            >
              Thống kê
            </a>
            
            {/* User Profile Dropdown */}
            <UserProfileDropdown />
          </nav>

          {/* Mobile Menu Button - Sát phải */}
          <button
            ref={buttonRef}
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors ml-auto mr-5"
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
          <div 
            ref={menuRef}
            className={`md:hidden bg-black/95 backdrop-blur-md rounded-bl-2xl shadow-2xl shadow-black/50 z-50 transform transition-all duration-300 ease-out ${
              menuAnimation === 'opening' 
                ? 'opacity-100 translate-x-0 scale-100' 
                : menuAnimation === 'closing'
                ? 'opacity-0 translate-x-full scale-95'
                : menuAnimation === 'open'
                ? 'opacity-100 translate-x-0 scale-100'
                : 'opacity-0 translate-x-full scale-95'
            }`}
            style={{
              ...getMenuStyle(),
              transformOrigin: 'right top',
              willChange: 'transform, opacity'
            }}
          >
            <nav className={`px-4 py-4 space-y-2 transition-all duration-300 ${
              menuAnimation === 'opening' || menuAnimation === 'open'
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-4'
            }`}>
              <a 
                className={`block px-3 py-3 rounded-lg transition-colors text-sm ${
                  isActive('/dashboard') 
                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                href="/dashboard"
                onClick={() => setMenuAnimation('closing')}
              >
                Bảng điều khiển
              </a>
              <a 
                className={`block px-3 py-3 rounded-lg transition-colors text-sm ${
                  isActive('/dashboard/guests') 
                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                href="/dashboard/guests"
                onClick={() => setMenuAnimation('closing')}
              >
                Khách mời
              </a>
              <a 
                className={`block px-3 py-3 rounded-lg transition-colors text-sm ${
                  isActive('/dashboard/checkin') 
                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                href="/dashboard/checkin"
                onClick={() => setMenuAnimation('closing')}
              >
                Check-in
              </a>
              <a 
                className={`block px-3 py-3 rounded-lg transition-colors text-sm ${
                  isActive('/dashboard/events') 
                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                href="/dashboard/events"
                onClick={() => setMenuAnimation('closing')}
              >
                Sự kiện
              </a>
              <a 
                className={`block px-3 py-3 rounded-lg transition-colors text-sm ${
                  isActive('/dashboard/stats') 
                    ? 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 border-b-2 border-cyan-400/60' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                href="/dashboard/stats"
                onClick={() => setMenuAnimation('closing')}
              >
                Thống kê
              </a>
              
              {/* Mobile User Profile */}
              <div className="pt-2 border-t border-white/10">
                <div className="px-3 py-2">
                  <UserProfileDropdown isInMobileMenu={true} />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
      <main className="w-full px-4 md:px-14 py-4 md:py-8 space-y-4 md:space-y-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-white/60">© 2025 EXP Technology Company Limited</footer>
    </>
  )
}
