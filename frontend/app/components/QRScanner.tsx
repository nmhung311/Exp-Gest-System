"use client"
import React, { useRef, useEffect, useState } from 'react'
import jsQR from 'jsqr'

interface QRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  isActive: boolean
}

export default function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)

  useEffect(() => {
    if (isActive && !isScanning) {
      startScanning()
    } else if (!isActive && isScanning) {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive])

  const startScanning = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsScanning(true)
        scanQRCode()
      }
    } catch (err) {
      const errorMessage = 'Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const scanFrame = () => {
      if (!isScanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanFrame)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const qrCode = detectQRCode(imageData)

      // Tăng counter để debug
      setScanCount(prev => prev + 1)

      if (qrCode) {
        console.log('QR Code detected:', qrCode)
        onScan(qrCode)
        stopScanning()
      } else {
        requestAnimationFrame(scanFrame)
      }
    }

    // Đợi video load xong rồi mới bắt đầu quét
    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      scanFrame()
    } else {
      video.addEventListener('loadeddata', scanFrame, { once: true })
    }
  }

  const detectQRCode = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        console.log('QR Code found:', code.data)
        return code.data
      }
      return null
    } catch (error) {
      console.error('QR detection error:', error)
      return null
    }
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
        <div className="text-red-400 font-medium mb-2">Lỗi Camera</div>
        <div className="text-red-300 text-sm">{error}</div>
        <button
          onClick={() => {
            setError(null)
            startScanning()
          }}
          className="group relative mt-3 px-4 py-2 bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-500/30 text-red-400 rounded-lg hover:from-red-500/30 hover:to-rose-500/30 hover:border-red-400/50 transition-all duration-300 text-sm backdrop-blur-sm hover:shadow-lg hover:shadow-red-500/20"
        >
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-64 object-cover"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      
      {/* Overlay với khung quét */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 border-2 border-white rounded-lg relative">
          {/* Góc vuông */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            {isScanning ? `Đưa mã QR vào khung để quét (${scanCount})` : 'Đang khởi động camera...'}
          </div>
        </div>
      </div>

      {/* Nút dừng quét */}
      {isScanning && (
        <button
          onClick={stopScanning}
          className="absolute top-4 right-4 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  )
}
