"use client"
import MeshBackground from "./components/MeshBackground"
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
const React = {} as any

export default function Page(){
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  function onSubmit(e: FormEvent){
    e.preventDefault()
    setError("")
    // Đăng nhập đơn giản: cho qua nếu có nhập đủ 2 trường
    if (!username || !password){
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu")
      return
    }
    // Lưu flag đơn giản để lần sau tự vào
    try {
      localStorage.setItem("exp_logged_in", "1")
    } catch {}
    router.push("/dashboard")
  }

  return (
    <div className="root">
      <div className="left">
        {/* Logo and Company Name */}
        <div className="flex items-center gap-4 mb-8">
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 p-0.5">
            <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-xl" style={{fontFamily: 'JetBrains Mono, monospace'}}>EXP</span>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              EXP TECHNOLOGY
            </h1>
            <p className="text-slate-300 text-sm" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Company Limited
            </p>
          </div>
        </div>

        {/* Welcome Message */}
        <h2 className="text-2xl xl:text-3xl font-bold text-white mb-4 leading-tight" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
          Chào mừng đến với<br className="hidden xl:block" />
          <span className="text-blue-400">EXP Technology</span>
        </h2>
        
        <p className="text-slate-200 text-lg mb-8 leading-relaxed" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
          Truy cập tài khoản để quản lý AI, Blockchain và Giải pháp số cho doanh nghiệp của bạn.
        </p>

        {/* Features */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-1" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Giải pháp doanh nghiệp
              </h3>
              <p className="text-slate-200" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Tự động hóa kinh doanh bằng AI và ứng dụng blockchain
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-1" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Truy cập an toàn
              </h3>
              <p className="text-slate-200" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Bảo mật cấp độ ngân hàng với xác thực đa yếu tố
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-1" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Hỗ trợ toàn cầu
              </h3>
              <p className="text-slate-200" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
                Hỗ trợ kỹ thuật 24/7 tại Việt Nam và khu vực
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Chào mừng trở lại
          </h2>
          <p className="text-slate-200" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            Nhập thông tin đăng nhập để truy cập tài khoản
          </p>
        </div>

        <form onSubmit={onSubmit} className="form">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập email của bạn"
                className="input w-full pl-10 pr-3 py-3"
                style={{fontFamily: 'JetBrains Mono, monospace'}}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-white mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu của bạn"
                className="input w-full pl-10 pr-10 py-3"
                style={{fontFamily: 'JetBrains Mono, monospace'}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-slate-400 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Quên mật khẩu?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3" style={{fontFamily: 'JetBrains Mono, monospace'}}>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            style={{fontFamily: 'Space Grotesk, sans-serif'}}
          >
            Đăng nhập
          </button>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-slate-200" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Chưa có tài khoản?{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Đăng ký
              </a>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-300 text-sm mb-2" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
            © 2024 EXP Technology Co., Ltd. All rights reserved.
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <a href="#" className="text-slate-300 hover:text-slate-200 transition-colors" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Chính sách bảo mật
            </a>
            <span className="text-slate-400">•</span>
            <a href="#" className="text-slate-300 hover:text-slate-200 transition-colors" style={{fontFamily: 'Space Grotesk, sans-serif'}}>
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


