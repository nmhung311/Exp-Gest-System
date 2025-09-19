"use client"
import React, { useState } from "react"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export default function ScanPanel() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<number>(0)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)
  const [statusType, setStatusType] = useState<'success' | 'warning' | 'error' | 'info'>('info')

  // Function để set status với type và auto-clear
  const setStatusWithType = (message: string, type: 'success' | 'warning' | 'error' | 'info', autoClear: boolean = true) => {
    setStatus(message)
    setStatusType(type)
    
    if (autoClear) {
      // Clear status sau 5 giây
      setTimeout(() => {
        setStatus("")
        setStatusType('info')
      }, 5000)
    }
  }

  // Kiểm tra cooldown
  const checkCooldown = () => {
    const now = Date.now()
    const timeSinceLastScan = now - lastScanTime
    const cooldownTime = 2000 // 3 giây
    
    if (timeSinceLastScan < cooldownTime) {
      const remaining = Math.ceil((cooldownTime - timeSinceLastScan) / 1000)
      setCooldownRemaining(remaining)
      return false
    }
    
    setCooldownRemaining(0)
    return true
  }

  // Effect để cập nhật cooldown timer
  React.useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [cooldownRemaining])

  async function handleCheckin(){
    if(!token) return
    
    // Kiểm tra cooldown
    if (!checkCooldown()) {
      setStatusWithType(`⏳ Vui lòng chờ ${cooldownRemaining} giây trước khi quét tiếp`, 'warning', false)
      return
    }
    
    setLoading(true)
    setStatusWithType("Đang kiểm tra...", 'info', false)
    setLastScanTime(Date.now())
    
    try{
      const res = await fetch("/api/checkin",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({token, gate:"G1", staff:"admin"})
      })
      const data = await res.json()
      console.log('Checkin response:', data)
      console.log('Response status:', res.status)
      console.log('Response ok:', res.ok)
      
      // Xử lý response dựa trên status code
      if (res.status === 409) {
        // Status 409 = Conflict = đã checkin rồi - coi như thành công
        const checkinTime = data?.checked_in_at ? new Date(data.checked_in_at).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : ''
        setStatusWithType(`ℹ️ Khách đã check-in rồi lúc ${checkinTime}`, 'info')
        
        // Clear token
        setToken("")
        
        // Trigger checkin success event để cập nhật danh sách
        const checkinEvent = new CustomEvent('checkin-success', {
          detail: { guestId: null, guestName: 'Guest' }
        })
        window.dispatchEvent(checkinEvent)
        
        // Trigger storage event để cập nhật các trang khác
        localStorage.setItem('exp_guests_updated', Date.now().toString())
        setTimeout(() => {
          localStorage.removeItem('exp_guests_updated')
        }, 100)
        
        // Also send message to parent window if in iframe
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'CHECKIN_SUCCESS',
            guestId: null,
            guestName: 'Guest'
          }, window.location.origin)
        }
      } else if (res.status === 404) {
        setStatusWithType(`❌ Không tìm thấy khách với mã này`, 'error')
      } else if (res.ok) {
        // Response OK - checkin thành công
        if (data?.guest) {
          setStatusWithType(`✅ ${data?.guest?.name || "Khách"} đã check-in thành công lúc ${data?.time || ""}`, 'success')
          
          // Clear token sau khi quét thành công
          setToken("")
          
          // Trigger checkin success event
          const checkinEvent = new CustomEvent('checkin-success', {
            detail: { guestId: data?.guest?.id, guestName: data?.guest?.name }
          })
          window.dispatchEvent(checkinEvent)
          
          // Trigger storage event để cập nhật các trang khác
          localStorage.setItem('exp_guests_updated', Date.now().toString())
          setTimeout(() => {
            localStorage.removeItem('exp_guests_updated')
          }, 100)
          
          // Also send message to parent window if in iframe
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'CHECKIN_SUCCESS',
              guestId: data?.guest?.id,
              guestName: data?.guest?.name
            }, window.location.origin)
          }
        } else {
          // Response OK nhưng không có guest data
          if (data?.message === 'invalid token') {
            setStatusWithType(`❌ Mã QR không hợp lệ`, 'error')
          } else if (data?.message && data.message.includes('success')) {
            setStatusWithType(`✅ Check-in thành công`, 'success')
            setToken("")
            
            // Trigger checkin success event
            const checkinEvent = new CustomEvent('checkin-success', {
              detail: { guestId: null, guestName: 'Guest' }
            })
            window.dispatchEvent(checkinEvent)
            
            // Trigger storage event để cập nhật các trang khác
            localStorage.setItem('exp_guests_updated', Date.now().toString())
            setTimeout(() => {
              localStorage.removeItem('exp_guests_updated')
            }, 100)
            
            // Also send message to parent window if in iframe
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'CHECKIN_SUCCESS',
                guestId: null,
                guestName: 'Guest'
              }, window.location.origin)
            }
          } else {
            setStatusWithType(`✅ Check-in thành công`, 'success')
            setToken("")
            
            // Trigger checkin success event
            const checkinEvent = new CustomEvent('checkin-success', {
              detail: { guestId: null, guestName: 'Guest' }
            })
            window.dispatchEvent(checkinEvent)
            
            // Trigger storage event để cập nhật các trang khác
            localStorage.setItem('exp_guests_updated', Date.now().toString())
            setTimeout(() => {
              localStorage.removeItem('exp_guests_updated')
            }, 100)
            
            // Also send message to parent window if in iframe
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'CHECKIN_SUCCESS',
                guestId: null,
                guestName: 'Guest'
              }, window.location.origin)
            }
          }
        }
      } else {
        // Các lỗi khác
        setStatusWithType(`⚠️ ${data?.message || "Lỗi không xác định"}`, 'error')
      }
    }catch(e:any){
      console.error('Checkin error:', e)
      setStatusWithType("❌ Lỗi mạng", 'error')
    }finally{
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 grid md:grid-cols-[1fr,320px] gap-6 bg-black/20 backdrop-blur-sm border-white/20">
      <div className="aspect-video rounded-xl bg-black/30 border border-white/20 flex items-center justify-center">
        <span className="text-white/60">Camera preview</span>
      </div>
      <div>
        <h3 className="font-semibold text-white">Check-in nhanh</h3>
        <p className="text-sm text-white/60">Quét QR hoặc nhập mã dự phòng.</p>
        {cooldownRemaining > 0 && (
          <div className="mt-2 text-xs text-yellow-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            Cooldown: {cooldownRemaining} giây
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <input 
            placeholder="Nhập mã..." 
            value={token} 
            onChange={e=>setToken(e.target.value)} 
            className="flex-1 bg-black/20 border border-white/20 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-white placeholder-white/50" 
            disabled={loading || cooldownRemaining > 0}
          />
          <Button 
            onClick={handleCheckin} 
            disabled={loading || cooldownRemaining > 0 || !token.trim()}
          >
            {loading ? "Đang xử lý..." : 
             cooldownRemaining > 0 ? `Chờ ${cooldownRemaining}s` : 
             "Ghi nhận"}
          </Button>
        </div>
        {status && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm text-white ${
            statusType === 'success' ? 'border-green-500/50 bg-green-500/10' :
            statusType === 'error' ? 'border-red-500/50 bg-red-500/10' :
            statusType === 'warning' ? 'border-yellow-500/50 bg-yellow-500/10' :
            'border-blue-500/50 bg-blue-500/10'
          }`}>
            {status}
          </div>
        )}
      </div>
    </Card>
  )
}
