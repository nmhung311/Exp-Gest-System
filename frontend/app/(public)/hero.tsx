import Image from "next/image"
const React = {} as any

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/20 backdrop-blur-sm">
      <div className="relative px-6 py-16 md:px-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 p-1">
            <div className="relative h-full w-full rounded-full bg-black overflow-hidden">
              <Image 
                src="/logo cong ty.png"
                alt="EXP Logo" 
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <p className="text-sm text-white/80">EXP TECHNOLOGY COMPANY LIMITED</p>
            <p className="text-xs text-white/60">AI • Blockchain • Digital Solutions</p>
          </div>
        </div>
        <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight">Lễ kỷ niệm 15 năm thành lập</h1>
        <p className="mt-4 max-w-xl text-white/80">Hệ thống quản lý khách mời thông minh với RSVP, QR Code, Check-in và thống kê chi tiết.</p>
        <div className="mt-6 flex gap-4">
          <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">
            Xem thông tin sự kiện
          </button>
          <button className="px-6 py-3 text-white hover:text-white/80 transition-colors">
            Liên hệ ban tổ chức →
          </button>
        </div>
      </div>
    </section>
  )
}
