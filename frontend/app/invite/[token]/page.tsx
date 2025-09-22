'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import BackgroundGlow from '../../_components/BackgroundGlow'

interface EventData {
  id: number;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  venue_address?: string;
  venue_map_url?: string;
  dress_code?: string;
  program_outline?: string;
  max_guests: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface GuestData {
  id: number;
  name: string;
  email: string;
  phone?: string;
  title: string;
  role: string;
  organization: string;
  group_tag: string;
  is_vip: boolean;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  checkin_status: 'not_arrived' | 'checked_in' | 'checked_out' | 'arrived';
  event_content?: string;
}

interface InviteData {
  event: EventData;
  guest: GuestData;
  token: string;
}

const InvitePage: React.FC = () => {
  const params = useParams()
  const token = params.token as string
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [programRows, setProgramRows] = useState<Array<{time: string, item: string}>>([])
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [showChangeOption, setShowChangeOption] = useState(false)
  const [showCheckinSuccess, setShowCheckinSuccess] = useState(false)
  const [isCardRevealed, setIsCardRevealed] = useState(false)
  
  // State cho instant check-in (không delay)
  const [instantCheckin, setInstantCheckin] = useState(false)
  
  // Ref for desktop RSVP card focus
  const desktopRsvpCardRef = useRef<HTMLDivElement>(null)
  
  // Function to update checkin status
  const updateCheckinStatus = (status: 'not_arrived' | 'checked_in' | 'checked_out' | 'arrived') => {
    if (inviteData) {
      setInviteData({
        ...inviteData,
        guest: {
          ...inviteData.guest,
          checkin_status: status
        }
      })
    }
  }

  // Function để kiểm tra trạng thái checkin từ server
  const checkCheckinStatus = async () => {
    if (!inviteData) return
    
    try {
      // Lấy danh sách tất cả guests và tìm guest hiện tại
      const response = await fetch('/api/guests', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        const guestData = data.guests?.find((g: any) => g.id === inviteData.guest.id)
        
        if (guestData) {
          console.log('=== CHECKING CHECKIN STATUS ===')
          console.log('Guest ID:', inviteData.guest.id)
          console.log('Current checkin status:', guestData.checkin_status)
          console.log('RSVP status:', guestData.rsvp_status)
          console.log('Event content:', guestData.event_content)
          
          // Cập nhật trạng thái từ server
          console.log('Previous checkin status:', inviteData.guest.checkin_status)
          console.log('New checkin status:', guestData.checkin_status)
          
          // Cập nhật tất cả data từ server để đảm bảo fresh data
          setInviteData(prev => prev ? {
            ...prev,
            guest: {
              ...prev.guest,
              checkin_status: guestData.checkin_status,
              rsvp_status: guestData.rsvp_status,
              // Bảo vệ event_content: chỉ cập nhật nếu có giá trị hợp lệ từ server
              // và không ghi đè nội dung hiện tại nếu server trả về null/empty
              // Sử dụng backup từ localStorage nếu cần
              event_content: (guestData.event_content && 
                             guestData.event_content.trim() !== '' && 
                             guestData.event_content !== null && 
                             guestData.event_content !== undefined) 
                ? guestData.event_content 
                : (prev.guest.event_content || 
                   localStorage.getItem(`event_content_${prev.guest.id}`) || 
                   '')
            }
          } : null)
        }
      }
    } catch (error) {
      console.error('Error checking checkin status:', error)
    }
  }

  // Effect để kiểm tra trạng thái checkin định kỳ
  useEffect(() => {
    if (!inviteData) return
    
    // Kiểm tra ngay lập tức
    checkCheckinStatus()
    
    // Kiểm tra định kỳ mỗi 60 giây để giảm tần suất polling và tránh mất dữ liệu
    const interval = setInterval(checkCheckinStatus, 60000)
    
    return () => clearInterval(interval)
  }, [inviteData?.guest.id])

  // Effect để kiểm tra trạng thái khi user focus vào trang
  useEffect(() => {
    let lastCheckTime = 0
    const MIN_CHECK_INTERVAL = 10000 // Tối thiểu 10 giây giữa các lần check

    const handleFocus = () => {
      if (inviteData) {
        const now = Date.now()
        if (now - lastCheckTime > MIN_CHECK_INTERVAL) {
          console.log('=== PAGE FOCUSED - CHECKING CHECKIN STATUS ===')
          lastCheckTime = now
          checkCheckinStatus()
        }
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && inviteData) {
        const now = Date.now()
        if (now - lastCheckTime > MIN_CHECK_INTERVAL) {
          console.log('=== PAGE VISIBLE - FORCE REFRESH DATA ===')
          lastCheckTime = now
          // Force refresh data khi user quay lại trang
          setTimeout(() => {
            checkCheckinStatus()
          }, 500)
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [inviteData])

  // Effect để hiển thị animation checkin success
  useEffect(() => {
    console.log('=== CHECKIN SUCCESS EFFECT ===')
    console.log('inviteData:', !!inviteData)
    console.log('rsvp_status:', inviteData?.guest.rsvp_status)
    console.log('checkin_status:', inviteData?.guest.checkin_status)
    console.log('showCheckinSuccess:', showCheckinSuccess)
    
    if (inviteData && inviteData.guest.rsvp_status === 'accepted' && 
        (inviteData.guest.checkin_status as string) === 'arrived') {
      console.log('Setting showCheckinSuccess to true...')
      // Hiển thị ngay lập tức - không delay
      setShowCheckinSuccess(true)
      console.log('showCheckinSuccess set to true')
    } else if (inviteData && inviteData.guest.checkin_status === 'not_arrived') {
      // Chỉ reset khi chưa checkin, không reset khi đã checkin
      console.log('Guest not checked in yet, keeping showCheckinSuccess as is')
    }
  }, [inviteData?.guest.checkin_status, inviteData?.guest.rsvp_status])

  // Effect để reset instantCheckin sau khi đã hiển thị
  useEffect(() => {
    if (instantCheckin) {
      console.log('Instant check-in displayed, resetting after 2 seconds...')
      const timer = setTimeout(() => {
        setInstantCheckin(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [instantCheckin])

  // Listen for check-in events from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CHECKIN_SUCCESS' && event.data.guestId === inviteData?.guest.id) {
        console.log('=== CHECKIN SUCCESS MESSAGE RECEIVED ===')
        console.log('Guest ID:', event.data.guestId)
        console.log('Current guest ID:', inviteData?.guest.id)
        
        // Cập nhật ngay lập tức để hiển thị dấu tích
        updateCheckinStatus('arrived')
        setInstantCheckin(true) // Instant check-in
        setShowCheckinSuccess(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [inviteData?.guest.id])

  // BroadcastChannel để giao tiếp real-time giữa các tab
  useEffect(() => {
    if (!inviteData?.guest.id) return
    
    console.log('Setting up BroadcastChannel for guest ID:', inviteData.guest.id)
    const channel = new BroadcastChannel('checkin-channel')
    
    channel.onmessage = (event) => {
      console.log('=== BROADCAST CHECKIN MESSAGE ===', event.data)
      console.log('Current guest ID:', inviteData?.guest.id)
      console.log('Message guest ID:', event.data.guestId)
      
      if (event.data.type === 'instant-checkin') {
        if (event.data.guestId === inviteData?.guest.id) {
          console.log('✅ MATCHED GUEST ID - Showing instant check-in!')
          setInstantCheckin(true)
          setShowCheckinSuccess(true)
          updateCheckinStatus('arrived')
        } else if (event.data.guestId === null) {
          console.log('⚠️ NULL GUEST ID - Showing generic instant check-in')
          setInstantCheckin(true)
          setShowCheckinSuccess(true)
          updateCheckinStatus('arrived')
        } else {
          console.log('❌ GUEST ID MISMATCH - Ignoring message')
        }
      }
    }
    
    return () => {
      console.log('Closing BroadcastChannel...')
      channel.close()
    }
  }, [inviteData?.guest.id])

  // Aggressive Polling để kiểm tra instant check-in từ localStorage
  useEffect(() => {
    if (!inviteData?.guest.id) return
    
    console.log('Setting up AGGRESSIVE instant checkin polling...')
    let pollInterval: NodeJS.Timeout | null = null
    let lastCheckTime = 0
    
    const startAggressivePolling = () => {
      pollInterval = setInterval(() => {
        const now = Date.now()
        
        // Poll localStorage mỗi 50ms
        try {
          const instantData = localStorage.getItem('exp_instant_checkin')
          if (instantData) {
            const data = JSON.parse(instantData)
            if (data.type === 'instant-checkin' && now - data.timestamp < 10000) {
              console.log('✅ AGGRESSIVE POLLING DETECTED INSTANT CHECKIN - Showing immediately!')
              setInstantCheckin(true)
              setShowCheckinSuccess(true)
              updateCheckinStatus('arrived')
              
              // Clear the data để tránh duplicate
              localStorage.removeItem('exp_instant_checkin')
            }
          }
        } catch (error) {
          console.error('Error polling instant checkin:', error)
        }
        
        // Poll server mỗi 2 giây để đảm bảo sync
        if (now - lastCheckTime > 2000) {
          lastCheckTime = now
          console.log('=== AGGRESSIVE POLLING - CHECKING SERVER STATUS ===')
          checkCheckinStatus()
        }
      }, 50) // Poll mỗi 50ms - rất aggressive
    }
    
    // Start polling ngay lập tức
    startAggressivePolling()
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [inviteData?.guest.id])

  // SSE với aggressive polling để đảm bảo real-time
  useEffect(() => {
    if (!inviteData?.token) return
    
    console.log('Setting up SSE with aggressive polling for real-time check-in notifications...')
    const eventSource = new EventSource(`/api/qr/stream?token=${inviteData.token}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('=== SSE CHECKIN NOTIFICATION ===', data)
        
        if (data.type === 'checkin' && data.guest_id === inviteData?.guest.id) {
          console.log('Real-time check-in detected via SSE!')
          // Cập nhật ngay lập tức với requestAnimationFrame
          requestAnimationFrame(() => {
            updateCheckinStatus('arrived')
            setInstantCheckin(true)
            setShowCheckinSuccess(true)
          })
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // Retry connection sau 1 giây
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('Retrying SSE connection...')
          eventSource.close()
        }
      }, 1000)
    }
    
    return () => {
      console.log('Closing SSE connection...')
      eventSource.close()
    }
  }, [inviteData?.token, inviteData?.guest.id])

  // Thêm listener cho sự kiện checkin từ bên ngoài
  useEffect(() => {
    const handleCheckinEvent = () => {
      console.log('=== EXTERNAL CHECKIN EVENT ===')
      if (inviteData) {
        // Cập nhật ngay lập tức thay vì chờ đợi
        updateCheckinStatus('arrived')
        setInstantCheckin(true) // Instant check-in
        setShowCheckinSuccess(true)
        
        // Kiểm tra từ server để đảm bảo đồng bộ ngay lập tức
        checkCheckinStatus()
      }
    }

    const handleInstantCheckin = (event: any) => {
      console.log('=== INSTANT CHECKIN EVENT ===', event.detail)
      if (inviteData) {
        // Hiển thị dấu tích ngay lập tức khi bắt đầu quét
        setInstantCheckin(true)
        setShowCheckinSuccess(true)
        console.log('Instant check-in displayed immediately!')
        
        // Cập nhật status để ẩn QR code ngay lập tức
        updateCheckinStatus('arrived')
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'exp_guests_updated') {
        console.log('=== STORAGE CHECKIN EVENT ===')
        handleCheckinEvent()
      } else if (e.key === 'exp_instant_checkin') {
        console.log('=== INSTANT STORAGE CHECKIN EVENT ===', e.newValue)
        try {
          const data = JSON.parse(e.newValue || '{}')
          if (data.type === 'instant-checkin') {
            console.log('✅ INSTANT CHECKIN FROM STORAGE - Showing immediately!')
            setInstantCheckin(true)
            setShowCheckinSuccess(true)
            updateCheckinStatus('arrived')
          }
        } catch (error) {
          console.error('Error parsing instant checkin data:', error)
        }
      }
    }

    const handleHashChange = () => {
      const hash = window.location.hash
      console.log('=== HASH CHANGE EVENT ===', hash)
      if (hash.includes('instant-checkin')) {
        console.log('✅ HASH DETECTED INSTANT CHECKIN - Showing immediately!')
        setInstantCheckin(true)
        setShowCheckinSuccess(true)
        updateCheckinStatus('arrived')
      }
    }

    const handleTitleChange = () => {
      const title = document.title
      console.log('=== TITLE CHANGE EVENT ===', title)
      if (title.includes('INSTANT_CHECKIN_')) {
        console.log('✅ TITLE DETECTED INSTANT CHECKIN - Showing immediately!')
        setInstantCheckin(true)
        setShowCheckinSuccess(true)
        updateCheckinStatus('arrived')
      }
    }

    // Listen for custom checkin events
    window.addEventListener('checkin-success', handleCheckinEvent)
    window.addEventListener('instant-checkin', handleInstantCheckin)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('hashchange', handleHashChange)
    
    // Poll document.title để detect instant check-in
    const titlePollInterval = setInterval(() => {
      const title = document.title
      if (title.includes('INSTANT_CHECKIN_')) {
        console.log('✅ TITLE POLLING DETECTED INSTANT CHECKIN - Showing immediately!')
        setInstantCheckin(true)
        setShowCheckinSuccess(true)
        updateCheckinStatus('arrived')
      }
    }, 50) // Poll mỗi 50ms
    
    // Visibility change listener để detect khi tab được focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('=== TAB FOCUSED - CHECKING INSTANT CHECKIN ===')
        // Kiểm tra localStorage ngay khi tab được focus
        try {
          const instantData = localStorage.getItem('exp_instant_checkin')
          if (instantData) {
            const data = JSON.parse(instantData)
            if (data.type === 'instant-checkin' && Date.now() - data.timestamp < 10000) {
              console.log('✅ VISIBILITY CHANGE DETECTED INSTANT CHECKIN - Showing immediately!')
              setInstantCheckin(true)
              setShowCheckinSuccess(true)
              updateCheckinStatus('arrived')
              localStorage.removeItem('exp_instant_checkin')
            }
          }
        } catch (error) {
          console.error('Error checking instant checkin on visibility change:', error)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('checkin-success', handleCheckinEvent)
      window.removeEventListener('instant-checkin', handleInstantCheckin)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('hashchange', handleHashChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(titlePollInterval)
    }
  }, [inviteData])


  // Parse program outline
  const parseProgramOutline = (src: string | undefined | null): Array<{time: string, item: string}> => {
    if (!src) return []
    try {
      const parsed = JSON.parse(src)
      if (Array.isArray(parsed)) {
        return parsed
          .map((r: any) => ({ time: String(r[0] ?? r.time ?? ''), item: String(r[1] ?? r.item ?? '') }))
          .filter(r => r.time || r.item)
      }
    } catch {}
    // fallback: "18:00-Đón khách; 18:30-Khai mạc"
    return src.split(';').map(s => s.trim()).filter(Boolean).map(s => {
      const [t, ...rest] = s.split('-')
      return { time: (t || '').trim(), item: rest.join('-').trim() }
    })
  }

  // Format time from HH:MM:SS to H:MM
  const formatTime = (timeString: string): string => {
    if (!timeString) return ''
    const parts = timeString.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}` // H:MM format
    }
    return timeString
  }

  // Generate QR code (legacy - for fallback)
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Sử dụng token trực tiếp thay vì JSON data
        const token = inviteData?.token || 'DEMO-TOKEN'
        
        const qrString = token
        const qrUrl = await QRCode.toDataURL(qrString, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
        const fallbackUrl = await QRCode.toDataURL('DEMO-EVENT-CONFIRMATION', {
          width: 200,
          margin: 2
        })
        setQrCodeUrl(fallbackUrl)
      }
    }

    if (inviteData) {
      generateQRCode()
      setProgramRows(parseProgramOutline(inviteData.event.program_outline))
    }
  }, [inviteData])

  // Effect để tự động tạo QR code khi guest đã accepted
  useEffect(() => {
    const autoGenerateQR = async () => {
      if (inviteData?.guest?.rsvp_status === 'accepted' && 
          inviteData?.guest?.checkin_status !== 'arrived' && 
          inviteData?.guest?.checkin_status !== 'checked_in' &&
          !qrImageUrl) {
        
        console.log('=== AUTO GENERATING QR CODE ON STATE CHANGE ===')
        console.log('Guest ID:', inviteData.guest.id)
        console.log('RSVP status:', inviteData.guest.rsvp_status)
        console.log('Checkin status:', inviteData.guest.checkin_status)
        console.log('Current QR URL:', qrImageUrl)
        
        try {
          const tokenResponse = await fetch(`/api/guests/${inviteData.guest.id}/qr`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          if (tokenResponse.ok) {
            const qrUrl = `/api/guests/${inviteData.guest.id}/qr-image?t=${Date.now()}`
            setQrImageUrl(qrUrl)
            console.log('QR code generated successfully on state change:', qrUrl)
          } else {
            console.error('Failed to generate QR token on state change')
          }
        } catch (error) {
          console.error('Error generating QR code on state change:', error)
        }
      }
    }

    // Delay để đảm bảo state đã được cập nhật
    const timer = setTimeout(autoGenerateQR, 100)
    return () => clearTimeout(timer)
  }, [inviteData?.guest?.rsvp_status, inviteData?.guest?.checkin_status, inviteData?.guest?.id, qrImageUrl])

  // Effect để xử lý scroll animation cho card thời gian địa điểm
  useEffect(() => {
    const handleScroll = () => {
      const timeLocationCard = document.querySelector('.time-location-card')
      if (!timeLocationCard || isCardRevealed) return

      const rect = timeLocationCard.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Kích hoạt animation khi card xuất hiện trong viewport (từ 80% viewport height)
      if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
        setIsCardRevealed(true)
        timeLocationCard.classList.add('scroll-reveal')
        
        // Remove animation class sau khi hoàn thành để tránh lặp lại
        setTimeout(() => {
          timeLocationCard.classList.remove('scroll-reveal')
        }, 800)
      }
    }

    // Thêm scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Kiểm tra ngay lập tức nếu card đã trong viewport
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isCardRevealed])

  // Load invite data
  useEffect(() => {
    const loadInviteData = async () => {
      try {
        setLoading(true)
        
        // Try to load from API first
        console.log('=== LOADING INVITE DATA ===')
        console.log('Token:', token)
        const response = await fetch(`/api/invite/${token}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        console.log('API Response status:', response.status)
        console.log('API Response ok:', response.ok)
        
        if (response.ok) {
          const data = await response.json()
          
          // Backup event_content vào localStorage để tránh mất dữ liệu
          if (data.guest?.event_content) {
            localStorage.setItem(`event_content_${data.guest.id}`, data.guest.event_content)
          }
          
          setInviteData(data)
          
          // Tự động tạo QR code nếu guest đã accepted và chưa checkin
          if (data.guest?.rsvp_status === 'accepted' && 
              data.guest?.checkin_status !== 'arrived' && 
              data.guest?.checkin_status !== 'checked_in') {
            console.log('=== AUTO GENERATING QR CODE ===')
            console.log('Guest RSVP status:', data.guest.rsvp_status)
            console.log('Guest checkin status:', data.guest.checkin_status)
            
            // Delay để đảm bảo state đã được set
            setTimeout(async () => {
              try {
                const tokenResponse = await fetch(`/api/guests/${data.guest.id}/qr`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                })
                
                if (tokenResponse.ok) {
                  const qrUrl = `/api/guests/${data.guest.id}/qr-image?t=${Date.now()}`
                  setQrImageUrl(qrUrl)
                  console.log('QR code generated successfully:', qrUrl)
                } else {
                  console.error('Failed to generate QR token')
                }
              } catch (error) {
                console.error('Error generating QR code:', error)
              }
            }, 500)
          }
        } else {
          console.log('API failed, using demo data')
          console.log('Response status:', response.status)
          console.log('Response text:', await response.text())
          // Fallback to demo data if API fails
          const demoData: InviteData = {
            event: {
              id: 1,
              name: 'Lễ kỷ niệm 15 năm thành lập',
              description: 'EXP Technology Company Limited',
              date: '2025-10-10',
              time: '18:00',
              location: 'Trung tâm Hội nghị tỉnh Thái Nguyên',
              venue_address: 'Số 1 Đường XYZ, TP. Thái Nguyên',
              venue_map_url: 'https://maps.google.com',
              dress_code: 'Business casual',
              program_outline: JSON.stringify([
                ['18:00', 'Đón khách & Check-in'],
                ['18:30', 'Khai mạc'],
                ['19:00', 'Vinh danh & Tri ân'],
                ['20:00', 'Gala & Networking']
              ]),
              max_guests: 200,
              status: 'upcoming'
            },
            guest: {
              id: 1,
              name: 'Bùi Hiếu',
              email: 'buihieu@example.com',
              title: 'Mr',
              role: 'CTO',
              organization: 'Công ty TNHH Dịch vụ và Phát triển Công nghệ Hachitech Solution',
              group_tag: 'Hachitech',
              is_vip: false,
              rsvp_status: 'pending',
              checkin_status: 'not_arrived',
              event_content: 'Kính gửi anh Bùi Hiếu,\n\nTrân trọng mời anh tham dự sự kiện kỷ niệm 15 năm thành lập công ty. Sự hiện diện của anh sẽ là niềm vinh dự lớn của chúng tôi.\n\nTrân trọng,\nBan tổ chức'
            },
            token: token
          }
          setInviteData(demoData)
          
          // Tự động tạo QR code cho demo data nếu đã accepted
          if (demoData.guest?.rsvp_status === 'accepted' && 
              demoData.guest?.checkin_status !== 'arrived' && 
              demoData.guest?.checkin_status !== 'checked_in') {
            console.log('=== AUTO GENERATING QR CODE FOR DEMO ===')
            setTimeout(async () => {
              try {
                const tokenResponse = await fetch(`/api/guests/${demoData.guest.id}/qr`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                })
                
                if (tokenResponse.ok) {
                  const qrUrl = `/api/guests/${demoData.guest.id}/qr-image?t=${Date.now()}`
                  setQrImageUrl(qrUrl)
                  console.log('Demo QR code generated successfully:', qrUrl)
                } else {
                  console.error('Failed to generate demo QR token')
                }
              } catch (error) {
                console.error('Error generating demo QR code:', error)
              }
            }, 500)
          }
        }
      } catch (err) {
        console.error('Error loading invite data:', err)
        setError('Không thể tải thông tin thiệp mời: ' + err)
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      loadInviteData()
    }
  }, [token])

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Đang tải thiệp mời...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Lỗi tải thiệp mời</h1>
            <p className="text-white/80">{error}</p>
          </div>
        </div>
      </>
    )
  }

  if (!inviteData) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-yellow-400 text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-white mb-2">Đang tải...</h1>
            <p className="text-white/80">Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </>
    )
  }

  const formattedDate = new Date(inviteData.event.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const rsvpDeadline = new Date(inviteData.event.date).toLocaleDateString('vi-VN')

  const handleAccept = async () => {
    if (!inviteData) return
    
    console.log('=== HANDLE ACCEPT ===')
    console.log('Guest data:', inviteData.guest)
    
    // Thêm class expanding để tăng chiều cao card
    const rsvpCard = document.querySelector('.rsvp-card')
    if (rsvpCard) {
      rsvpCard.classList.add('expanding')
    }
    
    // Delay 300ms trước khi thực hiện
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const requestBody = {
      name: inviteData.guest.name,
      email: inviteData.guest.email || '',
      phone: inviteData.guest.phone || '',
      title: inviteData.guest.title,
      role: inviteData.guest.role,
      organization: inviteData.guest.organization,
      rsvp_status: 'accepted',
      event_content: inviteData.guest.event_content || '',
      event_id: inviteData.event.id
    }
    
    console.log('Request body:', requestBody)
    console.log('API URL:', `/api/guests/${inviteData.guest.id}`)
    
    try {
      const response = await fetch(`/api/guests/${inviteData.guest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Response data:', responseData)
        setInviteData(prev => prev ? { ...prev, guest: { ...prev.guest, rsvp_status: 'accepted' } } : null)
        await showQRCode()
        console.log('RSVP status updated successfully!')
        
        // Tự động focus card RSVP ra giữa màn hình
          setTimeout(() => {
          if (window.innerWidth <= 768) {
            // Mobile: focus mobile RSVP card
            const rsvpCard = document.querySelector('.rsvp-card')
            if (rsvpCard) {
              rsvpCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
            }
          } else {
            // Desktop: focus desktop RSVP card
            if (desktopRsvpCardRef.current) {
              desktopRsvpCardRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
            }
          }
        }, 15)
        
        // Notify parent window about RSVP update
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'RSVP_UPDATE',
            guestId: inviteData.guest.id,
            rsvpStatus: 'accepted'
          }, window.location.origin)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update RSVP status:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating RSVP status:', error)
    }
  }

  const handleDecline = async () => {
    if (!inviteData) return
    
    console.log('=== HANDLE DECLINE ===')
    console.log('Guest data:', inviteData.guest)
    
    // Thêm class expanding để tăng chiều cao card
    const rsvpCard = document.querySelector('.rsvp-card')
    if (rsvpCard) {
      rsvpCard.classList.add('expanding')
    }
    
    // Delay 300ms trước khi thực hiện
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const requestBody = {
      name: inviteData.guest.name,
      email: inviteData.guest.email || '',
      phone: inviteData.guest.phone || '',
      title: inviteData.guest.title,
      role: inviteData.guest.role,
      organization: inviteData.guest.organization,
      rsvp_status: 'declined',
      event_content: inviteData.guest.event_content || '',
      event_id: inviteData.event.id
    }
    
    console.log('Request body:', requestBody)
    console.log('API URL:', `/api/guests/${inviteData.guest.id}`)
    
    try {
      const response = await fetch(`/api/guests/${inviteData.guest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('Response data:', responseData)
        setInviteData(prev => prev ? { ...prev, guest: { ...prev.guest, rsvp_status: 'declined' } } : null)
        console.log('RSVP status updated successfully!')
        
        // Tự động focus card RSVP ra giữa màn hình
          setTimeout(() => {
          if (window.innerWidth <= 768) {
            // Mobile: focus mobile RSVP card
            const rsvpCard = document.querySelector('.rsvp-card')
            if (rsvpCard) {
              rsvpCard.scrollIntoView({ 
                behavior: 'auto', 
                block: 'center',
                inline: 'center'
              })
            }
          } else {
            // Desktop: focus desktop RSVP card
            if (desktopRsvpCardRef.current) {
              desktopRsvpCardRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
            }
          }
        }, 200)
        
        // Notify parent window about RSVP update
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'RSVP_UPDATE',
            guestId: inviteData.guest.id,
            rsvpStatus: 'declined'
          }, window.location.origin)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update RSVP status:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error updating RSVP status:', error)
    }
  }

  const showQRCode = async () => {
    if (!inviteData) return
    
    setQrLoading(true)
    
    try {
      // Tạo QR token
      const tokenResponse = await fetch(`/api/guests/${inviteData.guest.id}/qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        const qrUrl = `/api/guests/${inviteData.guest.id}/qr-image?t=${Date.now()}`
        setQrImageUrl(qrUrl)
      } else {
        console.error('Failed to generate QR token')
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setQrLoading(false)
    }
  }

  const handleChangeOption = async () => {
    // Delay 300ms trước khi thực hiện
    await new Promise(resolve => setTimeout(resolve, 300))
    
    setShowChangeOption(true)
    
    // Focus vào RSVP card sau khi hiển thị change option
    setTimeout(() => {
      if (window.innerWidth <= 768) {
        // Mobile: focus mobile RSVP card
        const rsvpCard = document.querySelector('.rsvp-card')
        if (rsvpCard) {
          rsvpCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        }
      } else {
        // Desktop: focus desktop RSVP card
        if (desktopRsvpCardRef.current) {
          desktopRsvpCardRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        }
      }
    }, 100)
    
    // Không reset qrImageUrl để giữ QR code khi ấn "Không"
  }

  const handleResetRSVP = async () => {
    if (!inviteData) return
    
    // Delay 300ms trước khi thực hiện
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const response = await fetch(`/api/guests/${inviteData.guest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: inviteData.guest.name,
          email: inviteData.guest.email || '',
          phone: inviteData.guest.phone || '',
          title: inviteData.guest.title,
          role: inviteData.guest.role,
          organization: inviteData.guest.organization,
          rsvp_status: 'pending',
          event_content: inviteData.guest.event_content || ''
        }),
      })

      if (response.ok) {
        setInviteData(prev => prev ? { ...prev, guest: { ...prev.guest, rsvp_status: 'pending' } } : null)
        setShowChangeOption(false)
        setQrImageUrl('')
        
        // Focus vào RSVP card sau khi reset
        setTimeout(() => {
          if (window.innerWidth <= 768) {
            // Mobile: focus mobile RSVP card
            const rsvpCard = document.querySelector('.rsvp-card')
            if (rsvpCard) {
              rsvpCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
            }
          } else {
            // Desktop: focus desktop RSVP card
            if (desktopRsvpCardRef.current) {
              desktopRsvpCardRef.current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
            }
          }
        }, 100)
      } else {
        const errorText = await response.text()
        console.error('Failed to reset RSVP status:', errorText)
      }
    } catch (error) {
      console.error('Error resetting RSVP status:', error)
    }
  }

  const handleCancelChange = async () => {
    // Delay 300ms trước khi thực hiện
    await new Promise(resolve => setTimeout(resolve, 300))
    
    console.log('=== CANCEL CHANGE ===')
    console.log('qrImageUrl before:', qrImageUrl)
    console.log('rsvp_status:', inviteData?.guest.rsvp_status)
    
    setShowChangeOption(false)
    
    // Focus vào RSVP card sau khi cancel
    setTimeout(() => {
      if (window.innerWidth <= 768) {
        // Mobile: focus mobile RSVP card
        const rsvpCard = document.querySelector('.rsvp-card')
        if (rsvpCard) {
          rsvpCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        }
      } else {
        // Desktop: focus desktop RSVP card
        if (desktopRsvpCardRef.current) {
          desktopRsvpCardRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'center'
          })
        }
      }
    }, 100)
    
    // Không reset qrImageUrl để giữ QR code hiển thị
  }

  return (
    <>
      <BackgroundGlow />
      <div className="min-h-screen text-white">
        <style jsx global>{`
          body {
            font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #fff;
            background-color: #0B0F14;
          }
          .main-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
          .header { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 40px; }
          .header-top { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
          .logo-container { width: 45px; height: 45px; margin-right: 8px; }
          .logo-image { width: 100%; height: 100%; object-fit: contain; }
          .company-info { display: flex; flex-direction: column; align-items: flex-start; }
          .company-name { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 5px; line-height: 1.1; }
          .company-slogan { font-size: 18px; color: #8B5CF6; margin-bottom: 5px; }
          .company-full { font-size: 20px; color: #94A3B8; }
          .company-description { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 10px; font-style: italic; }
          .event-title-main-desktop { 
            font-size: 64px; 
            font-weight: 900; 
            color: #ffffff; 
            text-align: center; 
            margin-top: 8px; 
            margin-bottom: 6px;
            text-shadow: 
              0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              0 0 10px rgba(139, 92, 246, 0.8),
              0 0 20px rgba(59, 130, 246, 0.6),
              0 0 30px rgba(6, 182, 212, 0.4),
              0 0 40px rgba(139, 92, 246, 0.2);
            letter-spacing: 1px;
            filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.5));
            display: block;
          }
          .event-title-main-mobile { 
            font-size: 28px; 
            font-weight: 900; 
            color: #ffffff; 
            text-align: center; 
            margin-top: 8px; 
            margin-bottom: 6px;
            text-shadow: 
              0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              0 0 10px rgba(139, 92, 246, 0.8),
              0 0 20px rgba(59, 130, 246, 0.6),
              0 0 30px rgba(6, 182, 212, 0.4),
              0 0 40px rgba(139, 92, 246, 0.2);
            letter-spacing: 1px;
            filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.5));
            display: none;
          }
          .slogan-1-desktop { 
            font-size: 24px; 
            color:rgb(201, 202, 204); 
            text-align: center; 
            margin-bottom: 16px; 
            font-weight: 500;
            display: block;
          }
          .slogan-1-mobile { 
            font-size: 14px; 
            color:rgb(201, 202, 204); 
            text-align: center; 
            margin-bottom: 16px; 
            font-weight: 500;
            display: none;
          }
          .slogan-2-desktop { 
            font-size: 20px; 
            color: #94A3B8; 
            text-align: center; 
            margin-bottom: 20px; 
            font-style: italic;
            display: block;
          }
          .slogan-2-mobile { 
            font-size: 12px; 
            color: #94A3B8; 
            text-align: center; 
            margin-bottom: 20px; 
            font-style: italic;
            display: none;
          }
          .main-title { text-align: center; margin-bottom: 50px; }
          .event-title { font-size: 48px; font-weight: 700; color: #fff; margin-bottom: 10px; }
          .title-underline { width: 200px; height: 4px; background: linear-gradient(90deg, #3B82F6, #8B5CF6); margin: 0 auto; border-radius: 2px; }
          .invitation-card-desktop { 
            background: rgba(255,255,255,0.08); 
            backdrop-filter: blur(8px); 
            border: 1px solid rgba(255,255,255,0.15); 
            border-radius: 20px; 
            padding: 30px; 
            margin-bottom: 40px; 
            margin-left: auto;
            margin-right: auto;
            display: block;
            width: calc(70% + 50px);
            max-width: 1000px;
            text-align: center;
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .invitation-card-mobile { 
            background: rgba(255,255,255,0.08); 
            backdrop-filter: blur(8px); 
            border: 1px solid rgba(255,255,255,0.15); 
            border-radius: 20px; 
            padding: 25px; 
            margin-bottom: 20px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: none;
          }
          .greeting { font-size: 24px; color: #fff; margin-bottom: 20px; }
          .guest-name-highlight {
            font-weight: 700;
            color: #ffffff;
            text-shadow: 
              0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              0 0 10px rgba(139, 92, 246, 0.8),
              0 0 20px rgba(59, 130, 246, 0.6),
              0 0 30px rgba(6, 182, 212, 0.4),
              0 0 40px rgba(139, 92, 246, 0.2);
            letter-spacing: 1px;
            filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.5));
            display: inline-block;
            transition: all 0.3s ease;
          }
          .guest-name-highlight:hover {
            text-shadow: 
              0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
              -0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
              0 0 15px rgba(139, 92, 246, 1),
              0 0 25px rgba(59, 130, 246, 0.8),
              0 0 35px rgba(6, 182, 212, 0.6),
              0 0 45px rgba(139, 92, 246, 0.4);
            filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.7));
            transform: scale(1.05);
          }
          .greeting-section {
            padding: 15px 25px;
            margin-bottom: 20px;
            margin-top: -20px;
            position: relative;
            width: fit-content;
            margin-left: 0;
            margin-right: auto;
            text-align: left;
          }
          .greeting-section::before {
            content: '';
            position: absolute;
            left: 15px;
            top: 15px;
            bottom: 15px;
            width: 4px;
            background: linear-gradient(180deg, #60A5FA,rgb(192, 0, 250));
            border-radius: 2px;
            box-shadow: 0 0 10px rgba(96, 165, 250, 0.6);
          }
          @media (max-width: 767px) {
            /* Mobile-only styles - completely isolated */
            .greeting { font-size: 18px; }
            .greeting-title { font-size: 16px !important; }
            .guest-name { font-size: 24px !important; }
            .guest-name.long-name { font-size: 10px !important; }
            .guest-info { font-size: 12px !important; }
            .guest-role { font-size: 10px !important; }
            .greeting-section { margin-top: -40px !important; }
            .greeting-section::before { width: 4px; left: 12px; top: 10px; bottom: 10px; background: linear-gradient(180deg, #60A5FA, #A78BFA); }
            
            .details-grid { grid-template-columns: 1fr; gap: 20px; }
            .rsvp-buttons { flex-direction: column; gap: 15px; }
            .rsvp-button { 
              padding: 12px 24px; 
              font-size: 14px !important; 
              border-radius: 12px; 
              font-weight: 600; 
              cursor: pointer; 
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
              display: flex; 
              align-items: center; 
              gap: 8px; 
              border: none;
              backdrop-filter: blur(8px);
              position: relative;
              overflow: hidden;
              min-width: 180px;
              justify-content: center;
              text-align: center;
            }
            .event-title { font-size: 36px; }
            .event-title-main-desktop { display: none; }
            .event-title-main-mobile { display: block; }
            .slogan-1-desktop { display: none; }
            .slogan-1-mobile { display: block; }
            .slogan-2-desktop { display: none; }
            .slogan-2-mobile { display: block; }
            .desktop-qr-section { display: none; }
            .guest-card-desktop { display: none; }
            .desktop-rsvp-section { display: none; }
            .desktop-timeline-section { display: none !important; }
            
            /* Show mobile guest card after title */
            .mobile-guest-card-after-title { 
              display: block !important; 
              background: transparent !important; 
              backdrop-filter: none !important; 
              border: none !important; 
              border-radius: 0 !important; 
              padding: 25px !important; 
              margin-top: -28px !important;
              margin-bottom: 20px !important; 
              margin-left: -25px !important;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            /* Highlight guest name with blue color */
            .mobile-guest-card-after-title .name-bold {
              color: #ffffff !important;
              text-shadow: 0 0 20px rgba(96, 165, 250, 0.8), 0 0 40px rgba(96, 165, 250, 0.6), 0 0 60px rgba(96, 165, 250, 0.4);
            }
            
            /* Show mobile event content card */
            .mobile-event-content-card { 
              display: block !important; 
              margin-top: -50px !important;
            }
            
            /* Show mobile event info card */
            .mobile-event-info-card { 
              display: block !important; 
            }
            
            /* Show mobile RSVP card */
            .mobile-rsvp-card { 
              display: block !important; 
            }
            
            /* Hide old event info card in mobile cards section */
            .mobile-cards .time-location-card {
              display: none !important;
            }
            
            /* Hide old RSVP card in mobile cards section */
            .mobile-cards .rsvp-card {
              display: none !important;
            }
            .program-title { font-size: 24px; }
            .program-description { font-size: 16px; }
            
            /* Mobile program timeline styling */
            .program-item { 
              display: grid !important; 
              grid-template-columns: 60px 1fr !important; 
              align-items: center !important; 
              margin-bottom: 12px !important; 
              gap: 12px !important; 
              justify-content: start !important; 
              margin-left: 10px !important; 
            }
            .program-time { 
              font-weight: 700 !important; 
              color: #fff !important; 
              line-height: 1.2 !important; 
              font-size: 14px !important; 
              text-align: left !important; 
            }
            .program-description { 
              color: #fff !important; 
              line-height: 1.2 !important; 
              font-size: 16px !important; 
              text-align: left !important; 
            }
            .guest-info { font-size: 15px !important; }
            /* Giảm kích thước mobile guest card */
            .greeting-title { font-size: 16px !important; }
            .guest-name { font-size: 24px !important; }
            .guest-name.long-name { font-size: 10px !important; }
            .title-normal.small-title { font-size: 8px; }
            .title-normal { font-size: 18px !important; }
            .name-bold { font-size: 24px !important; font-weight: 700 !important; }
            .name-bold.long-name { font-size: 10px !important; font-weight: 700 !important; }
            .guest-role { font-size: 15px !important; }
            .main-container { padding: 20px 15px; }
            
            .invitation-section { 
              display: none !important; 
              margin-bottom: 20px !important; 
            }
            
            /* Mobile invitation message styling */
            .invitation-message { 
              color: #ffffff !important; 
              font-size: 16px; 
              line-height: 1.5;
              text-align: left !important;
              background: rgba(255,255,255,0.08) !important;
              backdrop-filter: blur(8px) !important;
              border: 1px solid rgba(255,255,255,0.15) !important;
              border-radius: 20px !important;
              padding: 25px !important;
              margin-bottom: 20px !important;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
            }
            
            /* Mobile Card Layout */
            .invitation-card-desktop { display: none; }
            .invitation-card-mobile { display: block; }
            .mobile-cards { 
              display: flex; 
              overflow-x: auto; 
              gap: 16px; 
              padding: 0 20px 20px 20px;
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
            }
            .mobile-cards::-webkit-scrollbar {
              height: 4px;
            }
            .mobile-cards::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.1);
              border-radius: 2px;
            }
            .mobile-cards::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.3);
              border-radius: 2px;
            }
            .mobile-cards::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.5);
            }
            
            /* Hide mobile guest card by default */
            .mobile-guest-card-after-title { display: none; }
            .mobile-event-content-card { display: none; }
            .mobile-event-info-card { display: none; }
            .mobile-rsvp-card { display: none; }
            .mobile-card { 
              background: rgba(255,255,255,0.08); 
              backdrop-filter: blur(8px); 
              border: 1px solid rgba(255,255,255,0.15); 
              border-radius: 20px; 
              padding: 25px; 
              margin-bottom: 0; 
              min-width: 280px;
              max-width: 320px;
              flex-shrink: 0;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .mobile-card-title { 
            font-size: 20px; 
              font-weight: 600; 
            color: #fff; 
              margin-bottom: 20px; 
            display: flex; 
            align-items: center; 
              gap: 12px;
            }
            .mobile-card-content { 
              color: #E2E8F0; 
              line-height: 1.6; 
              font-size: 16px;
            }
            .mobile-card-content p { 
              margin: 0 0 12px 0; 
              color: #E2E8F0; 
            }
            .mobile-card-content p:last-child { 
              margin-bottom: 0; 
            }
            .mobile-card-content strong { 
            color: #fff; 
              font-weight: 600; 
            }
            .mobile-card-content em { 
              color: #94A3B8; 
              font-style: italic; 
            }
            .mobile-card-content ul { 
              margin: 0; 
              padding-left: 20px; 
              color: #E2E8F0; 
            }
            .mobile-card-content li { 
            margin-bottom: 8px; 
              color: #E2E8F0; 
            }
            .mobile-card-content li:last-child { 
              margin-bottom: 0; 
            }
            .mobile-card-content a { 
              color: #60A5FA; 
              text-decoration: none; 
              border-bottom: 1px solid transparent; 
            transition: all 0.3s ease;
          }
            .mobile-card-content a:hover { 
              color: #93C5FD; 
              border-bottom-color: #93C5FD; 
            }
            .mobile-card-content h1, 
            .mobile-card-content h2, 
            .mobile-card-content h3, 
            .mobile-card-content h4, 
            .mobile-card-content h5, 
            .mobile-card-content h6 { 
              color: #fff; 
              margin: 0 0 12px 0; 
              font-weight: 600; 
            }
            .mobile-card-content h1:last-child, 
            .mobile-card-content h2:last-child, 
            .mobile-card-content h3:last-child, 
            .mobile-card-content h4:last-child, 
            .mobile-card-content h5:last-child, 
            .mobile-card-content h6:last-child { 
              margin-bottom: 0; 
            }
            .mobile-card-content blockquote { 
              margin: 0 0 12px 0; 
              padding: 12px 16px; 
              background: rgba(255,255,255,0.05); 
              border-left: 3px solid #60A5FA; 
              color: #E2E8F0; 
              font-style: italic; 
            }
            .mobile-card-content blockquote:last-child { 
              margin-bottom: 0; 
            }
            .mobile-card-content code { 
              background: rgba(255,255,255,0.1); 
              padding: 2px 6px; 
              border-radius: 4px; 
              font-family: 'Courier New', monospace; 
              color: #FBBF24; 
              font-size: 14px; 
            }
            .mobile-card-content pre { 
              background: rgba(0,0,0,0.3); 
              padding: 12px; 
              border-radius: 8px; 
              overflow-x: auto; 
              margin: 0 0 12px 0; 
            }
            .mobile-card-content pre:last-child { 
              margin-bottom: 0; 
            }
            .mobile-card-content pre code { 
              background: none; 
              padding: 0; 
              color: #E2E8F0; 
            }
            .mobile-card-content hr { 
            border: none; 
              height: 1px; 
              background: rgba(255,255,255,0.2); 
              margin: 16px 0; 
            }
            .mobile-card-content table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 0 0 12px 0; 
            }
            .mobile-card-content table:last-child { 
              margin-bottom: 0; 
            }
            .mobile-card-content th, 
            .mobile-card-content td { 
              padding: 8px 12px; 
              text-align: left; 
              border-bottom: 1px solid rgba(255,255,255,0.1); 
              color: #E2E8F0; 
            }
            .mobile-card-content th { 
              background: rgba(255,255,255,0.05); 
            color: #fff; 
              font-weight: 600; 
            }
            .mobile-card-content img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 8px; 
              margin: 8px 0; 
            }
            .mobile-card-content .detail-text { 
              color: #E2E8F0; 
              font-size: 16px; 
              line-height: 1.5; 
            }
            .mobile-card-content .rsvp-question { 
              color: #fff; 
              font-size: 16px; 
              font-weight: 600; 
              margin-bottom: 16px; 
            }
            .mobile-card-content .rsvp-status-text { 
              color: #94A3B8; 
              font-size: 12px; 
              margin-top: 10px; 
              line-height: 1.5; 
            }
            .mobile-card-content .checkin-success-text { 
              color: #22c55e; 
              font-size: 16px; 
              font-weight: 600; 
              margin-top: 10px; 
            }
            .mobile-card-content .qr-title { 
              color: #fff; 
              font-size: 16px; 
              font-weight: 600; 
              margin-bottom: 12px; 
            }
            .mobile-card-content .change-option-title { 
              color: #fff; 
              font-size: 16px; 
              font-weight: 600; 
              margin-bottom: 12px; 
            }
            .mobile-card.time-location-card .mobile-card-title { 
              text-align: left !important; 
              justify-content: flex-start !important; 
              margin-left: 10px !important; 
              border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important; 
              padding-bottom: 15px !important; 
              margin-bottom: 20px !important; 
              font-weight: 700 !important; 
            }
            .mobile-card.program-card .mobile-card-title { 
              text-align: left !important; 
              justify-content: flex-start !important; 
              margin-left: 10px !important; 
              border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important; 
              padding-bottom: 15px !important; 
              margin-bottom: 20px !important; 
              font-weight: 700 !important; 
            }
            .mobile-card.program-card { 
              padding-left: 28px !important; 
            }
            .detail-item { 
              display: grid !important; 
              grid-template-columns: 40px 1fr !important; 
              align-items: center !important; 
              margin-bottom: 15px !important; 
              gap: 12px !important; 
              justify-content: start !important; 
            }
            .detail-icon { 
              width: 20px !important; 
              height: 20px !important; 
              color: #fff !important; 
              text-align: center !important; 
              justify-self: center !important; 
            }
            .address-detail-icon { 
              width: 20px !important; 
              height: 20px !important; 
              color: #fff !important; 
              text-align: center !important; 
              justify-self: center !important; 
            }
            .detail-text { 
              color: #fff !important; 
              font-size: 16px !important; 
              text-align: left !important; 
              line-height: 1.4 !important; 
            }
            .map-link { 
              color: #fff !important; 
              text-decoration: none !important; 
              border-bottom: none !important; 
              transition: all 0.3s ease !important; 
          }
          .map-link:hover { 
              color: #60A5FA !important; 
              border-bottom: none !important; 
              transform: translateY(-1px) !important; 
            }
            .rsvp-question { 
              color: #fff !important; 
              font-size: 16px !important; 
              font-weight: 600 !important; 
              margin-bottom: 16px !important; 
            }
            .rsvp-status-text { 
              color: #94A3B8 !important; 
              font-size: 12px !important; 
              margin-top: 10px !important; 
              line-height: 1.5 !important; 
            }
            .checkin-success-text { 
              color: #22c55e !important; 
              font-size: 16px !important; 
              font-weight: 600 !important; 
              margin-top: 10px !important; 
            }
            .qr-title { 
              color: #fff !important; 
              font-size: 16px !important; 
              font-weight: 600 !important; 
              margin-bottom: 12px !important; 
            }
            .change-option-title { 
              color: #fff !important; 
              font-size: 16px !important; 
              font-weight: 600 !important; 
              margin-bottom: 12px !important; 
            }
            .mobile-card.time-location-card .mobile-card-title svg { 
              width: 25px !important; 
              height: 25px !important; 
              color: #3B82F6 !important; 
              max-width: 25px !important;
              max-height: 25px !important;
            }
          }
          /* Override cho icon tiêu đề card thời gian địa điểm */
          /* Override cho icon tiêu đề card thời gian địa điểm */
          /* Override cho icon tiêu đề card thời gian địa điểm */
            .rsvp-card { 
              background: rgba(255,255,255,0.08); 
              backdrop-filter: blur(8px); 
              border: 1px solid rgba(255,255,255,0.15); 
              border-radius: 20px; 
              padding: 12px; 
              text-align: center; 
              transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
              overflow: visible;
              height: auto;
              min-height: 200px;
            }
            .rsvp-card.expanding {
              height: auto !important;
              padding: 20px;
              min-height: 400px;
              transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
              overflow: visible !important;
            }
            .mobile-card.rsvp-card { 
              padding: 20px; 
              margin-bottom: 0; 
              min-height: 200px;
              min-width: 300px;
              max-width: 350px;
              overflow: visible;
            }
            .mobile-card.rsvp-card.expanding {
              min-height: auto !important;
              max-height: none !important;
              padding: 20px !important;
              height: auto !important;
              transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
              overflow: visible !important;
            }
            .mobile-card.time-location-card { 
              min-width: 280px;
              max-width: 320px;
            }
            .mobile-card.program-card { 
              min-width: 280px;
              max-width: 320px;
            }
              transform: translateY(0) !important;
              max-height: none !important;
              transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
            }
          .rsvp-card-declined { 
            background: rgba(239, 68, 68, 0.1); 
            border: 1px solid rgba(239, 68, 68, 0.3); 
          }
          .rsvp-title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #fff; 
            margin-bottom: 8px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .rsvp-title.accepted { color: #22c55e; }
          .rsvp-title.declined { color: #ef4444; }
            .rsvp-question { font-size: 12px; color: #94A3B8; margin-bottom: 15px; }
          .rsvp-buttons { 
            display: flex; 
            gap: 20px; 
            justify-content: center; 
            margin-bottom: 8px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .rsvp-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
          }
          .rsvp-button:hover::before {
            left: 100%;
          }
          .rsvp-accept { 
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2)); 
            border: 1px solid rgba(34, 197, 94, 0.3); 
            color: #ffffff; 
          }
          .rsvp-accept:hover { 
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4)); 
            border-color: rgba(34, 197, 94, 0.7); 
            transform: translateY(-3px) scale(1.02); 
            box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 0 25px rgba(34, 197, 94, 0.2); 
            color: #ffffff;
          }
          .rsvp-accept:active {
            transform: translateY(-1px) scale(0.98);
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.5);
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5));
            color: #ffffff;
          }
          .rsvp-decline { 
            background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2)); 
            border: 1px solid rgba(107, 114, 128, 0.3); 
            color:rgb(151, 154, 160); 
          }
          .rsvp-decline:hover { 
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.4), rgba(236, 72, 153, 0.4)); 
            border-color: rgba(239, 68, 68, 0.7); 
            transform: translateY(-3px) scale(1.02); 
            box-shadow: 0 15px 35px rgba(239, 68, 68, 0.4), 0 0 25px rgba(239, 68, 68, 0.2); 
            color: #ffffff;
          }
          .rsvp-decline:active {
            transform: translateY(-1px) scale(0.98);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(236, 72, 153, 0.5));
            color: #ffffff;
          }
          .rsvp-deadline { 
            color: #94A3B8; 
            font-size: 14px; 
            text-align: center; 
            margin-top: 5px; 
          }
          .rsvp-status-message { 
            text-align: center; 
            padding: 20px; 
          }
          .rsvp-status-text { 
            color: #94A3B8; 
              font-size: 16px; 
            margin-top: 10px; 
            line-height: 1.5; 
          }
          .qr-section { 
            margin-top: 20px; 
            padding: 0; 
            background: transparent; 
            text-align: center;
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
            overflow: visible;
          }
          .desktop-qr-section {
            display: block;
          }
          .rsvp-card.expanding .qr-section {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
          }
          .checkin-success { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            gap: 15px; 
            padding: 20px; 
            background: rgba(34, 197, 94, 0.1); 
            border: 2px solid #22c55e; 
            border-radius: 15px; 
            margin-top: 20px;
            animation: checkinSlideIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .checkin-success-icon { 
            width: 60px; 
            height: 60px; 
            background: #22c55e; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            animation: checkinIconBounce 0.6s ease-out 0.3s both, checkinPulse 2s ease-in-out 1s infinite;
          }
          .checkin-success-text { 
            color: #22c55e; 
            font-size: 16px; 
            font-weight: 600; 
            text-align: center;
            animation: checkinTextFade 0.6s ease-out 0.5s both;
          }
          .checkin-success-description { 
            color: #94A3B8; 
            font-size: 14px; 
            text-align: center; 
            margin-top: 8px; 
            line-height: 1.4;
            animation: checkinTextFade 0.6s ease-out 0.7s both;
          }
          
          /* Animations */
          @keyframes checkinSlideIn {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.8);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes checkinIconBounce {
            0% {
              opacity: 0;
              transform: scale(0.3) rotate(-180deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.2) rotate(-90deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }
          
          @keyframes checkinTextFade {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes checkinPulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
            }
            50% { 
              transform: scale(1.05); 
              box-shadow: 0 0 0 10px rgba(34, 197, 94, 0);
            }
          }
          
          @keyframes cardReveal {
            0% {
              opacity: 0.7;
              transform: translateY(20px) scale(0.95);
              filter: blur(2px);
            }
            50% {
              opacity: 0.9;
              transform: translateY(-4px) scale(1.01);
              filter: blur(0.5px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0px);
            }
          }
          .qr-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #fff; 
            margin-bottom: 10px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
            transform: translateY(0);
          }
          .rsvp-card.expanding .qr-title {
            opacity: 1;
            transform: translateY(0);
          }
          .qr-description { 
            color: #94A3B8; 
            margin-bottom: 15px; 
            font-size: 14px;
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
            transform: translateY(0);
          }
          .rsvp-card.expanding .qr-description {
            opacity: 1;
            transform: translateY(0);
          }
          .qr-loading { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            padding: 20px; 
          }
          .qr-image-container { 
            display: flex; 
            justify-content: center; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
            transform: translateY(0);
          }
          .rsvp-card.expanding .qr-image-container {
            opacity: 1;
            transform: translateY(0);
          }
          .qr-image { 
            width: 200px; 
            height: 200px; 
            border: 2px solid rgba(255,255,255,0.1); 
            border-radius: 12px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            opacity: 1;
            transform: scale(1);
          }
          .rsvp-card.expanding .qr-image {
            opacity: 1;
            transform: scale(1);
          }
          .qr-error { 
            color: #ef4444; 
            font-size: 14px; 
            padding: 20px; 
          }
          .declined-section { 
            margin-top: 20px; 
            padding: 0; 
            background: transparent; 
            text-align: center;
          }
          .declined-description { 
            color: #94A3B8; 
            margin-bottom: 15px; 
            font-size: 14px;
          }
          .change-option-button {
            margin-top: 15px;
            padding: 12px 24px;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #ffffff;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-left: auto;
            margin-right: auto;
            position: relative;
            overflow: hidden;
            white-space: nowrap;
            text-align: center;
          }
          .change-option-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
          }
          .change-option-button:hover::before {
            left: 100%;
          }
          .change-option-button:hover {
            background: rgba(59, 130, 246, 0.4);
            border-color: rgba(59, 130, 246, 0.7);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3), 0 0 15px rgba(59, 130, 246, 0.2);
            color: #2563eb;
          }
          .change-option-button:active {
            transform: translateY(-1px) scale(1.02);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
            background: rgba(59, 130, 246, 0.5);
          }
          .change-option-section {
            margin-top: 30px;
            padding: 20px;
            background: rgba(255,255,255,0.03);
            border-radius: 12px;
            text-align: center;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            max-height: 0;
            overflow: hidden;
          }
            .rsvp-card.expanding .change-option-section {
              opacity: 1;
              transform: translateY(0);
              max-height: none !important;
              transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .change-option-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 10px;
          }
          .change-option-description {
            color: #94A3B8;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .change-option-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
          }
          .confirm-change-button {
            padding: 12px 24px;
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #22c55e;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .confirm-change-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
          }
          .confirm-change-button:hover::before {
            left: 100%;
          }
          .confirm-change-button:hover {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
            border-color: rgba(34, 197, 94, 0.7);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3), 0 0 15px rgba(34, 197, 94, 0.2);
            color:rgb(255, 255, 255);
          }
          .confirm-change-button:active {
            transform: translateY(-1px) scale(1.02);
            box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5));
            color: #ffffff;
          }
          .cancel-change-button {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(122, 124, 126, 0.3);
            color:rgb(216, 216, 216);
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .cancel-change-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
          }
          .cancel-change-button:hover::before {
            left: 100%;
          }
          .cancel-change-button:hover {
            background: rgba(107, 114, 128, 0.4);
            border-color: rgba(107, 114, 128, 0.7);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 10px 25px rgba(107, 114, 128, 0.3), 0 0 15px rgba(107, 114, 128, 0.2);
            color: #ffffff;
          }
          .cancel-change-button:active {
            transform: translateY(-1px) scale(1.02);
            box-shadow: 0 6px 20px rgba(107, 114, 128, 0.4);
            background: rgba(107, 114, 128, 0.5);
            color: #ffffff;
          }
          @media (min-width: 768px) {
            .logo-container { width: 80px; height: 80px; margin-right: 20px; }
            .company-name { font-size: 32px; font-weight: 700; }
            .company-description { font-size: 20px; }
            .event-title-main-desktop { display: block; }
            .event-title-main-mobile { display: none; }
            .slogan-1-desktop { display: block; }
            .slogan-1-mobile { display: none; }
            .slogan-2-desktop { display: block; }
            .slogan-2-mobile { display: none; }
            .mobile-guest-card-after-title { display: none !important; }
            .mobile-event-content-card { display: none !important; }
            .mobile-event-info-card { display: none !important; }
            .mobile-rsvp-card { display: none !important; }
            .invitation-section { display: flex !important; }
            .header-top { margin-bottom: 15px; }
            .guest-card-desktop .guest-info-table {
              display: table;
              width: 100%;
              table-layout: fixed;
              margin-left: 30px;
            }
            .guest-card-desktop .guest-info-row {
              display: table-row;
            }
            .guest-card-desktop .greeting-title,
            .guest-card-desktop .guest-name-desktop,
            .guest-card-desktop .guest-info {
              display: table-cell;
              text-align: left;
              vertical-align: top;
              padding: 4px 0;
            }
            .guest-card-desktop .guest-info {
              font-size: 20px; 
              color: #94A3B8;
              margin-top: 8px;
              font-weight: 400;
              line-height: 1.4;
              text-align: left;
              margin-left: 0;
            }
            .mobile-cards { 
              display: flex !important; 
              overflow-x: auto; 
              gap: 16px; 
              padding: 0 20px 20px 20px;
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
            }
            .mobile-cards::-webkit-scrollbar {
              height: 4px;
            }
            .mobile-cards::-webkit-scrollbar-track {
              background: rgba(255,255,255,0.1);
              border-radius: 2px;
            }
            .mobile-cards::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.3);
              border-radius: 2px;
            }
            .mobile-cards::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.5);
            }
            .mobile-card { 
              background: rgba(255,255,255,0.08); 
              backdrop-filter: blur(8px); 
              border: 1px solid rgba(255,255,255,0.15); 
              border-radius: 20px; 
              padding: 25px; 
              margin-bottom: 0; 
              min-width: 280px;
              max-width: 320px;
              flex-shrink: 0;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .mobile-card.rsvp-card { 
              padding: 20px; 
              margin-bottom: 0; 
              min-height: 200px;
              min-width: 300px;
              max-width: 350px;
              overflow: visible;
            }
            .invitation-card-desktop { display: block; }
            .invitation-card-mobile { display: none; }
            .desktop-rsvp-section { display: flex; }
            
            /* Desktop Tables Layout */
            .desktop-tables-container {
              display: flex;
              justify-content: center;
              margin-bottom: 20px;
            }
            
            .desktop-table {
              background: transparent;
              border: none;
              border-radius: 0;
              padding: 0;
              width: 100%;
              max-width: none;
              text-align: left;
            }
            
            .desktop-table-title {
              font-size: 24px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
              border-bottom: 1px solid rgba(255,255,255,0.2);
              padding-bottom: 15px;
            }
            
            .desktop-table-icon {
              width: 20px;
              height: 20px;
              color: #94A3B8;
            }
            
            .desktop-table-content {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            
            .desktop-table-row {
              display: grid;
              grid-template-columns: 40px 1fr;
              gap: 12px;
              align-items: center;
            }
            
            .desktop-table-icon-cell {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            .desktop-table-row-icon {
              width: 18px;
              height: 18px;
              color: #94A3B8;
            }
            
            .desktop-table-content-cell {
              text-align: left;
            }
            
            .desktop-table-text {
              font-size: 22px;
              color: #E2E8F0;
              line-height: 1.4;
            }
            
            .desktop-map-link {
              color: #fff !important;
              text-decoration: none !important;
              border-bottom: none !important;
            }
            
            .desktop-map-link:hover {
              color: #3B82F6 !important;
              border-bottom: none !important;
            }
            
            /* Program Table Specific */
            .desktop-program-table .desktop-table-row {
              grid-template-columns: 60px 1fr;
            }
            
            .desktop-table-time-cell {
              text-align: left;
            }
            
            .desktop-table-time {
              font-size: 18px;
              font-weight: 600;
              color: #ffffff;
              background: rgba(255, 255, 255, 0.1);
              padding: 4px 8px;
              border-radius: 6px;
              display: inline-block;
            }
            
            /* Responsive for smaller screens */
            @media (max-width: 1400px) {
              .desktop-tables-container {
                flex-direction: column;
                gap: 20px;
              }
            }
            
            /* Desktop Timeline Card */
            .desktop-timeline-section {
              display: flex;
              justify-content: center;
              margin-bottom: 40px;
            }
            
            .desktop-timeline-card {
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 20px;
              padding: 30px;
              width: calc(70% + 50px);
              max-width: 1000px;
              text-align: center;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            .desktop-timeline-title {
              font-size: 24px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 8px;
              border-bottom: 1px solid rgba(255,255,255,0.2);
              padding-bottom: 15px;
            }
            
            .desktop-timeline-icon {
              width: 20px;
              height: 20px;
              color: #94A3B8;
            }
            
            .desktop-timeline-content {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }
            
            .desktop-timeline-row {
              display: grid;
              grid-template-columns: 80px 1fr;
              gap: 15px;
              align-items: center;
              text-align: left;
            }
            
            .desktop-timeline-time-cell {
              text-align: left;
            }
            
            .desktop-timeline-time {
              font-size: 18px;
              font-weight: 600;
              color: #ffffff;
              background: rgba(255, 255, 255, 0.1);
              padding: 6px 12px;
              border-radius: 8px;
              display: inline-block;
            }
            
            .desktop-timeline-content-cell {
              text-align: left;
            }
            
            .desktop-timeline-text {
              font-size: 18px;
              color: #E2E8F0;
              line-height: 1.4;
            }
            
            /* Desktop-specific styles */
            .greeting-title {
              font-size: 24px; 
              font-weight: 300; 
              color: #fff; 
              margin-bottom: 8px; 
              display: flex; 
              align-items: center; 
              gap: 10px;
              font-style: italic;
              padding-left: 15px;
            }
            .guest-name-desktop { 
              font-size: 40px; 
              color: #fff; 
              margin-bottom: 8px; 
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              font-weight: 700;
              text-shadow: 
                0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
                -0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
                0.5px -0.5px 0 rgba(0, 0, 0, 0.6),
                -0.5px 0.5px 0 rgba(0, 0, 0, 0.6),
                0 0 10px rgba(139, 92, 246, 0.8),
                0 0 20px rgba(59, 130, 246, 0.6),
                0 0 30px rgba(6, 182, 212, 0.4),
                0 0 40px rgba(139, 92, 246, 0.2);
              letter-spacing: 1px;
              filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.5));
              display: inline-block;
              transition: all 0.3s ease;
            }
            .guest-name-desktop.long-name { 
              font-size: 32px; 
            }
            .title-normal {
              font-weight: 400;
              font-size: 1.2em;
              text-shadow: none !important;
            }
            .title-normal.small-title {
              font-size: 28px;
              text-shadow: none !important;
            }
            .name-bold {
              font-weight: 700;
              text-shadow: 
                0.3px 0.3px 0 rgba(0, 0, 0, 0.3),
                -0.3px -0.3px 0 rgba(0, 0, 0, 0.3),
                0.3px -0.3px 0 rgba(0, 0, 0, 0.3),
                -0.3px 0.3px 0 rgba(0, 0, 0, 0.3),
                0 0 8px rgba(59, 130, 246, 0.8),
                0 0 16px rgba(59, 130, 246, 0.6),
                0 0 24px rgba(59, 130, 246, 0.4),
                0 0 32px rgba(59, 130, 246, 0.3),
                0 0 40px rgba(59, 130, 246, 0.2);
            }
            .guest-card-desktop { 
              background: transparent; 
              backdrop-filter: none; 
              border: none; 
              border-radius: 0; 
              padding: 25px; 
              margin-bottom: 20px; 
              margin-top: -30px;
              margin-left: auto;
              margin-right: auto;
              width: calc(70% + 50px);
              max-width: 1000px;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              text-align: center;
              display: block;
            }
            .guest-card-desktop:hover {
              transform: none;
              box-shadow: none;
              background: transparent;
              backdrop-filter: none;
            }
            
            /* Desktop-only styles - completely isolated */
            .program-info { text-align: center; margin-bottom: 40px; }
            .program-title { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 10px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .program-description { 
              font-size: 16px; 
              color: #94A3B8; 
              font-style: italic; 
              margin-top: 10px; 
            }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
            .detail-section h3 { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 20px; display: flex; align-items: center; }
            .detail-section h3 svg { width: 32px; height: 32px; margin-right: 16px; color: #3B82F6; }
            .detail-item { display: flex; align-items: center; margin-bottom: 15px; justify-content: flex-start; }
            .detail-icon { width: 20px; height: 20px; margin-right: 16px; color: #fff; text-align: left; }
            .address-detail-icon { width: 20px !important; height: 20px !important; margin-right: 16px !important; color: #fff !important; text-align: left; }
            .detail-text { color: #fff; font-size: 16px; text-align: left; }
            .map-link { 
              color: #fff; 
              text-decoration: none; 
              transition: all 0.3s ease;
              border-bottom: 1px solid transparent;
            }
            .map-link:hover { 
              color: #60A5FA; 
              border-bottom-color: #60A5FA;
              transform: translateY(-1px);
            }
            /* Desktop program timeline styling */
            .program-item { 
              display: flex; 
              margin-bottom: 12px; 
              align-items: baseline; 
            }
            .program-time { 
              font-weight: 700; 
              color: #fff; 
              width: 80px; 
              flex-shrink: 0; 
              line-height: 1.2; 
            }
            .program-description { 
              color: #fff; 
              flex: 1; 
              line-height: 1.2; 
              font-size: 16px; 
            }
            .additional-info { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; margin-bottom: 20px; }
            .info-item { color: #94A3B8; margin-bottom: 8px; }
            
            /* Desktop invitation section styling */
            .invitation-section {
              display: flex !important;
              justify-content: center;
              margin-bottom: 40px;
              margin-top: -20px;
            }
            
            /* Desktop invitation message styling */
            .invitation-message { 
              font-size: 20px; 
              color: #ffffff; 
              margin-top: 0; 
              margin-bottom: 0;
              font-style: italic;
              line-height: 1.5;
              text-align: left;
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 20px;
              padding: 25px;
              margin-bottom: 40px;
              margin-left: auto;
              margin-right: auto;
              width: calc(70% + 50px);
              max-width: 1000px;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            
            /* Desktop RSVP Card styling */
            .desktop-rsvp-section {
              display: flex;
              justify-content: center;
              margin-bottom: 40px;
            }
            
            .desktop-rsvp-card {
              background: rgba(255,255,255,0.08);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 20px;
              padding: 30px;
              width: calc(70% + 50px);
              max-width: 1000px;
              text-align: center;
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              scroll-margin-top: 100px;
            }
            
            .desktop-rsvp-card:focus {
              outline: none;
              border-color: rgba(34, 197, 94, 0.5);
              box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2), 0 8px 25px rgba(0, 0, 0, 0.3);
              transform: scale(1.02);
            }
            
            .desktop-rsvp-card.expanding {
              transform: scale(1.02);
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 25px rgba(34, 197, 94, 0.2);
            }
            
            .desktop-rsvp-title {
              font-size: 24px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .desktop-rsvp-title.accepted {
              color: #22c55e;
            }
            
            .desktop-rsvp-title.declined {
              color: #ef4444;
            }
            
            .desktop-rsvp-buttons {
              display: flex;
              gap: 20px;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .desktop-rsvp-button {
              padding: 15px 30px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 18px;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              gap: 10px;
              border: none;
              min-width: 180px;
              justify-content: center;
            }
            
            .desktop-rsvp-accept {
              background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
              border: 1px solid rgba(34, 197, 94, 0.3);
              color: #ffffff;
            }
            
            .desktop-rsvp-accept:hover {
              background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
              border-color: rgba(34, 197, 94, 0.7);
              transform: translateY(-3px) scale(1.02);
              box-shadow: 0 15px 35px rgba(34, 197, 94, 0.4), 0 0 25px rgba(34, 197, 94, 0.2);
              color: #ffffff;
            }
            
            .desktop-rsvp-accept:active {
              transform: translateY(-1px) scale(0.98);
              box-shadow: 0 8px 25px rgba(34, 197, 94, 0.5);
              background: linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5));
              color: #ffffff;
            }
            
            .desktop-rsvp-decline {
              background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2));
              border: 1px solid rgba(107, 114, 128, 0.3);
              color: rgb(151, 154, 160);
            }
            
            .desktop-rsvp-decline:hover {
              background: linear-gradient(135deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.4));
              border-color: rgba(107, 114, 128, 0.7);
              transform: translateY(-3px) scale(1.02);
              box-shadow: 0 15px 35px rgba(107, 114, 128, 0.4), 0 0 25px rgba(107, 114, 128, 0.2);
              color: #ffffff;
            }
            
            .desktop-rsvp-decline:active {
              transform: translateY(-1px) scale(0.98);
              box-shadow: 0 8px 25px rgba(107, 114, 128, 0.5);
              background: linear-gradient(135deg, rgba(107, 114, 128, 0.5), rgba(75, 85, 99, 0.5));
              color: #ffffff;
            }
            
            .desktop-rsvp-status-text {
              font-size: 16px;
              color: #94A3B8;
              margin-top: 10px;
              line-height: 1.5;
            }
            
            /* Desktop QR Section */
            .desktop-qr-section {
              margin-top: 20px;
              text-align: center;
            }
            
            .desktop-qr-title {
              font-size: 18px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 10px;
            }
            
            .desktop-qr-description {
              font-size: 14px;
              color: #94A3B8;
              margin-bottom: 20px;
            }
            
            .desktop-qr-loading {
              text-align: center;
              padding: 20px;
            }
            
            .desktop-qr-image-container {
              display: flex;
              justify-content: center;
              margin-bottom: 20px;
            }
            
            .desktop-qr-image {
              width: 200px;
              height: 200px;
              border-radius: 12px;
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }
            
            .desktop-qr-error {
              text-align: center;
              padding: 20px;
              background: rgba(239, 68, 68, 0.1);
              border-radius: 12px;
              border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            /* Desktop Change Option Button */
            .desktop-change-option-button {
              background: rgba(107, 114, 128, 0.2);
              border: 1px solid rgba(107, 114, 128, 0.3);
              color: rgb(151, 154, 160);
              padding: 12px 24px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex; 
              align-items: center;
              gap: 8px;
              margin: 20px auto 0;
            }
            
            .desktop-change-option-button:hover {
              background: rgba(107, 114, 128, 0.4);
              border-color: rgba(107, 114, 128, 0.7);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(107, 114, 128, 0.3);
              color: #ffffff;
            }
            
            /* Desktop Check-in Success */
            .desktop-checkin-success {
              text-align: center;
              padding: 30px;
            }
            
            .desktop-checkin-success-icon {
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #22c55e, #16a34a);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
            }
            
            .desktop-checkin-success-text {
              font-size: 24px;
              font-weight: 700; 
              color: #22c55e;
              margin-bottom: 10px;
            }
            
            .desktop-checkin-success-description {
              font-size: 16px;
              color: #94A3B8;
              line-height: 1.5;
            }
            
            /* Desktop Declined Section */
            .desktop-declined-section {
              text-align: center;
              padding: 20px;
            }
            
            .desktop-declined-description {
              font-size: 16px;
              color: #94A3B8;
              margin: 20px 0;
              line-height: 1.5;
            }
            
            /* Desktop Change Option Section */
            .desktop-change-option-section {
              background: rgba(255,255,255,0.05);
              border-radius: 12px;
              padding: 25px;
              margin-top: 20px;
              text-align: center;
            }
            
            .desktop-change-option-title {
              font-size: 20px;
              font-weight: 600;
              color: #fff;
              margin-bottom: 10px;
            }
            
            .desktop-change-option-description {
              font-size: 16px;
              color: #94A3B8;
              margin-bottom: 20px;
              line-height: 1.5;
            }
            
            .desktop-change-option-buttons {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .desktop-confirm-change-button {
              background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2));
              border: 1px solid rgba(34, 197, 94, 0.3);
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              min-width: 100px;
            }
            
            .desktop-confirm-change-button:hover {
              background: linear-gradient(135deg, rgba(34, 197, 94, 0.4), rgba(16, 185, 129, 0.4));
              border-color: rgba(34, 197, 94, 0.7);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
            }
            
            .desktop-cancel-change-button {
              background: linear-gradient(135deg, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.2));
              border: 1px solid rgba(107, 114, 128, 0.3);
              color: rgb(151, 154, 160);
              padding: 12px 24px;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              min-width: 100px;
            }
            
            .desktop-cancel-change-button:hover {
              background: linear-gradient(135deg, rgba(107, 114, 128, 0.4), rgba(75, 85, 99, 0.4));
              border-color: rgba(107, 114, 128, 0.7);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(107, 114, 128, 0.3);
              color: #ffffff;
            }
            
            /* Desktop RSVP buttons styling */
            .rsvp-button { 
              padding: 12px 24px; 
              border-radius: 12px; 
              font-weight: 600; 
              font-size: 20px; 
              cursor: pointer; 
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); 
              display: flex; 
              align-items: center; 
              gap: 8px; 
              border: none;
              backdrop-filter: blur(8px);
              position: relative;
              overflow: hidden;
              min-width: 180px;
              justify-content: center;
            }
          }
          
          /* Override cho icon tiêu đề card thời gian địa điểm */
          
          /* Override cho icon tiêu đề card thời gian địa điểm */
          .mobile-card.time-location-card .mobile-card-title svg { 
            width: 25px !important; 
            height: 25px !important; 
            color: #3B82F6 !important; 
            max-width: 25px !important;
            max-height: 25px !important;
          }
          
          /* Override cho icon tiêu đề card thời gian địa điểm */
        `}</style>
        
        <div className="main-container">
          {/* Header */}
          <div className="header">
            <div className="header-top">
              <div className="logo-container">
                <img src="/company-logo.png" alt="EXP Technology Logo" className="logo-image" />
              </div>
              <div className="company-info">
                <div className="company-name">Technology Company</div>
              </div>
            </div>
            <div className="event-title-main-desktop">Lễ kỷ niệm 15 năm</div>
            <div className="event-title-main-mobile">Lễ kỷ niệm 15 năm</div>
            <div className="slogan-1-desktop">Ngày Truyền thống Công ty TNHH Công nghệ EXP</div>
            <div className="slogan-1-mobile">Ngày Truyền thống Công ty TNHH Công nghệ EXP</div>
            <div className="slogan-2-desktop">"Từ Thái Nguyên vươn xa – 15 năm học tập và trải nghiệm"</div>
            <div className="slogan-2-mobile">"Từ Thái Nguyên vươn xa – 15 năm học tập và trải nghiệm"</div>
          </div>

          {/* Mobile Guest Card - Moved after title */}
          <div className="mobile-card guest-card mobile-guest-card-after-title">
            <div className="mobile-card-content">
              <div className="greeting-section">
                <div className="greeting-title">
                  Kính gửi:
                </div>
                <div className="guest-info-block">
                  <div className={`guest-name ${inviteData.guest.name && inviteData.guest.name.trim().split(' ').length >= 3 ? 'long-name' : ''}`}>
                    {inviteData.guest.title ? <><span className={`title-normal ${inviteData.guest.name && inviteData.guest.name.trim().split(' ').length >= 3 ? 'small-title' : ''}`}>{inviteData.guest.title}</span> </> : ''}<span className="name-bold">{inviteData.guest.name}</span>
                  </div>
                  {(inviteData.guest.role || inviteData.guest.organization) && (
                    <div className="guest-role">
                      {inviteData.guest.role && inviteData.guest.organization ? 
                        <><span className="role-bold">{inviteData.guest.role}</span> - {inviteData.guest.organization}</> :
                        inviteData.guest.role || inviteData.guest.organization
                      }
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Event Content Card */}
          <div className="mobile-card event-content-card mobile-event-content-card">
            <div className="mobile-card-content">
              {inviteData.guest.event_content ? (
                <div className="event-content-message" style={{ whiteSpace: 'pre-line', textAlign: 'left', margin: 0 }}>
                  {inviteData.guest.event_content}
                </div>
              ) : (
                <div className="event-content-message" style={{ color: '#ffffff', fontStyle: 'italic', textAlign: 'left', margin: 0 }}>
                  [Chưa có nội dung sự kiện]
                </div>
              )}
            </div>
          </div>

          {/* Mobile Event Info Card - Moved after event content */}
          <div className="mobile-card time-location-card mobile-event-info-card">
            <div className="mobile-card-title">
              Thông tin sự kiện
            </div>
            <div className="detail-item">
              <svg className="detail-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <span className="detail-text">{formattedDate}</span>
            </div>
            <div className="detail-item">
              <svg className="detail-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
              </svg>
              <span className="detail-text">{formatTime(inviteData.event.time)}</span>
            </div>
            {inviteData.event.venue_address && (
              <div className="detail-item">
                <svg className="address-detail-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 12,11.5Z"/>
                </svg>
                <span className="detail-text">{inviteData.event.venue_address}</span>
              </div>
            )}
            {inviteData.event.venue_map_url && inviteData.event.venue_map_url.trim() !== '' && (
              <div className="detail-item">
                <svg className="detail-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                </svg>
                <a 
                  href={inviteData.event.venue_map_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="detail-text map-link"
                >
                  Xem trên Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Mobile RSVP Card - Moved after event info */}
          <div className={`mobile-card rsvp-card mobile-rsvp-card ${inviteData.guest.rsvp_status === 'declined' ? 'rsvp-card-declined' : ''} ${showChangeOption ? 'expanding' : ''}`}>
            {/* 1. Trạng thái "chưa phản hồi" - Hiển thị câu hỏi RSVP */}
            {(() => {
              console.log('=== RSVP STATUS CHECK ===', {
                rsvp_status: inviteData.guest.rsvp_status,
                checkin_status: inviteData.guest.checkin_status,
                showChangeOption
              })
              return inviteData.guest.rsvp_status === 'pending' && 
                     (inviteData.guest.checkin_status as string) !== 'arrived'
            })() && (
              <>
                <h2 className="rsvp-title">Xác nhận tham dự</h2>
                <div className="rsvp-buttons">
                  <button className="rsvp-button rsvp-accept" onClick={() => handleAccept()}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Tôi sẽ tham dự
                  </button>
                  <button className="rsvp-button rsvp-decline" onClick={() => handleDecline()}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Không thể tham dự
                  </button>
                </div>
              </>
            )}

            {/* 2. Trạng thái "đã xác nhận" + chưa check-in - Hiển thị QR code */}
            {inviteData.guest.rsvp_status === 'accepted' && 
             (inviteData.guest.checkin_status as string) !== 'arrived' && 
             !showChangeOption && 
             !showCheckinSuccess && 
             !instantCheckin && (
              <>
                <h2 className="rsvp-title accepted" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="20" height="20" fill="#22c55e" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Đã xác nhận tham dự
                </h2>
                <p className="rsvp-status-text">
                  Cảm ơn bạn đã xác nhận tham dự sự kiện. Vui lòng quét mã QR để check-in.
                </p>
                
                {!showCheckinSuccess && !instantCheckin && (
                  <div className="qr-section">
                    <h3 className="qr-title">Mã QR Check-in</h3>
                    <p className="qr-description">Vui lòng quét mã QR này để check-in tại sự kiện</p>
                    
                    {qrLoading ? (
                      <div className="qr-loading">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-400 mt-2">Đang tạo mã QR...</p>
                      </div>
                    ) : qrImageUrl ? (
                      <div className="qr-image-container">
                        <img 
                          src={qrImageUrl} 
                          alt="QR Code" 
                          className="qr-image"
                          onLoad={() => console.log('QR image loaded successfully:', qrImageUrl)}
                          onError={(e) => console.error('QR image failed to load:', qrImageUrl, e)}
                        />
                      </div>
                    ) : (
                      <div className="qr-error text-red-500">
                        Không thể tạo mã QR
                        <br />
                        <small>Debug: qrImageUrl = {qrImageUrl || 'null'}</small>
                        <br />
                        <small>Debug: qrLoading = {qrLoading ? 'true' : 'false'}</small>
                      </div>
                    )}
                    
                    {(inviteData.guest.checkin_status as string) !== 'arrived' && (
                      <button 
                        className="change-option-button"
                        onClick={handleChangeOption}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Tôi muốn thay đổi tùy chọn
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 3. Trạng thái "đã check-in" - Hiển thị dấu tích xanh (ưu tiên cao nhất) */}
            {((inviteData.guest.checkin_status as string) === 'arrived' || showCheckinSuccess || instantCheckin) && (
              <div className="checkin-success">
                <div className="checkin-success-icon">
                  <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
                <div className="checkin-success-text">
                  {showCheckinSuccess ? 'Check-in thành công!' : 'Đã check-in'}
                </div>
                <p className="checkin-success-description">
                  Cảm ơn bạn đã tham dự sự kiện. Chúc bạn có những trải nghiệm tuyệt vời!
                </p>
              </div>
            )}

            {/* 4. Trạng thái "đã từ chối" - Hiển thị thông báo từ chối */}
            {inviteData.guest.rsvp_status === 'declined' && 
             (inviteData.guest.checkin_status as string) !== 'arrived' && 
             !showChangeOption && (
              <div className="declined-section">
                <h2 className="rsvp-title declined" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="20" height="20" fill="#ef4444" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  Đã từ chối tham dự
                </h2>
                <p className="declined-description">
                  Cảm ơn bạn đã phản hồi. Chúng tôi rất tiếc vì bạn không thể tham dự sự kiện này.
                </p>
                
                {(inviteData.guest.checkin_status as string) !== 'arrived' && (
                  <button 
                    className="change-option-button"
                    onClick={handleChangeOption}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Tôi muốn thay đổi tùy chọn
                  </button>
                )}
              </div>
            )}

            {/* Hiển thị lại nút RSVP khi muốn thay đổi */}
            {showChangeOption && 
             (inviteData.guest.checkin_status as string) !== 'arrived' && (
              <div className="change-option-section">
                <h3 className="change-option-title">Thay đổi tùy chọn tham dự</h3>
                <p className="change-option-description">Bạn có chắc chắn muốn thay đổi tùy chọn tham dự không?</p>
                
                <div className="change-option-buttons">
                  <button 
                    className="confirm-change-button"
                    onClick={handleResetRSVP}
                  >
                    Có
                  </button>
                  <button 
                    className="cancel-change-button"
                    onClick={handleCancelChange}
                  >
                    Không
                  </button>
                </div>
              </div>
            )}
          </div>

          
          {/* Guest Card */}
          <div className="guest-card-desktop">
            <div className="greeting-section">
              <div className="guest-info-table">
                <div className="guest-info-row">
              <div className="greeting-title">
                Kính gửi:
              </div>
                </div>
                <div className="guest-info-row">
                <div className={`guest-name-desktop ${inviteData.guest.name && inviteData.guest.name.trim().split(' ').length >= 3 ? 'long-name' : ''}`}>
                  {inviteData.guest.title ? <><span className={`title-normal ${inviteData.guest.name && inviteData.guest.name.trim().split(' ').length >= 3 ? 'small-title' : ''}`}>{inviteData.guest.title}</span> </> : ''}<span className="name-bold">{inviteData.guest.name}</span>
                  </div>
                </div>
                {(inviteData.guest.role || inviteData.guest.organization) && (
                  <div className="guest-info-row">
                  <div className="guest-info">
                    {inviteData.guest.role && inviteData.guest.organization ? 
                      `${inviteData.guest.role} - ${inviteData.guest.organization}` :
                      inviteData.guest.role || inviteData.guest.organization
                    }
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Nội dung thiệp mời */}
          <div className="invitation-section">
            {inviteData.guest.event_content ? (
              <div className="invitation-message" style={{ whiteSpace: 'pre-line', textAlign: 'left', margin: 0 }}>
                {inviteData.guest.event_content}
              </div>
            ) : (
              <div className="invitation-message" style={{ color: '#ffffff', fontStyle: 'italic', textAlign: 'left', margin: 0 }}>
                [Chưa có nội dung thiệp mời]
              </div>
            )}
          </div>

          {/* Desktop Invitation Card */}
          <div className="invitation-card-desktop">
            <div className="desktop-tables-container">
              {/* Bảng 1: Thời gian & Địa điểm */}
              <div className="desktop-table desktop-time-location-table">
                <h3 className="desktop-table-title">
                  Thời gian & Địa điểm
                </h3>
                <div className="desktop-table-content">
                  <div className="desktop-table-row">
                    <div className="desktop-table-icon-cell">
                      <svg className="desktop-table-row-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      </svg>
                    </div>
                    <div className="desktop-table-content-cell">
                      <span className="desktop-table-text">{formattedDate}</span>
                    </div>
                  </div>
                  <div className="desktop-table-row">
                    <div className="desktop-table-icon-cell">
                      <svg className="desktop-table-row-icon" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                      </svg>
                    </div>
                    <div className="desktop-table-content-cell">
                      <span className="desktop-table-text">{formatTime(inviteData.event.time)}</span>
                    </div>
                  </div>
                  {inviteData.event.venue_address && (
                    <div className="desktop-table-row">
                      <div className="desktop-table-icon-cell">
                        <svg className="desktop-table-row-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/>
                        </svg>
                      </div>
                      <div className="desktop-table-content-cell">
                        <span className="desktop-table-text">{inviteData.event.venue_address}</span>
                      </div>
                    </div>
                  )}
                  {inviteData.event.venue_map_url && inviteData.event.venue_map_url.trim() !== '' && (
                    <div className="desktop-table-row">
                      <div className="desktop-table-icon-cell">
                        <svg className="desktop-table-row-icon" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                        </svg>
                      </div>
                      <div className="desktop-table-content-cell">
                        <a 
                          href={inviteData.event.venue_map_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="desktop-table-text desktop-map-link"
                        >
                          Xem trên Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop QR Section */}
          {inviteData.guest.rsvp_status === 'accepted' && !inviteData.guest.checkin_status && (
            <div className="invitation-card desktop-qr-section">
              <div className="qr-section">
                <h3 className="qr-title">Mã QR Check-in</h3>
                <p className="qr-description">Vui lòng quét mã QR này để check-in tại sự kiện</p>
                {qrImageUrl ? (
                  <div className="qr-image-container">
                    <img 
                      src={qrImageUrl} 
                      alt="QR Code" 
                      className="qr-image"
                      onLoad={() => console.log('Desktop QR image loaded successfully:', qrImageUrl)}
                      onError={(e) => console.error('Desktop QR image failed to load:', qrImageUrl, e)}
                    />
                  </div>
                ) : (
                  <div className="qr-loading">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    <p className="text-gray-400 mt-2">Đang tạo mã QR...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card Xác nhận tham dự Desktop - Di chuyển xuống dưới cùng */}
          <div className="desktop-rsvp-section">
            <div ref={desktopRsvpCardRef} className={`desktop-rsvp-card ${inviteData.guest.rsvp_status === 'declined' ? 'rsvp-card-declined' : ''} ${showChangeOption ? 'expanding' : ''}`}>
              {/* 1. Trạng thái "chưa phản hồi" - Hiển thị câu hỏi RSVP */}
              {(() => {
                console.log('=== DESKTOP RSVP STATUS CHECK ===', {
                  rsvp_status: inviteData.guest.rsvp_status,
                  checkin_status: inviteData.guest.checkin_status,
                  showChangeOption
                })
                return inviteData.guest.rsvp_status === 'pending' && 
                       (inviteData.guest.checkin_status as string) !== 'arrived'
              })() && (
                <>
                  <h2 className="desktop-rsvp-title">Xác nhận tham dự</h2>
                  <div className="desktop-rsvp-buttons">
                    <button className="desktop-rsvp-button desktop-rsvp-accept" onClick={() => handleAccept()}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Tôi sẽ tham dự
                    </button>
                    <button className="desktop-rsvp-button desktop-rsvp-decline" onClick={() => handleDecline()}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Không thể tham dự
                    </button>
                  </div>
                </>
              )}

              {/* 2. Trạng thái "đã xác nhận" + chưa check-in - Hiển thị QR code */}
              {inviteData.guest.rsvp_status === 'accepted' && 
               (inviteData.guest.checkin_status as string) !== 'arrived' && 
               !showChangeOption && 
               !showCheckinSuccess && (
                <>
                  <h2 className="desktop-rsvp-title accepted" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width="20" height="20" fill="#22c55e" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Đã xác nhận tham dự
                  </h2>
                  <p className="desktop-rsvp-status-text">
                    Cảm ơn bạn đã xác nhận tham dự sự kiện. Vui lòng quét mã QR để check-in.
                  </p>
                  
                  {!showCheckinSuccess && !instantCheckin && (
                    <div className="desktop-qr-section">
                      <h3 className="desktop-qr-title">Mã QR Check-in</h3>
                      <p className="desktop-qr-description">Vui lòng quét mã QR này để check-in tại sự kiện</p>
                      
                      {qrLoading ? (
                        <div className="desktop-qr-loading">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-400 mt-2">Đang tạo mã QR...</p>
                        </div>
                      ) : qrImageUrl ? (
                        <div className="desktop-qr-image-container">
                          <img 
                            src={qrImageUrl} 
                            alt="QR Code" 
                            className="desktop-qr-image"
                            onLoad={() => console.log('Desktop QR image loaded successfully:', qrImageUrl)}
                            onError={(e) => console.error('Desktop QR image failed to load:', qrImageUrl, e)}
                          />
                        </div>
                      ) : (
                        <div className="desktop-qr-error text-red-500">
                          Không thể tạo mã QR
                          <br />
                          <small>Debug: qrImageUrl = {qrImageUrl || 'null'}</small>
                          <br />
                          <small>Debug: qrLoading = {qrLoading ? 'true' : 'false'}</small>
                        </div>
                      )}
                      
                      {(inviteData.guest.checkin_status as string) !== 'arrived' && (
                        <button 
                          className="desktop-change-option-button"
                          onClick={handleChangeOption}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Tôi muốn thay đổi tùy chọn
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 3. Trạng thái "đã check-in" - Hiển thị dấu tích xanh (ưu tiên cao nhất) */}
              {((inviteData.guest.checkin_status as string) === 'arrived' || showCheckinSuccess || instantCheckin) && (
                <div className="desktop-checkin-success">
                  <div className="desktop-checkin-success-icon">
                    <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <div className="desktop-checkin-success-text">
                    {showCheckinSuccess ? 'Check-in thành công!' : 'Đã check-in'}
                  </div>
                  <p className="desktop-checkin-success-description">
                    Cảm ơn bạn đã tham dự sự kiện. Chúc bạn có những trải nghiệm tuyệt vời!
                  </p>
                </div>
              )}

              {/* 4. Trạng thái "đã từ chối" - Hiển thị thông báo từ chối */}
              {inviteData.guest.rsvp_status === 'declined' && 
               (inviteData.guest.checkin_status as string) !== 'arrived' && 
               !showChangeOption && (
                <div className="desktop-declined-section">
                  <h2 className="desktop-rsvp-title declined" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width="20" height="20" fill="#ef4444" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Đã từ chối tham dự
                  </h2>
                  <p className="desktop-declined-description">
                    Cảm ơn bạn đã phản hồi. Chúng tôi rất tiếc vì bạn không thể tham dự sự kiện này.
                  </p>
                  
                  {(inviteData.guest.checkin_status as string) !== 'arrived' && (
                    <button 
                      className="desktop-change-option-button"
                      onClick={handleChangeOption}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Tôi muốn thay đổi tùy chọn
                    </button>
                  )}
                </div>
              )}

              {/* Hiển thị lại nút RSVP khi muốn thay đổi */}
              {showChangeOption && 
               (inviteData.guest.checkin_status as string) !== 'arrived' && (
                <div className="desktop-change-option-section">
                  <h3 className="desktop-change-option-title">Thay đổi tùy chọn tham dự</h3>
                  <p className="desktop-change-option-description">Bạn có chắc chắn muốn thay đổi tùy chọn tham dự không?</p>
                  
                  <div className="desktop-change-option-buttons">
                    <button 
                      className="desktop-confirm-change-button"
                      onClick={handleResetRSVP}
                    >
                      Có
                    </button>
                    <button 
                      className="desktop-cancel-change-button"
                      onClick={handleCancelChange}
                    >
                      Không
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Timeline Card - Tách riêng */}
          <div className="desktop-timeline-section">
            <div className="desktop-timeline-card">
              <h3 className="desktop-timeline-title">
                Chương trình
              </h3>
              <div className="desktop-timeline-content">
                {programRows.length > 0 ? (
                  programRows.map((row, index) => (
                    <div key={index} className="desktop-timeline-row">
                      <div className="desktop-timeline-time-cell">
                        <span className="desktop-timeline-time">{row.time}</span>
                      </div>
                      <div className="desktop-timeline-content-cell">
                        <span className="desktop-timeline-text">{row.item}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="desktop-timeline-row">
                      <div className="desktop-timeline-time-cell">
                        <span className="desktop-timeline-time">18:00</span>
                      </div>
                      <div className="desktop-timeline-content-cell">
                        <span className="desktop-timeline-text">Đón khách & Check-in</span>
                      </div>
                    </div>
                    <div className="desktop-timeline-row">
                      <div className="desktop-timeline-time-cell">
                        <span className="desktop-timeline-time">18:30</span>
                      </div>
                      <div className="desktop-timeline-content-cell">
                        <span className="desktop-timeline-text">Khai mạc</span>
                      </div>
                    </div>
                    <div className="desktop-timeline-row">
                      <div className="desktop-timeline-time-cell">
                        <span className="desktop-timeline-time">19:00</span>
                      </div>
                      <div className="desktop-timeline-content-cell">
                        <span className="desktop-timeline-text">Vinh danh & Tri ân</span>
                      </div>
                    </div>
                    <div className="desktop-timeline-row">
                      <div className="desktop-timeline-time-cell">
                        <span className="desktop-timeline-time">20:00</span>
                      </div>
                      <div className="desktop-timeline-content-cell">
                        <span className="desktop-timeline-text">Gala & Networking</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {/* Card 1: Xác nhận tham dự (RSVP) */}
            <div className={`mobile-card rsvp-card ${inviteData.guest.rsvp_status === 'declined' ? 'rsvp-card-declined' : ''} ${showChangeOption ? 'expanding' : ''}`}>
              {/* 1. Trạng thái "chưa phản hồi" - Hiển thị câu hỏi RSVP */}
              {(() => {
                console.log('=== RSVP STATUS CHECK ===', {
                  rsvp_status: inviteData.guest.rsvp_status,
                  checkin_status: inviteData.guest.checkin_status,
                  showChangeOption
                })
                return inviteData.guest.rsvp_status === 'pending' && 
                       (inviteData.guest.checkin_status as string) !== 'arrived'
              })() && (
                <>
                  <h2 className="rsvp-title">Xác nhận tham dự</h2>
                  <div className="rsvp-buttons">
                    <button className="rsvp-button rsvp-accept" onClick={() => handleAccept()}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Tôi sẽ tham dự
                    </button>
                    <button className="rsvp-button rsvp-decline" onClick={() => handleDecline()}>
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Không thể tham dự
                    </button>
                  </div>
                </>
              )}

              {/* 2. Trạng thái "đã xác nhận" + chưa check-in - Hiển thị QR code */}
              {inviteData.guest.rsvp_status === 'accepted' && 
               (inviteData.guest.checkin_status as string) !== 'arrived' && 
               !showChangeOption && 
               !showCheckinSuccess && (
                <>
                  <h2 className="rsvp-title accepted" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width="20" height="20" fill="#22c55e" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Đã xác nhận tham dự
                  </h2>
                  <p className="rsvp-status-text">
                    Cảm ơn bạn đã xác nhận tham dự sự kiện. Vui lòng quét mã QR để check-in.
                  </p>
                  
                  {!showCheckinSuccess && !instantCheckin && (
                    <div className="qr-section">
                      <h3 className="qr-title">Mã QR Check-in</h3>
                      <p className="qr-description">Vui lòng quét mã QR này để check-in tại sự kiện</p>
                      
                      {qrLoading ? (
                        <div className="qr-loading">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-gray-400 mt-2">Đang tạo mã QR...</p>
                        </div>
                      ) : qrImageUrl ? (
                        <div className="qr-image-container">
                          <img 
                            src={qrImageUrl} 
                            alt="QR Code" 
                            className="qr-image"
                            onLoad={() => console.log('QR image loaded successfully:', qrImageUrl)}
                            onError={(e) => console.error('QR image failed to load:', qrImageUrl, e)}
                          />
                        </div>
                      ) : (
                        <div className="qr-error text-red-500">
                          Không thể tạo mã QR
                          <br />
                          <small>Debug: qrImageUrl = {qrImageUrl || 'null'}</small>
                          <br />
                          <small>Debug: qrLoading = {qrLoading ? 'true' : 'false'}</small>
                        </div>
                      )}
                      
                      {(inviteData.guest.checkin_status as string) !== 'arrived' && (
                        <button 
                          className="change-option-button"
                          onClick={handleChangeOption}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Tôi muốn thay đổi tùy chọn
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 3. Trạng thái "đã check-in" - Hiển thị dấu tích xanh (ưu tiên cao nhất) */}
              {((inviteData.guest.checkin_status as string) === 'arrived' || showCheckinSuccess || instantCheckin) && (
                <div className="checkin-success">
                  <div className="checkin-success-icon">
                    <svg width="48" height="48" fill="white" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <div className="checkin-success-text">
                    {showCheckinSuccess ? 'Check-in thành công!' : 'Đã check-in'}
                  </div>
                  <p className="checkin-success-description">
                    Cảm ơn bạn đã tham dự sự kiện. Chúc bạn có những trải nghiệm tuyệt vời!
                  </p>
                </div>
              )}

              {/* 4. Trạng thái "đã từ chối" - Hiển thị thông báo từ chối */}
              {inviteData.guest.rsvp_status === 'declined' && 
               (inviteData.guest.checkin_status as string) !== 'arrived' && 
               !showChangeOption && (
                <div className="declined-section">
                  <h2 className="rsvp-title declined" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <svg width="20" height="20" fill="#ef4444" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Đã từ chối tham dự
                  </h2>
                  <p className="declined-description">
                    Cảm ơn bạn đã phản hồi. Chúng tôi rất tiếc vì bạn không thể tham dự sự kiện này.
                  </p>
                  
                  {(inviteData.guest.checkin_status as string) !== 'arrived' && (
                    <button 
                      className="change-option-button"
                      onClick={handleChangeOption}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Tôi muốn thay đổi tùy chọn
                    </button>
                  )}
                </div>
              )}

              {/* Hiển thị lại nút RSVP khi muốn thay đổi */}
              {showChangeOption && 
               (inviteData.guest.checkin_status as string) !== 'arrived' && (
                <div className="change-option-section">
                  <h3 className="change-option-title">Thay đổi tùy chọn tham dự</h3>
                  <p className="change-option-description">Bạn có chắc chắn muốn thay đổi tùy chọn tham dự không?</p>
                  
                  <div className="change-option-buttons">
                    <button 
                      className="confirm-change-button"
                      onClick={handleResetRSVP}
                    >
                      Có
                    </button>
                    <button 
                      className="cancel-change-button"
                      onClick={handleCancelChange}
                    >
                      Không
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Thời gian & Địa điểm */}
            <div className="mobile-card time-location-card">
              <div className="mobile-card-title">
                Thông tin sự kiện
              </div>
              <div className="detail-item">
                <svg className="detail-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span className="detail-text">{formattedDate}</span>
              </div>
              <div className="detail-item">
                <svg className="detail-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,13V7H12.5V12.2L17,14.9L16.2,16.2Z"/>
                </svg>
                <span className="detail-text">{formatTime(inviteData.event.time)}</span>
              </div>
              {inviteData.event.venue_address && (
                <div className="detail-item">
                  <svg className="address-detail-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5Z"/>
                  </svg>
                  <span className="detail-text">{inviteData.event.venue_address}</span>
                </div>
              )}
              {inviteData.event.venue_map_url && inviteData.event.venue_map_url.trim() !== '' && (
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                  </svg>
                  <a 
                    href={inviteData.event.venue_map_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="detail-text map-link"
                  >
                    Xem trên Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Card 3: Timeline chương trình */}
            <div className="mobile-card program-card">
              <div className="mobile-card-title">
                Chương trình
              </div>
              {programRows.length > 0 ? (
                programRows.map((row, index) => (
                  <div key={index} className="program-item">
                    <span className="program-time">{row.time}</span>
                    <span className="program-description">{row.item}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="program-item">
                    <span className="program-time">18:00</span>
                    <span className="program-description">Đón khách & Check-in</span>
                  </div>
                  <div className="program-item">
                    <span className="program-time">18:30</span>
                    <span className="program-description">Khai mạc</span>
                  </div>
                  <div className="program-item">
                    <span className="program-time">19:00</span>
                    <span className="program-description">Vinh danh & Tri ân</span>
                  </div>
                  <div className="program-item">
                    <span className="program-time">20:00</span>
                    <span className="program-description">Gala & Networking</span>
                  </div>
                </>
              )}
            </div>
          </div>

          
        </div>
      </div>

    </>
  )
}

export default InvitePage

