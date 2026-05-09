'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, typography, spacing, borders } from '@/components/DesignSystem'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

type TxType = 'income' | 'expense'

interface Transaction {
  id: string
  date: string
  type: TxType
  category: string
  amount: number
  note: string
}

const INCOME_CATEGORIES = ['Client Retainer', 'Project Fee', 'Upsell', 'Ad Management', 'Other']
const EXPENSE_CATEGORIES = ['Software / Tools', 'Contractors', 'Ad Spend', 'Subscriptions', 'Office / Admin', 'Other']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const now = new Date()

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtSmall(n: number) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k'
  return fmt(n)
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function parseDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00')
}

// ---- Stat Card ----
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '20px 22px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: accent ?? colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ---- Add Modal ----
function AddModal({ onClose, onSave }: { onClose: () => void; onSave: (tx: Transaction) => void }) {
  const [type, setType] = useState<TxType>('income')
  const [date, setDate] = useState(now.toISOString().slice(0, 10))
  const [category, setCategory] = useState(INCOME_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleTypeChange(t: TxType) {
    setType(t)
    setCategory(t === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
  }

  function handleSave() {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''))
    if (!val || val <= 0) return
    onSave({ id: Date.now().toString(), date, type, category, amount: val, note: note.trim() })
    onClose()
  }

  const inputBase: React.CSSProperties = {
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

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ ...cardStyle, width: 420, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Add Transaction</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['income', 'expense'] as TxType[]).map(t => (
            <button key={t} onClick={() => handleTypeChange(t)} style={{
              flex: 1, padding: '8px 0',
              borderRadius: borders.radius.medium,
              border: `1px solid ${type === t ? (t === 'income' ? colors.accent : colors.red) : colors.border}`,
              background: type === t ? (t === 'income' ? 'rgba(56,161,87,0.12)' : 'rgba(255,123,114,0.1)') : 'transparent',
              color: type === t ? (t === 'income' ? colors.accent : colors.red) : colors.textMuted,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              {t === 'income' ? '+ Income' : '− Expense'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Date', el: <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputBase} /> },
            { label: 'Category', el: <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputBase, cursor: 'pointer' }}>{cats.map(c => <option key={c} value={c}>{c}</option>)}</select> },
            { label: 'Amount ($)', el: <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={inputBase} /> },
            { label: 'Note (optional)', el: <input type="text" placeholder="e.g. client name, invoice #" value={note} onChange={e => setNote(e.target.value)} style={inputBase} /> },
          ].map(({ label, el }) => (
            <div key={label}>
              <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6 }}>{label}</label>
              {el}
            </div>
          ))}
        </div>

        <button onClick={handleSave} style={{
          marginTop: 20, width: '100%', padding: '11px 0',
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save Transaction
        </button>
      </div>
    </div>
  )
}

// ---- Chart Tooltip ----
function PLTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#141B24', border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: colors.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.name === 'Revenue' ? colors.accent : colors.red }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  )
}

export default function FinancesPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [showModal, setShowModal] = useState(false)
  const [viewMonth, setViewMonth] = useState(getMonthKey(now))
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('mc_finances_txs')
      if (saved) setTxs(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  function saveTxs(next: Transaction[]) {
    setTxs(next)
    localStorage.setItem('mc_finances_txs', JSON.stringify(next))
  }

  function addTx(tx: Transaction) { saveTxs([tx, ...txs]) }
  function deleteTx(id: string) { saveTxs(txs.filter(t => t.id !== id)); setDeleteId(null) }

  const monthTxs = useMemo(() => txs.filter(t => t.date.slice(0, 7) === viewMonth), [txs, viewMonth])
  const monthRevenue = useMemo(() => monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxs])
  const monthExpenses = useMemo(() => monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxs])
  const monthProfit = monthRevenue - monthExpenses
  const monthMargin = monthRevenue > 0 ? Math.round((monthProfit / monthRevenue) * 100) : 0

  const plChartData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = getMonthKey(d)
    const m = txs.filter(t => t.date.slice(0, 7) === key)
    return {
      month: MONTHS[d.getMonth()],
      Revenue: m.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      Expenses: m.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  }), [txs])

  const expenseCats = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { map[t.category] = (map[t.category] ?? 0) + t.amount })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [monthTxs])

  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { key: getMonthKey(d), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
  }).reverse(), [])

  const selectBase: React.CSSProperties = {
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium,
    padding: '8px 12px',
    color: colors.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  }

  return (
    <PageContainer>
      <PageHeader
        title="Finances"
        subtitle="Income & expense tracking — P&L by month and quarter."
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select value={viewMonth} onChange={e => setViewMonth(e.target.value)} style={selectBase}>
              {monthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <button onClick={() => setShowModal(true)} style={{
              background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
              color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' as const,
            }}>
              + Add
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        <StatCard label="Revenue" value={fmt(monthRevenue)} sub={monthOptions.find(m => m.key === viewMonth)?.label} accent={colors.accent} />
        <StatCard label="Expenses" value={fmt(monthExpenses)} accent={colors.red} />
        <StatCard label="Net Profit" value={fmt(monthProfit)} accent={monthProfit >= 0 ? colors.accent : colors.red} />
        <StatCard
          label="Margin"
          value={`${monthMargin}%`}
          sub="of revenue"
          accent={monthMargin >= 50 ? colors.accent : monthMargin >= 25 ? colors.yellow : colors.red}
        />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 24 }}>
        <div style={{ ...cardStyle, padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 16 }}>
            P&L — Last 6 Months
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={plChartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={colors.border} strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtSmall} tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<PLTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Revenue" fill={colors.accent} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill={colors.red} radius={[3, 3, 0, 0]} opacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            {[{ l: 'Revenue', c: colors.accent }, { l: 'Expenses', c: colors.red }].map(({ l, c }) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 11, color: colors.textMuted }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 16 }}>
            Expenses by Category
          </div>
          {expenseCats.length === 0 ? (
            <div style={{ color: colors.textMuted, fontSize: 13, paddingTop: 8 }}>No expenses this month.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {expenseCats.map(([cat, amt]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: colors.text }}>{cat}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.red, fontVariantNumeric: 'tabular-nums' }}>{fmt(amt)}</span>
                  </div>
                  <div style={{ height: 4, background: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round((amt / monthExpenses) * 100)}%`, background: colors.red, borderRadius: 2, opacity: 0.65 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Log */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const }}>
            Transactions — {monthOptions.find(m => m.key === viewMonth)?.label}
          </span>
          <span style={{ fontSize: 12, color: colors.textMuted }}>{monthTxs.length} entries</span>
        </div>

        {monthTxs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
            No transactions logged for this month.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {['Date', 'Type', 'Category', 'Note', 'Amount', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 16px',
                    textAlign: h === 'Amount' ? 'right' : 'left',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const, color: colors.textMuted,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...monthTxs].sort((a, b) => b.date.localeCompare(a.date)).map(tx => (
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
                    }}>
                      {tx.type === 'income' ? 'In' : 'Out'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: colors.text }}>{tx.category}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: colors.textMuted, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {tx.note || '—'}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 600, color: tx.type === 'income' ? colors.accent : colors.red, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                    {deleteId === tx.id ? (
                      <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => deleteTx(tx.id)} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                        <button onClick={() => setDeleteId(null)} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setDeleteId(tx.id)} style={{ fontSize: 11, color: colors.textMuted, background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4 }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddModal onClose={() => setShowModal(false)} onSave={addTx} />}
    </PageContainer>
  )
}
