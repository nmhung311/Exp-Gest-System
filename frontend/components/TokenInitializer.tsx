'use client'

import { useEffect } from 'react'
import { initializeTokenRestoration, enableAuthStorageSync } from '@/lib/jwt'

export default function TokenInitializer() {
  useEffect(() => {
    // Initialize token restoration when app starts
    initializeTokenRestoration()
    // Enable multi-tab sync
    enableAuthStorageSync()
  }, [])

  return null // This component doesn't render anything
}
