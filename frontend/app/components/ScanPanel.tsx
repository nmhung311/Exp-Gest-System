"use client"
import { useState } from "react"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export default function ScanPanel() {
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<string>("")
  const [loading, setLoading] = useState(false)

  async function handleCheckin(){
    if(!token) return
    setLoading(true)
    setStatus("Đang kiểm tra...")
    try{
      const res = await fetch("http://localhost:5001/api/checkin",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({token, gate:"G1", staff:"admin"})
      })
      const data = await res.json()
      if(res.ok){
        setStatus(`✅ ${data?.guest?.name || "Khách"} đã check-in lúc ${data?.time || ""}`)
      }else{
        setStatus(`⚠️ ${data?.message || "Lỗi"}`)
      }
    }catch(e:any){
      setStatus("Lỗi mạng")
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
        <div className="mt-4 flex gap-2">
          <input placeholder="Nhập mã..." value={token} onChange={e=>setToken(e.target.value)} className="flex-1 bg-black/20 border border-white/20 rounded-xl px-3 py-2 outline-none focus:border-blue-400 text-white placeholder-white/50" />
          <Button onClick={handleCheckin} disabled={loading}>{loading?"Đang xử lý...":"Ghi nhận"}</Button>
        </div>
        {status && (
          <div className="mt-4 rounded-xl border border-white/20 px-3 py-2 text-sm text-white bg-black/30">
            {status}
          </div>
        )}
      </div>
    </Card>
  )
}
