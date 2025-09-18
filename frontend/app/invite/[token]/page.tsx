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
  title: string;
  role: string;
  organization: string;
  group_tag: string;
  is_vip: boolean;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  checkin_status: 'not_arrived' | 'checked_in' | 'checked_out';
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

  // Load invite data
  useEffect(() => {
    const loadInviteData = async () => {
      try {
        setLoading(true)
        
        // Try to load from API first
        const response = await fetch(`http://192.168.1.135:9009/api/invite/${token}`)
        
        if (response.ok) {
          const data = await response.json()
          setInviteData(data)
        } else {
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
              checkin_status: 'not_arrived'
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

  return (
    <>
      <BackgroundGlow />
      <div className="min-h-screen bg-[#0B0F14] text-white">
        <style jsx global>{`
          body {
            font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #fff;
            background-color: #0B0F14;
          }
          .main-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
          .header { display: flex; align-items: center; margin-bottom: 40px; }
          .logo-container { width: 80px; height: 80px; margin-right: 20px; }
          .logo-image { width: 100%; height: 100%; object-fit: contain; }
          .company-info { flex: 1; }
          .company-name { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 5px; }
          .company-slogan { font-size: 18px; color: #8B5CF6; margin-bottom: 5px; }
          .company-full { font-size: 16px; color: #94A3B8; }
          .main-title { text-align: center; margin-bottom: 50px; }
          .event-title { font-size: 48px; font-weight: 700; color: #fff; margin-bottom: 10px; }
          .title-underline { width: 200px; height: 4px; background: linear-gradient(90deg, #3B82F6, #8B5CF6); margin: 0 auto; border-radius: 2px; }
          .invitation-card { background: rgba(255,255,255,0.05); backdrop-blur-sm; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; margin-bottom: 30px; }
          .greeting { font-size: 24px; color: #fff; margin-bottom: 20px; }
          .invitation-text { font-size: 18px; color: #94A3B8; margin-bottom: 40px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
          .detail-section h3 { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 20px; display: flex; align-items: center; }
          .detail-item { display: flex; align-items: center; margin-bottom: 15px; }
          .detail-icon { width: 24px; height: 24px; margin-right: 12px; color: #3B82F6; }
          .detail-text { color: #fff; font-size: 16px; }
          .program-item { display: flex; margin-bottom: 12px; }
          .program-time { font-weight: 600; color: #8B5CF6; width: 80px; }
          .program-description { color: #fff; flex: 1; }
          .additional-info { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; margin-bottom: 20px; }
          .info-item { color: #94A3B8; margin-bottom: 8px; }
          .rsvp-card { background: rgba(255,255,255,0.05); backdrop-blur-sm; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; text-align: center; }
          .rsvp-title { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 20px; }
          .rsvp-question { font-size: 18px; color: #94A3B8; margin-bottom: 30px; }
          .rsvp-buttons { display: flex; gap: 20px; justify-content: center; margin-bottom: 20px; }
          .rsvp-button { padding: 15px 30px; border-radius: 12px; font-weight: 600; font-size: 16px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 8px; }
          .rsvp-accept { background: linear-gradient(135deg, #10B981, #059669); color: #fff; }
          .rsvp-accept:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3); }
          .rsvp-decline { background: linear-gradient(135deg, #EF4444, #DC2626); color: #fff; }
          .rsvp-decline:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3); }
          .rsvp-deadline { color: #94A3B8; font-size: 14px; }
          @media (max-width: 768px) {
            .details-grid { grid-template-columns: 1fr; gap: 20px; }
            .rsvp-buttons { flex-direction: column; }
            .event-title { font-size: 36px; }
            .main-container { padding: 20px 15px; }
          }
        `}</style>
        
        <div className="main-container">
          {/* Header */}
          <div className="header">
            <div className="logo-container">
              <img src="/company-logo.png" alt="EXP Technology Logo" className="logo-image" />
            </div>
            <div className="company-info">
              <div className="company-name">EXP Technology</div>
              <div className="company-slogan">15 Years of Excellence</div>
              <div className="company-full">EXP Technology Company Limited</div>
            </div>
          </div>

          {/* Main Title */}
          <div className="main-title">
            <h1 className="event-title">Lễ kỷ niệm 15 năm thành lập</h1>
            <div className="title-underline"></div>
          </div>
          
          {/* Invitation Card */}
          <div className="invitation-card">
            <div className="greeting">Kính gửi {inviteData.guest.name}</div>
            <div className="invitation-text">
              Trân trọng mời quý khách tham dự chương trình
            </div>

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
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{formattedDate} lúc {inviteData.event.time}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{inviteData.event.location}</span>
                </div>
                {inviteData.event.venue_address && (
                  <div className="detail-item">
                    <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="detail-text">{inviteData.event.venue_address}</span>
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
              <div className="info-item">Trang phục: Business casual</div>
              <div className="info-item">Vui lòng xác nhận tham dự trước ngày {rsvpDeadline}</div>
            </div>
          </div>

          {/* RSVP Card */}
          <div className="rsvp-card">
            <h2 className="rsvp-title">Xác nhận tham dự</h2>
            <p className="rsvp-question">
              Vui lòng cho chúng tôi biết bạn có thể tham dự sự kiện không?
            </p>
            <div className="rsvp-buttons">
              <button className="rsvp-button rsvp-accept">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Tôi sẽ tham dự
              </button>
              <button className="rsvp-button rsvp-decline">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Không thể tham dự
              </button>
            </div>
            <div className="rsvp-deadline">Hạn chót xác nhận: {rsvpDeadline}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default InvitePage
