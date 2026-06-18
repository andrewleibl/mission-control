'use client'

import { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import { colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import {
  Client, ClientStatus, ServiceType, SERVICE_TYPE_LABELS,
  ClientService, ServiceKind, PayModel, SERVICE_KIND_LABELS, PAY_MODEL_LABELS, deriveMRR,
  CommsEntry, CommsType, ActionItem, FinanceTxLite,
  daysSince, daysUntil, lastContactDate,
  openActionItems, computePaymentStatus, computeLTV,
} from '@/lib/clients-data'

type DetailTab = 'overview' | 'account'

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'account', label: 'Account' },
]

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'ACTIVE',
  onboarding: 'ONBOARDING',
  prospect: 'PROSPECT',
  churned: 'CHURNED',
  archived: 'ARCHIVED',
}

function statusColor(status: ClientStatus): string {
  switch (status) {
    case 'active': return colors.accent
    case 'onboarding': return colors.yellow
    case 'prospect': return colors.blue
    case 'churned': return colors.textMuted
    case 'archived': return colors.textMuted
  }
}

function statusBg(status: ClientStatus): string {
  switch (status) {
    case 'active': return 'rgba(56,161,87,0.12)'
    case 'onboarding': return 'rgba(227,179,65,0.12)'
    case 'prospect': return 'rgba(99,179,237,0.12)'
    case 'churned': return 'rgba(125,138,153,0.12)'
    case 'archived': return 'rgba(125,138,153,0.12)'
  }
}

function fmtMoney(n: number) { return '$' + n.toLocaleString('en-US') }
function fmtDate(iso: string) {
  if (!iso || iso === 'N/A') return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  client: Client
  comms: CommsEntry[]
  actions: ActionItem[]
  txs: FinanceTxLite[]
  onClose: () => void
  onUpdateClient: (next: Client) => void
  onAddAction: (item: ActionItem) => void
  onToggleAction: (id: string) => void
  onDeleteAction: (id: string) => void
  onAddComms: (entry: CommsEntry) => void
  onUpdateComms: (entry: CommsEntry) => void
  onTogglePinComms: (id: string) => void
  onDeleteComms: (id: string) => void
}

