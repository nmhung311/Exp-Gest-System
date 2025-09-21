'use client'

import React, { useEffect, useState } from 'react'
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
              // Chỉ cập nhật event_content nếu có giá trị mới, không ghi đè bằng null
              event_content: guestData.event_content && guestData.event_content.trim() !== '' 
                ? guestData.event_content 
                : prev.guest.event_content
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
    
    // Kiểm tra định kỳ mỗi 30 giây để tránh gọi quá nhiều
    const interval = setInterval(checkCheckinStatus, 30000)
    
    return () => clearInterval(interval)
  }, [inviteData?.guest.id])

  // Effect để kiểm tra trạng thái khi user focus vào trang
  useEffect(() => {
    const handleFocus = () => {
      if (inviteData) {
        console.log('=== PAGE FOCUSED - CHECKING CHECKIN STATUS ===')
        checkCheckinStatus()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && inviteData) {
        console.log('=== PAGE VISIBLE - FORCE REFRESH DATA ===')
        // Force refresh data khi user quay lại trang
        setTimeout(() => {
          checkCheckinStatus()
        }, 500)
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
      // Delay 500ms để QR code biến mất trước khi hiển thị animation
      const timer = setTimeout(() => {
        setShowCheckinSuccess(true)
        console.log('showCheckinSuccess set to true')
      }, 500)
      
      return () => clearTimeout(timer)
    } else if (inviteData && inviteData.guest.checkin_status === 'not_arrived') {
      // Chỉ reset khi chưa checkin, không reset khi đã checkin
      console.log('Guest not checked in yet, keeping showCheckinSuccess as is')
    }
  }, [inviteData?.guest.checkin_status, inviteData?.guest.rsvp_status])

  // Listen for check-in events from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CHECKIN_SUCCESS' && event.data.guestId === inviteData?.guest.id) {
        console.log('=== CHECKIN SUCCESS MESSAGE RECEIVED ===')
        console.log('Guest ID:', event.data.guestId)
        console.log('Current guest ID:', inviteData?.guest.id)
        updateCheckinStatus('checked_in')
        
        // Kiểm tra trạng thái từ server ngay sau khi nhận message
        setTimeout(() => {
          console.log('Triggering immediate checkin status check...')
          checkCheckinStatus()
        }, 1000)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [inviteData?.guest.id])

  // Thêm listener cho sự kiện checkin từ bên ngoài
  useEffect(() => {
    const handleCheckinEvent = () => {
      console.log('=== EXTERNAL CHECKIN EVENT ===')
      if (inviteData) {
        setTimeout(() => {
          checkCheckinStatus()
        }, 500)
      }
    }

    // Listen for custom checkin events
    window.addEventListener('checkin-success', handleCheckinEvent)
    return () => window.removeEventListener('checkin-success', handleCheckinEvent)
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

  // Generate QR code
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
          setInviteData(data)
          
          // Không gọi checkCheckinStatus ngay sau khi load để tránh ghi đè data
          // setTimeout(() => {
          //   if (data.guest?.id) {
          //     checkCheckinStatus()
          //   }
          // }, 1000)
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
        
        // Tự động focus card RSVP ra giữa màn hình trên mobile
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            const rsvpCard = document.querySelector('.rsvp-card')
            if (rsvpCard) {
              rsvpCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'center'
              })
            }
          }, 15)
        }
        
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
        
        // Tự động focus card RSVP ra giữa màn hình trên mobile
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            const rsvpCard = document.querySelector('.rsvp-card')
            if (rsvpCard) {
              rsvpCard.scrollIntoView({ 
                behavior: 'auto', 
                block: 'center',
                inline: 'center'
              })
            }
          }, 200)
        }
        
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
          rsvp_status: 'pending'
        }),
      })

      if (response.ok) {
        setInviteData(prev => prev ? { ...prev, guest: { ...prev.guest, rsvp_status: 'pending' } } : null)
        setShowChangeOption(false)
        setQrImageUrl('')
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
          .company-full { font-size: 16px; color: #94A3B8; }
          .company-description { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 10px; font-style: italic; }
          .event-title-main { 
            font-size: 32px; 
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
          }
          .slogan-1 { 
            font-size: 16px; 
            color:rgb(201, 202, 204); 
            text-align: center; 
            margin-bottom: 16px; 
            font-weight: 500;
          }
          .slogan-2 { 
            font-size: 14px; 
            color: #94A3B8; 
            text-align: center; 
            margin-bottom: 20px; 
            font-style: italic;
          }
          .main-title { text-align: center; margin-bottom: 50px; }
          .event-title { font-size: 48px; font-weight: 700; color: #fff; margin-bottom: 10px; }
          .title-underline { width: 200px; height: 4px; background: linear-gradient(90deg, #3B82F6, #8B5CF6); margin: 0 auto; border-radius: 2px; }
          .invitation-card { 
            background: rgba(255,255,255,0.08); 
            backdrop-filter: blur(8px); 
            border: 1px solid rgba(255,255,255,0.15); 
            border-radius: 20px; 
            padding: 40px; 
            margin-bottom: 30px; 
          }
          .greeting { font-size: 24px; color: #fff; margin-bottom: 20px; }
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
          @media (max-width: 768px) {
            .greeting { font-size: 18px; }
            .greeting-section::before { width: 4px; left: 12px; top: 10px; bottom: 10px; background: linear-gradient(180deg, #60A5FA, #A78BFA); box-shadow: 0 0 10px rgba(96, 165, 250, 0.6); }
          }
          .guest-info { font-size: 18px; color: #8B5CF6; margin-top: 8px; font-weight: 500; }
          .invitation-text { font-size: 18px; color: #94A3B8; margin-bottom: 20px; }
          .program-info { text-align: center; margin-bottom: 40px; }
          .program-title { font-size: 32px; font-weight: 700; color: #fff; margin-bottom: 10px; background: linear-gradient(135deg, #3B82F6, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .program-description { font-size: 18px; color: #94A3B8; font-style: italic; margin-top: 10px; }
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
          .program-item { display: flex; margin-bottom: 12px; align-items: baseline; }
          .program-time { font-weight: 700; color: #fff; width: 80px; flex-shrink: 0; line-height: 1.2; }
          .program-description { color: #fff; flex: 1; line-height: 1.2; }
          .additional-info { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; margin-bottom: 20px; }
          .info-item { color: #94A3B8; margin-bottom: 8px; }
            .rsvp-card { 
              background: rgba(255,255,255,0.08); 
              backdrop-filter: blur(8px); 
              border: 1px solid rgba(255,255,255,0.15); 
              border-radius: 20px; 
              padding: 12px; 
              text-align: center; 
              transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
              overflow: hidden;
              height: auto;
            }
            .rsvp-card.expanding {
              height: auto;
              padding: 20px;
              transition: all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
            }
            .mobile-card.rsvp-card { padding: 10px; margin-bottom: 20px; }
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
          .rsvp-question { font-size: 18px; color: #94A3B8; margin-bottom: 15px; }
          .rsvp-buttons { 
            display: flex; 
            gap: 20px; 
            justify-content: center; 
            margin-bottom: 8px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          .rsvp-button { 
            padding: 12px 24px; 
            border-radius: 12px; 
            font-weight: 600; 
            font-size: 16px; 
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
            transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
            opacity: 0;
            transform: translateY(20px);
            max-height: 0;
            overflow: hidden;
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
            font-size: 18px; 
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
            font-size: 20px; 
            font-weight: 600; 
            color: #fff; 
            margin-bottom: 10px; 
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
            opacity: 0;
            transform: translateY(20px);
          }
          .rsvp-card.expanding .qr-title {
            opacity: 1;
            transform: translateY(0);
          }
          .qr-description { 
            color: #94A3B8; 
            margin-bottom: 15px; 
            font-size: 14px;
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
            opacity: 0;
            transform: translateY(20px);
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
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
            opacity: 0;
            transform: translateY(20px);
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
            transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 3s;
            opacity: 0;
            transform: scale(0.8);
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
            font-size: 13px;
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
          }
          .change-option-title {
            font-size: 18px;
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
            font-size: 14px;
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
            font-size: 14px;
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
          @media (min-width: 769px) {
            .logo-container { width: 80px; height: 80px; margin-right: 20px; }
            .company-name { font-size: 32px; font-weight: 700; }
            .company-description { font-size: 16px; }
            .event-title-main { font-size: 36px; }
            .slogan-1 { font-size: 18px; }
            .slogan-2 { font-size: 16px; }
            .header-top { margin-bottom: 15px; }
          }
          @media (max-width: 768px) {
            .details-grid { grid-template-columns: 1fr; gap: 20px; }
            .rsvp-buttons { flex-direction: column; gap: 15px; }
            .rsvp-button { padding: 12px 24px; font-size: 14px; }
            .event-title { font-size: 36px; }
            .program-title { font-size: 24px; }
            .program-description { font-size: 16px; }
            .guest-info { font-size: 16px; }
            .main-container { padding: 20px 15px; }
            
            /* Mobile invitation message styling */
            .invitation-message { 
              color: #ffffff !important; 
              font-size: 16px; 
              line-height: 1.5;
              text-align: left !important;
            }
            
            /* Mobile Card Layout */
            .invitation-card { display: none; }
            .mobile-cards { display: block; }
            .mobile-card { 
              background: rgba(255,255,255,0.08); 
              backdrop-filter: blur(8px); 
              border: 1px solid rgba(255,255,255,0.15); 
              border-radius: 20px; 
              padding: 25px; 
              margin-bottom: 20px; 
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .mobile-card-title { 
              font-size: 20px; 
              font-weight: 600; 
              color: #fff; 
              margin-bottom: 20px; 
              display: flex; 
              align-items: center; 
              gap: 10px;
              font-style: normal;
              text-align: left;
              justify-content: flex-start;
            }
            .greeting-section {
              padding: 15px 25px; 
              margin-bottom: 20px;
              margin-top: -30px;
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
              top: 8px;
              bottom: 8px;
              width: 4px;
              background: linear-gradient(180deg,rgb(0, 115, 255),rgb(221, 28, 228));
              border-radius: 2px;
              box-shadow: 0 0 10px rgba(204, 222, 245, 0.6);
            }
            .greeting-title {
              font-size: 16px; 
              font-weight: 300; 
              color: #fff; 
              margin-bottom: 8px; 
              display: flex; 
              align-items: center; 
              gap: 10px;
              font-style: italic;
              padding-left: 15px;
            }
            .guest-info-block {
              padding-left: 15px;
            }
            .invitation-section {
              background: rgba(255,255,255,0.08); 
              backdrop-filter: blur(8px); 
              border: 1px solid rgba(255,255,255,0.15); 
              border-radius: 20px; 
              padding: 20px; 
              margin-bottom: 20px;
              width: fit-content;
              max-width: 100%;
              margin-left: auto;
              margin-right: auto;
              display: inline-block;
            }
            .mobile-card-title svg { 
              width: 24px; 
              height: 24px; 
              color: #3B82F6; 
            }
            .time-location-card .mobile-card-title svg { 
              width: 25px !important; 
              height: 25px !important; 
              color: #3B82F6 !important; 
            }
            .mobile-card.time-location-card .mobile-card-title svg { 
              width: 25px !important; 
              height: 25px !important; 
              color: #3B82F6 !important; 
            }
            .address-detail-icon { 
              width: 56px !important; 
              height: 56px !important; 
              margin-right: 16px !important; 
              color: #fff !important; 
            }
            .detail-icon { 
              width: 25px !important; 
              height: 25px !important; 
              margin-right: 16px !important; 
              color: #fff !important; 
            }
            .map-link { 
              color: #fff !important; 
            }
            .detail-item { 
              justify-content: flex-start !important; 
              text-align: left;
            }
            .guest-card { text-align: center; }
            .guest-name { 
              font-size: 30px; 
              color: #fff; 
              margin-bottom: 8px; 
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .guest-name.long-name { 
              font-size: 25px; 
            }
            .guest-role { 
              font-size: 16px; 
              color: #fff; 
              font-weight: 500; 
              word-wrap: break-word;
              line-height: 1.4;
              text-align: left;
            }
            .role-bold {
              font-weight: 700;
            }
            .title-normal {
              font-weight: 400;
              font-size: 0.9em;
            }
            .title-normal.small-title {
              font-size: 19px;
            }
            .name-bold {
              font-weight: 700;
              text-shadow: 
                0.3px 0.3px 0 rgba(0, 0, 0, 0.3),
                -0.3px -0.3px 0 rgba(0, 0, 0, 0.3),
                0.3px -0.3px 0 rgba(0, 0, 0, 0.3),
                -0.3px 0.3px 0 rgba(0, 0, 0, 0.3),
                0 0 5px rgba(139, 92, 246, 0.4),
                0 0 10px rgba(59, 130, 246, 0.3),
                0 0 15px rgba(6, 182, 212, 0.2);
            }
            .invitation-message { 
              font-size: 16px; 
              color: #ffffff; 
              margin-top: 0; 
              margin-bottom: 0;
              font-style: italic;
              line-height: 1.5;
              text-align: left;
            }
            .date-range {
              color: #94A3B8;
              font-weight: 700;
              font-style: italic;
            }
            .honor-message {
              color: #94A3B8;
              font-weight: 500;
              font-style: italic;
              margin-top: 8px;
              display: block;
            }
            .time-location-card { 
              transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            .time-location-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow:
                0 20px 40px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 0 30px rgba(59, 130, 246, 0.2);
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(12px);
            }
            .time-location-card.scroll-reveal {
              animation: cardReveal 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            }
            .program-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow:
                0 20px 40px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 0 30px rgba(59, 130, 246, 0.2);
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(12px);
            }
            .rsvp-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow:
                0 20px 40px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 0 30px rgba(59, 130, 246, 0.2);
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(12px);
            }
            .invitation-card:hover {
              transform: translateY(-8px) scale(1.02);
              box-shadow:
                0 20px 40px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 0 30px rgba(59, 130, 246, 0.2);
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(12px);
            }
            .time-location-card .detail-item { margin-bottom: 15px; }
            .time-location-card .detail-icon { width: 20px !important; height: 20px !important; }
            .time-location-card .address-detail-icon { width: 20px !important; height: 20px !important; }
            .time-location-card svg { width: 20px !important; height: 20px !important; }
            .time-location-card .detail-item svg { width: 20px !important; height: 20px !important; }
            .time-location-card svg path { width: 20px !important; height: 20px !important; }
            .time-location-card .detail-item svg path { width: 20px !important; height: 20px !important; }
            .time-location-card svg { width: 20px !important; height: 20px !important; max-width: 20px !important; max-height: 20px !important; }
            .time-location-card .address-detail-icon { display: block !important; width: 40px !important; height: 40px !important; }
            .time-location-card .address-detail-icon svg { width: 40px !important; height: 40px !important; }
            .time-location-card .address-detail-icon svg path { width: 40px !important; height: 40px !important; }
            .mobile-card.time-location-card .address-detail-icon svg { width: 40px !important; height: 40px !important; max-width: 40px !important; max-height: 40px !important; }
            .mobile-card.time-location-card .address-detail-icon svg path { width: 40px !important; height: 40px !important; }
            .mobile-card.time-location-card .detail-item .address-detail-icon { transform: scale(2) translateX(1px) !important; }
            .mobile-card.time-location-card .detail-item .address-detail-icon svg { transform: scale(2) !important; }
            .program-card .program-item { 
              margin-bottom: 11px; 
              display: flex; 
              align-items: baseline; 
              gap: 8px;
              padding-left: 0; /* Căn sát lề trái của card */
              justify-content: flex-start;
            }
            .program-card .program-time { 
              font-weight: 700; 
              color: #fff; 
              width: 70px; 
              flex-shrink: 0;
              line-height: 1.2;
              text-align: left;
              font-size: 16px;
            }
            .program-card .program-description { 
              color: #fff; 
              flex: 1; 
              line-height: 1.2;
              font-size: 16px;
              font-style: italic;
              margin-left: 0;
              padding-left: 0;
              transform: translateY(-1px);
            }
            .address-detail-icon + .detail-text {
              transform: translateX(8px);
            }
            .map-link {
              transform: translateX(-1px);
            }
          }
          
          /* Override cho icon tiêu đề card thời gian địa điểm */
          .mobile-card.time-location-card .mobile-card-title svg { 
            width: 25px !important; 
            height: 25px !important; 
            color: #3B82F6 !important; 
            max-width: 25px !important;
            max-height: 25px !important;
          }
          
          @media (min-width: 769px) {
            .mobile-cards { display: none; }
          }
            .event-title-main {
              font-size: 37px;
            }
            .slogan-1 {
              font-size: 14px;
            }
            .slogan-2 {
              font-size: 12px;
            }
          }
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
            <div className="event-title-main">Lễ kỷ niệm 15 năm</div>
            <div className="slogan-1">Ngày Truyền thống Công ty TNHH Công nghệ EXP</div>
            <div className="slogan-2">"Từ Thái Nguyên vươn xa – 15 năm học tập và trải nghiệm"</div>
          </div>

          
          {/* Invitation Card */}
          <div className="invitation-card">
            <div className="greeting">
              Kính mời: {inviteData.guest.title ? `${inviteData.guest.title} ` : ''}{inviteData.guest.name}
              {(inviteData.guest.role || inviteData.guest.organization) && (
                <div className="guest-info">
                  {inviteData.guest.role && inviteData.guest.organization ? 
                    `${inviteData.guest.role} - ${inviteData.guest.organization}` :
                    inviteData.guest.role || inviteData.guest.organization
                  }
                </div>
              )}
            </div>
            {inviteData.guest.event_content && (
              <div className="invitation-text">
                {inviteData.guest.event_content}
              </div>
            )}

            <div className="details-grid">
              {/* Time & Location Section */}
              <div className="detail-section">
                <h3>
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Thời gian & Địa điểm
                </h3>
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

              {/* Program Section */}
              <div className="detail-section">
                <h3>
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Chương trình
                </h3>
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

            {/* Additional Info */}
            <div className="additional-info">
              {inviteData.event.dress_code && (
                <div className="info-item">Trang phục: {inviteData.event.dress_code}</div>
              )}
              <div className="info-item">Vui lòng xác nhận tham dự trước ngày {rsvpDeadline}</div>
            </div>
          </div>

          {/* Card 1: Thông tin khách */}
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

          {/* Mobile Cards */}
          <div className="mobile-cards">

            {/* Card 2: Xác nhận tham dự (RSVP) - Di chuyển lên vị trí thứ 2 */}
            <div className={`mobile-card rsvp-card ${inviteData.guest.rsvp_status === 'declined' ? 'rsvp-card-declined' : ''}`}>
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
                  
                  {!showCheckinSuccess && (
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
                          />
                        </div>
                      ) : (
                        <div className="qr-error text-red-500">Không thể tạo mã QR</div>
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
              {((inviteData.guest.checkin_status as string) === 'arrived' || showCheckinSuccess) && (
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

            {/* Card 3: Thời gian & Địa điểm */}
            <div className="mobile-card time-location-card">
              <div className="mobile-card-title">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
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

            {/* Card 4: Timeline chương trình */}
            <div className="mobile-card program-card">
              <div className="mobile-card-title">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3,13H5V11H3M3,17H5V15H3M3,9H5V7H3M7,13H21V11H7M7,17H21V15H7M7,7V9H21V7H7Z"/>
                </svg>
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

          
          <div className="rsvp-deadline">Hạn chót xác nhận: {rsvpDeadline}</div>
        </div>
      </div>

    </>
  )
}

export default InvitePage

