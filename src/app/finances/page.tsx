'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders } from '@/components/DesignSystem'
import {
  Transaction, RecurringRule, Frequency, TxType, ProjectedTransaction,
  loadTransactions, saveTransactions, loadRules, saveRules,
  projectRecurring, confirmed, sumIncome, sumExpenses,
  approveProjection, skipProjection,
} from '@/lib/finances'
import { getClientsForTagging, ClientSummary } from '@/lib/clients-data'
import dynamic from 'next/dynamic'
const CalendarView = dynamic(() => import('./_calendar'), { ssr: false })
const StatsView = dynamic(() => import('./_stats'), { ssr: false })

type TabKey = 'calendar' | 'stats' | 'recurring' | 'all'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'calendar', label: 'Calendar' },
  { key: 'stats', label: 'Stats' },
  { key: 'recurring', label: 'Recurring' },
  { key: 'all', label: 'All Transactions' },
]

const today = new Date()
const todayIso = today.toISOString().slice(0, 10)

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function parseDate(s: string) { return new Date(s + 'T12:00:00') }

// =================================================================
// Add Transaction Modal
// =================================================================
interface ModalDefaults {
  type?: TxType
  date?: string
  category?: string
  amount?: number
  clientId?: string
  note?: string
}

function AddTransactionModal({
  onClose, onSave, clients, defaults, title, submitLabel,
}: {
  onClose: () => void
  onSave: (tx: Transaction) => void
  clients: ClientSummary[]
  defaults?: ModalDefaults
  title?: string
  submitLabel?: string
}) {
  const [type, setType] = useState<TxType>(defaults?.type ?? 'income')
  const [date, setDate] = useState(defaults?.date ?? todayIso)
  const [category, setCategory] = useState(defaults?.category ?? '')
  const [amount, setAmount] = useState(defaults?.amount ? String(defaults.amount) : '')
  const [note, setNote] = useState(defaults?.note ?? '')
  const [clientId, setClientId] = useState(defaults?.clientId ?? '')

  function handleTypeChange(t: TxType) {
    setType(t)
  }

  function handleSave() {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''))
    if (!val || val <= 0) return
    onSave({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type, date, category,
      amount: val,
      clientId: clientId || undefined,
      note: note.trim() || undefined,
      status: 'confirmed',
      createdAt: Date.now(),
    })
    onClose()
  }

  return (
    <ModalShell title={title ?? 'Add Transaction'} onClose={onClose}>
      <TypeToggle value={type} onChange={handleTypeChange} />

      <FieldGrid>
        <Field label="Date">
          <BaseInput type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
        <Field label={type === 'income' ? 'Income' : 'Expense'}>
          <BaseInput
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder={type === 'income' ? 'e.g. Client Retainer, Project Fee…' : 'e.g. Ad Spend, Software, Contractors…'}
          />
        </Field>
        <Field label="Amount ($)">
          <BaseInput type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Client (optional)">
          <BaseSelect value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">— None / Overhead —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business}</option>)}
          </BaseSelect>
        </Field>
        <Field label="Note (optional)">
          <BaseInput type="text" placeholder="e.g. invoice #, descriptor..." value={note} onChange={e => setNote(e.target.value)} />
        </Field>
      </FieldGrid>

      <PrimaryButton onClick={handleSave}>{submitLabel ?? 'Save Transaction'}</PrimaryButton>
    </ModalShell>
  )
}

// =================================================================
// Add Recurring Rule Modal
// =================================================================
function AddRecurringModal({
  onClose, onSave, clients,
}: {
  onClose: () => void
  onSave: (rule: RecurringRule) => void
  clients: ClientSummary[]
}) {
  const [type, setType] = useState<TxType>('expense')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [startDate, setStartDate] = useState(todayIso)
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [clientId, setClientId] = useState('')

  function handleTypeChange(t: TxType) {
    setType(t)
  }

  function handleSave() {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''))
    if (!val || val <= 0) return
    onSave({
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type, category,
      amount: val,
      frequency,
      startDate,
      endDate: endDate || undefined,
      clientId: clientId || undefined,
      note: note.trim() || undefined,
      autoConfirm: false,
      createdAt: Date.now(),
    })
    onClose()
  }

  return (
    <ModalShell title="Add Recurring Rule" onClose={onClose}>
      <TypeToggle value={type} onChange={handleTypeChange} />

      <FieldGrid>
        <Field label={type === 'income' ? 'Income' : 'Expense'}>
          <BaseInput
            type="text"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder={type === 'income' ? 'e.g. Client Retainer, Project Fee…' : 'e.g. Ad Spend, Software, Contractors…'}
          />
        </Field>
        <Field label="Amount ($)">
          <BaseInput type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Frequency">
          <BaseSelect value={frequency} onChange={e => setFrequency(e.target.value as Frequency)}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </BaseSelect>
        </Field>
        <Field label="Start Date">
          <BaseInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="End Date (optional)">
          <BaseInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Field>
        <Field label="Client (optional)">
          <BaseSelect value={clientId} onChange={e => setClientId(e.target.value)}>
            <option value="">— None / Overhead —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.business}</option>)}
          </BaseSelect>
        </Field>
        <Field label="Note (optional)">
          <BaseInput type="text" placeholder="e.g. Notion subscription" value={note} onChange={e => setNote(e.target.value)} />
        </Field>
      </FieldGrid>

      <PrimaryButton onClick={handleSave}>Save Recurring Rule</PrimaryButton>
    </ModalShell>
  )
}

