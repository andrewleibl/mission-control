'use client'

import { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { Pencil, Check, X, TrendingUp, TrendingDown } from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  Transaction, RecurringRule,
  loadTransactions, loadRules,
} from '@/lib/finances'
import {
  MonthBreakdown, Contributor, DEFAULT_GOAL_KEY,
  buildBreakdowns, loadGoals, setGoal, clearGoal,
} from '@/lib/projections'

function fmt(n: number) {
  const sign = n < 0 ? '−' : ''
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtCompact(n: number) {
  const abs = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (abs >= 10000) return sign + '$' + (abs / 1000).toFixed(0) + 'k'
  if (abs >= 1000) return sign + '$' + (abs / 1000).toFixed(1) + 'k'
  return sign + '$' + Math.round(abs)
}

export default function ProjectionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [goals, setGoals] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState<string | null>(null) // 'default' or 'YYYY-MM' or null
  const [goalDraft, setGoalDraft] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([loadTransactions(), loadRules(), loadGoals()]).then(([t, r, g]) => {
      if (cancelled) return
      setTxs(t); setRules(r); setGoals(g); setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const months = useMemo(
    () => buildBreakdowns(txs, rules, { monthsBack: 1, monthsAhead: 11, goals }),
    [txs, rules, goals],
  )

  const defaultGoal = goals.get(DEFAULT_GOAL_KEY) ?? 0
  const currentMonth = months.find(m => m.isCurrent)
  const futureMonths = months.filter(m => !m.isPast)

  async function saveGoal(scope: string) {
    const amt = parseFloat(goalDraft.replace(/[^0-9.\\-]/g, ''))
    if (isNaN(amt) || amt < 0) { setEditingGoal(null); return }
    await setGoal(scope, amt)
    setGoals(prev => {
      const next = new Map(prev)
      next.set(scope, amt)
      return next
    })
    setEditingGoal(null)
  }

  async function removeOverride(scope: string) {
    await clearGoal(scope)
    setGoals(prev => {
      const next = new Map(prev)
      next.delete(scope)
      return next
    })
  }

  function startEdit(scope: string, current: number) {
    setGoalDraft(current > 0 ? String(current) : '')
    setEditingGoal(scope)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projections"
        subtitle="Forward view of net profit from your Finances data. Set a monthly goal and watch the gap."
      />

      {loading ? (
        <div style={{ color: colors.textMuted, padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {/* This-month + default-goal strip */}
          <ThisMonth
            current={currentMonth}
            defaultGoal={defaultGoal}
            editing={editingGoal === DEFAULT_GOAL_KEY}
            goalDraft={goalDraft}
            onStartEdit={() => startEdit(DEFAULT_GOAL_KEY, defaultGoal)}
            onCancel={() => setEditingGoal(null)}
            onChangeDraft={setGoalDraft}
            onSave={() => saveGoal(DEFAULT_GOAL_KEY)}
          />

          {/* Forecast chart */}
          <ForecastChart months={futureMonths} />

          {/* Per-month cards */}
          <div style={{ display: 'grid', gap: 12 }}>
            {futureMonths.map(m => (
              <MonthCard
                key={m.iso}
                month={m}
                editing={editingGoal === m.iso}
                goalDraft={goalDraft}
                hasOverride={goals.has(m.iso)}
                defaultGoal={defaultGoal}
                onStartEdit={() => startEdit(m.iso, m.goal)}
                onCancel={() => setEditingGoal(null)}
                onChangeDraft={setGoalDraft}
                onSave={() => saveGoal(m.iso)}
                onRemoveOverride={() => removeOverride(m.iso)}
              />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}

// =================================================================
// This-month strip
// =================================================================
function ThisMonth({
  current, defaultGoal, editing, goalDraft,
  onStartEdit, onCancel, onChangeDraft, onSave,
}: {
  current: MonthBreakdown | undefined
  defaultGoal: number
  editing: boolean
  goalDraft: string
  onStartEdit: () => void
  onCancel: () => void
  onChangeDraft: (s: string) => void
  onSave: () => void
}) {
  const booked = current ? current.confirmedIncome - current.confirmedExpense : 0
  const projected = current?.net ?? 0
  const goal = current?.goal ?? defaultGoal
  const gap = goal - projected
  const onTrack = projected >= goal
  const goalDisplay = (
    editing ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ ...mono, fontSize: 16, color: colors.text }}>$</span>
        <input
          autoFocus
          inputMode="decimal"
          value={goalDraft}
          onChange={e => onChangeDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
          style={{
            ...mono,
            width: 110, background: colors.bg, border: `1px solid ${colors.accent}`,
            borderRadius: borders.radius.small, color: colors.text,
            fontSize: 22, fontWeight: 700, padding: '4px 8px', outline: 'none',
          }}
        />
        <button onClick={onSave} style={iconBtnStyle(colors.accent)} title="Save"><Check size={14} /></button>
        <button onClick={onCancel} style={iconBtnStyle(colors.textMuted)} title="Cancel"><X size={14} /></button>
      </span>
    ) : (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: colors.text }}>
          {goal > 0 ? fmt(goal) : '—'}
        </span>
        <button onClick={onStartEdit} style={iconBtnStyle(colors.textMuted)} title="Edit monthly goal">
          <Pencil size={13} />
        </button>
      </span>
    )
  )

  return (
    <div style={{
      ...cardStyleAccent, padding: 20,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
    }} className="proj-this-month">
      <Kpi label={current ? `This month · ${current.label}` : 'This month'} value={fmt(booked)} sub="Booked (confirmed net)" />
      <Kpi label="Projected" value={fmt(projected)} sub="Confirmed + recurring this month" accent={projected >= 0 ? colors.accent : colors.red} divider />
      <KpiRaw label="Monthly Net Profit Goal" valueNode={goalDisplay} sub={goal > 0 ? 'Income − expenses target' : 'Click pencil to set'} divider />
      <Kpi
        label={onTrack ? 'Beat by' : 'Net gap to goal'}
        value={goal > 0 ? fmt(Math.abs(gap)) : '—'}
        sub={onTrack ? '🎯 past the line' : 'More net profit needed'}
        accent={onTrack ? colors.accent : colors.orange}
        divider
      />
    </div>
  )
}

function Kpi({ label, value, sub, accent, divider }: { label: string; value: string; sub: string; accent?: string; divider?: boolean }) {
  return (
    <KpiRaw label={label} valueNode={
      <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: accent ?? colors.text }}>{value}</span>
    } sub={sub} divider={divider} />
  )
}

function KpiRaw({ label, valueNode, sub, divider }: { label: string; valueNode: React.ReactNode; sub: string; divider?: boolean }) {
  return (
    <div style={{
      padding: '4px 18px', display: 'flex', flexDirection: 'column', gap: 4,
      borderLeft: divider ? `1px solid ${colors.border}` : 'none',
    }}>
      <div style={{ ...mono, fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
        {label}
      </div>
      <div style={{ lineHeight: 1 }}>
        {valueNode}
      </div>
      <div style={{ ...mono, fontSize: 11, color: colors.textSubtle }}>{sub}</div>
    </div>
  )
}

function iconBtnStyle(color: string): React.CSSProperties {
  return {
    width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.small, color, cursor: 'pointer',
  }
}

// =================================================================
// Forecast chart
// =================================================================
function ForecastChart({ months }: { months: MonthBreakdown[] }) {
  const data = months.map(m => ({
    label: m.label.split(' ')[0],
    fullLabel: m.label,
    goal: m.goal,
    net: m.net,
    confirmed: m.confirmedIncome - m.confirmedExpense,
  }))

  return (
    <div style={{ ...cardStyle, padding: 20 }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
          12-Month Net Forecast vs Goal
        </h3>
        <p style={{ ...mono, margin: '4px 0 0', fontSize: 11, color: colors.textMuted, letterSpacing: '0.04em' }}>
          Green = projected net (recurring + future-dated). Gray = your goal.
        </p>
      </div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }} barCategoryGap="20%">
            <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={{ stroke: colors.border }} tickLine={false} />
            <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={{ stroke: colors.border }} tickLine={false} tickFormatter={(v: number) => fmtCompact(v)} />
            <Tooltip
              cursor={{ fill: 'rgba(56, 161, 87, 0.06)' }}
              contentStyle={{
                background: colors.cardBgElevated,
                border: `1px solid ${colors.border}`,
                borderRadius: borders.radius.small, fontSize: 12,
              }}
              labelStyle={{ color: colors.text, fontWeight: 600 }}
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value : Number(value ?? 0)
                if (name === 'goal') return [fmt(v), 'Net Profit Goal']
                if (name === 'net') return [fmt(v), 'Projected Net Profit']
                if (name === 'confirmed') return [fmt(v), 'Confirmed Net']
                return [String(v), String(name)]
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { fullLabel?: string } | undefined
                return p?.fullLabel ?? ''
              }}
            />
            <ReferenceLine y={0} stroke={colors.border} />
            <Bar dataKey="goal" fill={colors.textSubtle + '99'} radius={[3, 3, 0, 0]} />
            <Bar dataKey="net" fill={colors.accent} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// =================================================================
// Per-month card
// =================================================================
function MonthCard({
  month, editing, goalDraft, hasOverride, defaultGoal,
  onStartEdit, onCancel, onChangeDraft, onSave, onRemoveOverride,
}: {
  month: MonthBreakdown
  editing: boolean
  goalDraft: string
  hasOverride: boolean
  defaultGoal: number
  onStartEdit: () => void
  onCancel: () => void
  onChangeDraft: (s: string) => void
  onSave: () => void
  onRemoveOverride: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  const onTrack = month.goal > 0 && month.net >= month.goal
  const pct = month.goal > 0 ? Math.min(100, Math.max(0, (month.net / month.goal) * 100)) : 0
  const pctOver = month.goal > 0 && month.net > month.goal ? ((month.net / month.goal) - 1) * 100 : 0

  return (
    <div style={{
      ...(month.isCurrent ? cardStyleAccent : cardStyle),
      padding: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{month.label}</h3>
            {month.isCurrent && (
              <span style={{
                ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase' as const, color: colors.accent,
                padding: '2px 7px', border: `1px solid ${colors.accent}55`,
                borderRadius: 4, background: colors.accent + '15',
              }}>This month</span>
            )}
            {hasOverride && (
              <span style={{
                ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase' as const, color: colors.yellow,
                padding: '2px 7px', border: `1px solid ${colors.yellow}55`,
                borderRadius: 4, background: colors.yellow + '15',
              }}>Override</span>
            )}
          </div>
          <div style={{ ...mono, fontSize: 11, color: colors.textMuted }}>
            {month.contributors.length} item{month.contributors.length === 1 ? '' : 's'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {editing ? (
            <>
              <span style={{ ...mono, fontSize: 13, color: colors.textMuted }}>Net Goal $</span>
              <input
                autoFocus
                inputMode="decimal"
                value={goalDraft}
                onChange={e => onChangeDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel() }}
                style={{
                  ...mono,
                  width: 100, background: colors.bg, border: `1px solid ${colors.accent}`,
                  borderRadius: borders.radius.small, color: colors.text,
                  fontSize: 14, fontWeight: 700, padding: '4px 8px', outline: 'none',
                }}
              />
              <button onClick={onSave} style={iconBtnStyle(colors.accent)} title="Save"><Check size={14} /></button>
              <button onClick={onCancel} style={iconBtnStyle(colors.textMuted)} title="Cancel"><X size={14} /></button>
            </>
          ) : (
            <>
              <span style={{ ...mono, fontSize: 12, color: colors.textMuted, letterSpacing: '0.04em' }}>
                Net Goal: <span style={{ color: colors.text, fontWeight: 700 }}>{month.goal > 0 ? fmt(month.goal) : '—'}</span>
              </span>
              <button onClick={onStartEdit} style={iconBtnStyle(colors.textMuted)} title={hasOverride ? 'Edit net profit override' : 'Override net profit goal for this month'}>
                <Pencil size={12} />
              </button>
              {hasOverride && (
                <button onClick={onRemoveOverride} style={iconBtnStyle(colors.red)} title={`Use default ${fmt(defaultGoal)}`}>
                  <X size={12} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Income / Expense / Net row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
        border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium,
        background: colors.cardBg, marginBottom: 12,
      }} className="proj-month-strip">
        <MonthStat
          label="Income"
          value={month.totalIncome}
          color={colors.accent}
          subParts={[
            month.confirmedIncome > 0 ? `${fmt(month.confirmedIncome)} confirmed` : '',
            month.projectedIncome > 0 ? `${fmt(month.projectedIncome)} projected` : '',
          ]}
        />
        <MonthStat
          label="Expenses"
          value={month.totalExpense}
          color={colors.red}
          divider
          subParts={[
            month.confirmedExpense > 0 ? `${fmt(month.confirmedExpense)} confirmed` : '',
            month.projectedExpense > 0 ? `${fmt(month.projectedExpense)} projected` : '',
          ]}
        />
        <MonthStat
          label="Net"
          value={month.net}
          color={month.net >= 0 ? colors.accent : colors.red}
          divider
          signed
          subParts={[
            month.goal > 0 && onTrack ? `Beat goal by ${fmt(month.net - month.goal)}` : '',
            month.goal > 0 && !onTrack ? `${fmt(month.goal - month.net)} below goal` : '',
          ]}
        />
      </div>

      {/* Goal progress bar */}
      {month.goal > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{
            position: 'relative', height: 8, background: colors.cardBg,
            border: `1px solid ${colors.border}`, borderRadius: 999, overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              width: `${pct}%`,
              background: onTrack ? colors.accent : colors.orange,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{
            ...mono, marginTop: 4, fontSize: 10, color: colors.textMuted, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{onTrack ? `${(100 + pctOver).toFixed(0)}% of goal` : `${pct.toFixed(0)}% of goal`}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {onTrack ? <TrendingUp size={11} color={colors.accent} /> : <TrendingDown size={11} color={colors.orange} />}
              {onTrack ? 'On pace to beat' : 'Below goal'}
            </span>
          </div>
        </div>
      )}

      {/* Contributors toggle */}
      {month.contributors.length > 0 && (
        <button
          onClick={() => setShowDetails(s => !s)}
          style={{
            ...mono, background: 'transparent', border: 'none',
            color: colors.textMuted, fontSize: 11, padding: '6px 0',
            cursor: 'pointer', letterSpacing: '0.04em',
          }}
        >
          {showDetails ? '▾ hide breakdown' : '▸ show breakdown'}
        </button>
      )}

      {showDetails && month.contributors.length > 0 && (
        <ContributorList contributors={month.contributors} />
      )}
    </div>
  )
}

function MonthStat({
  label, value, color, divider, subParts, signed,
}: {
  label: string
  value: number
  color: string
  divider?: boolean
  signed?: boolean
  subParts: string[]
}) {
  const display = signed && value >= 0 && value !== 0 ? '+' + fmt(value).replace('−', '') : fmt(value)
  return (
    <div style={{
      padding: '10px 14px',
      borderLeft: divider ? `1px solid ${colors.border}` : 'none',
    }}>
      <div style={{ ...mono, fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: 18, fontWeight: 700, color }}>{display}</div>
      <div style={{ ...mono, fontSize: 10, color: colors.textSubtle, marginTop: 2 }}>
        {subParts.filter(Boolean).join(' · ') || '—'}
      </div>
    </div>
  )
}

function ContributorList({ contributors }: { contributors: Contributor[] }) {
  return (
    <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
      {contributors.map((c, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
          padding: '8px 12px',
          background: colors.cardBg, border: `1px solid ${colors.border}`,
          borderRadius: borders.radius.small,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{
              ...mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: c.source === 'confirmed' ? colors.text : colors.textMuted,
              padding: '2px 6px', borderRadius: 4,
              background: c.source === 'confirmed' ? colors.border : 'transparent',
              border: `1px solid ${colors.border}`,
              minWidth: 70, textAlign: 'center',
            }}>
              {c.source === 'confirmed' ? 'Confirmed' : 'Recurring'}
            </span>
            <span style={{ color: colors.text, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.category}
            </span>
            <span style={{ ...mono, fontSize: 11, color: colors.textSubtle }}>{c.date}</span>
          </div>
          <span style={{
            ...mono, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: c.type === 'income' ? colors.accent : colors.red,
            flexShrink: 0,
          }}>
            {c.type === 'income' ? '+' : '−'}{fmt(c.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
