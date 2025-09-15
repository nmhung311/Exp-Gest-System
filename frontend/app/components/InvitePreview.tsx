'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface InvitePreviewProps {
  eventData: {
    id?: number | string
    name: string
    description?: string
    date: string
    time?: string
    location: string
    venue_address?: string
    venue_map_url?: string
    dress_code?: string
    program_outline?: string
    max_guests?: number
    status?: string
  }
  onClose: () => void
}

export default function InvitePreview({ eventData, onClose }: InvitePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // Demo data for invitation
  const demoData = {
    event: {
      title: eventData.name || 'Demo Event',
      subtitle: eventData.description || 'Sự kiện đặc biệt',
      date: eventData.date ? new Date(eventData.date).toLocaleDateString('vi-VN') : 'Chưa xác định',
      time: eventData.time || '19:00',
      location: eventData.location || 'Tòa nhà EXP Technology',
      venue_address: eventData.venue_address || '123 Lê Lợi, Quận 1, TP.HCM',
      venue_map_url: eventData.venue_map_url || 'https://maps.google.com',
      dress_code: eventData.dress_code || 'Trang phục lịch sự',
      program_outline: eventData.program_outline || JSON.stringify([
        { time: '18:00', item: 'Đón khách' },
        { time: '18:30', item: 'Khai mạc' },
        { time: '19:00', item: 'Tiệc tối' },
        { time: '20:30', item: 'Chương trình văn nghệ' },
        { time: '21:30', item: 'Kết thúc' }
      ]),
      host_org: 'EXP Technology Company Limited'
    },
    guest: {
      title: 'Anh/Chị',
      name: 'Nguyễn Văn A'
    },
    branding: {
      logo_url: '/logo.png',
      primary_color: '#0B2A4A',
      accent_color: '#1E88E5'
    },
    rsvp: {
      deadline: eventData.date ? new Date(eventData.date).toLocaleDateString('vi-VN') : 'Chưa xác định',
      accept_url: '#',
      decline_url: '#'
    }
  }

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = {
          eventId: eventData.id || 'DEMO',
          eventName: eventData.name || 'Demo Event',
          confirmationUrl: `${window.location.origin}/confirm-attendance?event=${eventData.id || 'demo'}`,
          timestamp: new Date().toISOString()
        }
        
        const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 150,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' }
        })
        
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    if (mounted) {
      generateQR()
    }
  }, [eventData, mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Parse program outline
  const parseProgramOutline = (programData: string) => {
    if (!programData) return []
    
    try {
      const parsed = JSON.parse(programData)
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item.time || item.item)
      }
    } catch (e) {
      // Fallback: parse as simple text format
      if (programData.includes(';')) {
        return programData.split(';').filter(item => item.trim()).map(item => {
          const parts = item.split('-')
          if (parts.length >= 2) {
            return {
              time: parts[0].trim(),
              item: parts.slice(1).join('-').trim()
            }
          }
          return { time: '', item: item.trim() }
        })
      }
    }
    
    return []
  }

  const programItems = parseProgramOutline(demoData.event.program_outline)

  if (!mounted) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Xem trước thiệp mời
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invitation Content */}
        <div className="p-0">
          <div className="container" style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,.1)' }}>
            {/* Header */}
            <div className="header" style={{ background: demoData.branding.primary_color, color: '#fff', padding: '30px 20px', textAlign: 'center' }}>
              {demoData.branding.logo_url && (
                <img src={demoData.branding.logo_url} alt="Logo" className="logo" style={{ maxWidth: '120px', height: 'auto', marginBottom: '20px' }} />
              )}
              <h1 className="event-title" style={{ fontSize: '28px', fontWeight: '700', marginBottom: '10px' }}>
                {demoData.event.title}
              </h1>
              {demoData.event.subtitle && (
                <p className="event-subtitle" style={{ fontSize: '18px', opacity: 0.9 }}>
                  {demoData.event.subtitle}
                </p>
              )}
            </div>
            
            {/* Content */}
            <div className="content" style={{ padding: '30px 20px' }}>
              <div className="greeting" style={{ fontSize: '18px', marginBottom: '20px' }}>
                Kính gửi {demoData.guest.title} {demoData.guest.name},
              </div>
              
              <p>Trân trọng kính mời Quý khách tham dự sự kiện đặc biệt:</p>
              
              {/* Event Details */}
              <div className="event-details" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                <div className="detail-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                  <span className="detail-icon" style={{ width: '20px', marginRight: '10px', textAlign: 'center' }}>📅</span>
                  <div className="detail-text" style={{ flex: 1 }}>
                    <strong>Thời gian:</strong> {demoData.event.date} {demoData.event.time}
                  </div>
                </div>
                
                <div className="detail-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                  <span className="detail-icon" style={{ width: '20px', marginRight: '10px', textAlign: 'center' }}>📍</span>
                  <div className="detail-text" style={{ flex: 1 }}>
                    <strong>Địa điểm:</strong> {demoData.event.location}
                  </div>
                </div>
                
                {demoData.event.venue_address && (
                  <div className="detail-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                    <span className="detail-icon" style={{ width: '20px', marginRight: '10px', textAlign: 'center' }}>🏢</span>
                    <div className="detail-text" style={{ flex: 1 }}>
                      <strong>Địa chỉ:</strong> {demoData.event.venue_address}
                      {demoData.event.venue_map_url && (
                        <>
                          <br />
                          <a href={demoData.event.venue_map_url} target="_blank" rel="noopener noreferrer" style={{ color: demoData.branding.accent_color }}>
                            Xem bản đồ
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {demoData.event.dress_code && (
                  <div className="detail-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center' }}>
                    <span className="detail-icon" style={{ width: '20px', marginRight: '10px', textAlign: 'center' }}>👔</span>
                    <div className="detail-text" style={{ flex: 1 }}>
                      <strong>Trang phục:</strong> {demoData.event.dress_code}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Program Outline */}
              {programItems.length > 0 && (
                <div className="program-outline" style={{ margin: '20px 0' }}>
                  <h3 style={{ marginBottom: '15px', color: '#333' }}>Chương trình:</h3>
                  <div id="program-content">
                    {programItems.map((item, index) => (
                      <div key={index} className="program-item" style={{ display: 'flex', marginBottom: '8px', padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <div className="program-time" style={{ fontWeight: '700', width: '60px', color: demoData.branding.accent_color }}>
                          {item.time}
                        </div>
                        <div className="program-description" style={{ flex: 1, marginLeft: '15px' }}>
                          {item.item}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* CTA Section */}
              <div className="cta-section" style={{ textAlign: 'center', margin: '30px 0' }}>
                <p><strong>Vui lòng phản hồi trước {demoData.rsvp.deadline} để chúng tôi chuẩn bị tốt nhất.</strong></p>
                <a href={demoData.rsvp.accept_url} className="cta-button cta-accept" style={{ 
                  display: 'inline-block', 
                  padding: '15px 30px', 
                  margin: '0 10px', 
                  textDecoration: 'none', 
                  borderRadius: '5px', 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  transition: 'all .3s',
                  background: demoData.branding.accent_color,
                  color: '#fff'
                }}>
                  Tham dự
                </a>
                <a href={demoData.rsvp.decline_url} className="cta-button cta-decline" style={{ 
                  display: 'inline-block', 
                  padding: '15px 30px', 
                  margin: '0 10px', 
                  textDecoration: 'none', 
                  borderRadius: '5px', 
                  fontWeight: '700', 
                  fontSize: '16px', 
                  transition: 'all .3s',
                  background: '#6c757d',
                  color: '#fff'
                }}>
                  Từ chối
                </a>
              </div>
              
              {/* QR Ticket Section */}
              <div className="qr-section" style={{ textAlign: 'center', margin: '30px 0', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px', color: '#333' }}>🎫 VÉ THAM DỰ CỦA BẠN</h3>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="qr-code" style={{ maxWidth: '150px', height: 'auto', margin: '15px 0' }} />
                ) : (
                  <div style={{ width: '150px', height: '150px', background: '#f0f0f0', margin: '15px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center', color: '#666' }}>
                      <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                      Đang tạo QR...
                    </div>
                  </div>
                )}
                <div className="qr-warning" style={{ color: '#dc3545', fontSize: '14px', fontWeight: '700', marginTop: '10px' }}>
                  ⚠️ QUAN TRỌNG: Mỗi QR code chỉ sử dụng được 1 lần. Không chia sẻ QR code này với người khác.
                </div>
              </div>
              
              {/* ICS Download */}
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <a href={`/events/${demoData.event.title}/ics`} className="ics-link" style={{ 
                  display: 'inline-block', 
                  marginTop: '15px', 
                  padding: '8px 16px', 
                  background: demoData.branding.primary_color, 
                  color: '#fff', 
                  textDecoration: 'none', 
                  borderRadius: '4px', 
                  fontSize: '14px' 
                }}>
                  📅 Tải lịch (.ics)
                </a>
              </div>
            </div>
            
            {/* Footer */}
            <div className="footer" style={{ background: '#f8f9fa', padding: '20px', textAlign: 'center', borderTop: '1px solid #dee2e6' }}>
              {demoData.branding.logo_url && (
                <img src={demoData.branding.logo_url} alt="Logo" className="footer-logo" style={{ maxWidth: '80px', height: 'auto', marginBottom: '10px' }} />
              )}
              <div className="footer-text" style={{ fontSize: '14px', color: '#6c757d' }}>
                <strong>{demoData.event.host_org}</strong><br />
                📧 Liên hệ: info@exp.com | 🌐 Website: www.exp.com<br />
                <small>Nếu bạn không thể tham dự, vui lòng từ chối để chúng tôi có thể mời khách khác.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
