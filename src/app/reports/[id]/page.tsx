'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Download, Plus, X } from 'lucide-react'
import { getReport, upsertReport, ClientReport, fmtCurrency, fmtNum } from '@/lib/reports-data'
import { loadClients } from '@/lib/clients-data'
import type { Client } from '@/lib/clients-data'

// ── MC design tokens ──────────────────────────────────────────
const C = {
  bg: '#07090D',
  card: '#0D1117',
  cardElevated: '#141B24',
  border: '#1C2534',
  text: '#F0F6FC',
  muted: '#7D8A99',
  accent: '#38A157',
  accentGlow: 'rgba(56,161,87,0.08)',
  red: '#FF7B72',
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>()
  const [report, setReport] = useState<ClientReport | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await getReport(id)
      if (cancelled) return
      setReport(r)
      if (r) {
        const clients = await loadClients()
        if (cancelled) return
        setClient(clients.find(c => c.id === r.clientId) ?? null)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [id])

  const save = useCallback((updated: ClientReport) => {
    setReport(updated)
    upsertReport(updated).catch(err => console.error('Failed to save report', err))
  }, [])

  function field<K extends keyof ClientReport>(key: K, value: ClientReport[K]) {
    if (!report) return
    save({ ...report, [key]: value })
  }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 14 }}>Loading...</div>
  if (!report) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 14 }}>Report not found.</div>

  const isLeadGen = report.reportType === 'lead_gen'
  const weekLabel = `${fmtDate(report.weekStart)} – ${fmtDate(report.weekEnd)}`

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>

      {/* Toolbar — hidden on print */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50, background: C.card, borderBottom: `1px solid ${C.border}`, padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 12, color: C.muted }}>
          {client?.business ?? 'Report'} · {weekLabel}
        </div>
        <button
          onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.accent, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer' }}
        >
          <Download size={14} /> Download PDF
        </button>
      </div>

      {/* Report body */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40, paddingBottom: 24, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.accent, textTransform: 'uppercase', marginBottom: 8 }}>
                {isLeadGen ? 'Lead Generation Report' : 'Sales Campaign Report'}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', marginBottom: 6 }}>
                {client?.business ?? 'Client Report'}
              </div>
              <div style={{ fontSize: 14, color: C.muted }}>Week of {weekLabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Straight Point Marketing</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>andrew@straightpointmarketing.com</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ marginBottom: 40 }}>
          <SectionLabel>Performance This Week</SectionLabel>
          <div className="stat-strip-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <StatCard label="Ad Spend" value={fmtCurrency(report.spend)} onEdit={v => field('spend', parseFloat(v) || undefined)} />
            <StatCard label="Impressions" value={fmtNum(report.impressions)} onEdit={v => field('impressions', parseInt(v) || undefined)} />
            {isLeadGen ? (
              <>
                <StatCard label="Leads" value={fmtNum(report.leads)} onEdit={v => field('leads', parseInt(v) || undefined)} />
                <StatCard label="Cost Per Lead" value={fmtCurrency(report.cpl)} onEdit={v => field('cpl', parseFloat(v) || undefined)} />
              </>
            ) : (
              <>
                <StatCard label="Revenue" value={fmtCurrency(report.revenue)} onEdit={v => field('revenue', parseFloat(v) || undefined)} />
                <StatCard label="ROAS" value={report.roas ? `${report.roas.toFixed(2)}x` : '—'} onEdit={v => field('roas', parseFloat(v) || undefined)} />
              </>
            )}
          </div>
          {isLeadGen ? (
            <div className="stat-strip-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <StatCard label="Reach" value={fmtNum(report.reach)} onEdit={v => field('reach', parseInt(v) || undefined)} />
              <StatCard label="Link Clicks" value={fmtNum(report.clicks)} onEdit={v => field('clicks', parseInt(v) || undefined)} />
              <StatCard label="CTR" value={report.ctr ? `${report.ctr.toFixed(2)}%` : '—'} onEdit={v => field('ctr', parseFloat(v) || undefined)} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 12 }}>
              <StatCard label="Purchases" value={fmtNum(report.purchases)} onEdit={v => field('purchases', parseInt(v) || undefined)} />
              <StatCard label="Cost Per Purchase" value={fmtCurrency(report.costPerPurchase)} onEdit={v => field('costPerPurchase', parseFloat(v) || undefined)} />
            </div>
          )}
        </div>

        {/* Three Q&A sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          <BulletSection
            label="How did last week go?"
            value={report.lastWeekSummary}
            onChange={v => field('lastWeekSummary', v)}
          />
          <BulletSection
            label="What to expect next week"
            value={report.nextWeekOutlook}
            onChange={v => field('nextWeekOutlook', v)}
          />
          <BulletSection
            label="Changes being made to get results"
            value={report.changesBeingMade}
            onChange={v => field('changesBeingMade', v)}
          />
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 20, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
          <span>Prepared by Straight Point Marketing</span>
          <span>Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #111 !important; }
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, onEdit }: { label: string; value: string; onEdit: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  function startEdit() {
    setDraft(value === '—' ? '' : value.replace(/[$,x%]/g, ''))
    setEditing(true)
  }
  function commit() { onEdit(draft); setEditing(false) }

  return (
    <div onClick={!editing ? startEdit : undefined} style={{ padding: '16px', background: C.cardElevated, border: `1px solid ${C.border}`, borderRadius: 10, cursor: editing ? 'default' : 'pointer' }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      {editing ? (
        <input autoFocus type="text" value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit() }}
          style={{ fontSize: 22, fontWeight: 700, color: C.text, background: 'transparent', border: 'none', outline: `1px solid ${C.accent}`, borderRadius: 4, padding: '2px 4px', width: '100%', fontFamily: 'inherit' }}
        />
      ) : (
        <div style={{ fontSize: 22, fontWeight: 700, color: value === '—' ? C.muted : C.text }}>{value}</div>
      )}
    </div>
  )
}

function BulletSection({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Parse stored string into bullet array; delimiter is newline
  const parse = (s: string) => s ? s.split('\n').filter(Boolean) : ['']
  const [bullets, setBullets] = useState<string[]>(parse(value))
  const [editing, setEditing] = useState<number | null>(null)

  useEffect(() => { setBullets(parse(value)) }, [value])

  function save(newBullets: string[]) {
    const cleaned = newBullets.filter(b => b.trim())
    setBullets(cleaned.length ? cleaned : [''])
    onChange(cleaned.join('\n'))
  }

  function updateBullet(i: number, v: string) {
    const next = [...bullets]; next[i] = v; setBullets(next)
  }

  function commitBullet(i: number) {
    save(bullets); setEditing(null)
  }

  function addBullet() {
    const next = [...bullets, '']
    setBullets(next)
    setEditing(next.length - 1)
  }

  function deleteBullet(i: number) {
    const next = bullets.filter((_, idx) => idx !== i)
    save(next.length ? next : [''])
  }

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === 'Enter') { e.preventDefault(); commitBullet(i); addBullet() }
    if (e.key === 'Backspace' && bullets[i] === '' && bullets.length > 1) {
      e.preventDefault(); deleteBullet(i); setEditing(Math.max(0, i - 1))
    }
  }

  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
        {bullets.map((bullet, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < bullets.length - 1 ? 10 : 0 }}>
            <span style={{ color: C.accent, marginTop: 2, flexShrink: 0, fontSize: 16 }}>•</span>
            {editing === i ? (
              <input
                autoFocus
                type="text"
                value={bullet}
                onChange={e => updateBullet(i, e.target.value)}
                onBlur={() => commitBullet(i)}
                onKeyDown={e => handleKeyDown(e, i)}
                placeholder="Type here..."
                style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1px solid ${C.border}`, outline: 'none', color: C.text, fontSize: 14, lineHeight: 1.6, padding: '0 0 2px', fontFamily: 'inherit' }}
              />
            ) : (
              <div
                onClick={() => setEditing(i)}
                style={{ flex: 1, fontSize: 14, color: bullet.trim() ? C.text : C.muted, lineHeight: 1.6, cursor: 'text', minHeight: 22 }}
              >
                {bullet.trim() || 'Click to edit...'}
              </div>
            )}
            {bullets.length > 1 && (
              <button onClick={() => deleteBullet(i)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.5, flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addBullet} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 12, padding: '6px 12px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted }}
        >
          <Plus size={12} /> Add bullet
        </button>
      </div>
    </div>
  )
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
