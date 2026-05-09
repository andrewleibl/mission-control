'use client'

import { useState, useMemo } from 'react'
import { colors, cardStyle, cardStyleAccent, borders } from '@/components/DesignSystem'
import {
  Transaction, RecurringRule, confirmed,
} from '@/lib/finances'
import { ClientSummary } from '@/lib/clients-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

type RangeKey = 'this-month' | 'last-3' | 'ytd' | 'last-12'

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'this-month', label: 'This Month' },
  { key: 'last-3', label: 'Last 3' },
  { key: 'ytd', label: 'YTD' },
  { key: 'last-12', label: 'Last 12' },
]

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TODAY = new Date()

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function fmtSmall(n: number) {
  if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(Math.abs(n) >= 10000 ? 0 : 1) + 'k'
  return '$' + Math.round(n)
}
function toIso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

function getRangeBounds(range: RangeKey): { start: string; end: string; monthsBack: number } {
  const today = TODAY
  const todayIso = toIso(today)
  switch (range) {
    case 'this-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: toIso(start), end: todayIso, monthsBack: 1 }
    }
    case 'last-3': {
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      return { start: toIso(start), end: todayIso, monthsBack: 3 }
    }
    case 'ytd': {
      const start = new Date(today.getFullYear(), 0, 1)
      return { start: toIso(start), end: todayIso, monthsBack: today.getMonth() + 1 }
    }
    case 'last-12': {
      const start = new Date(today.getFullYear(), today.getMonth() - 11, 1)
      return { start: toIso(start), end: todayIso, monthsBack: 12 }
    }
  }
}

interface Props {
  txs: Transaction[]
  rules: RecurringRule[]
  clients: ClientSummary[]
}

