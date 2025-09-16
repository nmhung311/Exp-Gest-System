'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

// SVG Icons
const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const LocationIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BuildingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const QRIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
)

const CloseIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const StarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const GiftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
)

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
  guestData?: {
    title: string
    name: string
    role?: string
    organization?: string
    tag?: string
  }
  onClose: () => void
}

export default function InvitePreview({ eventData, guestData, onClose }: InvitePreviewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // Demo data for invitation based on new structure
  const demoData = {
    guest: {
      title: guestData?.title || 'Mr',
      name: guestData?.name || 'Nguyễn Cường',
      role: guestData?.role || 'CEO',
      organization: guestData?.organization || 'Công ty TNHH Dịch vụ và Phát triển Công nghệ Hachitech Solution',
      tag: guestData?.tag || 'Hachitech'
    },
    event: {
      title: eventData.name || 'EXP Technology – 15 Years of Excellence',
      subtitle: eventData.description || 'Lễ kỷ niệm 15 năm thành lập',
      host_org: 'EXP Technology Company Limited',
      datetime: eventData.date ? new Date(eventData.date).toISOString() : '2025-10-10T18:00:00',
      timezone: 'Asia/Ho_Chi_Minh',
      venue: {
        name: eventData.location || 'Trung tâm Hội nghị tỉnh Thái Nguyên',
        address: eventData.venue_address || 'Số 1 Đường XYZ, TP. Thái Nguyên',
        map_url: eventData.venue_map_url || 'https://maps.example.com/venue'
      },
      program_outline: eventData.program_outline ? JSON.parse(eventData.program_outline) : [
        { time: '18:00', item: 'Đón khách & Check-in' },
        { time: '18:30', item: 'Khai mạc' },
        { time: '19:00', item: 'Vinh danh & Tri ân' },
        { time: '20:00', item: 'Gala & Networking' }
      ]
    },
    rsvp: {
      accept_url: `https://exp.example.com/rsvp/accept?id=${eventData.id || 'INV123'}`,
      decline_url: `https://exp.example.com/rsvp/decline?id=${eventData.id || 'INV123'}`,
      deadline: eventData.date ? new Date(eventData.date).toLocaleDateString('vi-VN') : '30/09/2025'
    },
    qr: {
      qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${eventData.id || 'INV123'}`,
      value: eventData.id || 'INV123'
    },
    branding: {
      logo_url: '/thiepmoi/logo.png',
      logo_alt_url: '/thiepmoi/logo 2.png',
      banner_url: '/thiepmoi/banner.png',
      backdrop_url: '/thiepmoi/back drop.png',
      wall_url: '/thiepmoi/wall.png',
      rv_url: '/thiepmoi/rv copy.png',
      avatar_url: '/thiepmoi/avatar.jpg',
      thiep_artboards: [
        '/thiepmoi/Thiep/Artboard 1.png',
        '/thiepmoi/Thiep/Artboard 2.png',
        '/thiepmoi/Thiep/Artboard 3.png',
        '/thiepmoi/Thiep/Artboard 4.png'
      ],
      primary_color: '#0B2A4A',
      accent_color: '#1E88E5'
    },
    meta: {
      invitation_id: eventData.id || 'INV123',
      created_at: new Date().toISOString(),
      notes: 'Mẫu thử nghiệm'
    }
  }

  // Generate QR code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = {
          invitation_id: demoData.meta.invitation_id,
          guest_name: demoData.guest.name,
          event_title: demoData.event.title,
          event_datetime: demoData.event.datetime,
          rsvp_url: demoData.rsvp.accept_url,
          timestamp: new Date().toISOString()
        }
        
        const qrUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
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
      }
    }

    if (mounted) {
      generateQR()
    }
  }, [mounted])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Format datetime for display
  const formatDateTime = (datetime: string, timezone: string) => {
    try {
      const date = new Date(datetime)
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
      }
      return date.toLocaleDateString('vi-VN', options)
    } catch (error) {
      return datetime
    }
  }

  const programItems = Array.isArray(demoData.event.program_outline) 
    ? demoData.event.program_outline 
    : []

  if (!mounted) return null

  return (
    <div className="fixed inset-0 bg-exp-bg z-50 flex items-center justify-center p-4">
      {/* Main invitation card */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="bg-exp-surface border border-exp-border rounded-xl overflow-hidden shadow-elevate">
          {/* Header with system theme */}
          <div className="relative bg-gradient-exp px-8 py-12 text-center text-white">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-300"
            >
              <CloseIcon className="w-5 h-5 text-white" />
            </button>
            
            {/* Logo */}
            <div className="mb-8">
              <img 
                src="/thiepmoi/logo 2.png" 
                alt="Logo" 
                className="h-20 w-auto mx-auto drop-shadow-lg"
              />
            </div>
            
            {/* Event title */}
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-lg mb-6">
                <GiftIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold tracking-wider uppercase">Thiệp mời</span>
              </div>
              <h1 className="exp-heading-1 mb-4">
                {demoData.event.title}
              </h1>
              {demoData.event.subtitle && (
                <p className="exp-body-large">
                  {demoData.event.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 py-12">
            {/* Guest Information Card */}
            <div className="mb-8">
              <div className="exp-card">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-exp-accent rounded-lg flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="exp-heading-3 mb-4">
                      Kính gửi {demoData.guest.title} {demoData.guest.name}
                    </h2>
                    <div className="space-y-3">
                      {demoData.guest.role && (
                        <div className="flex items-center space-x-3">
                          <BuildingIcon className="w-5 h-5 text-exp-accent" />
                          <p className="exp-body-medium">
                            <span className="font-semibold exp-text-primary">Chức vụ:</span> {demoData.guest.role}
                          </p>
                        </div>
                      )}
                      {demoData.guest.organization && (
                        <div className="flex items-center space-x-3">
                          <BuildingIcon className="w-5 h-5 text-exp-muted" />
                          <p className="exp-body-medium">
                            <span className="font-semibold exp-text-primary">Tổ chức:</span> {demoData.guest.organization}
                          </p>
                        </div>
                      )}
                      {demoData.guest.tag && (
                        <div className="mt-4">
                          <span className="inline-flex items-center px-4 py-2 bg-exp-accent/10 text-exp-accent rounded-lg text-sm font-semibold">
                            <StarIcon className="w-4 h-4 mr-2" />
                            {demoData.guest.tag}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="exp-heading-2 mb-4">
                  Thông tin sự kiện
                </h3>
                <div className="w-16 h-1 bg-exp-accent mx-auto rounded-full"></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Date & Time Card */}
                <div className="exp-card">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-exp-accent rounded-lg flex items-center justify-center mr-4">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="exp-heading-4">Thời gian</h4>
                  </div>
                  <div className="pl-16">
                    <p className="exp-body-medium font-medium leading-relaxed">
                      {formatDateTime(demoData.event.datetime, demoData.event.timezone)}
                    </p>
                    <div className="mt-3 flex items-center exp-body-small">
                      <ClockIcon className="w-4 h-4 mr-2 text-exp-muted" />
                      Múi giờ: {demoData.event.timezone}
                    </div>
                  </div>
                </div>

                {/* Venue Card */}
                <div className="exp-card">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-exp-success rounded-lg flex items-center justify-center mr-4">
                      <LocationIcon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="exp-heading-4">Địa điểm</h4>
                  </div>
                  <div className="pl-16">
                    <p className="exp-body-medium font-medium mb-2">
                      {demoData.event.venue.name}
                    </p>
                    <p className="exp-body-small mb-4">
                      {demoData.event.venue.address}
                    </p>
                    {demoData.event.venue.map_url && (
                      <a 
                        href={demoData.event.venue.map_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="exp-button-primary inline-flex items-center"
                      >
                        <LocationIcon className="w-4 h-4 mr-2" />
                        Xem bản đồ
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Program Outline */}
            {programItems.length > 0 && (
              <div className="mb-8">
                <div className="text-center mb-6">
                  <h3 className="exp-heading-2 mb-4">
                    Chương trình
                  </h3>
                  <div className="w-16 h-1 bg-exp-accent mx-auto rounded-full"></div>
                </div>
                
                <div className="space-y-4">
                  {programItems.map((item, index) => (
                    <div key={index} className="exp-card">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-exp-accent rounded-lg flex items-center justify-center mr-4">
                          <ClockIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="exp-body-medium font-bold text-exp-accent">
                              {item.time}
                            </span>
                            <div className="w-2 h-2 bg-exp-accent rounded-full"></div>
                          </div>
                          <p className="exp-body-medium font-medium mt-1">
                            {item.item}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RSVP Section */}
            <div className="mb-8 text-center">
              <div className="exp-card">
                <div className="mb-6">
                  <h3 className="exp-heading-3 mb-4">
                    Xác nhận tham dự
                  </h3>
                  <div className="w-16 h-1 bg-exp-accent mx-auto rounded-full mb-4"></div>
                  <p className="exp-body-medium">
                    Vui lòng phản hồi trước <span className="font-bold text-exp-accent">{demoData.rsvp.deadline}</span> để chúng tôi chuẩn bị tốt nhất.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href={demoData.rsvp.accept_url}
                    className="exp-button-primary inline-flex items-center"
                  >
                    <StarIcon className="w-5 h-5 mr-2" />
                    Tham dự
                  </a>
                  <a 
                    href={demoData.rsvp.decline_url}
                    className="exp-button-secondary inline-flex items-center"
                  >
                    <CloseIcon className="w-5 h-5 mr-2" />
                    Từ chối
                  </a>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mb-8">
              <div className="bg-exp-primary rounded-xl p-8 text-center text-white">
                <div className="mb-6">
                  <h3 className="exp-heading-3 mb-4">
                    Vé tham dự của bạn
                  </h3>
                  <div className="w-16 h-1 bg-exp-accent mx-auto rounded-full"></div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-6 inline-block border border-white/20">
                  {qrCodeUrl ? (
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto drop-shadow-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-white/20 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
                        <p className="font-semibold">Đang tạo QR...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-exp-danger/20 border border-exp-danger/50 rounded-lg">
                  <p className="text-red-200 font-bold">
                    ⚠️ QUAN TRỌNG: Mỗi QR code chỉ sử dụng được 1 lần. Không chia sẻ QR code này với người khác.
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar Download */}
            <div className="text-center mb-8">
              <a 
                href={`/events/${demoData.event.title}/ics`}
                className="exp-button-primary inline-flex items-center"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Tải lịch (.ics)
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-exp-surface border-t border-exp-border px-8 py-8">
            <div className="text-center">
              <div className="exp-text-secondary">
                <p className="exp-heading-4 mb-4">{demoData.event.host_org}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 exp-body-small">
                  <div className="flex items-center space-x-2">
                    <GiftIcon className="w-4 h-4" />
                    <span>info@exp.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StarIcon className="w-4 h-4" />
                    <span>www.exp.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span>+84 123 456 789</span>
                  </div>
                </div>
                <p className="exp-body-small mt-4 max-w-2xl mx-auto leading-relaxed">
                  Nếu bạn không thể tham dự, vui lòng từ chối để chúng tôi có thể mời khách khác.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
