"use client"

import Link from "next/link"

export default function AdminLanding() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl shadow-lg overflow-hidden">
            <img src="/logothiep.png" alt="EXP Technology Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">EXP Technology</h1>
          <p className="text-gray-300">Event Management System</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/login" 
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Đăng nhập Admin
          </Link>
          
          <Link 
            href="/register" 
            className="block w-full text-white hover:text-blue-300 font-medium py-3 px-6 transition-colors duration-300"
          >
            Tạo tài khoản mới
          </Link>
        </div>
        
        <div className="mt-8 text-sm text-gray-400">
          <p>Quản lý sự kiện và khách mời</p>
        </div>
      </div>
    </div>
  )
}