// =================================================================
// Reusable form pieces
// =================================================================
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-sheet" style={{ ...cardStyle, width: 460, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function TypeToggle({ value, onChange }: { value: TxType; onChange: (t: TxType) => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {(['income', 'expense'] as TxType[]).map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          flex: 1, padding: '8px 0',
          borderRadius: borders.radius.medium,
          border: `1px solid ${value === t ? (t === 'income' ? colors.accent : colors.red) : colors.border}`,
          background: value === t ? (t === 'income' ? 'rgba(56,161,87,0.12)' : 'rgba(255,123,114,0.1)') : 'transparent',
          color: value === t ? (t === 'income' ? colors.accent : colors.red) : colors.textMuted,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          {t === 'income' ? '+ Income' : '− Expense'}
        </button>
      ))}
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const baseInputStyle: React.CSSProperties = {
  background: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: borders.radius.medium,
  padding: '10px 12px',
  color: colors.text,
  fontSize: 14,
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
}

function BaseInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...baseInputStyle, ...(props.style ?? {}) }} />
}

function BaseSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return <select {...props} style={{ ...baseInputStyle, cursor: 'pointer', ...(props.style ?? {}) }}>{props.children}</select>
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      marginTop: 20, width: '100%', padding: '11px 0',
      background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
      color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

// =================================================================
// Tab views (Calendar / Stats are Phase 2/3 placeholders)
// =================================================================
function PlaceholderCard({ phase, title, description }: { phase: string; title: string; description: string }) {
  return (
    <div style={{
      ...cardStyleAccent, padding: 60, textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: colors.accent, textTransform: 'uppercase' as const, marginBottom: 12 }}>
        {phase}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: colors.textMuted, maxWidth: 480, margin: '0 auto' }}>{description}</div>
    </div>
  )
}

