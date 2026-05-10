'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .sidebar { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-nav { display: none !important; }
        }
      `}</style>
      <div style={{ display: 'flex' }}>
        <div className="sidebar">
          <Sidebar />
        </div>
        <main 
          className="main-content" 
          style={{
            marginLeft: 220,
            flex: 1,
            minWidth: 0,
            width: '100%'
          }}
        >
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  )
}

function MobileNav() {
  const navItems = [
    { href: '/pipeline', label: 'Pipeline', icon: '🔥' },
    { href: '/pipeline/admin', label: 'Admin', icon: '⚙️' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]
  
  return (
    <nav className="mobile-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0D0D0D',
      borderTop: '1px solid #1A1A1A',
      padding: '8px 16px',
      display: 'none',
      justifyContent: 'space-around',
      zIndex: 100,
    }}>
      {navItems.map((item) => (
        <a key={item.href} href={item.href} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          textDecoration: 'none',
          color: '#718096',
          fontSize: 11,
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  )
}
