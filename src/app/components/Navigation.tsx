'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/sales', label: 'Sales Pipeline', icon: '📈' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/callers', label: 'Callers', icon: '📞' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>
        <span style={{ fontSize: 20 }}>🔱</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Mission Control</span>
      </div>

      <div style={linksStyle}>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...linkStyle,
                background: isActive ? '#2A2A2A' : 'transparent',
                color: isActive ? '#F7FAFC' : '#718096',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <div style={footerStyle}>
        <div style={{ fontSize: 11, color: '#4A5568' }}>
          Straight Point Marketing
        </div>
        <div style={{ fontSize: 10, color: '#2A2A2A', marginTop: 4 }}>
          v1.0.0
        </div>
      </div>
    </nav>
  )
}

const navStyle: React.CSSProperties = {
  width: 200,
  background: '#0D0D0D',
  borderRight: '1px solid #1A1A1A',
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  padding: '20px 0',
}

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '0 20px',
  marginBottom: 32,
  color: '#F7FAFC',
}

const linksStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '0 12px',
  flex: 1,
}

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'background 0.15s, color 0.15s',
}

const footerStyle: React.CSSProperties = {
  padding: '20px',
  borderTop: '1px solid #1A1A1A',
}
