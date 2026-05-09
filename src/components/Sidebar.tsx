'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar as CalendarIcon, HeartHandshake, Wallet, Users,
  TrendingUp, ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { colors } from '@/components/DesignSystem'

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { href: '/client-retention', label: 'Retention', Icon: HeartHandshake },
  { href: '/finances', label: 'Finances', Icon: Wallet },
  { href: '/clients', label: 'Clients', Icon: Users },
  { href: '/growth', label: 'Growth', Icon: TrendingUp },
  { href: '/sops', label: 'SOP', Icon: ClipboardList },
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
      fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
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
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
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
              <Icon size={15} strokeWidth={1.85} color={active ? colors.accent : colors.textMuted} />
              <span>{label}</span>
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
