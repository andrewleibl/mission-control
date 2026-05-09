'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders } from '@/components/DesignSystem'
import {
  Client, ClientStatus, CommsEntry, ActionItem,
  loadClients, saveClients, loadComms, loadActions,
  computeHealth, healthColor, daysSince, daysUntil, lastContactDate, openActionItems,
} from '@/lib/clients-data'

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
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    setClients(loadClients())
    setComms(loadComms())
    setActions(loadActions())
  }, [])

  // Compute health for every client (memoized — recomputes when data changes)
  const enriched = useMemo(() => clients.map(c => ({
    client: c,
    health: computeHealth(c, comms, actions),
    lastContact: lastContactDate(c, comms),
    openItems: openActionItems(c.id, actions).length,
  })), [clients, comms, actions])

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

      {/* KPI Strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Kpi label="Active" value={String(totalActive)} accent={colors.accent} />
        <Kpi label="At Risk" value={String(atRiskCount)} accent={atRiskCount > 0 ? colors.red : colors.textMuted} />
        <Kpi label="Renewing < 30d" value={String(renewingCount)} accent={renewingCount > 0 ? colors.yellow : colors.textMuted} />
        <Kpi label="Stale Contact" value={String(staleCount)} accent={staleCount > 0 ? colors.yellow : colors.textMuted} />
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
              {f.label} <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span>
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
          {visible.map(({ client, health, lastContact, openItems }) => (
            <ClientCard
              key={client.id}
              client={client}
              healthScore={health.score}
              lastContact={lastContact}
              openItems={openItems}
              onClick={() => setSelectedId(client.id)}
            />
          ))}
        </div>
      )}

      {/* Side panel placeholder for Phase 2 */}
      {selectedId && (
        <SidePanelPlaceholder
          clientId={selectedId}
          clients={clients}
          onClose={() => setSelectedId(null)}
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
  client, healthScore, lastContact, openItems, onClick,
}: {
  client: Client
  healthScore: number
  lastContact: string
  openItems: number
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

  // Lead delta
  const leadDelta = client.leadsMTD - client.prevMonthLeads
  const cplDelta = client.cpl - client.prevMonthCpl

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
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
          background: sBg, color: sColor,
          letterSpacing: '0.06em', whiteSpace: 'nowrap' as const,
        }}>
          {STATUS_LABELS[client.status]}
        </span>
      </div>

      {/* Health + key metrics */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minWidth: 64, padding: '8px 4px',
          background: hColor === 'green' ? 'rgba(56,161,87,0.08)' : hColor === 'yellow' ? 'rgba(227,179,65,0.08)' : 'rgba(255,123,114,0.08)',
          borderRadius: borders.radius.medium,
          border: `1px solid ${hColor === 'green' ? 'rgba(56,161,87,0.2)' : hColor === 'yellow' ? 'rgba(227,179,65,0.2)' : 'rgba(255,123,114,0.2)'}`,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: healthHex, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {healthScore}
          </div>
          <div style={{ fontSize: 8, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginTop: 2 }}>
            HEALTH
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>MTD LEADS</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
              {client.leadsMTD}
              {leadDelta !== 0 && client.prevMonthLeads > 0 && (
                <span style={{ fontSize: 11, marginLeft: 6, color: leadDelta > 0 ? colors.accent : colors.red }}>
                  {leadDelta > 0 ? '▲' : '▼'}{Math.abs(leadDelta)}
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>CPL</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
              {client.cpl > 0 ? fmtMoney(client.cpl) : '—'}
              {cplDelta !== 0 && client.prevMonthCpl > 0 && (
                <span style={{ fontSize: 11, marginLeft: 6, color: cplDelta < 0 ? colors.accent : colors.red }}>
                  {cplDelta > 0 ? '▲' : '▼'}{fmtMoney(Math.abs(cplDelta))}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: colors.textMuted, paddingTop: 4, borderTop: `1px solid ${colors.border}` }}>
        <span>
          Contact: <span style={{ color: staleContact ? colors.yellow : colors.text }}>{formatDays(daysContact)} ago</span>
        </span>
        <span>
          Renewal: <span style={{ color: renewingSoon ? colors.yellow : colors.text }}>{isFinite(renewalDays) ? formatDays(renewalDays) : '—'}</span>
        </span>
        <span>
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

// ---- KPI strip card ----
function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '14px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

// ---- Side panel placeholder ----
function SidePanelPlaceholder({ clientId, clients, onClose }: { clientId: string; clients: Client[]; onClose: () => void }) {
  const client = clients.find(c => c.id === clientId)
  if (!client) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: colors.cardBg, borderLeft: `1px solid ${colors.border}`,
        zIndex: 91, padding: 28, overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
              {STATUS_LABELS[client.status]}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {client.business}
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
              {client.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{
          ...cardStyleAccent,
          padding: 24, textAlign: 'center', marginTop: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: colors.accent, textTransform: 'uppercase' as const, marginBottom: 8 }}>
            Phase 2 — Up Next
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Deep Dive</div>
          <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
            Overview / Performance / Comms / Account tabs. Health breakdown, activity timeline, pinned notes, open action items.
          </div>
        </div>

        {client.notes && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: colors.cardBgElevated, borderRadius: borders.radius.medium }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>NOTES</div>
            <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.5 }}>{client.notes}</div>
          </div>
        )}
      </div>
    </>
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
  const [monthlySpend, setMonthlySpend] = useState('')

  function handleSave() {
    if (!name.trim() || !business.trim()) return
    let id = (Math.max(0, ...existingIds.map(i => parseInt(i, 10) || 0)) + 1).toString()
    if (existingIds.includes(id)) id = `c_${Date.now()}`
    onSave({
      id,
      name: name.trim(),
      business: business.trim(),
      status,
      monthlySpend: parseFloat(monthlySpend) || 0,
      leadsMTD: 0,
      prevMonthLeads: 0,
      cpl: 0,
      prevMonthCpl: 0,
      renewalDate: 'N/A',
      lastContact: new Date().toISOString().slice(0, 10),
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
    fontSize: 11, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 6,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ ...cardStyle, width: 420, padding: 28 }}>
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
            <label style={labelStyle}>Monthly Spend ($)</label>
            <input type="number" placeholder="0" value={monthlySpend} onChange={e => setMonthlySpend(e.target.value)} style={inputStyle} />
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
