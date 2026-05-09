'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  Client, ClientStatus, ServiceType, SERVICE_TYPE_LABELS,
  CommsEntry, CommsType, ActionItem, FinanceTxLite,
  computeHealth, healthColor, daysSince, daysUntil, lastContactDate,
  openActionItems, computePaymentStatus, computeLTV,
} from '@/lib/clients-data'

type DetailTab = 'overview' | 'performance' | 'comms' | 'account'

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'performance', label: 'Performance' },
  { key: 'comms', label: 'Comms' },
  { key: 'account', label: 'Account' },
]

const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'ACTIVE',
  at_risk: 'AT RISK',
  onboarding: 'ONBOARDING',
  prospect: 'PROSPECT',
  churned: 'CHURNED',
}

function statusColor(status: ClientStatus): string {
  switch (status) {
    case 'active': return colors.accent
    case 'at_risk': return colors.red
    case 'onboarding': return colors.yellow
    case 'prospect': return colors.blue
    case 'churned': return colors.textMuted
  }
}

function statusBg(status: ClientStatus): string {
  switch (status) {
    case 'active': return 'rgba(56,161,87,0.12)'
    case 'at_risk': return 'rgba(255,123,114,0.12)'
    case 'onboarding': return 'rgba(227,179,65,0.12)'
    case 'prospect': return 'rgba(99,179,237,0.12)'
    case 'churned': return 'rgba(125,138,153,0.12)'
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
      <div style={{
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
          {tab === 'performance' && (
            <PlaceholderSection
              phase="Phase 4 — Optional"
              title="Performance"
              description="Reserved for clients with ad campaigns. Time-series of leads, CPL, spend (optional, pulled from Meta API)."
            />
          )}
          {tab === 'comms' && (
            <CommsTab
              clientId={client.id}
              comms={comms}
              onAdd={onAddComms}
              onUpdate={onUpdateComms}
              onTogglePin={onTogglePinComms}
              onDelete={onDeleteComms}
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
  const health = computeHealth(client, comms, actions, txs)
  const lastContact = lastContactDate(client, comms)
  const openItems = openActionItems(client.id, actions)
  const payment = computePaymentStatus(client, txs)
  const ltv = computeLTV(client, txs)

  // Activity timeline: combine comms entries + action items, last 5
  const timeline = [
    ...comms.filter(c => c.clientId === client.id).map(c => ({
      kind: 'comms' as const, date: c.date, summary: `${c.type[0].toUpperCase() + c.type.slice(1)} — ${c.summary}`,
    })),
    ...actions.filter(a => a.clientId === client.id).map(a => ({
      kind: 'action' as const, date: new Date(a.createdAt).toISOString().slice(0, 10),
      summary: a.completed ? `Completed: ${a.title}` : `Added: ${a.title}`,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Health Breakdown */}
      <Section label="Health Breakdown">
        <HealthBreakdownCard score={health.score} components={health.components} />
      </Section>

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

      {/* Open Action Items */}
      <Section label={`Open Action Items (${openItems.length})`}>
        <ActionItemsList
          clientId={client.id}
          items={openItems}
          onAdd={onAddAction}
          onToggle={onToggleAction}
          onDelete={onDeleteAction}
        />
      </Section>

      {/* Activity Timeline */}
      <Section label="Recent Activity">
        {timeline.length === 0 ? (
          <Empty>No activity yet — add an action item or log a conversation in the Comms tab.</Empty>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {timeline.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 12 }}>
                <span style={{ ...mono, color: colors.textMuted, minWidth: 48, fontVariantNumeric: 'tabular-nums' as const }}>
                  {fmtDate(e.date)}
                </span>
                <span style={{ color: colors.text, lineHeight: 1.5 }}>{e.summary}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Notes */}
      <Section label="Notes">
        <NotesEditor
          value={client.notes}
          onChange={notes => onUpdateClient({ ...client, notes })}
        />
      </Section>

      {/* Last Contact info */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '10px 14px', background: colors.cardBgElevated,
        borderRadius: borders.radius.medium,
        fontSize: 11,
      }}>
        <span style={{ color: colors.textMuted }}>
          Last contact: <span style={{ ...mono, color: colors.text }}>{fmtDate(lastContact)}</span>
        </span>
        <span style={{ color: colors.textMuted }}>
          Renewal: <span style={{ ...mono, color: colors.text }}>{client.renewalDate === 'N/A' ? '—' : fmtDate(client.renewalDate)}</span>
        </span>
      </div>
    </div>
  )
}

// ---- Health breakdown card ----
function HealthBreakdownCard({ score, components }: { score: number; components: { label: string; impact: number }[] }) {
  const hColor = healthColor(score)
  const accent = hColor === 'green' ? colors.accent : hColor === 'yellow' ? colors.yellow : colors.red
  return (
    <div style={{
      padding: '16px 18px',
      background: hColor === 'green' ? 'rgba(56,161,87,0.06)' : hColor === 'yellow' ? 'rgba(227,179,65,0.06)' : 'rgba(255,123,114,0.06)',
      border: `1px solid ${hColor === 'green' ? 'rgba(56,161,87,0.2)' : hColor === 'yellow' ? 'rgba(227,179,65,0.2)' : 'rgba(255,123,114,0.2)'}`,
      borderRadius: borders.radius.medium,
    }}>
      {/* Score + bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {score}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>
            HEALTH
          </div>
          <div style={{ height: 5, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${score}%`, background: accent, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {/* Component breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {components.map((c, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: colors.text }}>{c.label}</span>
            <span style={{
              ...mono,
              fontVariantNumeric: 'tabular-nums' as const,
              fontWeight: 600,
              color: c.impact > 0 ? colors.accent : c.impact < 0 ? colors.red : colors.textMuted,
            }}>
              {c.impact > 0 ? '+' : ''}{c.impact}
            </span>
          </div>
        ))}
      </div>
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
      gridTemplateColumns: '1.4fr 1fr 1fr',
      gap: 16,
    }}>
      <LTVCell
        label="Total"
        value={fmtMoney(ltv.total)}
        color={isEmpty ? colors.textMuted : colors.accent}
        emphasized
      />
      <LTVCell
        label="Tenure"
        value={ltv.tenureLabel}
        color={colors.text}
      />
      <LTVCell
        label="Avg / Mo"
        value={fmtMoney(Math.round(ltv.avgPerMonth))}
        color={colors.text}
        sub={ltv.paymentCount > 0 ? `${ltv.paymentCount} payment${ltv.paymentCount === 1 ? '' : 's'}` : undefined}
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
  const avg = sumTotal / months.length

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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 11 }}>
        <span style={{ color: colors.textMuted }}>
          6-mo total: <span style={{ ...mono, color: colors.accent, fontWeight: 600 }}>${sumTotal.toLocaleString('en-US')}</span>
        </span>
        <span style={{ color: colors.textMuted }}>
          Avg/mo: <span style={{ ...mono, color: colors.text, fontWeight: 600 }}>${Math.round(avg).toLocaleString('en-US')}</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
        {months.map((m, i) => {
          const heightPct = max > 0 ? (m.total / max) * 100 : 0
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                title={`${m.label}: $${m.total.toLocaleString('en-US')}`}
                style={{
                  width: '100%', height: `${heightPct}%`, minHeight: m.total > 0 ? 2 : 0,
                  background: m.total > 0 ? colors.accent : 'transparent',
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.85,
                  transition: 'opacity 0.15s',
                }}
              />
              <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.04em' }}>
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

      <Section label="Engagement">
        <FieldRow
          label="Status"
          value={client.status}
          display={STATUS_LABELS[client.status]}
          options={[
            { value: 'onboarding', label: 'Onboarding' },
            { value: 'active', label: 'Active' },
            { value: 'at_risk', label: 'At Risk' },
            { value: 'prospect', label: 'Prospect' },
            { value: 'churned', label: 'Churned' },
          ]}
          onSave={v => onUpdateClient({ ...client, status: v as ClientStatus })}
        />
        <FieldRow
          label="Service Type"
          value={client.serviceType}
          display={SERVICE_TYPE_LABELS[client.serviceType]}
          options={[
            { value: 'ads', label: 'Ads' },
            { value: 'web', label: 'Web Design' },
            { value: 'retainer', label: 'Retainer' },
            { value: 'project', label: 'Project' },
            { value: 'other', label: 'Other' },
          ]}
          onSave={v => onUpdateClient({ ...client, serviceType: v as ServiceType })}
        />
        <FieldRow
          label="Monthly Retainer"
          value={String(client.monthlyRetainer)}
          display={client.monthlyRetainer > 0 ? `${fmtMoney(client.monthlyRetainer)}/mo` : 'Project-based'}
          inputType="number"
          mono
          onSave={v => onUpdateClient({ ...client, monthlyRetainer: parseFloat(v) || 0 })}
        />
      </Section>

      <Section label="Dates">
        <FieldRow
          label="Start Date"
          value={client.startDate ?? ''}
          display={client.startDate ? fmtDate(client.startDate) : '—'}
          inputType="date"
          mono
          onSave={v => onUpdateClient({ ...client, startDate: v || undefined })}
        />
        <FieldRow
          label="Renewal Date"
          value={client.renewalDate === 'N/A' ? '' : client.renewalDate}
          display={client.renewalDate === 'N/A' ? 'N/A' : fmtDate(client.renewalDate)}
          inputType="date"
          mono
          onSave={v => onUpdateClient({ ...client, renewalDate: v || 'N/A' })}
        />
        <FieldRow
          label="Last Contact"
          value={client.lastContact}
          display={fmtDate(client.lastContact)}
          inputType="date"
          mono
          onSave={v => onUpdateClient({ ...client, lastContact: v })}
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
function NotesEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)

  function save() {
    onChange(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          style={{
            width: '100%', minHeight: 80,
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: borders.radius.medium, padding: '10px 12px',
            color: colors.text, fontSize: 13, outline: 'none', resize: 'vertical' as const,
            fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => { setDraft(value); setEditing(false) }} style={{
            padding: '6px 12px', fontSize: 12, background: 'transparent', color: colors.textMuted,
            border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={save} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 600,
            background: colors.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
          }}>Save</button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true) }}
      style={{
        padding: '12px 14px',
        background: colors.cardBgElevated,
        borderRadius: borders.radius.medium,
        border: `1px solid ${colors.border}`,
        cursor: 'text',
        fontSize: 13, color: value ? colors.text : colors.textMuted,
        lineHeight: 1.5, minHeight: 24,
        whiteSpace: 'pre-wrap' as const,
      }}
    >
      {value || 'Click to add notes...'}
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

// ---- Placeholder for Performance / Comms / Account tabs ----
function PlaceholderSection({ phase, title, description }: { phase: string; title: string; description: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: 28, textAlign: 'center' }}>
      <div style={{ ...mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: colors.accent, textTransform: 'uppercase' as const, marginBottom: 10 }}>
        {phase}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>{description}</div>
    </div>
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
      <div style={{ ...cardStyle, width: 460, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
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
