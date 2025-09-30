"use client"
import React, { useRef, useEffect, useState } from 'react'

interface SimpleQRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  isActive: boolean
}

export default function SimpleQRScanner({ onScan, onError, isActive }: SimpleQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string>("")

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
      setDebugInfo("Đang khởi động camera...")
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      })
      
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Xử lý lỗi play() bị gián đoạn
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error('Video play error:', error)
            }
          })
        }
        
        setIsScanning(true)
        setDebugInfo("Camera đã khởi động, đang bắt đầu quét...")
        
        // Đợi video load xong
        videoRef.current.onloadeddata = () => {
          setDebugInfo("Video đã sẵn sàng, bắt đầu quét QR...")
          startQRDetection()
        }
      }
    } catch (err) {
      const errorMessage = 'Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.'
      setError(errorMessage)
      setDebugInfo("Lỗi: " + errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setDebugInfo("Đã dừng quét")
  }

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      setDebugInfo("Không thể tạo canvas context")
      return
    }

    let isScanningActive = true

    const scanFrame = () => {
      if (!isScanningActive || !isScanning || video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (isScanningActive) {
          requestAnimationFrame(scanFrame)
        }
        return
      }

      try {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        // Tăng counter
        setScanCount(prev => prev + 1)
        setDebugInfo(`Đang quét... (${scanCount + 1}) - Video: ${video.videoWidth}x${video.videoHeight}`)

        // Thử detect QR code với jsQR
        import('jsqr').then((jsQR) => {
          if (!isScanningActive) return
          
          const code = jsQR.default(imageData.data, imageData.width, imageData.height)
          if (code) {
            console.log('QR Code detected:', code.data)
            setDebugInfo(`QR Code tìm thấy: ${code.data}`)
            isScanningActive = false
            onScan(code.data)
            stopScanning()
          } else {
            requestAnimationFrame(scanFrame)
          }
        }).catch((err) => {
          console.error('Error loading jsQR:', err)
          setDebugInfo(`Lỗi tải jsQR: ${err.message}`)
          if (isScanningActive) {
            requestAnimationFrame(scanFrame)
          }
        })

      } catch (err) {
        console.error('Scan frame error:', err)
        setDebugInfo(`Lỗi quét: ${err}`)
        if (isScanningActive) {
          requestAnimationFrame(scanFrame)
        }
      }
    }

    // Bắt đầu quét sau một chút delay để đảm bảo video ổn định
    setTimeout(() => {
      if (isScanningActive) {
        scanFrame()
      }
    }, 500)
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
        <div className="text-red-400 font-medium mb-2">Lỗi Camera</div>
        <div className="text-red-300 text-sm">{error}</div>
        <div className="text-red-200 text-xs mt-2">{debugInfo}</div>
        <button
          onClick={() => {
            setError(null)
            setDebugInfo("")
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

      {/* Debug info */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-2 rounded text-xs">
        <div>Scanning: {isScanning ? 'Yes' : 'No'}</div>
        <div>Count: {scanCount}</div>
        <div>Video: {videoRef.current?.readyState || 'N/A'}</div>
      </div>

      {/* Hướng dẫn */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-white text-sm">
            {isScanning ? 'Đưa mã QR vào khung để quét' : 'Đang khởi động camera...'}
          </div>
          <div className="text-white/60 text-xs mt-1">{debugInfo}</div>
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
