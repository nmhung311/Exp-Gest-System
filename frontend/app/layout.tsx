import "./globals.css"
const React = {} as any

export const metadata = { title: "EXP Guest System" }

export default function RootLayout({children}:{children:any}){
  return (
    <html lang="vi">
      <body className="min-h-dvh" style={{background:"var(--bg)", color:"#E6EDF6"}}>
        {children}
      </body>
    </html>
  )
}