function RecurringTab({
  rules, clients, onAdd, onDelete,
}: {
  rules: RecurringRule[]
  clients: ClientSummary[]
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Recurring Rules</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            Define a transaction once, it auto-projects. Each instance requires your approval before it counts.
          </div>
        </div>
        <button onClick={onAdd} style={{
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
        }}>+ New Rule</button>
      </div>

      {rules.length === 0 ? (
        <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
          No recurring rules yet. Add one for your software subs, retainers, or contractor pay.
        </div>
      ) : (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {['Type', 'Category', 'Client', 'Frequency', 'Amount', 'Starts', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: h === 'Amount' ? 'right' : 'left',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const, color: colors.textMuted,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map(r => {
                const client = r.clientId ? clients.find(c => c.id === r.clientId) : undefined
                return (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                        background: r.type === 'income' ? 'rgba(56,161,87,0.12)' : 'rgba(255,123,114,0.1)',
                        color: r.type === 'income' ? colors.accent : colors.red,
                        letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                      }}>{r.type === 'income' ? 'In' : 'Out'}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: colors.text }}>
                      {r.category}
                      {r.note && <span style={{ color: colors.textMuted, marginLeft: 6 }}>· {r.note}</span>}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: colors.textMuted }}>
                      {client?.business ?? '—'}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: colors.textMuted, textTransform: 'capitalize' as const }}>{r.frequency}</td>
                    <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 600, color: r.type === 'income' ? colors.accent : colors.red, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(r.amount)}
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: colors.textMuted }}>
                      {parseDate(r.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                      <button onClick={() => onDelete(r.id)} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>✕</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AllTransactionsTab({
  txs, clients, onDelete, onEdit,
}: {
  txs: Transaction[]
  clients: ClientSummary[]
  onDelete: (id: string) => void
  onEdit: (tx: Transaction) => void
}) {
  const sorted = useMemo(() => [...confirmed(txs)].sort((a, b) => b.date.localeCompare(a.date)), [txs])

  if (sorted.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
        No transactions yet. Hit + Add Transaction to log one.
      </div>
    )
  }

  return (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
            {['Date', 'Type', 'Category', 'Client', 'Note', 'Amount', '', ''].map((h, i) => (
              <th key={h} style={{
                padding: '10px 16px', textAlign: h === 'Amount' ? 'right' : 'left',
                fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase' as const, color: colors.textMuted,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(tx => {
            const client = tx.clientId ? clients.find(c => c.id === tx.clientId) : undefined
            return (
              <tr key={tx.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                <td style={{ padding: '11px 16px', fontSize: 13, color: colors.textMuted, whiteSpace: 'nowrap' as const }}>
                  {parseDate(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4,
                    background: tx.type === 'income' ? 'rgba(56,161,87,0.12)' : 'rgba(255,123,114,0.1)',
                    color: tx.type === 'income' ? colors.accent : colors.red,
                    letterSpacing: '0.04em', textTransform: 'uppercase' as const,
                  }}>{tx.type === 'income' ? 'In' : 'Out'}</span>
                </td>
                <td style={{ padding: '11px 16px', fontSize: 13, color: colors.text }}>{tx.category}</td>
                <td style={{ padding: '11px 16px', fontSize: 13, color: colors.textMuted }}>{client?.business ?? '—'}</td>
                <td style={{ padding: '11px 16px', fontSize: 13, color: colors.textMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {tx.note ?? '—'}
                </td>
                <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 600, color: tx.type === 'income' ? colors.accent : colors.red, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                </td>
                <td style={{ padding: '11px 8px', textAlign: 'right' }}>
                  <button onClick={() => onEdit(tx)} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }} title="Edit">✏</button>
                </td>
                <td style={{ padding: '11px 8px', textAlign: 'right' }}>
                  <button onClick={() => onDelete(tx.id)} style={{ fontSize: 12, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4 }}>✕</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// =================================================================
// Main page
// =================================================================
type TxModalState =
  | { kind: 'add'; date: string }
  | { kind: 'edit-confirm'; projection: ProjectedTransaction }
  | { kind: 'edit'; tx: Transaction }
  | null

export default function FinancesPage() {
  const [tab, setTab] = useState<TabKey>('calendar')
  const [txs, setTxs] = useState<Transaction[]>([])
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [txModal, setTxModal] = useState<TxModalState>(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone: 'success' | 'info' | 'error' } | null>(null)

  const [clients, setClients] = useState<ClientSummary[]>([])

  useEffect(() => {
    loadTransactions().then(setTxs)
    loadRules().then(setRules)
    getClientsForTagging().then(setClients)
  }, [])

  // Auto-dismiss toast after 2.5s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(msg: string, tone: 'success' | 'info' | 'error' = 'success') {
    setToast({ msg, tone })
  }

  function persistTxs(next: Transaction[]) { setTxs(next); saveTransactions(next) }
  function persistRules(next: RecurringRule[]) { setRules(next); saveRules(next) }

  function deleteTx(id: string) {
    persistTxs(txs.filter(t => t.id !== id))
    showToast('Transaction deleted', 'info')
  }
  function addRule(rule: RecurringRule) {
    persistRules([rule, ...rules])
    showToast('Recurring rule added')
  }
  function deleteRule(id: string) {
    persistRules(rules.filter(r => r.id !== id))
    persistTxs(txs.filter(t => t.recurringId !== id))
    showToast('Rule deleted', 'info')
  }

  function openTxModal(date?: string) { setTxModal({ kind: 'add', date: date ?? todayIso }) }
  function openEditConfirm(projection: ProjectedTransaction) { setTxModal({ kind: 'edit-confirm', projection }) }
  function closeTxModal() { setTxModal(null) }

  function handleTxModalSave(tx: Transaction) {
    if (txModal?.kind === 'edit-confirm') {
      persistTxs(approveProjection(txs, txModal.projection, {
        amount: tx.amount, category: tx.category, clientId: tx.clientId, note: tx.note, date: tx.date,
      }))
      showToast('Recurring entry confirmed')
    } else if (txModal?.kind === 'edit') {
      persistTxs(txs.map(t => t.id === txModal.tx.id ? { ...t, ...tx, id: txModal.tx.id, createdAt: txModal.tx.createdAt, recurringId: txModal.tx.recurringId } : t))
      showToast('Transaction updated')
    } else {
      persistTxs([tx, ...txs])
      showToast('Transaction added')
    }
  }

  function approveProj(projection: ProjectedTransaction) {
    persistTxs(approveProjection(txs, projection))
    showToast('Approved')
  }
  function skipProj(projection: ProjectedTransaction) {
    persistTxs(skipProjection(txs, projection))
    showToast('Skipped', 'info')
  }

  // Page-level keyboard shortcuts: N for new transaction, Esc to close modals
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key.toLowerCase() === 'n' && !txModal && !showRuleModal) {
        e.preventDefault()
        openTxModal()
      }
      if (e.key === 'Escape') {
        if (txModal) setTxModal(null)
        else if (showRuleModal) setShowRuleModal(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [txModal, showRuleModal])

  // Pending approvals count: project the next 14 days, count what's not yet approved
  const pendingCount = useMemo(() => {
    const start = todayIso
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 14)
    const end = endDate.toISOString().slice(0, 10)
    return projectRecurring(rules, txs, start, end).filter(p => p.date >= todayIso && p.date <= end).length
  }, [rules, txs])

  // Quick stats for header strip
  const monthIso = todayIso.slice(0, 7)
  const monthTxs = useMemo(() => txs.filter(t => t.date.slice(0, 7) === monthIso), [txs, monthIso])
  const monthRev = sumIncome(monthTxs)
  const monthExp = sumExpenses(monthTxs)
  const monthNet = monthRev - monthExp

  return (
    <PageContainer>
      <PageHeader
        title="Finances"
        subtitle="Income & expense tracking with per-client P&L."
        action={
          <button onClick={() => openTxModal()} style={{
            background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
            color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
          }}>
            + Add Transaction
          </button>
        }
      />

      {/* Quick header stats — current month */}
      <div className="kpi-strip" style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
        <MiniStat label={`${parseDate(todayIso + '').toLocaleDateString('en-US', { month: 'long' })} Revenue`} value={fmt(monthRev)} accent={colors.accent} />
        <MiniStat label="Month Expenses" value={fmt(monthExp)} accent={colors.red} />
        <MiniStat label="Net" value={fmt(monthNet)} accent={monthNet >= 0 ? colors.accent : colors.red} />
        <MiniStat label="Pending Approvals" value={String(pendingCount)} accent={pendingCount > 0 ? colors.yellow : colors.textMuted} />
      </div>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: 13, fontWeight: 600,
              color: active ? colors.text : colors.textMuted,
              borderBottom: `2px solid ${active ? colors.accent : 'transparent'}`,
              marginBottom: -1, transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'calendar' && (
        <CalendarView
          txs={txs}
          rules={rules}
          clients={clients}
          onAddForDay={openTxModal}
          onApprove={approveProj}
          onSkip={skipProj}
          onEditAndConfirm={openEditConfirm}
          onDeleteTx={deleteTx}
        />
      )}
      {tab === 'stats' && (
        <StatsView txs={txs} rules={rules} clients={clients} />
      )}
      {tab === 'recurring' && (
        <RecurringTab rules={rules} clients={clients} onAdd={() => setShowRuleModal(true)} onDelete={deleteRule} />
      )}
      {tab === 'all' && (
        <AllTransactionsTab txs={txs} clients={clients} onDelete={deleteTx} onEdit={tx => setTxModal({ kind: 'edit', tx })} />
      )}

      {txModal && (
        <AddTransactionModal
          onClose={closeTxModal}
          onSave={handleTxModalSave}
          clients={clients}
          defaults={
            txModal.kind === 'add'
              ? { date: txModal.date }
              : txModal.kind === 'edit'
              ? { type: txModal.tx.type, date: txModal.tx.date, amount: txModal.tx.amount, category: txModal.tx.category, clientId: txModal.tx.clientId, note: txModal.tx.note }
              : { type: txModal.projection.type, date: txModal.projection.date, amount: txModal.projection.amount, category: txModal.projection.category, clientId: txModal.projection.clientId, note: txModal.projection.note }
          }
          title={txModal.kind === 'edit-confirm' ? 'Edit & Confirm' : txModal.kind === 'edit' ? 'Edit Transaction' : undefined}
          submitLabel={txModal.kind === 'edit-confirm' ? 'Confirm Transaction' : txModal.kind === 'edit' ? 'Save Changes' : undefined}
        />
      )}
      {showRuleModal && <AddRecurringModal onClose={() => setShowRuleModal(false)} onSave={addRule} clients={clients} />}

      {toast && <Toast {...toast} />}
    </PageContainer>
  )
}

function Toast({ msg, tone }: { msg: string; tone: 'success' | 'info' | 'error' }) {
  const bg = tone === 'success' ? 'rgba(56,161,87,0.95)' : tone === 'error' ? 'rgba(255,123,114,0.95)' : 'rgba(20,27,36,0.97)'
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: bg,
      color: '#fff',
      padding: '11px 22px',
      borderRadius: 999,
      fontSize: 13, fontWeight: 600,
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      zIndex: 1000,
      pointerEvents: 'none',
      backdropFilter: 'blur(10px)',
    }}>
      {msg}
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '14px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: accent ?? colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}
