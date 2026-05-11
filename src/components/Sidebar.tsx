'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ListChecks, HeartHandshake, Wallet, Users,
  TrendingUp, ClipboardList, Menu,
  type LucideIcon,
} from 'lucide-react'
import { colors } from '@/components/DesignSystem'

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/today', label: 'Tasks', Icon: ListChecks },
  { href: '/client-retention', label: 'Retention', Icon: HeartHandshake },
  { href: '/finances', label: 'Finances', Icon: Wallet },
  { href: '/clients', label: 'Clients', Icon: Users },
  { href: '/growth', label: 'Growth', Icon: TrendingUp },
  { href: '/sops', label: 'SOP', Icon: ClipboardList },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const navLinks = (
    <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {navItems.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '9px 14px', margin: '0 4px', borderRadius: 6,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
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
  )

  const footer = (
    <div style={{ padding: '16px 20px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 32, height: 32, background: 'rgba(56,161,87,0.15)', border: `1px solid rgba(56,161,87,0.25)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        🔱
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>Poseidon</div>
        <div style={{ fontSize: 10, color: colors.textSubtle, letterSpacing: '0.08em' }}>v1.0.0</div>
      </div>
    </div>
  )

  const asideStyle: React.CSSProperties = {
    width: 240,
    background: colors.cardBg,
    borderRight: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  }

  if (isMobile) {
    return (
      <>
        {!mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              position: 'fixed',
              top: 14,
              right: 14,
              zIndex: 120,
              width: 40,
              height: 40,
              background: 'rgba(13,17,23,0.85)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: colors.text,
            }}
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={2} />
          </button>
        )}

        {/* Overlay */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 109,
            }}
          />
        )}

        {/* Slide-in sidebar */}
        <aside
          style={{
            ...asideStyle,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 110,
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            boxShadow: mobileOpen ? '4px 0 40px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: colors.accent, textTransform: 'uppercase' as const }}>
              Mission Control
            </div>
            <div style={{ fontSize: 10, color: colors.textSubtle, marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
              Straight Point Marketing
            </div>
          </div>
          {navLinks}
          {footer}
        </aside>
      </>
    )
  }

  // Desktop — spacer reserves 240px in the flex layout; fixed aside overlays it
  return (
    <>
      <div style={{ width: 240, flexShrink: 0 }} />
      <aside
        style={{
          ...asideStyle,
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', color: colors.accent, textTransform: 'uppercase' as const }}>
            Mission Control
          </div>
          <div style={{ fontSize: 10, color: colors.textSubtle, marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
            Straight Point Marketing
          </div>
        </div>
        {navLinks}
        {footer}
      </aside>
    </>
  )
}
