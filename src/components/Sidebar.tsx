'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/tasks', label: 'Task Board', icon: '⬛' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/notes', label: 'Notes & Ideas', icon: '📝' },
  { href: '/docs', label: 'Docs', icon: '📄' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/dashboard/meta-ads', label: 'Meta Ads', icon: '🎯' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/usage', label: 'Usage & Cost', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 240,
      background: '#0D0D0D',
      borderRight: '1px solid #1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', color: '#E53E3E', textTransform: 'uppercase' }}>
          Mission Control
        </div>
        <div style={{ fontSize: 10, color: '#4A5568', marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Straight Point Marketing
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12 }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${active ? 'active' : ''}`}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1A1A1A',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'rgba(229,62,62,0.15)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}>
          🔱
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC' }}>Poseidon</div>
          <div style={{ fontSize: 10, color: '#4A5568' }}>v1.0.0</div>
        </div>
      </div>
    </aside>
  )
}
