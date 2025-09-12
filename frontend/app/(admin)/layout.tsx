// @jsxRuntime automatic
import "../globals.css"
import Image from "next/image"
import MeshBackground from "../components/MeshBackground"
const React = {} as any

export default function AdminLayout({children}:{children: any}) {
  return (
    <MeshBackground>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="company-logo relative h-12 w-52 md:h-14 md:w-64 overflow-hidden">
              <Image
                src="/logo.png"
                alt="Company Logo"
                fill
                sizes="(min-width: 768px) 256px, 208px"
                className="object-contain"
                priority
              />
            </div>
          <nav className="flex items-center gap-4 text-sm text-white/70">
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard">Bảng điều khiển</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/guests">Khách mời</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/checkin">Check-in</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/events">Sự kiện</a>
            <a className="hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors" href="/dashboard/stats">Thống kê</a>
          </nav>
        </div>
      </header>
      <main className="w-full px-14 py-8 space-y-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-xs text-white/50">© 2025 EXP Technology Company Limited</footer>
    </MeshBackground>
  )
}
