"use client"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EXP</span>
            </div>
            <span className="text-lg font-bold text-white">TECHNOLOGY</span>
          </div>
          
          {/* Login Button */}
          <Link 
            href="/login" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-400 text-sm mb-4">EXP TECHNOLOGY COMPANY LIMITED</p>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            AI • Blockchain • Digital Solutions
          </h1>
          
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Pioneering intelligent systems and secure digital platforms for enterprises across Vietnam and beyond.
          </p>
          
          <div className="flex justify-center mb-16">
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors"
            >
              Đăng nhập hệ thống
            </Link>
          </div>
          
          {/* Core Business Areas */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">Core Business Areas</h2>
            <p className="text-lg text-gray-300 mb-12">
              Applying modern technology to real-world operations across industries.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
