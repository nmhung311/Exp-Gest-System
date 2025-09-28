"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from './api'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user exists in localStorage first
        const savedUser = localStorage.getItem('current_user')
        if (savedUser) {
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // If no saved user, try to get current user from API
        const response = await api.getCurrentUser()
        if (response.ok) {
          const data = response.data
          if (data.user) {
            // Save user to localStorage
            localStorage.setItem('current_user', JSON.stringify(data.user))
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Clear any existing auth data
      localStorage.removeItem('current_user')
      localStorage.removeItem('auth_token')
      
      // Redirect to login
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/80">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null
  }

  // Render children if authenticated
  return <>{children}</>
}
