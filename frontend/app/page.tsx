"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import BackgroundOverlay from "./components/BackgroundOverlay"

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('header')) {
          setIsMobileMenuOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <BackgroundOverlay />
      <div className="min-h-screen">
        {/* Header */}
      <header className="relative z-50 px-3 sm:px-6 py-3 sm:py-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg overflow-hidden">
              <img src="/logothiep.png" alt="EXP Technology Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm sm:text-xl font-bold text-white">EXP TECHNOLOGY</span>
              <p className="text-xs text-gray-400">Co., Ltd</p>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">Home</Link>
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">About</Link>
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">Solutions</Link>
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">Projects</Link>
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">Clients</Link>
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">Team</Link>
            <Link href="/" className="text-white hover:text-blue-300 transition-colors">Careers</Link>
          </nav>
          
          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/login" 
              className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              → Sign In
            </Link>
            <div className="flex items-center space-x-2 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              <span className="text-sm">VN</span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
            <nav className="px-3 py-4 space-y-2">
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Solutions
              </Link>
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Projects
              </Link>
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Clients
              </Link>
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Team
              </Link>
              <Link 
                href="/" 
                className="block text-white hover:text-blue-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Careers
              </Link>
              
              {/* Mobile CTA */}
              <div className="pt-4 border-t border-slate-700/50 mt-4">
                <Link 
                  href="/login" 
                  className="block bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 text-center text-sm mb-3"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  → Sign In
                </Link>
                <div className="flex items-center justify-center space-x-2 text-white text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  <span>VN</span>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative px-3 sm:px-6 py-10 sm:py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-6 sm:mb-8">
            <div className="text-center sm:text-left max-w-none">
              <p className="text-gray-400 text-xs sm:text-sm font-medium mb-3 sm:mb-4 tracking-wider uppercase">
                EXP TECHNOLOGY COMPANY LIMITED
              </p>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight">
                <span className="text-blue-400">AI</span>
                <span className="text-white mx-1 sm:mx-4">•</span>
                <span className="text-purple-400">Blockchain</span>
                <span className="text-white mx-1 sm:mx-4">•</span>
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block sm:inline">
                  Digital Solutions
                </span>
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto sm:mx-0 leading-relaxed">
                Pioneering intelligent systems and secure digital platforms for enterprises across Vietnam and beyond.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-row gap-3 sm:gap-6 justify-center mb-12 sm:mb-20">
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-4 px-4 sm:px-8 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 border border-white/20 text-xs sm:text-base flex-1 sm:flex-none text-center"
            >
              Explore Solutions
            </Link>
            <Link 
              href="/" 
              className="text-white hover:text-blue-300 font-medium py-3 sm:py-4 px-4 sm:px-8 transition-colors duration-300 text-xs sm:text-base flex-1 sm:flex-none text-center"
            >
              About Us
            </Link>
          </div>

          {/* Core Business Areas */}
          <div className="mt-12 sm:mt-20">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Core Business Areas</h2>
              <p className="text-sm sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
                Applying modern technology to real-world operations across industries.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* AI Card */}
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">AI</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Artificial Intelligence solutions for automation, machine learning, and intelligent decision making.
                  </p>
                </div>
              </div>

              {/* Blockchain Card */}
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">Blockchain</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Secure, decentralized solutions for digital transactions and smart contracts.
                  </p>
                </div>
              </div>

              {/* E-commerce Card */}
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">E-commerce</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Complete digital commerce solutions for online businesses and marketplaces.
                  </p>
                </div>
              </div>

              {/* Analytics Card */}
              <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg sm:rounded-xl mb-4 sm:mb-6 flex items-center justify-center">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">Analytics</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Data-driven insights and business intelligence for informed decision making.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-12 sm:mt-20 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">Enterprise Solutions</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                AI-powered business automation and blockchain applications designed for enterprise-scale operations.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Machine Learning Models
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Smart Contract Development
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Process Automation
                </li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">Global Support</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                24/7 technical support across Vietnam and beyond with dedicated account management.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 Technical Support
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Dedicated Account Manager
                </li>
                <li className="flex items-center text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Multi-language Support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-slate-900/50 backdrop-blur-sm border-t border-slate-700/50 py-8 sm:py-12 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden">
                  <img src="/logothiep.png" alt="EXP Technology Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-sm sm:text-lg font-bold text-white">EXP TECHNOLOGY</span>
                  <p className="text-xs text-gray-400">Co., Ltd</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 max-w-md">
                Leading provider of AI, Blockchain, and Digital Solutions for enterprises across Vietnam and beyond.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Services</h4>
              <ul className="space-y-1 sm:space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">AI Solutions</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Blockchain</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">E-commerce</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Analytics</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1 sm:space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">About Us</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Team</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Careers</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-4">
              © 2024 EXP Technology Co., Ltd. All rights reserved.
            </p>
            <div className="flex justify-center space-x-4 sm:space-x-6">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}