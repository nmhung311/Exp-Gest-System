import './globals.css'
import TokenInitializer from '../components/TokenInitializer'

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
      <body className="min-h-screen" style={{
        background: `
          radial-gradient(60rem 40rem at 30% 75%, rgba(201,92,61,0.55) 0%, rgba(168,63,44,0.38) 35%, transparent 65%),
          radial-gradient(70rem 50rem at 52% 52%, rgba(102,51,153,0.55) 0%, rgba(60,30,78,0.38) 45%, transparent 72%),
          radial-gradient(65rem 45rem at 82% 40%, rgba(18,108,94,0.55) 0%, rgba(11,42,74,0.38) 40%, transparent 70%),
          #0b0f14
        `
      }}>
        <TokenInitializer />
        {children}
      </body>
    </html>
  )
}
