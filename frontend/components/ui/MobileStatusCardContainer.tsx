"use client"

import React, { useRef, useEffect, useState } from 'react'

interface MobileStatusCardContainerProps {
  children: React.ReactNode
  className?: string
  showScrollbar?: boolean
  scrollbarStyle?: 'default' | 'glass' | 'thin'
  gap?: 'sm' | 'md' | 'lg'
  padding?: 'sm' | 'md' | 'lg'
}

export default function MobileStatusCardContainer({
  children,
  className = '',
  showScrollbar = true,
  scrollbarStyle = 'default',
  gap = 'md',
  padding = 'md'
}: MobileStatusCardContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  // Gap classes
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  }

  // Padding classes
  const paddingClasses = {
    sm: 'p-2',
    md: 'p-3 sm:p-4',
    lg: 'p-4 sm:p-6'
  }

  // Scrollbar style classes
  const scrollbarClasses = {
    default: 'scrollbar-horizontal-default',
    glass: 'scrollbar-horizontal-glass',
    thin: 'scrollbar-horizontal-thin'
  }

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  // Handle scroll
  const handleScroll = () => {
    setIsScrolling(true)
    checkScrollPosition()
    
    // Clear scrolling state after animation
    setTimeout(() => {
      setIsScrolling(false)
    }, 150)
  }

  // Scroll to direction
  const scrollTo = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200
      const currentScroll = scrollRef.current.scrollLeft
      const targetScroll = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : currentScroll + scrollAmount

      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  // Initialize scroll position check
  useEffect(() => {
    checkScrollPosition()
    
    const handleResize = () => {
      setTimeout(checkScrollPosition, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Scroll indicators */}
      {canScrollLeft && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="w-8 h-16 bg-gradient-to-r from-black/80 to-transparent rounded-r-lg flex items-center justify-center">
            <div className="w-1 h-8 bg-white/30 rounded-full"></div>
          </div>
        </div>
      )}
      
      {canScrollRight && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="w-8 h-16 bg-gradient-to-l from-black/80 to-transparent rounded-l-lg flex items-center justify-center">
            <div className="w-1 h-8 bg-white/30 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`
          flex overflow-x-auto overflow-y-hidden
          ${gapClasses[gap]}
          ${paddingClasses[padding]}
          ${showScrollbar ? scrollbarClasses[scrollbarStyle] : 'scrollbar-none'}
          transition-all duration-200
          ${isScrolling ? 'scroll-smooth' : ''}
        `}
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </div>

      {/* Scroll buttons for desktop */}
      <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none">
        {canScrollLeft && (
          <button
            onClick={() => scrollTo('left')}
            className="pointer-events-auto w-8 h-8 bg-black/50 hover:bg-black/70 border border-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={() => scrollTo('right')}
            className="pointer-events-auto w-8 h-8 bg-black/50 hover:bg-black/70 border border-white/20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
