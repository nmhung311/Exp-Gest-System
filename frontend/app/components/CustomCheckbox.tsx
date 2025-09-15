"use client"

import { forwardRef } from "react"

interface CustomCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  label?: string
  id?: string
}

const CustomCheckbox = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ checked, onChange, disabled = false, className = "", label, id }, ref) => {
    return (
      <label 
        className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        htmlFor={id}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
          />
          <div className={`
            w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center
            ${checked 
              ? 'bg-blue-500 border-blue-500' 
              : 'bg-transparent border-white/30 hover:border-white/50'
            }
            ${disabled ? 'opacity-50' : ''}
          `}>
            {checked && (
              <svg 
                className="w-3 h-3 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            )}
          </div>
        </div>
        {label && (
          <span className="text-white/80 text-sm font-medium select-none">
            {label}
          </span>
        )}
      </label>
    )
  }
)

CustomCheckbox.displayName = "CustomCheckbox"

export default CustomCheckbox
