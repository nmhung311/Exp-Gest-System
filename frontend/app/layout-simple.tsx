import React from 'react'

export const metadata = { 
  title: "EXP Technology Co., Ltd | AI • Blockchain • Digital Solutions",
  description: "EXP Technology — AI, Blockchain, Automation, Fintech and digital solutions. Together we stand.",
  author: "EXP Technology",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ color: '#0B2A4A', textAlign: 'center' }}>
            EXP Technology Co., Ltd
          </h1>
          <p style={{ textAlign: 'center', color: '#666' }}>
            AI • Blockchain • Digital Solutions
          </p>
          {children}
        </div>
      </body>
    </html>
  )
}