export default function ClientDetail({
  client, comms, actions, txs, onClose,
  onUpdateClient, onAddAction, onToggleAction, onDeleteAction,
  onAddComms, onUpdateComms, onTogglePinComms, onDeleteComms,
}: Props) {
  const [tab, setTab] = useState<DetailTab>('overview')

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90,
      }} />
      <div className="side-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
        background: colors.cardBg, borderLeft: `1px solid ${colors.border}`,
        zIndex: 91, padding: 0, overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{
                ...mono,
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                background: statusBg(client.status), color: statusColor(client.status),
                letterSpacing: '0.06em',
              }}>
                {STATUS_LABELS[client.status]}
              </span>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8, color: colors.text }}>
                {client.business}
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                {client.name}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
          </div>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${colors.border}`, marginTop: 4 }}>
            {TABS.map(t => {
              const active = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '9px 14px', fontSize: 13, fontWeight: 600,
                  color: active ? colors.text : colors.textMuted,
                  borderBottom: `2px solid ${active ? colors.accent : 'transparent'}`,
                  marginBottom: -1, transition: 'color 0.15s',
                  fontFamily: 'inherit',
                }}>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '20px 28px 32px' }}>
          {tab === 'overview' && (
            <OverviewTab
              client={client}
              comms={comms}
              actions={actions}
              txs={txs}
              onUpdateClient={onUpdateClient}
              onAddAction={onAddAction}
              onToggleAction={onToggleAction}
              onDeleteAction={onDeleteAction}
            />
          )}
          {tab === 'account' && (
            <AccountTab client={client} onUpdateClient={onUpdateClient} />
          )}
        </div>
      </div>
    </>
  )
}

// =================================================================
// Overview tab content
// =================================================================
function OverviewTab({
  client, comms, actions, txs, onUpdateClient, onAddAction, onToggleAction, onDeleteAction,
}: {
  client: Client
  comms: CommsEntry[]
  actions: ActionItem[]
  txs: FinanceTxLite[]
  onUpdateClient: (next: Client) => void
  onAddAction: (item: ActionItem) => void
  onToggleAction: (id: string) => void
  onDeleteAction: (id: string) => void
}) {
  const payment = computePaymentStatus(client, txs)
  const ltv = computeLTV(client, txs)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* LTV Snapshot */}
      <Section label="Lifetime Value">
        <LTVSnapshot ltv={ltv} />
      </Section>

      {/* Payment Status */}
      <Section label="Payment Status">
        <PaymentStatusCard client={client} payment={payment} />
      </Section>

      {/* Revenue History */}
      <Section label="Revenue History">
        <RevenueHistory clientId={client.id} txs={txs} />
      </Section>

      {/* Notes */}
      <Section label="Notes">
        <NotesEditor
          value={client.notes}
          onChange={notes => onUpdateClient({ ...client, notes })}
        />
      </Section>
    </div>
  )
}

// ---- Payment status card ----
function PaymentStatusCard({ client, payment }: { client: Client; payment: ReturnType<typeof computePaymentStatus> }) {
  if (payment.state === 'no-billing') {
    return (
      <div style={{ padding: '14px 16px', background: colors.cardBgElevated, borderRadius: borders.radius.medium, fontSize: 12, color: colors.textMuted }}>
        Project-based — no recurring billing tracked.
        {payment.mtdRevenue > 0 && (
          <> MTD revenue: <span style={{ ...mono, color: colors.accent, fontWeight: 600 }}>{fmtMoney(payment.mtdRevenue)}</span></>
        )}
      </div>
    )
  }

  const isCurrent = payment.state === 'current'
  const accent = isCurrent ? colors.accent : colors.red
  const bg = isCurrent ? 'rgba(56,161,87,0.06)' : 'rgba(255,123,114,0.06)'
  const border = isCurrent ? 'rgba(56,161,87,0.2)' : 'rgba(255,123,114,0.2)'

  return (
    <div style={{
      padding: '14px 16px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: borders.radius.medium,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          ...mono,
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
          background: isCurrent ? 'rgba(56,161,87,0.15)' : 'rgba(255,123,114,0.15)',
          color: accent, letterSpacing: '0.06em',
        }}>
          {isCurrent ? 'PAID' : 'OVERDUE'}
        </span>
        <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: colors.text, fontVariantNumeric: 'tabular-nums' as const }}>
          {fmtMoney(client.monthlyRetainer)}/mo
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' as const }}>
            Last payment
          </div>
          <div style={{ ...mono, fontSize: 13, color: colors.text, fontVariantNumeric: 'tabular-nums' as const }}>
            {payment.lastPaymentDate ? fmtDate(payment.lastPaymentDate) : 'None logged'}
            {payment.daysSincePayment !== undefined && (
              <span style={{ color: colors.textMuted, marginLeft: 6 }}>
                ({payment.daysSincePayment}d)
              </span>
            )}
          </div>
        </div>
        <div>
          <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase' as const }}>
            MTD revenue
          </div>
          <div style={{ ...mono, fontSize: 13, color: payment.mtdRevenue > 0 ? colors.accent : colors.textMuted, fontVariantNumeric: 'tabular-nums' as const, fontWeight: 600 }}>
            {fmtMoney(payment.mtdRevenue)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- LTV snapshot ----
function LTVSnapshot({ ltv }: { ltv: ReturnType<typeof computeLTV> }) {
  const isEmpty = ltv.total === 0
  return (
    <div style={{
      padding: '16px 18px',
      background: isEmpty ? colors.cardBgElevated : 'rgba(56,161,87,0.06)',
      border: `1px solid ${isEmpty ? colors.border : 'rgba(56,161,87,0.2)'}`,
      borderRadius: borders.radius.medium,
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: 16,
    }}>
      <LTVCell
        label="Total"
        value={fmtMoney(ltv.total)}
        color={isEmpty ? colors.textMuted : colors.accent}
        emphasized
        sub={ltv.paymentCount > 0 ? `${ltv.paymentCount} payment${ltv.paymentCount === 1 ? '' : 's'}` : undefined}
      />
      <LTVCell
        label="Tenure"
        value={ltv.tenureLabel}
        color={colors.text}
      />
    </div>
  )
}

function LTVCell({ label, value, color, emphasized, sub }: { label: string; value: string; color: string; emphasized?: boolean; sub?: string }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' as const }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: emphasized ? 22 : 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' as const, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ---- Revenue history — last 6 months from this client ----
function RevenueHistory({ clientId, txs }: { clientId: string; txs: FinanceTxLite[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const now = new Date()
  const months: { label: string; ym: string; total: number }[] = []
  const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const total = txs
      .filter(t => t.type === 'income' && t.status === 'confirmed' && t.clientId === clientId && t.date.slice(0, 7) === ym)
      .reduce((s, t) => s + t.amount, 0)
    months.push({ label: SHORT_MONTHS[d.getMonth()], ym, total })
  }

  const max = Math.max(1, ...months.map(m => m.total))
  const sumTotal = months.reduce((s, m) => s + m.total, 0)

  if (sumTotal === 0) {
    return (
      <div style={{
        padding: '14px 16px', background: colors.cardBgElevated,
        borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 12,
      }}>
        No income from this client logged in Finances yet.
      </div>
    )
  }

  return (
    <div style={{
      padding: '14px 16px',
      background: colors.cardBgElevated,
      borderRadius: borders.radius.medium,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, fontSize: 11 }}>
        <span style={{ color: colors.textMuted }}>
          6-mo total: <span style={{ ...mono, color: colors.accent, fontWeight: 600 }}>${sumTotal.toLocaleString('en-US')}</span>
        </span>
        <span style={{ ...mono, fontSize: 11, color: hover !== null ? colors.accent : colors.textSubtle }}>
          {hover !== null ? `${months[hover].label} · $${months[hover].total.toLocaleString('en-US')}` : 'hover a bar'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
        {months.map((m, i) => {
          const heightPct = max > 0 ? (m.total / max) * 100 : 0
          const active = hover === i
          return (
            <div key={i}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* reference track — gives the bars a visible scale */}
              <div style={{ position: 'relative', width: '100%', height: 52, display: 'flex', alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', borderRadius: '3px 3px 0 0' }}>
                <div style={{
                  width: '100%', height: `${heightPct}%`, minHeight: m.total > 0 ? 2 : 0,
                  background: colors.accent, opacity: active ? 1 : 0.8,
                  borderRadius: '3px 3px 0 0', transition: 'opacity 0.12s',
                }} />
                {active && m.total > 0 && (
                  <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', ...mono, fontSize: 10, fontWeight: 700, color: colors.accent, whiteSpace: 'nowrap' as const }}>
                    ${m.total.toLocaleString('en-US')}
                  </div>
                )}
              </div>
              <div style={{ ...mono, fontSize: 9, color: active ? colors.text : colors.textMuted, letterSpacing: '0.04em' }}>
                {m.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Account tab — full editable account info ----
function AccountTab({ client, onUpdateClient }: { client: Client; onUpdateClient: (c: Client) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Section label="Identity">
        <FieldRow label="Contact Name" value={client.name} onSave={v => onUpdateClient({ ...client, name: v })} />
        <FieldRow label="Business Name" value={client.business} onSave={v => onUpdateClient({ ...client, business: v })} />
      </Section>

      <Section label="Services & Payment">
        <ServicesEditor
          services={client.services ?? []}
          onChange={services => onUpdateClient({ ...client, services, monthlyRetainer: deriveMRR(services) })}
        />
      </Section>

      <Section label="Dates">
        <FieldRow
          label="Signed"
          value={client.signedDate ?? ''}
          display={client.signedDate ? fmtDate(client.signedDate) : '—'}
          inputType="date"
          mono
          onSave={v => onUpdateClient({ ...client, signedDate: v || undefined })}
        />
        <FieldRow
          label="Renewal (optional)"
          value={client.renewalDate === 'N/A' ? '' : client.renewalDate}
          display={client.renewalDate === 'N/A' ? '—' : fmtDate(client.renewalDate)}
          inputType="date"
          mono
          onSave={v => onUpdateClient({ ...client, renewalDate: v || 'N/A' })}
        />
      </Section>

      <Section label="Contact">
        <FieldRow
          label="Email"
          value={client.contactEmail ?? ''}
          inputType="email"
          placeholder="—"
          onSave={v => onUpdateClient({ ...client, contactEmail: v.trim() || undefined })}
        />
        <FieldRow
          label="Phone"
          value={client.contactPhone ?? ''}
          inputType="tel"
          placeholder="—"
          onSave={v => onUpdateClient({ ...client, contactPhone: v.trim() || undefined })}
        />
      </Section>
    </div>
  )
}

// ---- Services & per-service payment editor (Account tab) ----
function ServicesEditor({ services, onChange }: { services: ClientService[]; onChange: (s: ClientService[]) => void }) {
  const [local, setLocal] = useState<ClientService[]>(services)
  useEffect(() => { setLocal(services) }, [services])
  const editLocal = (i: number, patch: Partial<ClientService>) => setLocal(local.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  const commit = (next: ClientService[]) => { setLocal(next); onChange(next) }
  const sel: React.CSSProperties = { background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, fontSize: 12, padding: '6px 8px', fontFamily: 'inherit', outline: 'none' }
  const unit = (p: PayModel) => p === 'monthly' ? '/mo' : p === 'per_appt' ? '/appt' : p === 'per_lead' ? '/lead' : ''
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {local.length === 0 && <div style={{ fontSize: 12, color: colors.textMuted }}>No services yet — add one below.</div>}
      {local.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const, background: colors.cardBgElevated, borderRadius: borders.radius.small, padding: 8 }}>
          <select value={s.kind} onChange={e => commit(local.map((x, idx) => idx === i ? { ...x, kind: e.target.value as ServiceKind } : x))} style={{ ...sel, flex: '1 1 140px' }}>
            {(Object.keys(SERVICE_KIND_LABELS) as ServiceKind[]).map(k => <option key={k} value={k}>{SERVICE_KIND_LABELS[k]}</option>)}
          </select>
          <select value={s.pay} onChange={e => commit(local.map((x, idx) => idx === i ? { ...x, pay: e.target.value as PayModel } : x))} style={{ ...sel, flex: '1 1 130px' }}>
            {(Object.keys(PAY_MODEL_LABELS) as PayModel[]).map(p => <option key={p} value={p}>{PAY_MODEL_LABELS[p]}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ ...mono, fontSize: 12, color: colors.textMuted }}>$</span>
            <input type="number" value={s.amount || ''} onChange={e => editLocal(i, { amount: parseFloat(e.target.value) || 0 })} onBlur={() => onChange(local)} style={{ ...sel, ...mono, width: 72 }} />
            <span style={{ ...mono, fontSize: 11, color: colors.textMuted, minWidth: 28 }}>{unit(s.pay)}</span>
          </div>
          <button onClick={() => commit(local.filter((_, idx) => idx !== i))} title="Remove" style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      ))}
      <button onClick={() => commit([...local, { kind: 'ads_leads', pay: 'monthly', amount: 0 }])} style={{ alignSelf: 'flex-start', background: colors.accent + '18', border: `1px solid ${colors.accent}44`, borderRadius: borders.radius.small, color: colors.accent, fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer' }}>+ Add service</button>
      {deriveMRR(local) > 0 && <div style={{ ...mono, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>MRR from monthly services: <span style={{ color: colors.accent, fontWeight: 700 }}>{fmtMoney(deriveMRR(local))}/mo</span></div>}
    </div>
  )
}

// ---- Inline-editable field row (for Account tab) ----
function FieldRow({
  label, value, display, options, inputType, mono: monoValue, placeholder, onSave,
}: {
  label: string
  value: string
  display?: string
  options?: { value: string; label: string }[]
  inputType?: 'text' | 'email' | 'tel' | 'number' | 'date'
  mono?: boolean
  placeholder?: string
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    if (draft !== value) onSave(draft)
    setEditing(false)
  }
  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  const valueStyle: React.CSSProperties = {
    ...(monoValue ? mono : {}),
    fontSize: 13, color: value ? colors.text : colors.textMuted,
    fontVariantNumeric: 'tabular-nums' as const,
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', background: colors.cardBgElevated,
      borderRadius: borders.radius.medium, marginBottom: 6,
    }}>
      <div style={{
        ...mono,
        fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em',
        fontWeight: 600, textTransform: 'uppercase' as const, minWidth: 110,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {editing ? (
          options ? (
            <select
              autoFocus value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
              style={{
                background: colors.cardBg, border: `1px solid ${colors.accent}`,
                borderRadius: 4, padding: '5px 8px',
                color: colors.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            >
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input
              type={inputType ?? 'text'}
              autoFocus value={draft}
              placeholder={placeholder}
              onChange={e => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
              style={{
                ...(monoValue ? mono : {}),
                background: colors.cardBg, border: `1px solid ${colors.accent}`,
                borderRadius: 4, padding: '5px 8px',
                color: colors.text, fontSize: 13, outline: 'none',
                fontFamily: monoValue ? 'var(--font-mono), monospace' : 'inherit',
                textAlign: 'right' as const, minWidth: 160,
              }}
            />
          )
        ) : (
          <button
            onClick={() => { setDraft(value); setEditing(true) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', padding: '4px 8px', borderRadius: 4,
              background: 'transparent', border: 'none',
              color: 'inherit', fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              const icon = e.currentTarget.querySelector('svg')
              if (icon) (icon as SVGElement).style.opacity = '1'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              const icon = e.currentTarget.querySelector('svg')
              if (icon) (icon as SVGElement).style.opacity = '0.35'
            }}
          >
            <span style={valueStyle}>
              {display ?? (value || placeholder || '—')}
            </span>
            <Pencil
              size={11} strokeWidth={2}
              style={{ color: colors.textMuted, opacity: 0.35, transition: 'opacity 0.15s', flexShrink: 0 }}
            />
          </button>
        )}
      </div>
    </div>
  )
}

// ---- Action items list ----
function ActionItemsList({
  clientId, items, onAdd, onToggle, onDelete,
}: {
  clientId: string
  items: ActionItem[]
  onAdd: (item: ActionItem) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')

  function submit() {
    if (!title.trim()) return
    onAdd({
      id: `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientId, title: title.trim(),
      dueDate: dueDate || undefined,
      completed: false,
      createdAt: Date.now(),
    })
    setTitle(''); setDueDate(''); setAdding(false)
  }

  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(item => {
        const overdue = item.dueDate && item.dueDate < todayIso
        return (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px',
            background: colors.cardBgElevated,
            borderRadius: borders.radius.medium,
            border: `1px solid ${overdue ? 'rgba(255,123,114,0.3)' : colors.border}`,
          }}>
            <button
              onClick={() => onToggle(item.id)}
              style={{
                width: 16, height: 16, borderRadius: 3,
                border: `1.5px solid ${colors.textMuted}`, background: 'transparent',
                cursor: 'pointer', padding: 0, flexShrink: 0,
              }}
              title="Mark complete"
            />
            <span style={{ flex: 1, fontSize: 13, color: colors.text }}>{item.title}</span>
            {item.dueDate && (
              <span style={{
                ...mono,
                fontSize: 10, color: overdue ? colors.red : colors.textMuted,
                whiteSpace: 'nowrap' as const,
              }}>
                {overdue ? 'Overdue ' : 'Due '}{fmtDate(item.dueDate)}
              </span>
            )}
            <button onClick={() => onDelete(item.id)} style={{
              background: 'none', border: 'none', color: colors.textMuted,
              cursor: 'pointer', fontSize: 12, opacity: 0.4, padding: 0, lineHeight: 1,
            }}>✕</button>
          </div>
        )
      })}

      {/* Add row */}
      {adding ? (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          padding: '10px 12px',
          background: colors.cardBgElevated,
          borderRadius: borders.radius.medium,
          border: `1px solid ${colors.border}`,
        }}>
          <input
            type="text" placeholder="What's the action item?" autoFocus
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setAdding(false); setTitle(''); setDueDate('') } }}
            style={{
              background: colors.cardBg, border: `1px solid ${colors.border}`,
              borderRadius: 4, padding: '7px 10px', color: colors.text, fontSize: 13, outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{
                ...mono,
                background: colors.cardBg, border: `1px solid ${colors.border}`,
                borderRadius: 4, padding: '6px 10px', color: colors.text, fontSize: 12, outline: 'none', flex: 1,
              }}
            />
            <button onClick={submit} style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 600,
              background: colors.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Add</button>
            <button onClick={() => { setAdding(false); setTitle(''); setDueDate('') }} style={{
              padding: '6px 12px', fontSize: 12,
              background: 'transparent', color: colors.textMuted,
              border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: '8px 12px', fontSize: 12, fontWeight: 600,
          background: 'transparent', border: `1px dashed ${colors.border}`,
          borderRadius: borders.radius.medium, color: colors.textMuted,
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
        }}>
          + Add action item
        </button>
      )}
    </div>
  )
}

