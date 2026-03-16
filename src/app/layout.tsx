import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'Mission Control | Straight Point Marketing',
  description: 'Poseidon Command Center',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0A' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '240px', padding: '28px', minHeight: '100vh', overflowY: 'auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
