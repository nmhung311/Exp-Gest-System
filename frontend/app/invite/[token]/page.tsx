'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import MeshBackground from '../../components/MeshBackground'

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
        const qrData = {
          eventId: inviteData?.event.id || 'DEMO',
          eventName: inviteData?.event.name || 'Demo Event',
          confirmationUrl: `${window.location.origin}/confirm-attendance?event=${inviteData?.event.id || 'demo'}`,
          timestamp: new Date().toISOString()
        }
        const qrString = JSON.stringify(qrData)
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
        const response = await fetch(`http://localhost:5001/api/invite/${token}`)
        
        if (response.ok) {
          const data = await response.json()
          setInviteData(data)
        } else {
          // Fallback to demo data if API fails
          const demoData: InviteData = {
            event: {
              id: 1,
              name: 'Lễ kỷ niệm 15 năm thành lập',
              description: 'Công ty EXP Technology',
              date: '2025-01-20',
              time: '18:00',
              location: 'Trung tâm Hội nghị Quốc gia',
              venue_address: 'Số 1 Thăng Long, Cầu Giấy, Hà Nội',
              venue_map_url: 'https://maps.google.com',
              dress_code: 'Lịch sự',
              program_outline: JSON.stringify([
                ['18:00', 'Đón khách'],
                ['18:30', 'Khai mạc'],
                ['19:00', 'Phát biểu'],
                ['19:30', 'Tiệc buffet'],
                ['21:00', 'Kết thúc']
              ]),
              max_guests: 100,
              status: 'upcoming'
            },
            guest: {
              id: 1,
              name: 'Nguyễn Văn A',
              email: 'nguyenvana@example.com',
              title: 'Ông',
              role: 'Khách mời',
              organization: 'Công ty ABC',
              group_tag: 'VIP',
              is_vip: true,
              rsvp_status: 'pending',
              checkin_status: 'not_arrived'
            },
            token: token
          }
          setInviteData(demoData)
        }
      } catch (err) {
        console.error('Error loading invite data:', err)
        setError('Không thể tải thông tin thiệp mời')
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
      <MeshBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Đang tải thiệp mời...</p>
          </div>
        </div>
      </MeshBackground>
    )
  }

  if (error || !inviteData) {
    return (
      <MeshBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">Không tìm thấy thiệp mời</h1>
            <p className="text-white/80">Thiệp mời không tồn tại hoặc đã hết hạn</p>
          </div>
        </div>
      </MeshBackground>
    )
  }

  const formattedDate = new Date(inviteData.event.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const rsvpDeadline = new Date(inviteData.event.date).toLocaleDateString('vi-VN')

  return (
    <MeshBackground>
      <div className="min-h-screen" style={{ '--primary-color': '#0B2A4A', '--accent-color': '#1E88E5' } as React.CSSProperties}>
        <style jsx global>{`
          body {
            font-family: 'Space Grotesk', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container { max-width: 600px; margin: 0 auto; background: #fff; box-shadow: 0 0 20px rgba(0,0,0,.1); }
          .header { background: var(--primary-color, #0B2A4A); color: #fff; padding: 30px 20px; text-align: center; }
          .logo { max-width: 120px; height: auto; margin-bottom: 20px; }
          .event-title { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
          .event-subtitle { font-size: 18px; opacity: .9; }
          .content { padding: 30px 20px; }
          .greeting { font-size: 18px; margin-bottom: 20px; }
          .event-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; margin-bottom: 10px; align-items: center; }
          .detail-icon { width: 20px; margin-right: 10px; text-align: center; }
          .detail-text { flex: 1; }
          .program-outline { margin: 20px 0; }
          .program-item { display: flex; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid #eee; }
          .program-time { font-weight: 700; width: 60px; color: var(--accent-color, #1E88E5); }
          .program-description { flex: 1; margin-left: 15px; }
          .cta-section { text-align: center; margin: 30px 0; }
          .cta-button { display: inline-block; padding: 15px 30px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: 700; font-size: 16px; transition: all .3s; }
          .cta-accept { background: var(--accent-color, #1E88E5); color: #fff; }
          .cta-accept:hover { background: #1976d2; }
          .cta-decline { background: #6c757d; color: #fff; }
          .cta-decline:hover { background: #5a6268; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .qr-code { max-width: 150px; height: auto; margin: 15px 0; }
          .qr-warning { color: #dc3545; font-size: 14px; font-weight: 700; margin-top: 10px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; }
          .footer-logo { max-width: 80px; height: auto; margin-bottom: 10px; }
          .footer-text { font-size: 14px; color: #6c757d; }
          .ics-link { display: inline-block; margin-top: 15px; padding: 8px 16px; background: var(--primary-color, #0B2A4A); color: #fff; text-decoration: none; border-radius: 4px; font-size: 14px; }
          .ics-link:hover { background: #0a1f3a; }
          @media (max-width: 600px) {
            .container { margin: 0; box-shadow: none; }
            .cta-button { display: block; margin: 10px 0; }
            .detail-row { flex-direction: column; align-items: flex-start; }
            .detail-icon { margin-bottom: 5px; }
          }
        `}</style>
        
        <div className="container">
          {/* Header */}
          <div className="header">
            <img src="/logo.png" alt="Logo" className="logo" />
            <h1 className="event-title">{inviteData.event.name}</h1>
            {inviteData.event.description && (
              <p className="event-subtitle">{inviteData.event.description}</p>
            )}
          </div>
          
          {/* Content */}
          <div className="content">
            <div className="greeting">
              Kính gửi {inviteData.guest.title} {inviteData.guest.name},
            </div>
            
            <p>Trân trọng kính mời Quý khách tham dự sự kiện đặc biệt:</p>
            
            {/* Event Details */}
            <div className="event-details">
              <div className="detail-row">
                <span className="detail-icon">📅</span>
                <div className="detail-text">
                  <strong>Thời gian:</strong> {formattedDate} {inviteData.event.time}
                </div>
              </div>
              
              <div className="detail-row">
                <span className="detail-icon">📍</span>
                <div className="detail-text">
                  <strong>Địa điểm:</strong> {inviteData.event.location}
                </div>
              </div>
              
              {inviteData.event.venue_address && (
                <div className="detail-row">
                  <span className="detail-icon">🏢</span>
                  <div className="detail-text">
                    <strong>Địa chỉ:</strong> {inviteData.event.venue_address}
                    {inviteData.event.venue_map_url && (
                      <><br /><a href={inviteData.event.venue_map_url} target="_blank" rel="noopener noreferrer">Xem bản đồ</a></>
                    )}
                  </div>
                </div>
              )}
              
              {inviteData.event.dress_code && (
                <div className="detail-row">
                  <span className="detail-icon">👔</span>
                  <div className="detail-text">
                    <strong>Trang phục:</strong> {inviteData.event.dress_code}
                  </div>
                </div>
              )}
            </div>
            
            {/* Program Outline */}
            {programRows.length > 0 && (
              <div className="program-outline">
                <h3>Chương trình:</h3>
                <div id="program-content">
                  {programRows.map((item, index) => (
                    <div key={index} className="program-item">
                      <div className="program-time">{item.time || ''}</div>
                      <div className="program-description">{item.item || ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* CTA Section */}
            <div className="cta-section">
              <p><strong>Vui lòng phản hồi trước {rsvpDeadline} để chúng tôi chuẩn bị tốt nhất.</strong></p>
              <a href="#" onClick={(e) => e.preventDefault()} className="cta-button cta-accept">Tham dự</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="cta-button cta-decline">Từ chối</a>
            </div>
            
            {/* QR Ticket Section */}
            <div className="qr-section">
              <h3>🎫 VÉ THAM DỰ CỦA BẠN</h3>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
              ) : (
                <div className="qr-code bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                  Đang tạo QR...
                </div>
              )}
              <div className="qr-warning">
                ⚠️ QUAN TRỌNG: Mỗi QR code chỉ sử dụng được 1 lần. Không chia sẻ QR code này với người khác.
              </div>
            </div>
            
            {/* ICS Download */}
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <a href="#" onClick={(e) => e.preventDefault()} className="ics-link">📅 Tải lịch (.ics)</a>
            </div>
          </div>
          
          {/* Footer */}
          <div className="footer">
            <img src="/logo.png" alt="Logo" className="footer-logo" />
            <div className="footer-text">
              <strong>EXP Technology Company Limited</strong><br />
              📧 Liên hệ: info@exp.com | 🌐 Website: www.exp.com<br />
              <small>Nếu bạn không thể tham dự, vui lòng từ chối để chúng tôi có thể mời khách khác.</small>
            </div>
          </div>
        </div>
      </div>
    </MeshBackground>
  )
}

export default InvitePage
