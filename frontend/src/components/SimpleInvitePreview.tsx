'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import BackgroundGlow from '../_components/BackgroundGlow'

interface SimpleInviteData {
  guest: {
    title: string;
    name: string;
    role: string;
    organization: string;
    tag: string;
  };
  event: {
    title: string;
    subtitle: string;
    host_org: string;
    datetime: string;
    timezone: string;
    venue: {
      name: string;
      address: string;
      map_url: string;
    };
    program_outline: Array<{
      time: string;
      item: string;
    }>;
  };
  rsvp: {
    accept_url: string;
    decline_url: string;
    deadline: string;
  };
  qr: {
    qr_url: string;
    value: string;
  };
  branding: {
    logo_url: string;
    primary_color: string;
    accent_color: string;
  };
}

interface SimpleInvitePreviewProps {
  eventData: any;
  onClose: () => void;
}

export default function SimpleInvitePreview({ eventData, onClose }: SimpleInvitePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  // Copy invite link function
  const copyInviteLink = async () => {
    try {
      const inviteUrl = `${window.location.origin}/invite/demo-token`
      await navigator.clipboard.writeText(inviteUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Error copying invite link:', error)
    }
  }

  // Demo data theo format mới
  const demoData: SimpleInviteData = {
    guest: {
      title: "Mr",
      name: "Nguyễn Cường",
      role: "CEO",
      organization: "Công ty TNHH Dịch vụ và Phát triển Công nghệ Hachitech Solution",
      tag: "Hachitech"
    },
    event: {
      title: "EXP Technology – 15 Years of Excellence",
      subtitle: "Lễ kỷ niệm 15 năm thành lập",
      host_org: "EXP Technology Company Limited",
      datetime: "2025-10-10T18:00:00",
      timezone: "Asia/Ho_Chi_Minh",
      venue: {
        name: "Trung tâm Hội nghị tỉnh Thái Nguyên",
        address: "Số 1 Đường XYZ, TP. Thái Nguyên",
        map_url: "https://maps.example.com/venue"
      },
      program_outline: [
        {"time": "18:00", "item": "Đón khách & Check-in"},
        {"time": "18:30", "item": "Khai mạc"},
        {"time": "19:00", "item": "Vinh danh & Tri ân"},
        {"time": "20:00", "item": "Gala & Networking"}
      ]
    },
    rsvp: {
      accept_url: "https://exp.example.com/rsvp/accept?id=INV123",
      decline_url: "https://exp.example.com/rsvp/decline?id=INV123",
      deadline: "2025-09-30"
    },
    qr: {
      qr_url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=INV123",
      value: "INV123"
    },
    branding: {
      logo_url: "/logo.png",
      primary_color: "#0B2A4A",
      accent_color: "#1E88E5"
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // Generate QR code
    const generateQR = async () => {
      try {
        const qrData = {
          invitation_id: demoData.qr.value,
          event_title: demoData.event.title,
          guest_name: demoData.guest.name,
          rsvp_url: demoData.rsvp.accept_url,
          timestamp: new Date().toISOString()
        }
        
        const qrString = JSON.stringify(qrData)
        const qrUrl = await QRCode.toDataURL(qrString, {
          width: 200,
          margin: 2,
          color: {
            dark: demoData.branding.primary_color,
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error('Error generating QR code:', error)
        setQrCodeUrl(demoData.qr.qr_url)
      }
    }
    
    generateQR()
  }, [])

  if (!mounted) return null

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime)
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const { date: formattedDate, time: formattedTime } = formatDateTime(demoData.event.datetime)

  return (
    <>
      <BackgroundGlow />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-exp-surface border border-exp-border rounded-xl shadow-elevate w-full max-w-2xl max-h-[90vh] overflow-hidden"
          style={{ '--primary-color': demoData.branding.primary_color, '--accent-color': demoData.branding.accent_color } as React.CSSProperties}
        >
        {/* Header */}
        <div className="p-6 text-center text-white bg-gradient-exp border border-exp-border">
          <div className="w-20 h-20 mx-auto mb-4 bg-exp-accent/20 border border-exp-accent/30 rounded-xl flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">{demoData.event.title}</h1>
          <p className="text-lg text-white/80">{demoData.event.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-exp-surface">
          {/* Greeting */}
          <div className="text-center">
            <p className="text-lg text-white">
              Kính gửi <strong className="text-blue-400">{demoData.guest.title} {demoData.guest.name}</strong>,
            </p>
            <p className="text-white/70 mt-2">
              {demoData.guest.role} - {demoData.guest.organization}
            </p>
          </div>

          {/* Event Details */}
          <div className="bg-exp-surface/50 border border-exp-border p-4 rounded-lg shadow-elevate">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-10 h-10 bg-exp-accent/20 border border-exp-accent/30 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-white">
                  <strong className="text-exp-accent text-lg">Thời gian:</strong>
                  <div className="text-white/90 mt-1">{formattedDate} lúc {formattedTime}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-10 h-10 bg-exp-danger/20 border border-exp-danger/30 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-white">
                  <strong className="text-exp-danger text-lg">Địa điểm:</strong>
                  <div className="text-white/90 mt-1">{demoData.event.venue.name}</div>
                  <div className="text-sm text-white/70 mt-1">{demoData.event.venue.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Program Outline */}
          {demoData.event.program_outline.length > 0 && (
            <div className="bg-exp-surface/50 border border-exp-border p-4 rounded-lg shadow-elevate">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <div className="w-8 h-8 bg-exp-accent/20 border border-exp-accent/30 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                Chương trình
              </h3>
              <div className="space-y-3">
                {demoData.event.program_outline.map((item, index) => (
                  <div key={index} className="flex items-center py-3 px-4 bg-exp-surface/30 rounded-lg border border-exp-border backdrop-blur-sm">
                    <div 
                      className="w-16 text-sm font-bold text-exp-accent bg-exp-accent/20 border border-exp-accent/30 px-2 py-1 rounded-lg text-center"
                    >
                      {item.time}
                    </div>
                    <div className="flex-1 ml-4 text-white font-medium">{item.item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RSVP Section */}
          <div className="text-center space-y-6 bg-exp-surface/50 border border-exp-border p-6 rounded-lg shadow-elevate">
            <p className="text-white text-lg">
              <strong className="text-exp-accent">Vui lòng phản hồi trước {demoData.rsvp.deadline}</strong>
            </p>
            <div className="flex gap-4 justify-center">
              <button 
                className="exp-button-primary inline-flex items-center gap-2 hover:transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                onClick={(e) => e.preventDefault()}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Tham dự
              </button>
              <button 
                className="exp-button-secondary inline-flex items-center gap-2 hover:transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                onClick={(e) => e.preventDefault()}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Từ chối
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="text-center bg-exp-surface/50 border border-exp-border p-6 rounded-lg shadow-elevate">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center justify-center">
              <div className="w-8 h-8 bg-exp-accent/20 border border-exp-accent/30 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              VÉ THAM DỰ
            </h3>
            {qrCodeUrl ? (
              <div className="bg-white p-4 rounded-xl inline-block shadow-2xl border border-white/20">
                <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto mb-3 bg-white/20 flex items-center justify-center text-white/70 rounded-xl border-2 border-dashed border-white/30">
                <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            )}
            <p className="text-sm text-red-400 font-bold mt-4 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
              ⚠️ Mỗi QR code chỉ sử dụng được 1 lần
            </p>
            
            {/* Copy Link Button */}
            <div className="mt-6">
              <button 
                onClick={copyInviteLink}
                className="exp-button-secondary inline-flex items-center gap-2 hover:transform hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                {copySuccess ? 'Đã copy!' : 'Copy link thiệp'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-exp-surface/50 border-t border-exp-border p-4 text-center text-sm text-white/70">
          <div className="font-semibold mb-1 text-white">{demoData.event.host_org}</div>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              info@exp.com
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              www.exp.com
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-exp-surface/50 border border-exp-border hover:bg-exp-surface hover:border-exp-accent/50 text-white transition-all duration-300 hover:shadow-lg hover:shadow-exp-accent/20"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        </div>
      </div>
    </>
  )
}
