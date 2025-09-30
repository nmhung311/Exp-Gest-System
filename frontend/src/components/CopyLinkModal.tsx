"use client"
import React, { useState } from 'react'
import { createPortal } from 'react-dom'

interface CopyLinkModalProps {
  isOpen: boolean
  onClose: () => void
  inviteLink: string
  qrCodeUrl?: string
  eventName?: string
  showToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void
}

export default function CopyLinkModal({ 
  isOpen, 
  onClose, 
  inviteLink, 
  qrCodeUrl,
  eventName,
  showToast
}: CopyLinkModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyLink = async () => {
    console.log('=== COPY LINK CLICKED ===')
    console.log('Invite link:', inviteLink)
    console.log('Clipboard API available:', !!navigator.clipboard)
    console.log('Secure context:', window.isSecureContext)
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        console.log('Using modern clipboard API')
        await navigator.clipboard.writeText(inviteLink)
        console.log('Copy successful')
        setCopied(true)
        showToast?.('Đã copy link thiệp mời!', 'success')
        setTimeout(() => setCopied(false), 2000)
      } else {
        console.log('Using fallback copy method')
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = inviteLink
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          setCopied(true)
          showToast?.('Đã copy link thiệp mời!', 'success')
          setTimeout(() => setCopied(false), 2000)
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr)
          // Show alert as last resort
          alert('Link: ' + inviteLink)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy link:', err)
      // Show alert as last resort
      alert('Link: ' + inviteLink)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Chia sẻ thiệp mời</h3>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Event Name */}
          {eventName && (
            <div className="text-center">
              <p className="text-sm text-white/80 mb-1">Sự kiện:</p>
              <p className="text-white font-medium">{eventName}</p>
            </div>
          )}

          {/* Link Section */}
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Link thiệp mời:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 bg-black/30 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400/50"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500/20 border border-green-400/50 text-green-400'
                    : 'bg-blue-500/20 border border-blue-400/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400/70'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">Đã copy</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          {qrCodeUrl && (
            <div className="space-y-2">
              <label className="text-sm text-white/80 font-medium text-center block">Mã QR:</label>
              <div className="flex justify-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white p-1 rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div className="space-y-2">
            <label className="text-sm text-white/80 font-medium">Chia sẻ:</label>
            <div className="grid grid-cols-2 gap-2">
              {/* Telegram */}
              <button
                onClick={() => {
                  const message = encodeURIComponent(`Thiệp mời sự kiện: ${inviteLink}`)
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${message}`, '_blank')
                }}
                className="px-3 py-2 bg-blue-500/20 border border-blue-400/50 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 hover:border-blue-400/70 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span>Telegram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => {
                  const url = encodeURIComponent(inviteLink)
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
                }}
                className="px-3 py-2 bg-blue-700/20 border border-blue-600/50 text-blue-200 rounded-lg text-sm font-medium hover:bg-blue-700/30 hover:border-blue-600/70 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-white rounded-lg text-sm font-medium hover:bg-gray-600/50 hover:border-gray-500/50 transition-all duration-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
