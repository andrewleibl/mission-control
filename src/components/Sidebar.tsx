'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { colors } from '@/components/DesignSystem'

const navItems = [
  { href: '/tasks', label: 'Task Board', icon: '⬛' },
  { href: '/calendar', label: 'Calendar', icon: '📅' },
  { href: '/client-retention', label: 'Retention', icon: '🤝' },
  { href: '/pipeline', label: 'Pipeline', icon: '🔥' },
  { href: '/finances', label: 'Finances', icon: '💰' },
  { href: '/docs', label: 'Docs', icon: '📄' },
  { href: '/clients', label: 'Clients', icon: '👥' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/usage', label: 'Usage & Cost', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 240,
      background: colors.cardBg,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.18em',
          color: colors.accent,
          textTransform: 'uppercase',
        }}>
          Mission Control
        </div>
        <div style={{
          fontSize: 10,
          color: colors.textSubtle,
          marginTop: 4,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Straight Point Marketing
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '9px 14px',
                margin: '0 4px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                color: active ? colors.text : colors.textMuted,
                background: active ? 'rgba(56,161,87,0.1)' : 'transparent',
                borderLeft: `2px solid ${active ? colors.accent : 'transparent'}`,
                paddingLeft: 12,
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, opacity: active ? 1 : 0.75 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'rgba(56,161,87,0.15)',
          border: `1px solid rgba(56,161,87,0.25)`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
        }}>
          🔱
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Poseidon</div>
          <div style={{ fontSize: 10, color: colors.textSubtle, letterSpacing: '0.08em' }}>v1.0.0</div>
        </div>
      </div>
    </aside>
  )
}
