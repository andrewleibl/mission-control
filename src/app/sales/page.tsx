'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, TrendingUp, Phone, UserCheck, DollarSign, X } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import {
  PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono,
} from '@/components/DesignSystem'
import {
  SalesCall, CallSource, CallOutcome,
  loadCalls, saveCalls,
  SOURCE_META, OUTCOME_META,
  computeStats,
  MONTHS, WEEKDAYS_SHORT,
  toISO, startOfMonth, addMonths, addDays, isoWeek, fmtCurrency, fmtPct,
} from '@/lib/sales-data'

// ─── Constants ───────────────────────────────────────────────────────

const SOURCES = Object.keys(SOURCE_META) as CallSource[]
const OUTCOMES = Object.keys(OUTCOME_META) as CallOutcome[]
const TODAY = toISO(new Date())

const BLANK: Omit<SalesCall, 'id' | 'createdAt'> = {
  date: TODAY, time: '', name: '', business: '', service: '',
  source: 'website', showed: false, qualified: false,
  outcome: 'pending', value: undefined, notes: '',
}

// ─── KPI card ────────────────────────────────────────────────────────

function Kpi({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string
  icon: React.ElementType
}) {
  return (
    <div style={{ ...cardStyleAccent, padding: '14px 16px', flex: '1 1 140px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={14} color={color} strokeWidth={2} />
        <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ─── Funnel bar ──────────────────────────────────────────────────────

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: colors.text, fontWeight: 500 }}>{label}</span>
        <span style={{ ...mono, fontSize: 12, color: colors.textMuted }}>{value}</span>
      </div>
      <div style={{ height: 8, background: colors.cardBg, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

// ─── Outcome badge ───────────────────────────────────────────────────

function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  const m = OUTCOME_META[outcome]
  return (
    <span style={{
      ...mono, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
      letterSpacing: '0.05em', color: m.color, background: `${m.color}18`,
      border: `1px solid ${m.color}30`,
    }}>
      {m.label.toUpperCase()}
    </span>
  )
}

// ─── Call modal ──────────────────────────────────────────────────────

function CallModal({ existing, defaultDate, onClose, onSave, onDelete }: {
  existing?: SalesCall
  defaultDate?: string
  onClose: () => void
  onSave: (data: Omit<SalesCall, 'id' | 'createdAt'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState<Omit<SalesCall, 'id' | 'createdAt'>>(
    existing ? {
      date: existing.date, time: existing.time ?? '', name: existing.name,
      business: existing.business, service: existing.service ?? '',
      source: existing.source, showed: existing.showed, qualified: existing.qualified,
      outcome: existing.outcome, value: existing.value, notes: existing.notes ?? '',
    } : { ...BLANK, date: defaultDate ?? TODAY }
  )

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const inp: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '9px 11px',
    color: colors.text, fontSize: 13, outline: 'none', width: '100%', fontFamily: 'inherit',
  }
  const lbl: React.CSSProperties = {
    ...mono, fontSize: 10, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 5,
  }
  const row: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const field: React.CSSProperties = { display: 'flex', flexDirection: 'column' as const, gap: 5 }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ ...cardStyle, width: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
            {existing ? 'Edit Call' : 'Log Call'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', lineHeight: 1 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={row}>
            <div style={field}>
              <label style={lbl}>Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inp} />
            </div>
            <div style={field}>
              <label style={lbl}>Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} style={inp} />
            </div>
          </div>

          <div style={row}>
            <div style={field}>
              <label style={lbl}>Prospect name *</label>
              <input autoFocus placeholder="Joe Smith" value={form.name} onChange={e => set('name', e.target.value)} style={inp} />
            </div>
            <div style={field}>
              <label style={lbl}>Business</label>
              <input placeholder="Smith's Roofing" value={form.business} onChange={e => set('business', e.target.value)} style={inp} />
            </div>
          </div>

          <div style={row}>
            <div style={field}>
              <label style={lbl}>Service</label>
              <input placeholder="Roofing, HVAC..." value={form.service} onChange={e => set('service', e.target.value)} style={inp} />
            </div>
            <div style={field}>
              <label style={lbl}>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value as CallSource)} style={{ ...inp, cursor: 'pointer' }}>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_META[s].label}</option>)}
              </select>
            </div>
          </div>

          <div style={row}>
            <div style={field}>
              <label style={lbl}>Showed up?</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => set('showed', v)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: borders.radius.medium, fontFamily: 'inherit',
                    border: `1px solid ${form.showed === v ? colors.accent : colors.border}`,
                    background: form.showed === v ? 'rgba(56,161,87,0.12)' : 'transparent',
                    color: form.showed === v ? colors.accent : colors.textMuted,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
            <div style={field}>
              <label style={lbl}>Qualified?</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => set('qualified', v)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: borders.radius.medium, fontFamily: 'inherit',
                    border: `1px solid ${form.qualified === v ? colors.accent : colors.border}`,
                    background: form.qualified === v ? 'rgba(56,161,87,0.12)' : 'transparent',
                    color: form.qualified === v ? colors.accent : colors.textMuted,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    {v ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={row}>
            <div style={field}>
              <label style={lbl}>Outcome</label>
              <select value={form.outcome} onChange={e => set('outcome', e.target.value as CallOutcome)} style={{ ...inp, cursor: 'pointer' }}>
                {OUTCOMES.map(o => <option key={o} value={o}>{OUTCOME_META[o].label}</option>)}
              </select>
            </div>
            <div style={field}>
              <label style={lbl}>Deal value ($)</label>
              <input
                type="number" placeholder="0"
                value={form.value ?? ''}
                onChange={e => set('value', e.target.value ? Number(e.target.value) : undefined)}
                style={inp}
              />
            </div>
          </div>

          <div style={field}>
            <label style={lbl}>Notes</label>
            <textarea
              placeholder="Anything to remember about this call..."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              style={{ ...inp, minHeight: 64, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button
            onClick={() => form.name.trim() && onSave(form)}
            style={{
              flex: 1, padding: '10px 0', background: colors.accent, border: 'none',
              borderRadius: borders.radius.medium, color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {existing ? 'Save Changes' : 'Log Call'}
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

// ─── Stats view ──────────────────────────────────────────────────────

function StatsView({ calls, onEdit }: { calls: SalesCall[]; onEdit: (c: SalesCall) => void }) {
  const stats = useMemo(() => computeStats(calls), [calls])

  const weeklyData = useMemo(() => {
    const weeks: Record<string, { week: string; booked: number; showed: number; closed: number }> = {}
    const cutoff = toISO(addDays(new Date(), -70))
    calls.filter(c => c.date >= cutoff).forEach(c => {
      const w = isoWeek(c.date)
      if (!weeks[w]) weeks[w] = { week: w.slice(5), booked: 0, showed: 0, closed: 0 }
      weeks[w].booked++
      if (c.showed) weeks[w].showed++
      if (c.outcome === 'closed_won') weeks[w].closed++
    })
    return Object.values(weeks).sort((a, b) => a.week.localeCompare(b.week)).slice(-10)
  }, [calls])

  const sourceData = useMemo(() => {
    const counts: Partial<Record<CallSource, number>> = {}
    calls.forEach(c => { counts[c.source] = (counts[c.source] ?? 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .map(([source, count]) => ({ source: SOURCE_META[source as CallSource].label, count, color: SOURCE_META[source as CallSource].color }))
  }, [calls])

  const recent = useMemo(() =>
    [...calls].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    [calls]
  )

  const tooltipStyle = {
    contentStyle: { background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { color: colors.textMuted },
    itemStyle: { color: colors.text },
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 20 }}>
        <Kpi label="Calls Booked" value={String(stats.total)} sub="all time" color={colors.accent} icon={Phone} />
        <Kpi label="Show Rate" value={fmtPct(stats.showRate)} sub={`${stats.showed} showed`} color={colors.blue} icon={UserCheck} />
        <Kpi label="Qual Rate" value={fmtPct(stats.qualRate)} sub={`${stats.qualified} qualified`} color={colors.purple} icon={TrendingUp} />
        <Kpi label="Close Rate" value={fmtPct(stats.closeRate)} sub={`${stats.closedWon} won`} color={colors.accent} icon={TrendingUp} />
        <Kpi label="Revenue" value={fmtCurrency(stats.revenue)} sub={`avg ${fmtCurrency(stats.avgDeal)}/deal`} color={colors.accent} icon={DollarSign} />
        <Kpi label="Pipeline" value={fmtCurrency(stats.pipeline)} sub="proposals out" color={colors.yellow} icon={DollarSign} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 16 }}>
            CALLS PER WEEK — LAST 10 WEEKS
          </div>
          {weeklyData.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, fontSize: 13 }}>
              No data yet — log your first call above
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke={colors.border} />
                <XAxis dataKey="week" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="booked" name="Booked" fill={`${colors.accent}55`} radius={[3, 3, 0, 0]} />
                <Bar dataKey="showed" name="Showed" fill={colors.accent} radius={[3, 3, 0, 0]} />
                <Bar dataKey="closed" name="Closed" fill={colors.purple} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 20 }}>
          <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 16 }}>
            CONVERSION FUNNEL
          </div>
          <FunnelBar label="Booked" value={stats.total} max={stats.total} color={colors.textMuted} />
          <FunnelBar label="Showed" value={stats.showed} max={stats.total} color={colors.blue} />
          <FunnelBar label="Qualified" value={stats.qualified} max={stats.total} color={colors.purple} />
          <FunnelBar label="Closed Won" value={stats.closedWon} max={stats.total} color={colors.accent} />
          {sourceData.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${colors.border}` }}>
              <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 8 }}>BY SOURCE</div>
              {sourceData.slice(0, 5).map(s => (
                <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>{s.source}</span>
                  <span style={{ ...mono, fontSize: 11, color: s.color, fontWeight: 600 }}>{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 16 }}>
          RECENT CALLS
        </div>
        {recent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: colors.textMuted, fontSize: 13 }}>
            No calls logged yet. Click "Log Call" to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Prospect', 'Service', 'Source', 'Showed', 'Qualified', 'Outcome', 'Value'].map(h => (
                  <th key={h} style={{ ...mono, fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.06em', textAlign: 'left', padding: '0 8px 10px', borderBottom: `1px solid ${colors.border}` }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(c => (
                <tr
                  key={c.id}
                  onClick={() => onEdit(c)}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 8px', fontSize: 12, color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{c.date}</td>
                  <td style={{ padding: '10px 8px', fontSize: 12, color: colors.text, fontWeight: 500, borderBottom: `1px solid ${colors.border}` }}>
                    {c.name}<br /><span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400 }}>{c.business}</span>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: 11, color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{c.service || '—'}</td>
                  <td style={{ padding: '10px 8px', borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: SOURCE_META[c.source].color }}>{SOURCE_META[c.source].label}</span>
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: 13, borderBottom: `1px solid ${colors.border}`, color: c.outcome === 'pending' ? colors.textMuted : c.showed ? colors.accent : colors.red }}>
                    {c.outcome === 'pending' ? '—' : c.showed ? '✓' : '✗'}
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: 13, borderBottom: `1px solid ${colors.border}`, color: c.outcome === 'pending' ? colors.textMuted : c.qualified ? colors.accent : colors.red }}>
                    {c.outcome === 'pending' ? '—' : c.qualified ? '✓' : '✗'}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: `1px solid ${colors.border}` }}>
                    <OutcomeBadge outcome={c.outcome} />
                  </td>
                  <td style={{ padding: '10px 8px', fontSize: 12, color: c.value ? colors.accent : colors.textMuted, fontWeight: c.value ? 600 : 400, borderBottom: `1px solid ${colors.border}` }}>
                    {c.value ? fmtCurrency(c.value) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Calendar view ───────────────────────────────────────────────────

function CalendarView({ calls, onAddForDay, onEdit }: {
  calls: SalesCall[]
  onAddForDay: (date: string) => void
  onEdit: (c: SalesCall) => void
}) {
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const monthStart = startOfMonth(cursor)
  const firstDow = monthStart.getDay()
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()

  const callsByDay = useMemo(() => {
    const map: Record<string, SalesCall[]> = {}
    const monthStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    calls.filter(c => c.date.startsWith(monthStr)).forEach(c => {
      if (!map[c.date]) map[c.date] = []
      map[c.date].push(c)
    })
    return map
  }, [calls, cursor])

  const selectedCalls = selectedDay ? (callsByDay[selectedDay] ?? []) : []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => setCursor(addMonths(cursor, -1))} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button onClick={() => setCursor(addMonths(cursor, 1))} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 4 }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {WEEKDAYS_SHORT.map(d => (
            <div key={d} style={{ ...mono, fontSize: 9, fontWeight: 700, color: colors.textMuted, textAlign: 'center', letterSpacing: '0.06em' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = toISO(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))
            const dayCalls = callsByDay[date] ?? []
            const isToday = date === TODAY
            const isSelected = date === selectedDay
            const hasWon = dayCalls.some(c => c.outcome === 'closed_won')
            const hasNoShow = dayCalls.some(c => c.outcome === 'no_show')

            return (
              <button
                key={date}
                onClick={() => setSelectedDay(isSelected ? null : date)}
                style={{
                  padding: '8px 4px', minHeight: 56, borderRadius: borders.radius.medium,
                  border: `1px solid ${isSelected ? colors.accent : isToday ? `${colors.accent}50` : colors.border}`,
                  background: isSelected ? 'rgba(56,161,87,0.1)' : isToday ? 'rgba(56,161,87,0.04)' : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(56,161,87,0.04)' : 'transparent' }}
              >
                <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? colors.accent : colors.text }}>{i + 1}</span>
                {dayCalls.length > 0 && (
                  <span style={{
                    ...mono, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                    color: hasWon ? colors.accent : hasNoShow ? colors.red : colors.blue,
                    background: hasWon ? 'rgba(56,161,87,0.18)' : hasNoShow ? 'rgba(255,123,114,0.18)' : 'rgba(99,179,237,0.18)',
                  }}>
                    {dayCalls.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 20 }}>
        {selectedDay ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 2 }}>SELECTED</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{selectedDay}</div>
              </div>
              <button
                onClick={() => onAddForDay(selectedDay)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
                  background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
                  color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Plus size={11} /> Add
              </button>
            </div>
            {selectedCalls.length === 0 ? (
              <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No calls this day</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedCalls.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onEdit(c)}
                    style={{
                      textAlign: 'left', padding: '10px 12px', borderRadius: borders.radius.medium,
                      border: `1px solid ${colors.border}`, borderLeft: `3px solid ${OUTCOME_META[c.outcome].color}`,
                      background: colors.cardBgElevated, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = colors.cardBgElevated)}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{c.business}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' as const }}>
                      <OutcomeBadge outcome={c.outcome} />
                      {c.time && <span style={{ ...mono, fontSize: 9, color: colors.textMuted }}>{c.time}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: '40px 0' }}>
            Click a day to see calls
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────

type Tab = 'stats' | 'calendar'

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', background: colors.accent, border: 'none',
  borderRadius: borders.radius.medium, color: '#fff',
  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

export default function SalesTrackingPage() {
  const [calls, setCalls] = useState<SalesCall[]>([])
  const [tab, setTab] = useState<Tab>('stats')
  const [modal, setModal] = useState<
    | { kind: 'add'; defaultDate?: string }
    | { kind: 'edit'; call: SalesCall }
    | null
  >(null)

  useEffect(() => { setCalls(loadCalls()) }, [])

  function persist(next: SalesCall[]) { setCalls(next); saveCalls(next) }

  function addCall(data: Omit<SalesCall, 'id' | 'createdAt'>) {
    persist([{
      ...data,
      id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    }, ...calls])
    setModal(null)
  }

  function updateCall(data: Omit<SalesCall, 'id' | 'createdAt'>) {
    if (modal?.kind !== 'edit') return
    persist(calls.map(c => c.id === modal.call.id ? { ...c, ...data } : c))
    setModal(null)
  }

  function deleteCall() {
    if (modal?.kind !== 'edit') return
    persist(calls.filter(c => c.id !== modal.call.id))
    setModal(null)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Sales Tracking"
        subtitle="Log every call, track show rates, qualification, and close rate."
        action={
          <button onClick={() => setModal({ kind: 'add' })} style={primaryBtn}>
            <Plus size={14} strokeWidth={2.5} /> Log Call
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
        {([
          { key: 'stats', label: 'Statistics' },
          { key: 'calendar', label: 'Calendar' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t.key ? colors.accent : 'transparent'}`,
              color: tab === t.key ? colors.accent : colors.textMuted,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              marginBottom: -1, transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stats' && <StatsView calls={calls} onEdit={c => setModal({ kind: 'edit', call: c })} />}
      {tab === 'calendar' && (
        <CalendarView
          calls={calls}
          onAddForDay={date => setModal({ kind: 'add', defaultDate: date })}
          onEdit={c => setModal({ kind: 'edit', call: c })}
        />
      )}

      {modal?.kind === 'add' && (
        <CallModal defaultDate={modal.defaultDate} onClose={() => setModal(null)} onSave={addCall} />
      )}
      {modal?.kind === 'edit' && (
        <CallModal existing={modal.call} onClose={() => setModal(null)} onSave={updateCall} onDelete={deleteCall} />
      )}
    </PageContainer>
  )
}
