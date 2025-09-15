import "./globals.css"

export const metadata = { 
  title: "EXP Technology Co., Ltd | AI • Blockchain • Digital Solutions",
  description: "EXP Technology — AI, Blockchain, Automation, Fintech and digital solutions. Together we stand.",
  author: "EXP Technology",
  themeColor: "#0f172a",
  openGraph: {
    title: "EXP Technology Co., Ltd | AI • Blockchain • Digital Solutions",
    description: "EXP Technology — AI, Blockchain, Automation, Fintech and digital solutions. Together we stand.",
    type: "website",
    image: "/images/exp-logo.png",
  },
  twitter: {
    card: "summary_large_image",
    image: "/images/exp-logo.png",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <head>
        <meta name="theme-color" content="#0f172a" />
              <link rel="icon" href="/favicon.ico" />
              <link rel="icon" type="image/svg+xml" href="/exp-logo.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen relative overflow-x-hidden text-white font-sans">
        {children}
      </body>
    </html>
  )
}


