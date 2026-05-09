'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, DollarSign, Video, Phone, MessageSquare, Users as UsersIcon, FileText, Flag } from 'lucide-react'
import { colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { Task, todayIso } from '@/lib/today-data'
import { Client } from '@/lib/clients-data'

// =================================================================
// Aggregation types — lightweight reads from other sections' localStorage
// =================================================================

interface FinanceTxLite {
  id: string
  type: 'income' | 'expense'
  date: string
  amount: number
  category: string
  status: 'confirmed' | 'skipped'
}

interface RetentionEventLite {
  id: string
  type: 'loom' | 'call' | 'text' | 'meeting' | 'report' | 'milestone'
  date: string
  title: string
  clientId: string
  completed: boolean
}

function loadFinanceTxs(): FinanceTxLite[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('mc_finances_txs_v2')
    if (!raw) return []
    const all = JSON.parse(raw) as FinanceTxLite[]
    return all.filter(t => t.status === 'confirmed')
  } catch { return [] }
}

function loadRetentionEvents(): RetentionEventLite[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('mc_retention_events_v3')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// =================================================================
// Unified calendar entry
// =================================================================

type CalendarEntry =
  | { source: 'task'; id: string; date: string; label: string; color: string; bg: string; done: boolean; starred: boolean }
  | { source: 'finance'; id: string; date: string; label: string; color: string; bg: string; txType: 'income' | 'expense' }
  | { source: 'retention'; id: string; date: string; label: string; color: string; bg: string; eventType: string }

const RETENTION_COLOR: Record<string, { fg: string; bg: string }> = {
  loom: { fg: colors.red, bg: 'rgba(255,123,114,0.12)' },
  call: { fg: colors.accent, bg: 'rgba(56,161,87,0.12)' },
  text: { fg: colors.yellow, bg: 'rgba(227,179,65,0.12)' },
  meeting: { fg: colors.purple, bg: 'rgba(159,122,234,0.12)' },
  report: { fg: colors.blue, bg: 'rgba(99,179,237,0.12)' },
  milestone: { fg: colors.orange, bg: 'rgba(246,173,85,0.12)' },
}

const RETENTION_ICON: Record<string, React.ElementType> = {
  loom: Video, call: Phone, text: MessageSquare,
  meeting: UsersIcon, report: FileText, milestone: Flag,
}

type ViewMode = 'week' | 'month'
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const TODAY = todayIso()

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function startOfWeek(d: Date) { const r = new Date(d); r.setDate(d.getDate() - d.getDay()); return r }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r }
function fmt$(n: number) { return '$' + Math.round(n).toLocaleString('en-US') }

interface Props {
  tasks: Task[]
  clients: Client[]
  onAddForDay: (dateIso: string) => void
}