export default function StatsView({ txs, rules, clients }: Props) {
  const [range, setRange] = useState<RangeKey>('last-3')
  const bounds = useMemo(() => getRangeBounds(range), [range])

  // Filter to confirmed transactions within range
  const inRange = useMemo(() =>
    confirmed(txs).filter(t => t.date >= bounds.start && t.date <= bounds.end),
    [txs, bounds.start, bounds.end]
  )

  const totalRevenue = inRange.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = inRange.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netProfit = totalRevenue - totalExpenses
  const margin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0
  const avgMonthlyBurn = bounds.monthsBack > 0 ? totalExpenses / bounds.monthsBack : 0

  // P&L trend: per-month bars across the selected range
  const monthlyTrend = useMemo(() => {
    const months: { month: string; ym: string; Revenue: number; Expenses: number; Net: number }[] = []
    const startDate = new Date(bounds.start + 'T12:00:00')
    const endDate = new Date(bounds.end + 'T12:00:00')
    let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    while (cursor <= endDate) {
      const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      const monthTxs = inRange.filter(t => t.date.slice(0, 7) === ym)
      const rev = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const exp = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      months.push({
        month: MONTHS_SHORT[cursor.getMonth()],
        ym,
        Revenue: rev,
        Expenses: exp,
        Net: rev - exp,
      })
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
    return months
  }, [inRange, bounds.start, bounds.end])

  // Expense breakdown by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    inRange.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [inRange])

  // Revenue breakdown: MRR (Client Retainer) vs other
  const revenueBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    inRange.filter(t => t.type === 'income').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [inRange])
  const mrrAmount = revenueBreakdown.find(([c]) => c === 'Client Retainer')?.[1] ?? 0
  const otherRevenue = totalRevenue - mrrAmount

  // Per-client P&L
  const clientPL = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number; clientName: string }> = {}
    for (const tx of inRange) {
      if (!tx.clientId) continue
      const c = clients.find(c => c.id === tx.clientId)
      if (!c) continue
      const entry = (map[tx.clientId] ??= { revenue: 0, expenses: 0, clientName: c.business })
      if (tx.type === 'income') entry.revenue += tx.amount
      else entry.expenses += tx.amount
    }
    // Add overhead row for unassigned tx
    const unassigned = inRange.filter(t => !t.clientId)
    if (unassigned.length > 0) {
      const rev = unassigned.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const exp = unassigned.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      map['__overhead'] = { revenue: rev, expenses: exp, clientName: '— Overhead / Unassigned' }
    }
    return Object.entries(map)
      .map(([id, v]) => ({
        id,
        clientName: v.clientName,
        revenue: v.revenue,
        expenses: v.expenses,
        net: v.revenue - v.expenses,
        margin: v.revenue > 0 ? Math.round(((v.revenue - v.expenses) / v.revenue) * 100) : null,
      }))
      .sort((a, b) => b.net - a.net)
  }, [inRange, clients])

  return (
    <div>
      {/* Range toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <RangeToggle value={range} onChange={setRange} />
        <span style={{ fontSize: 11, color: colors.textMuted, letterSpacing: '0.06em' }}>
          {bounds.start} → {bounds.end}
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <KpiCard label="Revenue" value={fmt(totalRevenue)} accent={colors.accent} />
        <KpiCard label="Expenses" value={fmt(totalExpenses)} accent={colors.red} />
        <KpiCard label="Net Profit" value={fmt(netProfit)} accent={netProfit >= 0 ? colors.accent : colors.red} />
        <KpiCard
          label="Margin"
          value={`${margin}%`}
          sub="of revenue"
          accent={margin >= 50 ? colors.accent : margin >= 25 ? colors.yellow : margin >= 0 ? colors.textMuted : colors.red}
        />
      </div>

      {/* P&L Trend Chart */}
      <div style={{ ...cardStyle, padding: '20px 24px', marginBottom: 16 }}>
        <SectionHeader title="P&L Trend" right={`avg burn / mo: ${fmt(avgMonthlyBurn)}`} />
        {monthlyTrend.length === 0 ? (
          <EmptyMsg>No data in this range yet.</EmptyMsg>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend} barGap={4} barCategoryGap="25%">
                <CartesianGrid vertical={false} stroke={colors.border} strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: colors.textMuted, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtSmall} tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                <Tooltip content={<TrendTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="Revenue" fill={colors.accent} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Expenses" fill={colors.red} radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
            <Legend items={[
              { label: 'Revenue', color: colors.accent },
              { label: 'Expenses', color: colors.red },
            ]} />
          </>
        )}
      </div>

      {/* Two-column row: Revenue Mix + Expense Mix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Revenue Mix */}
        <div style={{ ...cardStyle, padding: '20px 22px' }}>
          <SectionHeader
            title="Revenue Mix"
            right={mrrAmount > 0 ? `MRR: ${fmt(mrrAmount)}` : undefined}
          />
          {revenueBreakdown.length === 0 ? (
            <EmptyMsg>No revenue logged in this range.</EmptyMsg>
          ) : (
            <>
              {totalRevenue > 0 && (
                <div style={{ marginBottom: 14, padding: '10px 12px', background: colors.cardBgElevated, borderRadius: borders.radius.medium, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>RECURRING</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(mrrAmount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>ONE-OFF</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>{fmt(otherRevenue)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>RECURRING %</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
                      {totalRevenue > 0 ? Math.round((mrrAmount / totalRevenue) * 100) : 0}%
                    </div>
                  </div>
                </div>
              )}
              <CategoryBars items={revenueBreakdown} total={totalRevenue} color={colors.accent} />
            </>
          )}
        </div>

        {/* Expense Mix */}
        <div style={{ ...cardStyle, padding: '20px 22px' }}>
          <SectionHeader title="Expenses by Category" />
          {expenseByCategory.length === 0 ? (
            <EmptyMsg>No expenses logged in this range.</EmptyMsg>
          ) : (
            <CategoryBars items={expenseByCategory} total={totalExpenses} color={colors.red} />
          )}
        </div>
      </div>

      {/* Per-Client P&L */}
      <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <SectionHeader title="Per-Client P&L" right={`${clientPL.length} ${clientPL.length === 1 ? 'entity' : 'entities'}`} />
        </div>
        {clientPL.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
            No transactions tagged with a client in this range. Tag transactions in the Add modal to see per-client breakdown.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {['Client', 'Revenue', 'Expenses', 'Net', 'Margin'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px',
                    textAlign: i === 0 ? 'left' : 'right',
                    fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const, color: colors.textMuted,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientPL.map(c => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: c.id === '__overhead' ? colors.textMuted : colors.text, fontStyle: c.id === '__overhead' ? 'italic' as const : 'normal' as const }}>
                    {c.clientName}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: c.revenue > 0 ? colors.accent : colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                    {c.revenue > 0 ? fmt(c.revenue) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: c.expenses > 0 ? colors.red : colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                    {c.expenses > 0 ? fmt(c.expenses) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: c.net >= 0 ? colors.accent : colors.red, fontVariantNumeric: 'tabular-nums' }}>
                    {c.net >= 0 ? '+' : '−'}{fmt(Math.abs(c.net))}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: c.margin === null ? colors.textMuted : c.margin >= 50 ? colors.accent : c.margin >= 25 ? colors.yellow : c.margin >= 0 ? colors.textMuted : colors.red, fontVariantNumeric: 'tabular-nums' }}>
                    {c.margin === null ? '—' : `${c.margin}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Runway placeholder */}
      <div style={{
        ...cardStyleAccent, padding: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 6 }}>
            Runway — Coming Soon
          </div>
          <div style={{ fontSize: 14, color: colors.text, marginBottom: 4 }}>
            Set a starting bank balance to see runway in months.
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>
            Avg monthly burn over this range: <span style={{ color: colors.red, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmt(avgMonthlyBurn)}</span>
          </div>
        </div>
        <button disabled style={{
          padding: '8px 14px', borderRadius: borders.radius.medium,
          background: 'transparent', border: `1px dashed ${colors.border}`,
          color: colors.textMuted, fontSize: 12, fontWeight: 600,
          cursor: 'not-allowed', fontFamily: 'inherit',
        }}>
          Set starting balance
        </button>
      </div>
    </div>
  )
}

// ------------------ Subcomponents ------------------

function RangeToggle({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  return (
    <div style={{
      display: 'flex',
      background: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: borders.radius.medium,
      padding: 2,
    }}>
      {RANGES.map(r => {
        const active = value === r.key
        return (
          <button key={r.key} onClick={() => onChange(r.key)} style={{
            padding: '6px 14px',
            borderRadius: 6, border: 'none', cursor: 'pointer',
            background: active ? colors.accent : 'transparent',
            color: active ? '#fff' : colors.textMuted,
            fontSize: 12, fontWeight: 600,
            fontFamily: 'inherit',
          }}>{r.label}</button>
        )
      })}
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '18px 22px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: accent ?? colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ title, right }: { title: string; right?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const }}>
        {title}
      </span>
      {right && (
        <span style={{ fontSize: 11, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
          {right}
        </span>
      )}
    </div>
  )
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 0', color: colors.textMuted, fontSize: 13 }}>{children}</div>
  )
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: i.color }} />
          <span style={{ fontSize: 11, color: colors.textMuted }}>{i.label}</span>
        </div>
      ))}
    </div>
  )
}

function CategoryBars({ items, total, color }: { items: [string, number][]; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map(([cat, amt]) => {
        const pct = total > 0 ? Math.round((amt / total) * 100) : 0
        return (
          <div key={cat}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, color: colors.text }}>{cat}</span>
              <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ fontWeight: 600, color }}>{fmt(amt)}</span>
                <span style={{ color: colors.textMuted, marginLeft: 6 }}>{pct}%</span>
              </span>
            </div>
            <div style={{ height: 4, background: colors.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, opacity: 0.7 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const rev = payload.find(p => p.name === 'Revenue')?.value ?? 0
  const exp = payload.find(p => p.name === 'Expenses')?.value ?? 0
  const net = rev - exp
  return (
    <div style={{ background: '#141B24', border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: colors.textMuted, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ color: colors.accent, fontVariantNumeric: 'tabular-nums' as const }}>Revenue: {fmt(rev)}</div>
      <div style={{ color: colors.red, fontVariantNumeric: 'tabular-nums' as const }}>Expenses: {fmt(exp)}</div>
      <div style={{ color: net >= 0 ? colors.accent : colors.red, marginTop: 4, fontWeight: 600, fontVariantNumeric: 'tabular-nums' as const, borderTop: `1px solid ${colors.border}`, paddingTop: 4 }}>
        Net: {net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}
      </div>
    </div>
  )
}
