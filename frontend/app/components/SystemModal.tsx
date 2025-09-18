import React from 'react'
import Portal from './Portal'

interface SystemModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
  showCloseButton?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl'
}

export default function SystemModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  showCloseButton = true,
  className = ''
}: SystemModalProps) {
  if (!isOpen) return null

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] flex items-center justify-center p-2 sm:p-4">
        <div className={`bg-gray-900/20 backdrop-blur-md border border-white/10 rounded-xl w-full ${sizeClasses[size]} max-h-[95dvh] flex flex-col shadow-2xl ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 pb-3 border-b border-white/10">
            <h2 className="text-lg sm:text-xl font-bold text-white pr-4">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-lg flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-glass p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </Portal>
  )
}
