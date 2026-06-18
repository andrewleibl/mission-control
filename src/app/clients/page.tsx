'use client'

import { useState, useEffect, useMemo } from 'react'
import { Archive, RotateCcw } from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  Client, ClientStatus, ServiceType, SERVICE_TYPE_LABELS,
  CommsEntry, ActionItem,
  loadClients, saveClients, loadComms, saveComms, loadActions, saveActions,
  daysSince, daysUntil, lastContactDate,
  openActionItems, computePaymentStatus, computeLTV, FinanceTxLite,
} from '@/lib/clients-data'
import { loadTransactions } from '@/lib/finances'
import dynamic from 'next/dynamic'
const ClientDetail = dynamic(() => import('./_detail'), { ssr: false })

type FilterKey = 'all' | 'active' | 'renewing'
type MainTab = 'clients' | 'stats' | 'archived'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'renewing', label: 'Renewing < 30d' },
]

function statusColor(status: ClientStatus): string {
  switch (status) {
    case 'active': return colors.accent
    case 'onboarding': return colors.yellow
    case 'prospect': return colors.blue
    case 'churned': return colors.textMuted
    case 'archived': return colors.textMuted
  }
}

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US')
}

const thStyle: React.CSSProperties = {
  ...mono,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: colors.textMuted,
  textAlign: 'left' as const,
  padding: '10px 16px',
}

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle' as const,
}

// ---- Status Badge ----
function StatusBadge({ status }: { status: ClientStatus }) {
  const color = statusColor(status)
  const bg = status === 'active' ? 'rgba(56,161,87,0.12)' :
    status === 'onboarding' ? 'rgba(227,179,65,0.12)' :
    status === 'prospect' ? 'rgba(99,179,237,0.12)' :
    'rgba(125,138,153,0.12)'
  const labels: Record<ClientStatus, string> = {
    active: 'ACTIVE', onboarding: 'ONBOARDING',
    prospect: 'PROSPECT', churned: 'CHURNED', archived: 'ARCHIVED',
  }
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: bg, color, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const }}>
      {labels[status]}
    </span>
  )
}

// ---- Table header cell ----
function Th({ children }: { children?: React.ReactNode }) {
  return <th style={thStyle}>{children}</th>
}

