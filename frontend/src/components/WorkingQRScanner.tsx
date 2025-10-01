"use client"
import React, { useRef, useEffect, useState } from 'react'

interface WorkingQRScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  isActive: boolean
}

// Deprecated: was used only for internal testing. Keeping a stub export to avoid import errors.
export default function WorkingQRScanner({ onScan, onError, isActive }: WorkingQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastScannedCode = useRef<string>("")
  const lastScanTime = useRef<number>(0)
  const isProcessing = useRef<boolean>(false)

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
      setDebugInfo("Đang khởi động camera phía sau...")
      
      // Dừng stream cũ nếu có
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      
      // Kiểm tra quyền truy cập camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera')
      }
      
      // Thử các cấu hình camera khác nhau để đảm bảo sử dụng camera phía sau
      const constraints = [
        // Ưu tiên camera phía sau với environment
        {
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // Fallback với camera phía sau không có size constraints
        {
          video: { 
            facingMode: 'environment'
          }
        },
        // Fallback với camera phía sau và exact constraints
        {
          video: { 
            facingMode: { exact: 'environment' }
          }
        }
      ]
      
      let stream: MediaStream | null = null
      let lastError: Error | null = null
      
      // Thử từng constraint cho đến khi thành công
      for (let i = 0; i < constraints.length; i++) {
        try {
          setDebugInfo(`Thử cấu hình camera ${i + 1}/${constraints.length}...`)
          stream = await navigator.mediaDevices.getUserMedia(constraints[i])
          setDebugInfo(`Camera phía sau đã được khởi động thành công`)
          break
        } catch (err) {
          lastError = err as Error
          console.warn(`Camera constraint ${i + 1} failed:`, err)
          setDebugInfo(`Cấu hình ${i + 1} thất bại, thử tiếp...`)
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Không thể truy cập camera phía sau')
      }
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Đợi video load xong
        videoRef.current.onloadedmetadata = () => {
          setDebugInfo("Video metadata loaded - Camera phía sau")
          console.log('Video metadata loaded:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState
          })
          
          // Force video to play and ensure it's visible
          const playVideo = async () => {
            try {
              await videoRef.current?.play()
              setDebugInfo("Camera phía sau đang hoạt động")
              console.log('Video playing successfully')
              
              // Ensure video is visible
              if (videoRef.current) {
                videoRef.current.style.display = 'block'
                videoRef.current.style.visibility = 'visible'
                videoRef.current.style.opacity = '1'
              }
              
              setIsScanning(true)
              startQRDetection()
            } catch (playError) {
              console.warn('Video play error:', playError)
              setDebugInfo("Video play error nhưng vẫn tiếp tục...")
              setIsScanning(true)
              startQRDetection()
            }
          }
          
          playVideo()
        }
        
        // Thêm event listener để debug
        videoRef.current.oncanplay = () => {
          console.log('Video can play:', {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState
          })
          setDebugInfo(`Video ready: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`)
        }
        
        // Thêm event listener để đảm bảo video hiển thị
        videoRef.current.onplaying = () => {
          console.log('Video is playing')
          setDebugInfo("Video đang phát - Camera hoạt động")
          if (videoRef.current) {
            videoRef.current.style.display = 'block'
            videoRef.current.style.visibility = 'visible'
            videoRef.current.style.opacity = '1'
          }
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      let errorMessage = 'Không thể truy cập camera phía sau. '
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage += 'Vui lòng cho phép quyền truy cập camera trong trình duyệt.'
        } else if (err.name === 'NotFoundError') {
          errorMessage += 'Không tìm thấy camera phía sau. Vui lòng kiểm tra thiết bị.'
        } else if (err.name === 'NotSupportedError') {
          errorMessage += 'Trình duyệt không hỗ trợ truy cập camera.'
        } else {
          errorMessage += `Lỗi: ${err.message}`
        }
      }
      
      setError(errorMessage)
      setDebugInfo("Lỗi: " + errorMessage)
      onError?.(errorMessage)
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setDebugInfo("Đã dừng quét")
  }

  const startQRDetection = () => {
    console.log('Starting QR detection...')
    
    if (!videoRef.current || !canvasRef.current) {
      console.log('Missing video or canvas refs')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) {
      setDebugInfo("Không thể tạo canvas context")
      return
    }

    console.log('QR detection setup complete, starting interval...')

    // Sử dụng setInterval với delay để đảm bảo video ổn định
    scanIntervalRef.current = setInterval(async () => {
      console.log('Interval tick - isScanning:', isScanning, 'videoSize:', video.videoWidth, 'x', video.videoHeight)
      
      if (!video.videoWidth || !video.videoHeight) {
        console.log('Video not ready yet')
        return
      }

      try {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        // Tăng counter
        setScanCount(prev => {
          const newCount = prev + 1
          console.log('Scan attempt:', newCount)
          return newCount
        })
        setDebugInfo(`Đang quét... (${scanCount + 1}) - Video: ${video.videoWidth}x${video.videoHeight}`)

        // Thử detect QR code với jsQR
        try {
          const jsQR = await import('jsqr')
          const code = jsQR.default(imageData.data, imageData.width, imageData.height)
          
          console.log('QR Detection attempt:', {
            hasCode: !!code,
            codeData: code?.data,
            imageSize: `${imageData.width}x${imageData.height}`,
            scanCount: scanCount + 1
          })
          
          if (code && code.data) {
            console.log('QR Code detected:', code.data)
            
            // Kiểm tra nếu đang xử lý QR code khác
            if (isProcessing.current) {
              console.log('Đang xử lý QR code khác, bỏ qua')
              return
            }
            
            // Kiểm tra debounce - tránh quét cùng QR code liên tục
            const now = Date.now()
            if (code.data === lastScannedCode.current && (now - lastScanTime.current) < 2000) {
              console.log('QR code đã được quét gần đây, bỏ qua')
              return
            }
            
            // Đánh dấu đang xử lý
            isProcessing.current = true
            lastScannedCode.current = code.data
            lastScanTime.current = now
            
            setDebugInfo(`QR Code tìm thấy: ${code.data}`)
            onScan(code.data)
            
            // Delay 2 giây trước khi cho phép quét tiếp
            setTimeout(() => {
              isProcessing.current = false
              setDebugInfo("Sẵn sàng quét QR code tiếp theo...")
            }, 2000)
            
            return
          }
        } catch (err) {
          console.error('Error loading jsQR:', err)
          setDebugInfo(`Lỗi tải jsQR: ${err}`)
        }

      } catch (err) {
        console.error('Scan frame error:', err)
        setDebugInfo(`Lỗi quét: ${err}`)
      }
    }, 2000) // Quét mỗi 2 giây
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

  // Hiển thị khung video để người dùng thấy camera đang hoạt động
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm" style={{ minHeight: '500px' }}>
      <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] lg:h-[600px] xl:h-[700px]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover z-10"
          style={{ 
            backgroundColor: 'transparent',
            display: 'block',
            visibility: 'visible',
            opacity: '1'
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Overlay với khung quét QR - chỉ hiển thị khung, không che video */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] lg:w-96 lg:h-96 xl:w-[32rem] xl:h-[32rem] border-2 border-white/80 rounded-lg relative">
            {/* Góc vuông */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-6 border-l-6 border-cyan-400 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-6 border-r-6 border-cyan-400 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-6 border-l-6 border-cyan-400 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-6 border-r-6 border-cyan-400 rounded-br-lg"></div>
          </div>
        </div>
      </div>
      {/* Thanh trạng thái nhỏ dưới khung video */}
      <div className="px-3 py-2 text-xs text-white/70 border-t border-white/10 flex items-center justify-between">
        <span>{isScanning ? "Đang quét QR..." : isActive ? "Đang khởi động camera..." : "Đã tắt camera"}</span>
        {debugInfo && <span className="text-white/40 truncate max-w-[60%]" title={debugInfo}>{debugInfo}</span>}
      </div>
    </div>
  )
}