// ---- Notes editor ----
// Bullet-point notes editor. Each line of `value` is one bullet. Commits on
// blur (not per keystroke — client saves are wipe-and-reinsert).
function NotesEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [bullets, setBullets] = useState<string[]>(value ? value.split('\n') : [])
  useEffect(() => { setBullets(value ? value.split('\n') : []) }, [value])
  const commit = (next: string[]) => { setBullets(next); onChange(next.map(b => b.trim()).filter(Boolean).join('\n')) }
  const editAt = (i: number, v: string) => setBullets(bullets.map((b, idx) => idx === i ? v : b))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {bullets.length === 0 && <div style={{ fontSize: 12, color: colors.textMuted }}>No notes yet — add a bullet below.</div>}
      {bullets.map((b, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: colors.accent, fontSize: 15, lineHeight: 1 }}>•</span>
          <input
            value={b}
            onChange={e => editAt(i, e.target.value)}
            onBlur={() => commit(bullets)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setBullets([...bullets.slice(0, i + 1), '', ...bullets.slice(i + 1)]) } }}
            placeholder="Add a note…"
            style={{ flex: 1, background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '7px 10px', color: colors.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', lineHeight: 1.4 }}
          />
          <button onClick={() => commit(bullets.filter((_, idx) => idx !== i))} title="Remove" style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
        </div>
      ))}
      <button onClick={() => setBullets([...bullets, ''])} style={{ alignSelf: 'flex-start', background: colors.accent + '18', border: `1px solid ${colors.accent}44`, borderRadius: 6, color: colors.accent, fontSize: 12, fontWeight: 600, padding: '5px 10px', cursor: 'pointer' }}>+ Add bullet</button>
    </div>
  )
}