export default function CalendarView({ tasks, clients, onAddForDay }: Props) {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState(new Date())
  const [showAggregated, setShowAggregated] = useState(false)
  const [financeTxs, setFinanceTxs] = useState<FinanceTxLite[]>([])
  const [retentionEvents, setRetentionEvents] = useState<RetentionEventLite[]>([])

  useEffect(() => {
    if (showAggregated) {
      setFinanceTxs(loadFinanceTxs())
      setRetentionEvents(loadRetentionEvents())
    }
  }, [showAggregated])

  // Keyboard: ←/→ nav, W/M view, T today
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key.toLowerCase()) {
        case 'w': setView('week'); break
        case 'm': setView('month'); break
        case 't': setCursor(new Date()); break
        case 'arrowleft': e.preventDefault(); setCursor(prev => view === 'week' ? addDays(prev, -7) : addMonths(prev, -1)); break
        case 'arrowright': e.preventDefault(); setCursor(prev => view === 'week' ? addDays(prev, 7) : addMonths(prev, 1)); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view])

  // Build unified entry map
  const entriesByDay = useMemo<Record<string, CalendarEntry[]>>(() => {
    const map: Record<string, CalendarEntry[]> = {}
    const push = (date: string, entry: CalendarEntry) => {
      ;(map[date] ??= []).push(entry)
    }

    for (const t of tasks) {
      if (!t.dueDate) continue
      push(t.dueDate, {
        source: 'task', id: t.id, date: t.dueDate,
        label: t.title,
        color: t.starred ? colors.yellow : colors.accent,
        bg: t.starred ? 'rgba(227,179,65,0.12)' : 'rgba(56,161,87,0.12)',
        done: t.status === 'done',
        starred: t.starred,
      })
    }

    if (showAggregated) {
      for (const tx of financeTxs) {
        const isIncome = tx.type === 'income'
        push(tx.date, {
          source: 'finance', id: tx.id, date: tx.date,
          label: `${isIncome ? '+' : '−'}${fmt$(tx.amount)} ${tx.category}`,
          color: isIncome ? colors.accent : colors.red,
          bg: isIncome ? 'rgba(56,161,87,0.08)' : 'rgba(255,123,114,0.08)',
          txType: tx.type,
        })
      }
      for (const ev of retentionEvents) {
        const cp = RETENTION_COLOR[ev.type] ?? { fg: colors.textMuted, bg: 'rgba(125,138,153,0.1)' }
        const clientName = clients.find(c => c.id === ev.clientId)?.business ?? ''
        push(ev.date, {
          source: 'retention', id: ev.id, date: ev.date,
          label: clientName ? `${clientName} · ${ev.title}` : ev.title,
          color: cp.fg, bg: cp.bg, eventType: ev.type,
        })
      }
    }

    return map
  }, [tasks, financeTxs, retentionEvents, showAggregated, clients])

  // Period label
  const periodLabel = useMemo(() => {
    if (view === 'week') {
      const s = startOfWeek(cursor)
      const e = addDays(s, 6)
      return `${MONTHS_LONG[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTHS_LONG[e.getMonth()].slice(0, 3)} ${e.getDate()}, ${e.getFullYear()}`
    }
    return `${MONTHS_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [view, cursor])

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' as const, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => view === 'week' ? setCursor(addDays(cursor, -7)) : setCursor(addMonths(cursor, -1))} style={iconBtnStyle}><ChevronLeft size={16} /></button>
          <button onClick={() => view === 'week' ? setCursor(addDays(cursor, 7)) : setCursor(addMonths(cursor, 1))} style={iconBtnStyle}><ChevronRight size={16} /></button>
          <button onClick={() => setCursor(new Date())} style={pillBtnStyle}>Today</button>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginLeft: 8 }}>{periodLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Aggregation toggle */}
          <button
            onClick={() => setShowAggregated(!showAggregated)}
            style={{
              padding: '6px 12px',
              borderRadius: borders.radius.medium,
              border: `1px solid ${showAggregated ? colors.accent : colors.border}`,
              background: showAggregated ? 'rgba(56,161,87,0.1)' : 'transparent',
              color: showAggregated ? colors.accent : colors.textMuted,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-mono), monospace',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {showAggregated ? '◈ ALL SOURCES' : '◻ TASKS ONLY'}
          </button>

          {/* View toggle */}
          <div style={{ display: 'flex', background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, padding: 2 }}>
            {(['week', 'month'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: view === v ? colors.accent : 'transparent',
                color: view === v ? '#fff' : colors.textMuted,
                fontSize: 12, fontWeight: 600, textTransform: 'capitalize' as const,
                fontFamily: 'inherit',
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend (only when aggregated) */}
      {showAggregated && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' as const }}>
          {[
            { label: 'Tasks', color: colors.accent },
            { label: 'Starred tasks', color: colors.yellow },
            { label: 'Finance income', color: colors.accent },
            { label: 'Finance expense', color: colors.red },
            { label: 'Retention event', color: colors.purple },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ ...mono, fontSize: 10, color: colors.textMuted }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {view === 'month' ? (
          <MonthGrid cursor={cursor} entriesByDay={entriesByDay} onAddForDay={onAddForDay} />
        ) : (
          <WeekGrid cursor={cursor} entriesByDay={entriesByDay} onAddForDay={onAddForDay} />
        )}
      </div>
    </div>
  )
}

// ---- Shared button styles ----
const iconBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 6,
  background: 'transparent', border: `1px solid ${colors.border}`,
  color: colors.textMuted, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
}
const pillBtnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6,
  background: 'transparent', border: `1px solid ${colors.border}`,
  color: colors.textMuted, cursor: 'pointer',
  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
}

// ---- Month Grid ----
function MonthGrid({ cursor, entriesByDay, onAddForDay }: { cursor: Date; entriesByDay: Record<string, CalendarEntry[]>; onAddForDay: (iso: string) => void }) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const inMonth = (d: Date) => d.getMonth() === cursor.getMonth()

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${colors.border}` }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{ ...mono, padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          const iso = toIso(d)
          const entries = (entriesByDay[iso] ?? []).slice(0, 4)
          const overflow = (entriesByDay[iso]?.length ?? 0) - 4
          const isToday = iso === TODAY
          const dim = !inMonth(d)
          return (
            <div
              key={i}
              onClick={() => onAddForDay(iso)}
              style={{
                minHeight: 100, padding: '6px 8px',
                borderRight: ((i + 1) % 7 !== 0) ? `1px solid ${colors.border}` : undefined,
                borderBottom: i < 35 ? `1px solid ${colors.border}` : undefined,
                background: isToday ? 'rgba(56,161,87,0.05)' : 'transparent',
                cursor: 'pointer', opacity: dim ? 0.35 : 1,
                display: 'flex', flexDirection: 'column', gap: 3,
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ ...mono, fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? colors.accent : colors.text, fontVariantNumeric: 'tabular-nums' as const }}>
                {d.getDate()}
              </span>
              {entries.map(e => <EntryChip key={e.id} entry={e} />)}
              {overflow > 0 && <span style={{ ...mono, fontSize: 10, color: colors.textMuted, paddingLeft: 4 }}>+{overflow} more</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Week Grid ----
function WeekGrid({ cursor, entriesByDay, onAddForDay }: { cursor: Date; entriesByDay: Record<string, CalendarEntry[]>; onAddForDay: (iso: string) => void }) {
  const start = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${colors.border}` }}>
        {days.map((d, i) => {
          const isToday = toIso(d) === TODAY
          return (
            <div key={i} style={{ padding: '12px 14px', borderRight: i < 6 ? `1px solid ${colors.border}` : undefined, background: isToday ? 'rgba(56,161,87,0.05)' : 'transparent' }}>
              <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 4 }}>{WEEKDAYS[i]}</div>
              <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: isToday ? colors.accent : colors.text, fontVariantNumeric: 'tabular-nums' as const }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 380 }}>
        {days.map((d, i) => {
          const iso = toIso(d)
          const entries = entriesByDay[iso] ?? []
          const isToday = iso === TODAY
          return (
            <div
              key={i}
              onClick={() => onAddForDay(iso)}
              style={{ padding: '8px 8px', borderRight: i < 6 ? `1px solid ${colors.border}` : undefined, background: isToday ? 'rgba(56,161,87,0.04)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              {entries.length === 0 && <span style={{ ...mono, fontSize: 11, color: colors.textMuted, opacity: 0.4 }}>—</span>}
              {entries.map(e => <EntryChip key={e.id} entry={e} expanded />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Entry Chip ----
function EntryChip({ entry, expanded }: { entry: CalendarEntry; expanded?: boolean }) {
  const isDone = entry.source === 'task' && entry.done

  if (entry.source === 'finance') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: entry.bg, borderRadius: 4, padding: expanded ? '4px 6px' : '2px 6px',
        fontSize: 10, opacity: 0.85,
      }}>
        <DollarSign size={9} strokeWidth={2.5} color={entry.color} style={{ flexShrink: 0 }} />
        <span style={{ color: entry.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {entry.label}
        </span>
      </div>
    )
  }

  if (entry.source === 'retention') {
    const Icon = RETENTION_ICON[entry.eventType] ?? FileText
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: entry.bg, borderRadius: 4, padding: expanded ? '4px 6px' : '2px 6px',
        fontSize: 10, opacity: 0.85,
      }}>
        <Icon size={9} strokeWidth={2.25} color={entry.color} style={{ flexShrink: 0 }} />
        <span style={{ color: entry.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {entry.label}
        </span>
      </div>
    )
  }

  // Task
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: entry.bg, borderRadius: 4, padding: expanded ? '4px 6px' : '2px 6px',
      fontSize: 10,
      opacity: isDone ? 0.45 : 1,
      textDecoration: isDone ? 'line-through' : 'none',
    }}>
      {entry.starred && <span style={{ color: entry.color, fontSize: 9 }}>★</span>}
      <span style={{ color: entry.color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {entry.label}
      </span>
    </div>
  )
}