function nextBillingDate(renewalDate: string): string | null {
  if (!renewalDate || renewalDate === 'N/A') return null
  const billingDay = new Date(renewalDate + 'T12:00:00').getDate()
  const now = new Date()
  let next = new Date(now.getFullYear(), now.getMonth(), billingDay)
  if (next.getTime() <= now.getTime()) {
    next = new Date(now.getFullYear(), now.getMonth() + 1, billingDay)
  }
  return next.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---- Client Table Row ----
function ClientRow({
  client, lastContact, openItems, paymentState, ltvTenure, onClick, onArchive,
}: {
  client: Client
  lastContact: string
  openItems: number
  paymentState: 'current' | 'overdue' | 'no-billing'
  ltvTenure: string
  onClick: () => void
  onArchive: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const daysContact = daysSince(lastContact)
  const renewalDays = daysUntil(client.renewalDate)

  const paymentChip =
    paymentState === 'current' ? { label: 'PAID', color: colors.accent, bg: 'rgba(56,161,87,0.12)' } :
    paymentState === 'overdue' ? { label: 'OVERDUE', color: colors.red, bg: 'rgba(255,123,114,0.12)' } :
    null

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 52,
        cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Client */}
      <td style={tdStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>{client.business}</div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{client.name}</div>
      </td>

      {/* Status */}
      <td style={tdStyle}>
        <StatusBadge status={client.status} />
      </td>

      {/* Service */}
      <td style={tdStyle}>
        <span style={{ ...mono, fontSize: 13, color: colors.textMuted }}>{SERVICE_TYPE_LABELS[client.serviceType]}</span>
      </td>

      {/* Retainer */}
      <td style={tdStyle}>
        <div style={{ ...mono, fontSize: 13 }}>
          {client.monthlyRetainer > 0 ? `${fmtMoney(client.monthlyRetainer)}/mo` : 'Project'}
        </div>
        {paymentChip && (
          <div style={{ marginTop: 3 }}>
            <span style={{
              ...mono,
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
              background: paymentChip.bg, color: paymentChip.color, letterSpacing: '0.06em',
            }}>
              {paymentChip.label}
            </span>
          </div>
        )}
        {client.monthlyRetainer > 0 && (() => {
          const d = nextBillingDate(client.renewalDate)
          return d ? (
            <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
              Bills {d}
            </div>
          ) : null
        })()}
      </td>

      {/* Last Contact */}
      <td style={tdStyle}>
        <span style={{ ...mono, fontSize: 13, color: daysContact > 14 ? colors.yellow : colors.textMuted }}>
          {isFinite(daysContact) ? `${daysContact}d ago` : '—'}
        </span>
      </td>

      {/* Renewal */}
      <td style={tdStyle}>
        <span style={{ ...mono, fontSize: 13, color: (renewalDays < 30 && renewalDays > 0) ? colors.yellow : colors.textMuted }}>
          {isFinite(renewalDays) && renewalDays > 0 ? `${renewalDays}d` : '—'}
        </span>
      </td>

      {/* Open items */}
      <td style={tdStyle}>
        <span style={{ ...mono, fontSize: 13, color: openItems > 0 ? colors.yellow : colors.textMuted }}>
          {openItems}
        </span>
      </td>

      {/* Archive action */}
      <td style={{ ...tdStyle, textAlign: 'right' as const }}>
        <button
          onClick={e => { e.stopPropagation(); onArchive() }}
          title="Archive client"
          style={{
            background: 'none',
            border: `1px solid ${colors.border}`,
            borderRadius: 5,
            padding: '5px 7px',
            cursor: 'pointer',
            color: colors.textMuted,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Archive size={16} />
        </button>
      </td>
    </tr>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [comms, setComms] = useState<CommsEntry[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [txs, setTxs] = useState<FinanceTxLite[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [mainTab, setMainTab] = useState<MainTab>('clients')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadClients().then(setClients)
    loadComms().then(setComms)
    loadActions().then(setActions)
    loadTransactions().then(txs => setTxs(txs.map(t => ({
      type: t.type, date: t.date, amount: t.amount, clientId: t.clientId, status: t.status,
    }))))
  }, [])

  const enriched = useMemo(() => clients.map(c => ({
    client: c,
    lastContact: lastContactDate(c, comms),
    openItems: openActionItems(c.id, actions).length,
    payment: computePaymentStatus(c, txs),
    ltv: computeLTV(c, txs),
  })), [clients, comms, actions, txs])

  // Derived counts for KPI strip and filter chips
  const activeClients = enriched.filter(e => e.client.status === 'active')
  const totalMRR = activeClients.reduce((s, e) => s + e.client.monthlyRetainer, 0)
  const totalActiveLTV = activeClients.reduce((s, e) => s + e.ltv.total, 0)
  const renewingCount = enriched.filter(e => {
    const d = daysUntil(e.client.renewalDate)
    return d < 30 && d > 0
  }).length
  const totalActive = activeClients.length

  // Archived list
  const archivedClients = enriched.filter(e => e.client.status === 'archived')

  // Clients tab: exclude archived, apply filter, sort by urgency
  const nonArchived = enriched.filter(e => e.client.status !== 'archived')

  const visible = useMemo(() => {
    return nonArchived.filter(({ client }) => {
      switch (filter) {
        case 'active': return client.status === 'active'
        case 'renewing': {
          const d = daysUntil(client.renewalDate)
          return d < 30 && d > 0
        }
        case 'all':
        default: return true
      }
    }).sort((a, b) => {
      const score = (e: typeof a) => {
        let s = 0
        const rd = daysUntil(e.client.renewalDate)
        if (rd < 30 && rd > 0) s += 30
        if (e.openItems > 0) s += 10
        return s
      }
      return score(b) - score(a)
    })
  }, [nonArchived, filter])

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

      {/* Main tab switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
        {(['clients', 'stats', 'archived'] as MainTab[]).map(t => (
          <button key={t} onClick={() => setMainTab(t)} style={{
            padding: '8px 18px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${mainTab === t ? colors.accent : 'transparent'}`,
            color: mainTab === t ? colors.accent : colors.textMuted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: -1, transition: 'color 0.15s', textTransform: 'capitalize' as const,
          }}>
            {t === 'clients' ? 'Clients' : t === 'stats' ? 'Stats' : `Archived${archivedClients.length > 0 ? ` (${archivedClients.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ---- Tab: clients ---- */}
      {mainTab === 'clients' && (
        <>
          {/* Renewal Pipeline banner */}
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
            <Kpi label="Monthly MRR" value={fmtMoney(totalMRR)} accent={colors.accent} />
            <Kpi label="Renewing < 30d" value={String(renewingCount)} accent={renewingCount > 0 ? colors.yellow : colors.textMuted} />
            <Kpi label="Active LTV" value={fmtMoney(totalActiveLTV)} accent={totalActiveLTV > 0 ? colors.accent : colors.textMuted} />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              const count = f.key === 'all' ? nonArchived.length :
                f.key === 'active' ? totalActive :
                renewingCount
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

          {/* Client cards */}
          {visible.length === 0 ? (
            <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
              No clients match this filter.
            </div>
          ) : (
            <div className="responsive-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {visible.map(({ client, openItems, payment, ltv }) => {
                const pay = payment.state === 'current' ? { label: 'PAID', color: colors.accent }
                  : payment.state === 'overdue' ? { label: 'OVERDUE', color: colors.red }
                  : null
                const renew = daysUntil(client.renewalDate)
                return (
                  <div key={client.id} onClick={() => setSelectedId(client.id)} style={{ ...cardStyle, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 110 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>{client.business}</span>
                      <StatusBadge status={client.status} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const, ...mono, fontSize: 11, color: colors.textMuted }}>
                      <span>{SERVICE_TYPE_LABELS[client.serviceType]}</span>
                      <span style={{ color: colors.text, fontWeight: 600 }}>{client.monthlyRetainer > 0 ? fmtMoney(client.monthlyRetainer) + '/mo' : 'project'}</span>
                      {pay && <span style={{ color: pay.color, fontWeight: 700, letterSpacing: '0.04em' }}>{pay.label}</span>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', ...mono, fontSize: 11, gap: 8, flexWrap: 'wrap' as const }}>
                      <span style={{ color: colors.textMuted }}>LTV <span style={{ color: ltv.total > 0 ? colors.accent : colors.textMuted, fontWeight: 600 }}>{ltv.total > 0 ? fmtMoney(ltv.total) : '—'}</span></span>
                      {renew < 30 && renew > 0 && <span style={{ color: colors.yellow }}>renews {renew}d</span>}
                      {openItems > 0 && <span style={{ color: colors.textMuted }}>{openItems} open</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ---- Tab: stats ---- */}
      {mainTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* KPI grid — 3 columns, 2 rows */}
          <div className="stat-strip-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Kpi label="Active Clients" value={String(activeClients.length)} accent={colors.accent} />
            <Kpi label="Monthly MRR" value={fmtMoney(totalMRR)} accent={colors.accent} />
            <Kpi label="Portfolio LTV" value={fmtMoney(totalActiveLTV)} accent={colors.accent} />
            <Kpi label="Renewing < 30d" value={String(renewingCount)} accent={renewingCount > 0 ? colors.yellow : colors.textMuted} />
            <Kpi label="Avg Retainer" value={fmtMoney(Math.round(totalMRR / Math.max(activeClients.length, 1)))} accent={colors.textMuted} />
          </div>

          {/* Revenue breakdown */}
          <div style={cardStyle}>
            <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 16 }}>Revenue by Client</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Client', 'Service', 'Retainer', 'Status', 'Tenure', 'LTV'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enriched
                  .filter(e => e.client.status !== 'archived' && e.client.status !== 'churned')
                  .sort((a, b) => b.client.monthlyRetainer - a.client.monthlyRetainer)
                  .map(({ client, payment: _payment, ltv }) => (
                    <tr key={client.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={tdStyle}><span style={{ fontWeight: 600, fontSize: 13 }}>{client.business}</span></td>
                      <td style={tdStyle}><span style={{ ...mono, fontSize: 12, color: colors.textMuted }}>{SERVICE_TYPE_LABELS[client.serviceType]}</span></td>
                      <td style={tdStyle}><span style={{ ...mono, fontSize: 13, fontVariantNumeric: 'tabular-nums' as const }}>{client.monthlyRetainer > 0 ? fmtMoney(client.monthlyRetainer) + '/mo' : '—'}</span></td>
                      <td style={tdStyle}><StatusBadge status={client.status} /></td>
                      <td style={tdStyle}><span style={{ ...mono, fontSize: 12, color: colors.textMuted }}>{ltv.tenureLabel}</span></td>
                      <td style={tdStyle}><span style={{ ...mono, fontSize: 13, color: ltv.total > 0 ? colors.accent : colors.textMuted, fontVariantNumeric: 'tabular-nums' as const }}>{ltv.total > 0 ? fmtMoney(ltv.total) : '—'}</span></td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${colors.border}` }}>
                  <td style={{ ...tdStyle, fontWeight: 700 }} colSpan={2}>Total MRR</td>
                  <td style={{ ...tdStyle, ...mono, fontWeight: 700, fontSize: 14 }}>{fmtMoney(totalMRR)}/mo</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ---- Tab: archived ---- */}
      {mainTab === 'archived' && (
        <div>
          {archivedClients.length === 0 ? (
            <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
              No archived clients.
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Client', 'Service', 'Retainer', ''].map((h, i) => (
                      <th key={i} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archivedClients.map(({ client }) => (
                    <tr key={client.id} style={{ borderBottom: `1px solid ${colors.border}`, opacity: 0.7 }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{client.business}</div>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>{client.name}</div>
                      </td>
                      <td style={tdStyle}><span style={{ ...mono, fontSize: 12, color: colors.textMuted }}>{SERVICE_TYPE_LABELS[client.serviceType]}</span></td>
                      <td style={tdStyle}><span style={{ ...mono, fontSize: 13 }}>{client.monthlyRetainer > 0 ? fmtMoney(client.monthlyRetainer) + '/mo' : '—'}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'right' as const }}>
                        <button
                          onClick={() => updateClient({ ...client, status: 'active' })}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'transparent', border: `1px solid ${colors.border}`,
                            borderRadius: 5, padding: '6px 12px', cursor: 'pointer',
                            color: colors.accent, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                          }}
                        >
                          <RotateCcw size={12} strokeWidth={2} /> Reactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
