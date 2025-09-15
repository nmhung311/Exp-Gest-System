"use client"
import React, { useState, useRef, useEffect } from "react"

interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface CustomDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  className = "",
  disabled = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)

  const handleSelect = (option: DropdownOption) => {
    if (!option.disabled) {
      onChange(option.value)
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm
          hover:bg-white/10 hover:border-white/30 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between
          ${isOpen ? 'bg-white/10 border-white/30' : ''}
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
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
        <div className="absolute z-[9999] w-full mt-1 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={`
                  w-full px-3 py-2 text-left text-sm transition-colors duration-150
                  hover:bg-white/10 focus:bg-white/10 focus:outline-none
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${option.value === value ? 'bg-blue-500/30 text-blue-300 border-l-2 border-blue-400' : 'text-white/90'}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === options.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
