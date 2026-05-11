'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  Client, ClientStatus, ServiceType, SERVICE_TYPE_LABELS,
  CommsEntry, ActionItem,
  loadClients, saveClients, loadComms, saveComms, loadActions, saveActions,
  computeHealth, healthColor, daysSince, daysUntil, lastContactDate,
  openActionItems, computePaymentStatus, computeLTV, FinanceTxLite,
} from '@/lib/clients-data'
import { loadTransactions } from '@/lib/finances'
import dynamic from 'next/dynamic'
const ClientDetail = dynamic(() => import('./_detail'), { ssr: false })

type FilterKey = 'all' | 'active' | 'at-risk' | 'renewing' | 'stale'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'at-risk', label: 'At-Risk' },
  { key: 'renewing', label: 'Renewing < 30d' },
  { key: 'stale', label: 'Stale Contact' },
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

function formatDays(days: number): string {
  if (!isFinite(days)) return '—'
  if (days === 0) return 'today'
  if (days === 1) return '1d'
  return `${days}d`
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US')
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [comms, setComms] = useState<CommsEntry[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [txs, setTxs] = useState<FinanceTxLite[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadClients().then(setClients)
    loadComms().then(setComms)
    loadActions().then(setActions)
    // Pull finance income txs to derive payment status. Only need a tiny shape.
    loadTransactions().then(txs => setTxs(txs.map(t => ({
      type: t.type, date: t.date, amount: t.amount, clientId: t.clientId, status: t.status,
    }))))
  }, [])

  // Compute health for every client (memoized — recomputes when data changes)
  const enriched = useMemo(() => clients.map(c => ({
    client: c,
    health: computeHealth(c, comms, actions, txs),
    lastContact: lastContactDate(c, comms),
    openItems: openActionItems(c.id, actions).length,
    payment: computePaymentStatus(c, txs),
    ltv: computeLTV(c, txs),
  })), [clients, comms, actions, txs])

  // Portfolio LTV across active clients
  const totalActiveLTV = enriched
    .filter(e => e.client.status === 'active')
    .reduce((s, e) => s + e.ltv.total, 0)

  // KPI strip
  const totalActive = enriched.filter(e => e.client.status === 'active').length
  const atRiskCount = enriched.filter(e => e.client.status === 'at_risk' || e.health.score < 45).length
  const renewingCount = enriched.filter(e => {
    const d = daysUntil(e.client.renewalDate)
    return d < 30 && d > 0
  }).length
  const staleCount = enriched.filter(e => daysSince(e.lastContact) > 14).length

  // Apply filter
  const visible = useMemo(() => {
    return enriched.filter(({ client, lastContact, health }) => {
      switch (filter) {
        case 'active': return client.status === 'active'
        case 'at-risk': return client.status === 'at_risk' || health.score < 45
        case 'renewing': {
          const d = daysUntil(client.renewalDate)
          return d < 30 && d > 0
        }
        case 'stale': return daysSince(lastContact) > 14
        case 'all':
        default: return true
      }
    }).sort((a, b) => a.health.score - b.health.score) // worst first (needs attention)
  }, [enriched, filter])

  function addClient(c: Client) {
    const next = [...clients, c]
    setClients(next)
    saveClients(next)
  }

  function persistClients(next: Client[]) { setClients(next); saveClients(next) }
  function persistActions(next: ActionItem[]) { setActions(next); saveActions(next) }
  function persistComms(next: CommsEntry[]) { setComms(next); saveComms(next) }

  function updateClient(updated: Client) {
    persistClients(clients.map(c => c.id === updated.id ? updated : c))
  }
  function addAction(item: ActionItem) {
    persistActions([item, ...actions])
  }
  function toggleAction(id: string) {
    persistActions(actions.map(a => a.id === id ? { ...a, completed: !a.completed, completedAt: !a.completed ? Date.now() : undefined } : a))
  }
  function deleteAction(id: string) {
    persistActions(actions.filter(a => a.id !== id))
  }
  function addComms(entry: CommsEntry) {
    persistComms([entry, ...comms])
  }
  function updateComms(updated: CommsEntry) {
    persistComms(comms.map(c => c.id === updated.id ? updated : c))
  }
  function togglePinComms(id: string) {
    persistComms(comms.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c))
  }
  function deleteComms(id: string) {
    persistComms(comms.filter(c => c.id !== id))
  }

  const selectedClient = selectedId ? clients.find(c => c.id === selectedId) : null

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        subtitle="Active accounts at a glance — sorted by who needs attention."
        action={
          <button onClick={() => setShowAddModal(true)} style={{
            background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
            color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
          }}>
            + Add Client
          </button>
        }
      />

      {/* Renewal Pipeline banner — only shown when any clients are renewing soon */}
      {renewingCount > 0 && (
        <RenewalBanner
          clients={enriched.filter(e => {
            const d = daysUntil(e.client.renewalDate)
            return d < 30 && d > 0
          }).sort((a, b) => daysUntil(a.client.renewalDate) - daysUntil(b.client.renewalDate))}
          onSelect={id => setSelectedId(id)}
        />
      )}

      {/* KPI Strip */}
      <div className="kpi-strip" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Kpi label="Active" value={String(totalActive)} accent={colors.accent} />
        <Kpi label="At Risk" value={String(atRiskCount)} accent={atRiskCount > 0 ? colors.red : colors.textMuted} />
        <Kpi label="Renewing < 30d" value={String(renewingCount)} accent={renewingCount > 0 ? colors.yellow : colors.textMuted} />
        <Kpi label="Stale Contact" value={String(staleCount)} accent={staleCount > 0 ? colors.yellow : colors.textMuted} />
        <Kpi label="Active LTV" value={fmtMoney(totalActiveLTV)} accent={totalActiveLTV > 0 ? colors.accent : colors.textMuted} />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        {FILTERS.map(f => {
          const active = filter === f.key
          const count = f.key === 'all' ? enriched.length :
            f.key === 'active' ? totalActive :
            f.key === 'at-risk' ? atRiskCount :
            f.key === 'renewing' ? renewingCount :
            staleCount
          return (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px',
              borderRadius: borders.radius.medium,
              border: `1px solid ${active ? colors.accent : colors.border}`,
              background: active ? 'rgba(56,161,87,0.1)' : 'transparent',
              color: active ? colors.accent : colors.textMuted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              {f.label} <span style={{ ...mono, opacity: 0.6, marginLeft: 4 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Card grid */}
      {visible.length === 0 ? (
        <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
          No clients match this filter.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 14,
        }}>
          {visible.map(({ client, health, lastContact, openItems, payment, ltv }) => (
            <ClientCard
              key={client.id}
              client={client}
              healthScore={health.score}
              lastContact={lastContact}
              openItems={openItems}
              paymentState={payment.state}
              ltvTotal={ltv.total}
              ltvTenure={ltv.tenureLabel}
              onClick={() => setSelectedId(client.id)}
            />
          ))}
        </div>
      )}

      {/* Deep dive side panel */}
      {selectedClient && (
        <ClientDetail
          client={selectedClient}
          comms={comms}
          actions={actions}
          txs={txs}
          onClose={() => setSelectedId(null)}
          onUpdateClient={updateClient}
          onAddAction={addAction}
          onToggleAction={toggleAction}
          onDeleteAction={deleteAction}
          onAddComms={addComms}
          onUpdateComms={updateComms}
          onTogglePinComms={togglePinComms}
          onDeleteComms={deleteComms}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSave={addClient}
          existingIds={clients.map(c => c.id)}
        />
      )}
    </PageContainer>
  )
}

// ---- Client Card ----
function ClientCard({
  client, healthScore, lastContact, openItems, paymentState, ltvTotal, ltvTenure, onClick,
}: {
  client: Client
  healthScore: number
  lastContact: string
  openItems: number
  paymentState: 'current' | 'overdue' | 'no-billing'
  ltvTotal: number
  ltvTenure: string
  onClick: () => void
}) {
  const hColor = healthColor(healthScore)
  const healthHex = hColor === 'green' ? colors.accent : hColor === 'yellow' ? colors.yellow : colors.red
  const sColor = statusColor(client.status)
  const sBg = client.status === 'active' ? 'rgba(56,161,87,0.12)' :
              client.status === 'at_risk' ? 'rgba(255,123,114,0.12)' :
              client.status === 'onboarding' ? 'rgba(227,179,65,0.12)' :
              client.status === 'prospect' ? 'rgba(99,179,237,0.12)' :
              'rgba(125,138,153,0.12)'

  const daysContact = daysSince(lastContact)
  const renewalDays = daysUntil(client.renewalDate)
  const staleContact = daysContact > 14
  const renewingSoon = renewalDays < 30 && renewalDays > 0

  const paymentChip =
    paymentState === 'current' ? { label: 'PAID', color: colors.accent, bg: 'rgba(56,161,87,0.12)' } :
    paymentState === 'overdue' ? { label: 'OVERDUE', color: colors.red, bg: 'rgba(255,123,114,0.12)' } :
    null

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: '18px 20px',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'border-color 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,161,87,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border }}
    >
      {/* Top row: business name + status pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {client.business}
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {client.name}
          </div>
        </div>
        <span style={{
          ...mono,
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
          background: sBg, color: sColor,
          letterSpacing: '0.06em', whiteSpace: 'nowrap' as const,
        }}>
          {STATUS_LABELS[client.status]}
        </span>
      </div>

      {/* Health + service type + retainer */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minWidth: 64, padding: '8px 4px',
          background: hColor === 'green' ? 'rgba(56,161,87,0.08)' : hColor === 'yellow' ? 'rgba(227,179,65,0.08)' : 'rgba(255,123,114,0.08)',
          borderRadius: borders.radius.medium,
          border: `1px solid ${hColor === 'green' ? 'rgba(56,161,87,0.2)' : hColor === 'yellow' ? 'rgba(227,179,65,0.2)' : 'rgba(255,123,114,0.2)'}`,
        }}>
          <div style={{ ...mono, fontSize: 24, fontWeight: 700, color: healthHex, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {healthScore}
          </div>
          <div style={{ ...mono, fontSize: 8, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>
            HEALTH
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>SERVICE</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
              {SERVICE_TYPE_LABELS[client.serviceType]}
            </div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>RETAINER · LTV</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
              <span style={{ ...mono, fontSize: 14, fontWeight: 600, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
                {client.monthlyRetainer > 0 ? `${fmtMoney(client.monthlyRetainer)}/mo` : 'Project'}
              </span>
              {paymentChip && (
                <span style={{
                  ...mono,
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                  background: paymentChip.bg, color: paymentChip.color, letterSpacing: '0.06em',
                }}>
                  {paymentChip.label}
                </span>
              )}
            </div>
            <div style={{
              ...mono,
              fontSize: 11, color: ltvTotal > 0 ? colors.accent : colors.textMuted,
              marginTop: 3, fontVariantNumeric: 'tabular-nums' as const,
            }}>
              {ltvTotal > 0 ? `LTV ${fmtMoney(ltvTotal)}` : 'No LTV yet'}
              <span style={{ color: colors.textMuted, marginLeft: 6, fontSize: 10, fontWeight: 400 }}>
                · {ltvTenure}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.textMuted, paddingTop: 4, borderTop: `1px solid ${colors.border}` }}>
        <span>
          Contact: <span style={{ ...mono, color: staleContact ? colors.yellow : colors.text }}>{formatDays(daysContact)} ago</span>
        </span>
        <span>
          Renewal: <span style={{ ...mono, color: renewingSoon ? colors.yellow : colors.text }}>{isFinite(renewalDays) ? formatDays(renewalDays) : '—'}</span>
        </span>
        <span style={mono}>
          {openItems > 0 ? (
            <span style={{ color: colors.yellow }}>{openItems} open</span>
          ) : (
            <span>0 open</span>
          )}
        </span>
      </div>
    </div>
  )
}

// ---- Renewal pipeline banner ----
function RenewalBanner({
  clients, onSelect,
}: {
  clients: { client: Client }[]
  onSelect: (id: string) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 18px', marginBottom: 14,
      background: 'rgba(227,179,65,0.06)',
      border: '1px solid rgba(227,179,65,0.25)',
      borderRadius: borders.radius.medium,
    }}>
      <span style={{
        ...mono,
        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
        background: 'rgba(227,179,65,0.18)', color: colors.yellow,
        letterSpacing: '0.08em', whiteSpace: 'nowrap' as const,
      }}>
        RENEWAL PIPELINE
      </span>
      <span style={{ fontSize: 12, color: colors.textMuted }}>
        {clients.length} {clients.length === 1 ? 'client' : 'clients'} renewing in the next 30 days:
      </span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, flex: 1 }}>
        {clients.map(({ client }) => (
          <button
            key={client.id}
            onClick={() => onSelect(client.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '3px 8px', borderRadius: 4, fontFamily: 'inherit',
              color: colors.text, fontSize: 12, fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span>{client.business}</span>
            <span style={{ ...mono, fontSize: 11, color: colors.yellow, fontVariantNumeric: 'tabular-nums' as const }}>
              {daysUntil(client.renewalDate)}d
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---- KPI strip card ----
function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '14px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

// ---- Add client modal ----
function AddClientModal({
  onClose, onSave, existingIds,
}: {
  onClose: () => void
  onSave: (c: Client) => void
  existingIds: string[]
}) {
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [status, setStatus] = useState<ClientStatus>('onboarding')
  const [serviceType, setServiceType] = useState<ServiceType>('ads')
  const [monthlyRetainer, setMonthlyRetainer] = useState('')
  const todayIso = new Date().toISOString().slice(0, 10)

  function handleSave() {
    if (!name.trim() || !business.trim()) return
    let id = (Math.max(0, ...existingIds.map(i => parseInt(i, 10) || 0)) + 1).toString()
    if (existingIds.includes(id)) id = `c_${Date.now()}`
    onSave({
      id,
      name: name.trim(),
      business: business.trim(),
      status,
      serviceType,
      monthlyRetainer: parseFloat(monthlyRetainer) || 0,
      startDate: todayIso,
      renewalDate: 'N/A',
      lastContact: todayIso,
      notes: '',
      createdAt: Date.now(),
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
      <div className="modal-sheet" style={{ ...cardStyle, width: 420, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Add Client</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Contact Name</label>
            <input type="text" placeholder="e.g. John Smith" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Business Name</label>
            <input type="text" placeholder="e.g. Acme Landscape Co." value={business} onChange={e => setBusiness(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ClientStatus)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="prospect">Prospect</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Service Type</label>
            <select value={serviceType} onChange={e => setServiceType(e.target.value as ServiceType)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="ads">Ads</option>
              <option value="web">Web Design</option>
              <option value="retainer">Retainer</option>
              <option value="project">Project</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Monthly Retainer ($) — what they pay you</label>
            <input type="number" placeholder="0 for project-only" value={monthlyRetainer} onChange={e => setMonthlyRetainer(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button onClick={handleSave} style={{
          marginTop: 20, width: '100%', padding: '11px 0',
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Add Client
        </button>
      </div>
    </div>
  )
}
