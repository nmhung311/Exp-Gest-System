"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import MeshBackground from "../../components/MeshBackground"
const React = {} as any

export default function InvitePage() {
  const params = useParams()
  const token = params?.token as string
  const [guest, setGuest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [showChangeConfirm, setShowChangeConfirm] = useState(false)
  const [qrRefreshKey, setQrRefreshKey] = useState(0)

  useEffect(() => {
    if (!token) return
    fetch(`http://localhost:5001/api/qr/validate?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setGuest(data.guest)
          setRsvpStatus(data.guest.rsvp_status)
        } else {
          // Token hết hạn, thử tạo token mới
          if (data.reason === "token expired") {
            setMessage("Token đã hết hạn, đang tạo token mới...")
            setLoading(true)
            createNewToken()
          } else {
            setMessage("Link không hợp lệ")
          }
        }
      })
      .catch(() => setMessage("Lỗi kết nối"))
      .finally(() => setLoading(false))
  }, [token])

  // Poll nhẹ để cập nhật trạng thái check-in nếu khách mở thiệp mời trong lúc lễ diễn ra
  useEffect(() => {
    if (!token) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/qr/validate?token=${token}`)
        if (res.ok) {
          const data = await res.json()
          if (data.valid) {
            setGuest((prev: any) => {
              if (!prev || JSON.stringify(prev) !== JSON.stringify(data.guest)) {
                return data.guest
              }
              return prev
            })
          }
        }
      } catch {}
    }, 10000)
    return () => clearInterval(interval)
  }, [token])

  // SSE realtime: cập nhật ngay khi quét
  useEffect(() => {
    if (!token) return
    let es: EventSource | null = null
    try {
      es = new EventSource(`http://localhost:5001/api/qr/stream?token=${token}`)
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data)
          if (payload?.type === 'checkin') {
            // Sau khi nhận checkin, refetch guest để đồng bộ đầy đủ thông tin
            fetch(`http://localhost:5001/api/qr/validate?token=${token}`)
              .then(r => r.json())
              .then(d => { if (d.valid) setGuest(d.guest) })
              .catch(() => {})
          }
        } catch {}
      }
    } catch {}
    return () => { if (es) es.close() }
  }, [token])

  // Function to create new token for guest
  const createNewToken = async () => {
    try {
      // Gọi API để tạo token mới từ token cũ (nếu có thể)
      const newTokenResponse = await fetch(`http://localhost:5001/api/qr/refresh?token=${token}`, {
        method: 'POST'
      })
      
      if (newTokenResponse.ok) {
        const newTokenData = await newTokenResponse.json()
        setMessage("Đã tạo token mới thành công! Đang chuyển hướng...")
        // Force refresh QR code
        setQrRefreshKey(prev => prev + 1)
        // Redirect đến trang mới với token mới sau 1 giây
        setTimeout(() => {
          window.location.href = `/invite/${newTokenData.token}`
        }, 1000)
      } else {
        setMessage("Token đã hết hạn và không thể làm mới. Vui lòng liên hệ quản trị viên để được cấp link mới.")
        setLoading(false)
      }
    } catch (error) {
      console.error("Error creating new token:", error)
      setMessage("Lỗi khi tạo token mới. Vui lòng thử lại sau.")
      setLoading(false)
    }
  }

  async function handleRsvp(status: string) {
    if (!token) {
      setMessage("Không có token")
      return
    }
    
    setSubmitting(true)
    setMessage("")
    
    try {
      console.log("Sending RSVP request:", { token, status })
      
      const res = await fetch("http://localhost:5001/api/rsvp/respond", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ token, status })
      })
      
      console.log("RSVP response status:", res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error("RSVP error response:", errorText)
        setMessage(`Lỗi server: ${res.status} - ${errorText}`)
        return
      }
      
      const data = await res.json()
      console.log("RSVP success data:", data)
      
      if (data.guest) {
        setGuest(data.guest)
        setRsvpStatus(data.guest.rsvp_status)
        setMessage(`Đã ${status === "accepted" ? "xác nhận tham gia" : "từ chối"} thành công!`)
      } else {
        setMessage("Phản hồi không hợp lệ từ server")
      }
      
    } catch (e: any) {
      console.error("RSVP error:", e)
      setMessage(`Lỗi kết nối: ${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  // Đã loại bỏ chức năng check-in trực tiếp từ thiệp mời

  if (loading) return (
    <MeshBackground>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Đang tải...</p>
        </div>
      </div>
    </MeshBackground>
  )
  
  if (!guest) return (
    <MeshBackground>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 mb-4 flex justify-center">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Lỗi truy cập</h1>
          <p className="text-white/60 mb-4">{message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    </MeshBackground>
  )

  return (
    <MeshBackground>
      <div className="min-h-screen">
        <div className="max-w-2xl mx-auto p-6 space-y-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              {/* Logo công ty */}
              <img
                src="/assets/logo-DytfE-Xm.png"
                alt="Company Logo"
                className="h-16 w-16 object-contain"
              />

              {/* Text bên cạnh */}
              <div>
                <h1 className="text-2xl font-bold text-white">EXP Technology</h1>
                <p className="text-lg text-white/80">15 Years of Excellence</p>
                <p className="text-sm text-white/60">EXP Technology Company Limited</p>
              </div>
            </div>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">{guest?.event?.name || 'Sự kiện'}</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto rounded-full"></div>
          </div>
        </div>

        {guest?.checkin_status !== 'arrived' && (
        <div className="border border-white/20 rounded-xl p-6 space-y-6 bg-black/20 backdrop-blur-sm relative z-0">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">Kính gửi {guest.name}</h2>
            <p className="text-white/80 text-lg">Trân trọng mời quý khách tham dự chương trình</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Thời gian & Địa điểm
              </h3>
              <div className="space-y-2 text-white/80">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{guest?.event?.date} {guest?.event?.time || ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <a
                    href={guest?.event?.venue_map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(guest?.event?.location || 'Địa điểm sự kiện')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-cyan-200 underline decoration-dotted underline-offset-4"
                  >
                    {guest?.event?.location || 'Địa điểm sự kiện'}
                  </a>
                </div>
                {guest?.event?.venue_address && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white/70">{guest.event.venue_address}</span>
                </div>
                )}
                {guest?.event?.dress_code && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/60"></div>
                  <span className="text-white/70">Trang phục: {guest.event.dress_code}</span>
                </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Chương trình
              </h3>
              <div className="relative pl-6 text-sm">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
                {guest?.event?.program_outline ? (
                  (() => {
                    try {
                      const program = JSON.parse(guest.event.program_outline);
                      if (Array.isArray(program) && program.length > 0) {
                        return program.map((item, index) => (
                          <div key={index} className="relative flex items-start gap-3 py-2">
                            <div className="text-cyan-400 w-16 font-medium">{item.time || ''}</div>
                            <div className="text-white/85 flex-1">{item.item || ''}</div>
                          </div>
                        ));
                      }
                    } catch (e) {
                      // Fallback for simple text format
                      if (guest.event.program_outline.includes(';')) {
                        const items = guest.event.program_outline.split(';').filter(item => item.trim());
                        return items.map((item, index) => {
                          const parts = item.split('-');
                          if (parts.length >= 2) {
                            return (
                              <div key={index} className="relative flex items-start gap-3 py-2">
                                <div className="text-cyan-400 w-16 font-medium">{parts[0].trim()}</div>
                                <div className="text-white/85 flex-1">{parts.slice(1).join('-').trim()}</div>
                              </div>
                            );
                          }
                          return null;
                        }).filter(Boolean);
                      }
                    }
                    return (
                      <div className="text-white/60 italic">Chương trình sẽ được cập nhật</div>
                    );
                  })()
                ) : (
                  <div className="text-white/60 italic">Chương trình sẽ được cập nhật</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-white/10">
              
            <p className="text-white/60 text-sm mt-1">
              Vui lòng xác nhận tham dự trước hạn chót
            </p>
          </div>
        </div>
        )}

        {rsvpStatus === "pending" && (
          <div className="border border-white/20 rounded-xl p-8 bg-black/20 backdrop-blur-sm text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Xác nhận tham dự</h3>
            <p className="text-white/60 mb-6">Vui lòng cho chúng tôi biết bạn có thể tham dự sự kiện không?</p>
            {message && (message.includes("chờ phản hồi") || message.includes("chuyển về trạng thái")) && (
              <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-sm">⚠️ Bạn đã thay đổi lựa chọn, vui lòng xác nhận lại</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <button 
                className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 hover:from-emerald-500/30 hover:to-cyan-500/30 hover:border-emerald-300/60 transition-all duration-300 flex items-center justify-center gap-3 font-medium backdrop-blur-sm hover:shadow-lg hover:shadow-emerald-500/20"
                onClick={() => handleRsvp("accepted")}
                disabled={submitting}
              >
                {submitting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{submitting ? "Đang xử lý..." : "Tôi sẽ tham dự"}</span>
              </button>
              <button 
                className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-400/40 text-rose-300 hover:from-rose-500/20 hover:to-red-500/20 hover:border-rose-300/60 transition-all duration-300 flex items-center justify-center gap-3 font-medium backdrop-blur-sm hover:shadow-lg hover:shadow-rose-500/20"
                onClick={() => handleRsvp("declined")}
                disabled={submitting}
              >
                {submitting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{submitting ? "Đang xử lý..." : "Không thể tham dự"}</span>
              </button>
            </div>
            <p className="text-white/50 text-sm mt-4">
              Hạn chót xác nhận: Hạn chót
            </p>
          </div>
        )}

        {rsvpStatus === "accepted" && (
          <div className="border border-green-500/30 rounded-xl p-8 bg-green-500/10 text-center mt-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-green-300 mb-2">
                {guest?.checkin_status === 'arrived'
                  ? `Kính chào ${[guest?.title, guest?.name].filter(Boolean).join(' ')}!`
                  : 'Xác nhận tham dự'}
              </h3>
              <p className="text-white/80">Chúng tôi rất vui mừng được chào đón sự hiện diện của bạn</p>
            </div>
            
            {/* Nội dung trong thẻ lớn: sau khi arrived chỉ giữ icon + lời chào, bỏ thẻ trắng và thẻ xanh nhỏ */}
            {guest?.checkin_status === 'arrived' ? (
              <div className="relative z-10">
                <style jsx global>{`
                  @keyframes ring_expand { 0% { transform: scale(0.9); opacity: .5; } 100% { transform: scale(1.7); opacity: 0; } }
                  @keyframes badge_breathe { 0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16,185,129,.35);} 50% { transform: scale(1.03); box-shadow: 0 0 36px 8px rgba(16,185,129,.18);} }
                  @keyframes check_draw { 0% { stroke-dashoffset: 48; } 100% { stroke-dashoffset: 0; } }
                `}</style>
                <div className="flex items-center justify-center mb-10 mt-12">
                  <div className="relative" style={{ width: 112, height: 112 }}>
                    <span className="absolute inset-0 rounded-full border border-emerald-300/40" style={{ animation: 'ring_expand 1600ms ease-out infinite' }} />
                    <span className="absolute inset-0 rounded-full border border-emerald-300/30" style={{ animation: 'ring_expand 1600ms ease-out infinite', animationDelay: '800ms' }} />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500" style={{ filter: 'blur(20px)', opacity: .18 }} />
                    <div className="relative w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center shadow-inner shadow-black/30" style={{ animation: 'badge_breathe 2000ms ease-in-out infinite' }}>
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 48, strokeDashoffset: 0, animation: 'check_draw 700ms ease-out forwards' }} />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <div className="text-white/70 text-sm leading-relaxed">Chúc bạn có một buổi tối tuyệt vời!</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 mb-6 border border-white/15 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] relative z-10">
              <div className="w-48 h-48 mx-auto bg-white rounded-xl flex items-center justify-center mb-4 p-4 shadow-lg">
                <Image
                  key={qrRefreshKey}
                  src={`http://localhost:5001/api/guests/${guest.id}/qr-image?t=${Date.now()}`}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
                <p className="text-sm text-white/80 mb-2 text-center">Mang mã QR này để check-in tại sự kiện</p>
              <p className="text-xs text-white/60">Mã ID: {token}</p>
            </div>
            )}

            {/* Ẩn các thẻ phụ sau khi đã check-in để giao diện tinh tế hơn */}
            
            
            
            {guest?.checkin_status !== 'arrived' && (
              <div className="mb-4 text-white/70 text-sm text-center">
                Vui lòng mang mã QR này để check-in tại cổng sự kiện.
              </div>
            )}
            
            {guest?.checkin_status !== 'arrived' && (
            <button
              onClick={() => setShowChangeConfirm(true)}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2 mx-auto"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Thay đổi lựa chọn
            </button>
            )}
          </div>
        )}

        {rsvpStatus === "declined" && (
          <div className="border border-red-500/30 rounded-xl p-8 bg-red-500/10 text-center">
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-300 mb-2">Đã ghi nhận phản hồi</h3>
            <p className="text-white/80 mb-4">Chúng tôi rất tiếc vì bạn không thể tham dự sự kiện này</p>
            <p className="text-sm text-white/60 mb-6">Nếu thay đổi ý định, bạn có thể chọn lại ngay bên dưới</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowChangeConfirm(true)}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Thay đổi lựa chọn
              </button>
              
            </div>
          </div>
        )}

        {showChangeConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-md w-full text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Xác nhận thay đổi</h3>
              <p className="text-white/80 mb-6">Bạn có chắc chắn muốn thay đổi lựa chọn RSVP không?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={async () => {
                    setShowChangeConfirm(false)
                    setRsvpStatus("pending")
                    setMessage("Đã chuyển về trạng thái chờ phản hồi. Vui lòng chọn lại.")
                    
                    // Cập nhật trạng thái về pending trên server
                    try {
                      await handleRsvp("pending")
                    } catch (e) {
                      console.error("Error updating status to pending:", e)
                    }
                  }}
                  className="group relative px-6 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
                >
                  Có, thay đổi
                </button>
                <button
                  onClick={() => setShowChangeConfirm(false)}
                  className="group relative px-6 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:from-gray-500/30 hover:to-slate-500/30 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/20"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="border border-white/20 rounded-xl p-4 text-center bg-black/20 backdrop-blur-sm">
            <p className="text-white/80 mb-3">{message}</p>
            {message.includes("Token không hợp lệ") && (
              <button
                onClick={() => window.location.reload()}
                className="group relative px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 hover:border-blue-400/50 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/20"
              >
                Tải lại trang
              </button>
            )}
            {message.includes("hết hạn") && !message.includes("thành công") && (
              <button
                onClick={createNewToken}
                disabled={loading}
                className="group relative px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-green-400 rounded-lg hover:from-green-500/30 hover:to-blue-500/30 hover:border-green-400/50 disabled:from-gray-500/20 disabled:to-gray-600/20 disabled:border-gray-500/30 disabled:text-gray-400 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/20"
              >
                {loading ? "Đang tạo..." : "Làm mới token"}
              </button>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img
              src="/assets/logo-DytfE-Xm.png"
              alt="Company Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="text-white/80 font-medium">EXP Technology Company Limited</span>
          </div>
          <p className="text-white/60 text-sm mb-2">15 Years of Excellence</p>
          <p className="text-white/50 text-xs">
            Thiệp mời điện tử • Mã ID: {token} • Tạo lúc: {new Date().toLocaleString('vi-VN')}
          </p>
        </div>
        </div>
      </div>
    </MeshBackground>
  )
}