// ---- Section wrapper ----
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '14px 16px', background: colors.cardBgElevated,
      borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 12,
    }}>{children}</div>
  )
}

// =================================================================
// Comms Tab
// =================================================================

const COMMS_TYPE_LABELS: Record<CommsType, string> = {
  call: 'CALL',
  email: 'EMAIL',
  text: 'TEXT',
  meeting: 'MEETING',
  other: 'OTHER',
}

const COMMS_TYPE_COLOR: Record<CommsType, { fg: string; bg: string }> = {
  call: { fg: colors.blue, bg: 'rgba(99,179,237,0.12)' },
  email: { fg: colors.purple, bg: 'rgba(159,122,234,0.12)' },
  text: { fg: colors.accent, bg: 'rgba(56,161,87,0.12)' },
  meeting: { fg: colors.yellow, bg: 'rgba(227,179,65,0.12)' },
  other: { fg: colors.textMuted, bg: 'rgba(125,138,153,0.12)' },
}

function CommsTab({
  clientId, comms, onAdd, onUpdate, onTogglePin, onDelete,
}: {
  clientId: string
  comms: CommsEntry[]
  onAdd: (entry: CommsEntry) => void
  onUpdate: (entry: CommsEntry) => void
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const clientComms = comms
    .filter(c => c.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date))
  const pinned = clientComms.filter(c => c.pinned)
  const history = clientComms.filter(c => !c.pinned)

  const editingEntry = editingId ? comms.find(c => c.id === editingId) ?? null : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const }}>
          Conversations ({clientComms.length})
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'inherit',
        }}>+ Log Conversation</button>
      </div>

      {clientComms.length === 0 ? (
        <div style={{
          padding: 28, textAlign: 'center',
          background: colors.cardBgElevated, borderRadius: borders.radius.medium,
          color: colors.textMuted, fontSize: 13, lineHeight: 1.5,
        }}>
          No conversations logged yet.<br />
          <span style={{ fontSize: 12 }}>Log your next call, email, or meeting to start building the relationship memory.</span>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: colors.yellow, marginBottom: 8 }}>
                ⌘ PINNED
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pinned.map(c => (
                  <CommsRow
                    key={c.id} entry={c}
                    onTogglePin={() => onTogglePin(c.id)}
                    onEdit={() => setEditingId(c.id)}
                    onDelete={() => onDelete(c.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div style={{ ...mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: colors.textMuted, marginBottom: 8 }}>
                  HISTORY
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map(c => (
                  <CommsRow
                    key={c.id} entry={c}
                    onTogglePin={() => onTogglePin(c.id)}
                    onEdit={() => setEditingId(c.id)}
                    onDelete={() => onDelete(c.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <LogCommsModal
          clientId={clientId}
          onClose={() => setShowModal(false)}
          onSave={onAdd}
        />
      )}
      {editingEntry && (
        <LogCommsModal
          clientId={clientId}
          existing={editingEntry}
          onClose={() => setEditingId(null)}
          onSave={onUpdate}
        />
      )}
    </div>
  )
}

// ---- Comms entry row ----
function CommsRow({
  entry, onTogglePin, onEdit, onDelete,
}: {
  entry: CommsEntry
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const typeColor = COMMS_TYPE_COLOR[entry.type]
  const hasContext = entry.context && entry.context.trim().length > 0

  return (
    <div style={{
      padding: '12px 14px',
      background: colors.cardBgElevated,
      border: `1px solid ${entry.pinned ? 'rgba(227,179,65,0.25)' : colors.border}`,
      borderRadius: borders.radius.medium,
    }}>
      {/* Top row: type chip + date + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            ...mono,
            fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
            background: typeColor.bg, color: typeColor.fg, letterSpacing: '0.06em',
          }}>
            {COMMS_TYPE_LABELS[entry.type]}
          </span>
          <span style={{ ...mono, fontSize: 11, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' as const }}>
            {fmtDate(entry.date)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <RowAction label={entry.pinned ? 'Unpin' : 'Pin'} onClick={onTogglePin} active={entry.pinned} />
          <RowAction label="Edit" onClick={onEdit} />
          <RowAction label="✕" onClick={onDelete} />
        </div>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>
        {entry.summary}
      </div>

      {/* Context (collapsible) */}
      {hasContext && (
        <>
          {expanded ? (
            <div style={{
              marginTop: 8, padding: '8px 10px',
              background: colors.cardBg, borderRadius: 4,
              fontSize: 12, color: colors.textMuted, lineHeight: 1.6,
              whiteSpace: 'pre-wrap' as const,
            }}>
              {entry.context}
            </div>
          ) : null}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              ...mono,
              marginTop: 6, fontSize: 10, fontWeight: 600,
              background: 'none', border: 'none', color: colors.textMuted,
              cursor: 'pointer', padding: 0, letterSpacing: '0.06em',
            }}
          >
            {expanded ? '— HIDE CONTEXT' : '+ SHOW CONTEXT'}
          </button>
        </>
      )}
    </div>
  )
}

function RowAction({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 10, fontWeight: 600,
        background: 'transparent', border: 'none', color: active ? colors.yellow : colors.textMuted,
        cursor: 'pointer', padding: '2px 6px', borderRadius: 3, opacity: 0.7,
        fontFamily: 'var(--font-mono), monospace',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.7' }}
    >
      {label}
    </button>
  )
}

// ---- Log conversation modal (also used for editing) ----
function LogCommsModal({
  clientId, existing, onClose, onSave,
}: {
  clientId: string
  existing?: CommsEntry
  onClose: () => void
  onSave: (entry: CommsEntry) => void
}) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(existing?.date ?? todayIso)
  const [type, setType] = useState<CommsType>(existing?.type ?? 'call')
  const [summary, setSummary] = useState(existing?.summary ?? '')
  const [context, setContext] = useState(existing?.context ?? '')

  function save() {
    if (!summary.trim()) return
    onSave({
      id: existing?.id ?? `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      clientId,
      date,
      type,
      summary: summary.trim(),
      context: context.trim() || undefined,
      pinned: existing?.pinned ?? false,
      createdAt: existing?.createdAt ?? Date.now(),
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '10px 12px',
    color: colors.text, fontSize: 14, outline: 'none', width: '100%',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    ...mono,
    fontSize: 11, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 6,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-sheet" style={{ ...cardStyle, width: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {existing ? 'Edit Conversation' : 'Log Conversation'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type pills */}
          <div>
            <label style={labelStyle}>Type</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {(['call', 'email', 'text', 'meeting', 'other'] as CommsType[]).map(t => {
                const active = type === t
                const color = COMMS_TYPE_COLOR[t]
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      ...mono,
                      flex: 1, padding: '7px 0', minWidth: 56,
                      borderRadius: borders.radius.medium,
                      border: `1px solid ${active ? color.fg : colors.border}`,
                      background: active ? color.bg : 'transparent',
                      color: active ? color.fg : colors.textMuted,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-mono), monospace',
                    }}
                  >
                    {COMMS_TYPE_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, ...mono }} />
          </div>

          <div>
            <label style={labelStyle}>Summary <span style={{ color: colors.red }}>*</span></label>
            <input
              type="text" autoFocus
              placeholder="What was the conversation about?"
              value={summary} onChange={e => setSummary(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Additional Context (optional)</label>
            <textarea
              placeholder="Longer notes, decisions made, things to remember..."
              value={context} onChange={e => setContext(e.target.value)}
              style={{
                ...inputStyle, minHeight: 100, resize: 'vertical' as const,
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>

        <button onClick={save} style={{
          marginTop: 20, width: '100%', padding: '11px 0',
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {existing ? 'Save Changes' : 'Log Conversation'}
        </button>
      </div>
    </div>
  )
}
