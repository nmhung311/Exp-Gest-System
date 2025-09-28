"use client"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Event Management System</h1>
        <p className="text-gray-300">Hệ thống quản lý sự kiện</p>
        <div className="mt-6">
          <a 
            href="/login" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Đăng nhập
          </a>
        </div>
      </div>
    </div>
  )
}