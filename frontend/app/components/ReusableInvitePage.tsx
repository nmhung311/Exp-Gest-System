'use client'

import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import BackgroundGlow from '../_components/BackgroundGlow'

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

interface ReusableInvitePageProps {
  eventData: EventData;
  guestData: GuestData;
  token: string;
  onClose?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

const ReusableInvitePage: React.FC<ReusableInvitePageProps> = ({
  eventData,
  guestData,
  token,
  onClose,
  onAccept,
  onDecline
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [programRows, setProgramRows] = useState<Array<{time: string, item: string}>>([])

  // Parse program outline
  const parseProgramOutline = (src: string | undefined | null): Array<{time: string, item: string}> => {
    if (!src) return []
    try {
      const parsed = JSON.parse(src)
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          time: item.time || '',
          item: item.item || item.description || ''
        }))
      }
    } catch (error) {
      console.error('Error parsing program outline:', error)
    }
    return []
  }

  // Generate QR code
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrToken = token || 'DEMO-TOKEN'
        const qrUrl = await QRCode.toDataURL(qrToken, {
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
        // Fallback QR code
        const fallbackQR = await QRCode.toDataURL('DEMO-TOKEN', {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(fallbackQR)
      }
    }

    generateQRCode()
  }, [token])

  // Parse program outline when eventData changes
  useEffect(() => {
    if (eventData?.program_outline) {
      const parsed = parseProgramOutline(eventData.program_outline)
      setProgramRows(parsed)
    }
  }, [eventData?.program_outline])

  if (!eventData || !guestData) {
    return (
      <>
        <BackgroundGlow />
        <div className="min-h-screen text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Đang tải dữ liệu...</p>
          </div>
        </div>
      </>
    )
  }

  const formattedDate = new Date(eventData.date).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const rsvpDeadline = new Date(eventData.date).toLocaleDateString('vi-VN')

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
          .rsvp-accept { background: #1E88E5; color: #fff; border: none; }
          .rsvp-accept:hover { background: #1976D2; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(30, 136, 229, 0.3); }
          .rsvp-accept:disabled { background: #6B7280; cursor: not-allowed; transform: none; box-shadow: none; }
          .rsvp-accept:disabled:hover { background: #6B7280; transform: none; box-shadow: none; }
          .rsvp-decline { background: #EF4444; color: #fff; border: none; }
          .rsvp-decline:hover { background: #DC2626; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3); }
          .rsvp-decline:disabled { background: #6B7280; cursor: not-allowed; transform: none; box-shadow: none; }
          .rsvp-decline:disabled:hover { background: #6B7280; transform: none; box-shadow: none; }
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
              <img src="/logo.png" alt="Logo" className="logo-image" />
            </div>
            <div className="company-info">
              <div className="company-name">Exp Gest System</div>
              <div className="company-slogan">Hệ thống quản lý sự kiện</div>
              <div className="company-full">Event Management System</div>
            </div>
          </div>

          {/* Main Title */}
          <div className="main-title">
            <h1 className="event-title">{eventData.name}</h1>
            <div className="title-underline"></div>
          </div>

          {/* Invitation Card */}
          <div className="invitation-card">
            <div className="greeting">
              Kính gửi {guestData.title} {guestData.name},
            </div>
            <div className="invitation-text">
              {eventData.description}
            </div>

            {/* Event Details Grid */}
            <div className="details-grid">
              {/* Event Info */}
              <div className="detail-section">
                <h3>
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Thông tin sự kiện
                </h3>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{formattedDate}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{eventData.time}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{eventData.location}</span>
                </div>
                {eventData.venue_address && (
                  <div className="detail-item">
                    <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="detail-text">{eventData.venue_address}</span>
                  </div>
                )}
              </div>

              {/* Guest Info */}
              <div className="detail-section">
                <h3>
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Thông tin khách mời
                </h3>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{guestData.title} {guestData.name}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="detail-text">{guestData.email}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{guestData.role}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  <span className="detail-text">{guestData.organization}</span>
                </div>
              </div>
            </div>

            {/* Program Outline */}
            {programRows.length > 0 && (
              <div className="detail-section">
                <h3>
                  <svg className="detail-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Chương trình
                </h3>
                {programRows.map((row, index) => (
                  <div key={index} className="program-item">
                    <span className="program-time">{row.time}</span>
                    <span className="program-description">{row.item}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Info */}
            {(eventData.dress_code || eventData.venue_map_url) && (
              <div className="additional-info">
                {eventData.dress_code && (
                  <div className="info-item">
                    <strong>Trang phục:</strong> {eventData.dress_code}
                  </div>
                )}
                {eventData.venue_map_url && (
                  <div className="info-item">
                    <strong>Bản đồ:</strong> <a href={eventData.venue_map_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Xem bản đồ</a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RSVP Card */}
          <div className="rsvp-card">
            <h2 className="rsvp-title">Xác nhận tham dự</h2>
            <p className="rsvp-question">
              Vui lòng cho chúng tôi biết bạn có thể tham dự sự kiện không?
            </p>
            <div className="rsvp-buttons">
              <button 
                className="rsvp-button rsvp-accept"
                onClick={onAccept}
                disabled={guestData.rsvp_status === 'accepted' || guestData.rsvp_status === 'declined'}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {guestData.rsvp_status === 'accepted' ? 'Đã xác nhận tham dự' : 'Tôi sẽ tham dự'}
              </button>
              <button 
                className="rsvp-button rsvp-decline"
                onClick={onDecline}
                disabled={guestData.rsvp_status === 'accepted' || guestData.rsvp_status === 'declined'}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {guestData.rsvp_status === 'declined' ? 'Đã từ chối' : 'Không thể tham dự'}
              </button>
            </div>
            <div className="rsvp-deadline">Hạn chót xác nhận: {rsvpDeadline}</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReusableInvitePage
