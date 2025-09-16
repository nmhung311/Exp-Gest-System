'use client'

import React from 'react'

export default function ScrollbarDemo() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Demo Custom Scrollbar
        </h1>
        
        {/* Demo 1: Vertical Scroll */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Vertical Scroll</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-64 overflow-y-auto scrollbar-glass">
            <div className="space-y-4">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="bg-gray-700 p-3 rounded-lg">
                  <h3 className="text-white font-medium">Item {i + 1}</h3>
                  <p className="text-gray-300 text-sm">
                    Đây là nội dung mẫu để demo scrollbar dọc. Scrollbar sẽ có thiết kế gradient đẹp mắt.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo 2: Horizontal Scroll */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Horizontal Scroll</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-x-auto scrollbar-glass">
            <div className="flex space-x-4 min-w-max">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="bg-gray-700 p-4 rounded-lg min-w-[200px] flex-shrink-0">
                  <h3 className="text-white font-medium">Card {i + 1}</h3>
                  <p className="text-gray-300 text-sm">Nội dung card ngang</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo 3: Thin Scrollbar */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Thin Scrollbar</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-48 overflow-y-auto scrollbar-thin">
            <div className="space-y-3">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded">
                  <span className="text-white text-sm">Thin scrollbar item {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo 4: Thick Scrollbar */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Thick Scrollbar</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-48 overflow-y-auto scrollbar-thick">
            <div className="space-y-3">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded">
                  <span className="text-white text-sm">Thick scrollbar item {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo 5: No Scrollbar */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Hidden Scrollbar</h2>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-48 overflow-y-auto scrollbar-none">
            <div className="space-y-3">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="bg-gray-700 p-2 rounded">
                  <span className="text-white text-sm">Hidden scrollbar item {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo 6: Glass Effect */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Glass Effect Scrollbar</h2>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-white/20 rounded-lg p-4 h-48 overflow-y-auto scrollbar-glass">
            <div className="space-y-3">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm p-2 rounded border border-white/20">
                  <span className="text-white text-sm">Glass scrollbar item {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-gray-400 text-sm">
          <p>Cuộn để xem các loại scrollbar khác nhau</p>
        </div>
      </div>
    </div>
  )
}
