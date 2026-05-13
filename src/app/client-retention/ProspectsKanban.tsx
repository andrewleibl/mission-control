'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ExternalLink, ChevronRight } from 'lucide-react'
import { colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'

// ─── Types ─────────────────────────────────────────────────────────

export type ProspectStage = 'applied' | 'booked' | 'met' | 'proposal' | 'closed' | 'lost'

export type Prospect = {
  id: string
  createdAt: number
  stage: ProspectStage
  businessName: string
  ownerName: string
  service: string
  location: string
  revenue: string
  adSpend: string
  lookingFor: string
  timeline: string
  email: string
  phone: string
  website?: string
  notes?: string
  ghlUrl?: string
}

const STORAGE_KEY = 'mc_prospects'

const STAGES: { key: ProspectStage; label: string; color: string }[] = [
  { key: 'applied',  label: 'Applied',       color: colors.textMuted },
  { key: 'booked',   label: 'Call Booked',   color: colors.blue },
  { key: 'met',      label: 'Met',           color: colors.purple },
  { key: 'proposal', label: 'Proposal Sent', color: colors.yellow },
  { key: 'closed',   label: 'Closed',        color: colors.accent },
  { key: 'lost',     label: 'Lost',          color: colors.red },
]

const BLANK: Omit<Prospect, 'id' | 'createdAt' | 'stage'> = {
  businessName: '', ownerName: '', service: '', location: '',
  revenue: '', adSpend: '', lookingFor: '', timeline: '',
  email: '', phone: '', website: '', notes: '', ghlUrl: '',
}

// ─── Storage ────────────────────────────────────────────────────────

function loadProspects(): Prospect[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveProspects(list: Prospect[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// ─── Days in stage ──────────────────────────────────────────────────

function daysAgo(ts: number) {
  return Math.floor((Date.now() - ts) / 86_400_000)
}

// ─── Prospect card ──────────────────────────────────────────────────

function ProspectCard({ p, onClick }: { p: Prospect; onClick: () => void }) {
  const days = daysAgo(p.createdAt)
  const stage = STAGES.find(s => s.key === p.stage)!
  const stale = p.stage !== 'closed' && p.stage !== 'lost' && days > 7

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '12px 14px',
        background: colors.cardBgElevated, border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${stage.color}`,
        borderRadius: borders.radius.medium,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={e => (e.currentTarget.style.background = colors.cardBgElevated)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>
          {p.businessName}
        </div>
        <span style={{
          ...mono, fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
          color: stale ? colors.red : colors.textMuted, letterSpacing: '0.06em',
        }}>
          {days === 0 ? 'today' : `${days}d`}
        </span>
      </div>
      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>
        {p.service} · {p.location}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <Chip label={p.revenue} color={colors.accent} />
        <Chip label={p.lookingFor} color={colors.blue} />
      </div>
    </button>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  if (!label) return null
  return (
    <span style={{
      ...mono, fontSize: 9, fontWeight: 700, padding: '2px 6px',
      borderRadius: 4, letterSpacing: '0.05em',
      color, background: `${color}18`, border: `1px solid ${color}30`,
    }}>
      {label.toUpperCase()}
    </span>
  )
}

// ─── Add / Edit modal ───────────────────────────────────────────────

function ProspectModal({
  existing, onClose, onSave, onDelete,
}: {
  existing?: Prospect
  onClose: () => void
  onSave: (data: Omit<Prospect, 'id' | 'createdAt'>) => void
  onDelete?: () => void
}) {
  const [stage, setStage] = useState<ProspectStage>(existing?.stage ?? 'applied')
  const [form, setForm] = useState(existing ? {
    businessName: existing.businessName, ownerName: existing.ownerName,
    service: existing.service, location: existing.location,
    revenue: existing.revenue, adSpend: existing.adSpend,
    lookingFor: existing.lookingFor, timeline: existing.timeline,
    email: existing.email, phone: existing.phone,
    website: existing.website ?? '', notes: existing.notes ?? '',
    ghlUrl: existing.ghlUrl ?? '',
  } : { ...BLANK })

  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function save() {
    if (!form.businessName.trim()) return
    onSave({ stage, ...form })
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '9px 11px',
    color: colors.text, fontSize: 13, outline: 'none', width: '100%',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    ...mono, fontSize: 10, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 5,
  }
  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ ...cardStyle, width: 500, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
            {existing ? 'Edit Prospect' : 'Add Prospect'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {/* Stage picker */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Stage</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {STAGES.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStage(s.key)}
                style={{
                  padding: '7px 4px', borderRadius: borders.radius.medium,
                  border: `1px solid ${stage === s.key ? s.color : colors.border}`,
                  background: stage === s.key ? `${s.color}18` : 'transparent',
                  color: stage === s.key ? s.color : colors.textMuted,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Business name *</label>
              <input autoFocus placeholder="Smith's Roofing" value={form.businessName} onChange={set('businessName')} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Owner name</label>
              <input placeholder="Joe Smith" value={form.ownerName} onChange={set('ownerName')} style={inputStyle} />
            </div>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Service</label>
              <input placeholder="Roofing" value={form.service} onChange={set('service')} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Location</label>
              <input placeholder="Tulsa, OK" value={form.location} onChange={set('location')} style={inputStyle} />
            </div>
          </div>

          {/* Row 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Monthly revenue</label>
              <input placeholder="$50k–$200k/mo" value={form.revenue} onChange={set('revenue')} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Ad spend</label>
              <input placeholder="$1k–$5k/mo" value={form.adSpend} onChange={set('adSpend')} style={inputStyle} />
            </div>
          </div>

          {/* Row 4 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Looking for</label>
              <input placeholder="Both" value={form.lookingFor} onChange={set('lookingFor')} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Timeline</label>
              <input placeholder="Right now" value={form.timeline} onChange={set('timeline')} style={inputStyle} />
            </div>
          </div>

          {/* Row 5 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="joe@business.com" value={form.email} onChange={set('email')} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone</label>
              <input placeholder="(555) 000-0000" value={form.phone} onChange={set('phone')} style={inputStyle} />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>GHL contact link (optional)</label>
            <input placeholder="https://app.gohighlevel.com/..." value={form.ghlUrl} onChange={set('ghlUrl')} style={inputStyle} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Notes</label>
            <textarea
              placeholder="Context, talking points, anything relevant..."
              value={form.notes}
              onChange={set('notes')}
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button onClick={save} style={{
            flex: 1, padding: '10px 0', background: colors.accent, border: 'none',
            borderRadius: borders.radius.medium, color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {existing ? 'Save Changes' : 'Add Prospect'}
          </button>
          {onDelete && (
            <button onClick={onDelete} style={{
              padding: '10px 16px', background: 'transparent',
              border: `1px solid rgba(255,123,114,0.35)`, borderRadius: borders.radius.medium,
              color: colors.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Kanban ─────────────────────────────────────────────────────

export default function ProspectsKanban() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [modal, setModal] = useState<
    | { kind: 'add' }
    | { kind: 'edit'; prospect: Prospect }
    | null
  >(null)

  useEffect(() => {
    setProspects(loadProspects())
  }, [])

  function persist(next: Prospect[]) {
    setProspects(next)
    saveProspects(next)
  }

  function addProspect(data: Omit<Prospect, 'id' | 'createdAt'>) {
    persist([{
      ...data,
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    }, ...prospects])
    setModal(null)
  }

  function updateProspect(data: Omit<Prospect, 'id' | 'createdAt'>) {
    if (modal?.kind !== 'edit') return
    persist(prospects.map(p => p.id === modal.prospect.id ? { ...p, ...data } : p))
    setModal(null)
  }

  function deleteProspect() {
    if (modal?.kind !== 'edit') return
    persist(prospects.filter(p => p.id !== modal.prospect.id))
    setModal(null)
  }

  const activeStages = STAGES.filter(s => s.key !== 'closed' && s.key !== 'lost')
  const terminalStages = STAGES.filter(s => s.key === 'closed' || s.key === 'lost')

  const total = prospects.length
  const qualified = prospects.filter(p => p.stage !== 'lost').length

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Prospects', value: String(total), color: colors.textMuted },
          { label: 'In Pipeline', value: String(prospects.filter(p => !['closed','lost'].includes(p.stage)).length), color: colors.accent },
          { label: 'Closed', value: String(prospects.filter(p => p.stage === 'closed').length), color: colors.accent },
          { label: 'Lost', value: String(prospects.filter(p => p.stage === 'lost').length), color: colors.red },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ ...cardStyleAccent, padding: '10px 16px', minWidth: 100 }}>
            <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, marginTop: 4 }}>{value}</div>
          </div>
        ))}
        <button
          onClick={() => setModal({ kind: 'add' })}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', background: colors.accent, border: 'none',
            borderRadius: borders.radius.medium, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={13} strokeWidth={2.5} /> Add Prospect
        </button>
      </div>

      {/* Active pipeline columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {activeStages.map(s => {
          const cards = prospects.filter(p => p.stage === s.key)
          return (
            <div key={s.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '0.08em' }}>
                  {s.label.toUpperCase()}
                </span>
                <span style={{ ...mono, fontSize: 10, color: colors.textMuted }}>{cards.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
                {cards.length === 0 && (
                  <div style={{
                    padding: '14px 12px', borderRadius: borders.radius.medium,
                    border: `1px dashed ${colors.border}`, textAlign: 'center',
                    fontSize: 12, color: colors.textMuted,
                  }}>
                    Empty
                  </div>
                )}
                {cards.map(p => (
                  <ProspectCard key={p.id} p={p} onClick={() => setModal({ kind: 'edit', prospect: p })} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Terminal columns (Closed + Lost) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {terminalStages.map(s => {
          const cards = prospects.filter(p => p.stage === s.key)
          return (
            <div key={s.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '0.08em' }}>
                  {s.label.toUpperCase()}
                </span>
                <span style={{ ...mono, fontSize: 10, color: colors.textMuted }}>{cards.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 40 }}>
                {cards.length === 0 && (
                  <div style={{
                    padding: '10px 12px', borderRadius: borders.radius.medium,
                    border: `1px dashed ${colors.border}`, textAlign: 'center',
                    fontSize: 12, color: colors.textMuted,
                  }}>
                    None yet
                  </div>
                )}
                {cards.map(p => (
                  <ProspectCard key={p.id} p={p} onClick={() => setModal({ kind: 'edit', prospect: p })} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {modal?.kind === 'add' && (
        <ProspectModal onClose={() => setModal(null)} onSave={addProspect} />
      )}
      {modal?.kind === 'edit' && (
        <ProspectModal
          existing={modal.prospect}
          onClose={() => setModal(null)}
          onSave={updateProspect}
          onDelete={deleteProspect}
        />
      )}
    </div>
  )
}
