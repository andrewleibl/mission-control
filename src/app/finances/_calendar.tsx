'use client'

import { useState, useMemo, useEffect } from 'react'
import { colors, cardStyle, borders } from '@/components/DesignSystem'
import {
  Transaction, RecurringRule, ProjectedTransaction,
  projectRecurring, confirmed,
} from '@/lib/finances'
import { ClientSummary } from '@/lib/clients-data'

type ViewMode = 'day' | 'week' | 'month'

interface Props {
  txs: Transaction[]
  rules: RecurringRule[]
  clients: ClientSummary[]
  onAddForDay: (dateIso: string) => void
  onApprove: (projection: ProjectedTransaction) => void
  onSkip: (projection: ProjectedTransaction) => void
  onEditAndConfirm: (projection: ProjectedTransaction) => void
  onDeleteTx: (id: string) => void
  onEditTx: (id: string) => void
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function fmtSmall(n: number) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
  return '$' + Math.round(n)
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fromIso(s: string) { return new Date(s + 'T12:00:00') }
function startOfWeek(d: Date) { const r = new Date(d); r.setDate(d.getDate() - d.getDay()); return r }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r }
function isSameDay(a: Date, b: Date) { return toIso(a) === toIso(b) }

const TODAY = new Date()
const TODAY_ISO = toIso(TODAY)

// Combined entry type for calendar rendering
interface CalendarEntry {
  kind: 'tx' | 'projected'
  date: string
  type: 'income' | 'expense'
  amount: number
  category: string
  clientId?: string
  note?: string
  // Only for tx
  txId?: string
  // Only for projected
  projection?: ProjectedTransaction
}

export default function CalendarView({ txs, rules, clients, onAddForDay, onApprove, onSkip, onEditAndConfirm, onDeleteTx, onEditTx }: Props) {
  const [view, setView] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<Date>(TODAY)
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null)
  const [popover, setPopover] = useState<{ projection: ProjectedTransaction; x: number; y: number } | null>(null)

  // Keyboard shortcuts: D/W/M view, T today, ←/→ navigate, Esc close panel/popover
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'd': setView('day'); break
        case 'w': setView('week'); break
        case 'm': setView('month'); break
        case 't': setCursor(TODAY); break
        case 'arrowleft':
          e.preventDefault()
          setCursor(prev => view === 'day' ? addDays(prev, -1) : view === 'week' ? addDays(prev, -7) : addMonths(prev, -1))
          break
        case 'arrowright':
          e.preventDefault()
          setCursor(prev => view === 'day' ? addDays(prev, 1) : view === 'week' ? addDays(prev, 7) : addMonths(prev, 1))
          break
        case 'escape':
          if (popover) setPopover(null)
          else if (selectedDayIso) setSelectedDayIso(null)
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view, popover, selectedDayIso])

  // Determine the date range to show + project
  const [rangeStart, rangeEnd] = useMemo<[Date, Date]>(() => {
    if (view === 'day') return [cursor, cursor]
    if (view === 'week') {
      const s = startOfWeek(cursor)
      return [s, addDays(s, 6)]
    }
    // month: show 6 weeks (42 cells) starting from the Sunday before/of the 1st
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    const gridStart = startOfWeek(first)
    const gridEnd = addDays(startOfWeek(last), 6)
    return [gridStart, gridEnd]
  }, [view, cursor])

  // Generate all entries (confirmed txs + projected) within range
  const entriesByDay = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {}
    const startIso = toIso(rangeStart)
    const endIso = toIso(rangeEnd)

    for (const tx of txs) {
      if (tx.status !== 'confirmed') continue
      if (tx.date < startIso || tx.date > endIso) continue
      ;(map[tx.date] ??= []).push({
        kind: 'tx', date: tx.date,
        type: tx.type, amount: tx.amount, category: tx.category,
        clientId: tx.clientId, note: tx.note, txId: tx.id,
      })
    }

    const projected = projectRecurring(rules, txs, startIso, endIso)
    for (const p of projected) {
      ;(map[p.date] ??= []).push({
        kind: 'projected', date: p.date,
        type: p.type, amount: p.amount, category: p.category,
        clientId: p.clientId, note: p.note, projection: p,
      })
    }
    return map
  }, [txs, rules, rangeStart, rangeEnd])

  // All projected globally for the next 30 days (for the pending count badge)
  const pendingNext30 = useMemo(() => {
    const start = TODAY_ISO
    const end = toIso(addDays(TODAY, 30))
    return projectRecurring(rules, txs, start, end).filter(p => p.date >= start)
  }, [txs, rules])

  // Period label for header
  const periodLabel = useMemo(() => {
    if (view === 'day') return cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (view === 'week') {
      const s = startOfWeek(cursor)
      const e = addDays(s, 6)
      const sameMonth = s.getMonth() === e.getMonth()
      if (sameMonth) return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`
      return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`
    }
    return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [view, cursor])

  function navigate(dir: -1 | 1) {
    if (view === 'day') setCursor(addDays(cursor, dir))
    else if (view === 'week') setCursor(addDays(cursor, dir * 7))
    else setCursor(addMonths(cursor, dir))
  }
  function jumpToToday() { setCursor(TODAY) }

  // Close popover on outside click
  useEffect(() => {
    if (!popover) return
    function close() { setPopover(null) }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [popover])

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={iconBtnStyle} title="Previous">‹</button>
          <button onClick={() => navigate(1)} style={iconBtnStyle} title="Next">›</button>
          <button onClick={jumpToToday} style={pillBtnStyle}>Today</button>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginLeft: 8 }}>{periodLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pendingNext30.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px',
              borderRadius: 12, background: 'rgba(227,179,65,0.12)',
              color: colors.yellow, letterSpacing: '0.04em',
            }}>
              {pendingNext30.length} PENDING APPROVAL{pendingNext30.length === 1 ? '' : 'S'}
            </span>
          )}
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Body */}
      <div className="retention-cal-body" style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        {view === 'month' && (
          <MonthGrid
            cursor={cursor}
            entriesByDay={entriesByDay}
            onSelectDay={setSelectedDayIso}
            onAddForDay={onAddForDay}
            onProjectedClick={(projection, e) => {
              e.stopPropagation()
              setPopover({ projection, x: e.clientX, y: e.clientY })
            }}
          />
        )}
        {view === 'week' && (
          <WeekGrid
            cursor={cursor}
            entriesByDay={entriesByDay}
            onSelectDay={setSelectedDayIso}
            onAddForDay={onAddForDay}
            onProjectedClick={(projection, e) => {
              e.stopPropagation()
              setPopover({ projection, x: e.clientX, y: e.clientY })
            }}
          />
        )}
        {view === 'day' && (
          <DayList
            dateIso={toIso(cursor)}
            entries={entriesByDay[toIso(cursor)] ?? []}
            clients={clients}
            onAddForDay={onAddForDay}
            onApprove={onApprove}
            onSkip={onSkip}
            onEditAndConfirm={onEditAndConfirm}
            onDeleteTx={onDeleteTx}
            onEditTx={onEditTx}
          />
        )}
      </div>

      {/* Side panel for selected day */}
      {selectedDayIso && view !== 'day' && (
        <SidePanel
          dateIso={selectedDayIso}
          entries={entriesByDay[selectedDayIso] ?? []}
          clients={clients}
          onClose={() => setSelectedDayIso(null)}
          onAddForDay={onAddForDay}
          onApprove={onApprove}
          onSkip={onSkip}
          onEditAndConfirm={onEditAndConfirm}
          onDeleteTx={onDeleteTx}
          onEditTx={onEditTx}
        />
      )}

      {/* Approval popover for projected chips */}
      {popover && (
        <ApprovalPopover
          projection={popover.projection}
          x={popover.x}
          y={popover.y}
          onApprove={() => { onApprove(popover.projection); setPopover(null) }}
          onSkip={() => { onSkip(popover.projection); setPopover(null) }}
          onEdit={() => { onEditAndConfirm(popover.projection); setPopover(null) }}
        />
      )}
    </div>
  )
}

// ------------------ Header pieces ------------------
const iconBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 6,
  background: 'transparent', border: `1px solid ${colors.border}`,
  color: colors.textMuted, cursor: 'pointer',
  fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
}

const pillBtnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6,
  background: 'transparent', border: `1px solid ${colors.border}`,
  color: colors.textMuted, cursor: 'pointer',
  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div style={{
      display: 'flex',
      background: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: borders.radius.medium,
      padding: 2,
    }}>
      {(['day', 'week', 'month'] as ViewMode[]).map(v => {
        const active = value === v
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: '5px 14px',
            borderRadius: 6, border: 'none', cursor: 'pointer',
            background: active ? colors.accent : 'transparent',
            color: active ? '#fff' : colors.textMuted,
            fontSize: 12, fontWeight: 600, textTransform: 'capitalize' as const,
            fontFamily: 'inherit',
          }}>{v}</button>
        )
      })}
    </div>
  )
}

// ------------------ Month grid ------------------
function MonthGrid({
  cursor, entriesByDay, onSelectDay, onAddForDay, onProjectedClick,
}: {
  cursor: Date
  entriesByDay: Record<string, CalendarEntry[]>
  onSelectDay: (iso: string) => void
  onAddForDay: (iso: string) => void
  onProjectedClick: (p: ProjectedTransaction, e: React.MouseEvent) => void
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const inMonth = (d: Date) => d.getMonth() === cursor.getMonth()

  return (
    <div style={{ minWidth: 420 }}>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${colors.border}` }}>
        {WEEKDAYS.map(w => (
          <div key={w} style={{
            padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            color: colors.textMuted, textAlign: 'left',
          }}>{w}</div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          const iso = toIso(d)
          const entries = entriesByDay[iso] ?? []
          const isToday = iso === TODAY_ISO
          const dim = !inMonth(d)
          const incomeSum = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
          const expenseSum = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)

          return (
            <div
              key={i}
              onClick={() => onSelectDay(iso)}
              style={{
                minHeight: 110,
                padding: '6px 8px',
                borderRight: ((i + 1) % 7 !== 0) ? `1px solid ${colors.border}` : undefined,
                borderBottom: i < 35 ? `1px solid ${colors.border}` : undefined,
                background: isToday ? 'rgba(56,161,87,0.05)' : 'transparent',
                cursor: 'pointer',
                position: 'relative',
                opacity: dim ? 0.35 : 1,
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 12, fontWeight: isToday ? 700 : 500,
                  color: isToday ? colors.accent : colors.text,
                  fontVariantNumeric: 'tabular-nums',
                }}>{d.getDate()}</span>
              </div>

              {/* Transaction chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                {entries.slice(0, 3).map((e, idx) => (
                  <Chip
                    key={idx}
                    entry={e}
                    onProjectedClick={onProjectedClick}
                  />
                ))}
                {entries.length > 3 && (
                  <span style={{ fontSize: 10, color: colors.textMuted, paddingLeft: 4 }}>
                    +{entries.length - 3} more
                  </span>
                )}
              </div>

              {/* Daily rollup at the bottom */}
              {(incomeSum > 0 || expenseSum > 0) && (
                <div style={{
                  display: 'flex', gap: 6, fontSize: 10, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums', marginTop: 'auto',
                }}>
                  {incomeSum > 0 && <span style={{ color: colors.accent }}>+{fmtSmall(incomeSum)}</span>}
                  {expenseSum > 0 && <span style={{ color: colors.red }}>−{fmtSmall(expenseSum)}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ------------------ Week grid ------------------
function WeekGrid({
  cursor, entriesByDay, onSelectDay, onAddForDay, onProjectedClick,
}: {
  cursor: Date
  entriesByDay: Record<string, CalendarEntry[]>
  onSelectDay: (iso: string) => void
  onAddForDay: (iso: string) => void
  onProjectedClick: (p: ProjectedTransaction, e: React.MouseEvent) => void
}) {
  const start = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  return (
    <div style={{ minWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${colors.border}` }}>
        {days.map((d, i) => {
          const isToday = toIso(d) === TODAY_ISO
          return (
            <div key={i} style={{
              padding: '12px 14px',
              borderRight: i < 6 ? `1px solid ${colors.border}` : undefined,
              background: isToday ? 'rgba(56,161,87,0.05)' : 'transparent',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 4 }}>
                {WEEKDAYS[i]}
              </div>
              <div style={{
                fontSize: 18, fontWeight: 600,
                color: isToday ? colors.accent : colors.text,
              }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 360 }}>
        {days.map((d, i) => {
          const iso = toIso(d)
          const entries = entriesByDay[iso] ?? []
          const isToday = iso === TODAY_ISO
          return (
            <div
              key={i}
              onClick={() => onSelectDay(iso)}
              style={{
                padding: '10px 12px',
                borderRight: i < 6 ? `1px solid ${colors.border}` : undefined,
                background: isToday ? 'rgba(56,161,87,0.04)' : 'transparent',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              {entries.length === 0 && (
                <span style={{ fontSize: 11, color: colors.textMuted, opacity: 0.4 }}>—</span>
              )}
              {entries.map((e, idx) => (
                <Chip key={idx} entry={e} onProjectedClick={onProjectedClick} expanded />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ------------------ Day list ------------------
function DayList({
  dateIso, entries, clients, onAddForDay, onApprove, onSkip, onEditAndConfirm, onDeleteTx, onEditTx,
}: {
  dateIso: string
  entries: CalendarEntry[]
  clients: ClientSummary[]
  onAddForDay: (iso: string) => void
  onApprove: (p: ProjectedTransaction) => void
  onSkip: (p: ProjectedTransaction) => void
  onEditAndConfirm: (p: ProjectedTransaction) => void
  onDeleteTx: (id: string) => void
  onEditTx: (id: string) => void
}) {
  const sorted = [...entries].sort((a, b) => a.type.localeCompare(b.type))
  return (
    <DayContents
      dateIso={dateIso}
      entries={sorted}
      clients={clients}
      onAddForDay={onAddForDay}
      onApprove={onApprove}
      onSkip={onSkip}
      onEditAndConfirm={onEditAndConfirm}
      onDeleteTx={onDeleteTx}
      onEditTx={onEditTx}
      compact={false}
    />
  )
}

// ------------------ Side panel ------------------
function SidePanel({
  dateIso, entries, clients, onClose, onAddForDay, onApprove, onSkip, onEditAndConfirm, onDeleteTx, onEditTx,
}: {
  dateIso: string
  entries: CalendarEntry[]
  clients: ClientSummary[]
  onClose: () => void
  onAddForDay: (iso: string) => void
  onApprove: (p: ProjectedTransaction) => void
  onSkip: (p: ProjectedTransaction) => void
  onEditAndConfirm: (p: ProjectedTransaction) => void
  onDeleteTx: (id: string) => void
  onEditTx: (id: string) => void
}) {
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90,
      }} />
      <div className="side-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 380, background: colors.cardBg,
        borderLeft: `1px solid ${colors.border}`,
        zIndex: 91, padding: 24, overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        <DayContents
          dateIso={dateIso}
          entries={entries}
          clients={clients}
          onAddForDay={onAddForDay}
          onApprove={onApprove}
          onSkip={onSkip}
          onEditAndConfirm={onEditAndConfirm}
          onDeleteTx={onDeleteTx}
          onEditTx={onEditTx}
          onClose={onClose}
          compact={true}
        />
      </div>
    </>
  )
}

// ------------------ Day contents (shared by day view + side panel) ------------------
function DayContents({
  dateIso, entries, clients, onAddForDay, onApprove, onSkip, onEditAndConfirm, onDeleteTx, onEditTx, onClose, compact,
}: {
  dateIso: string
  entries: CalendarEntry[]
  clients: ClientSummary[]
  onAddForDay: (iso: string) => void
  onApprove: (p: ProjectedTransaction) => void
  onSkip: (p: ProjectedTransaction) => void
  onEditAndConfirm: (p: ProjectedTransaction) => void
  onDeleteTx: (id: string) => void
  onEditTx: (id: string) => void
  onClose?: () => void
  compact: boolean
}) {
  const date = fromIso(dateIso)
  const projected = entries.filter(e => e.kind === 'projected')
  const confirmedEntries = entries.filter(e => e.kind === 'tx')
  const incomeSum = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expenseSum = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const net = incomeSum - expenseSum

  return (
    <div style={compact ? {} : { padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 4 }}>
            {date.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Daily totals */}
      {(incomeSum > 0 || expenseSum > 0) && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 16,
          padding: '10px 14px', background: colors.cardBgElevated,
          borderRadius: borders.radius.medium,
        }}>
          <div>
            <div style={{ fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>IN</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.accent, fontVariantNumeric: 'tabular-nums' }}>{fmt(incomeSum)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>OUT</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: colors.red, fontVariantNumeric: 'tabular-nums' }}>{fmt(expenseSum)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>NET</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: net >= 0 ? colors.accent : colors.red, fontVariantNumeric: 'tabular-nums' }}>
              {net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}
            </div>
          </div>
        </div>
      )}

      {/* Pending approvals */}
      {projected.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.yellow, letterSpacing: '0.08em', marginBottom: 8 }}>
            PENDING APPROVAL ({projected.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projected.map((e, i) => (
              <PendingRow
                key={i}
                entry={e}
                clients={clients}
                onApprove={() => onApprove(e.projection!)}
                onSkip={() => onSkip(e.projection!)}
                onEdit={() => onEditAndConfirm(e.projection!)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed transactions */}
      {confirmedEntries.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 8 }}>
            TRANSACTIONS ({confirmedEntries.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {confirmedEntries.map((e, i) => (
              <TxRow
                key={i}
                entry={e}
                clients={clients}
                onDelete={() => onDeleteTx(e.txId!)}
                onEdit={() => onEditTx(e.txId!)}
              />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
          No transactions for this day.
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => onAddForDay(dateIso)}
        style={{
          width: '100%', padding: '10px 0', marginTop: 8,
          background: 'transparent', border: `1px dashed ${colors.border}`,
          borderRadius: borders.radius.medium,
          color: colors.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        + Add transaction for this day
      </button>
    </div>
  )
}

// ------------------ Chip (used in calendar cells) ------------------
function Chip({
  entry, expanded, onProjectedClick,
}: {
  entry: CalendarEntry
  expanded?: boolean
  onProjectedClick: (p: ProjectedTransaction, e: React.MouseEvent) => void
}) {
  const isIncome = entry.type === 'income'
  const isProjected = entry.kind === 'projected'
  const color = isIncome ? colors.accent : colors.red
  const bg = isIncome ? 'rgba(56,161,87,0.12)' : 'rgba(255,123,114,0.1)'

  function handleClick(e: React.MouseEvent) {
    if (isProjected && entry.projection) onProjectedClick(entry.projection, e)
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: bg,
        borderRadius: 4,
        padding: expanded ? '4px 6px' : '2px 6px',
        fontSize: expanded ? 11 : 10,
        opacity: isProjected ? 0.55 : 1,
        border: isProjected ? `1px dashed ${color}` : `1px solid transparent`,
        cursor: isProjected ? 'pointer' : 'default',
        whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
        gap: 4,
      }}
      title={`${entry.category}${entry.note ? ' · ' + entry.note : ''}`}
    >
      <span style={{ color: color, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {expanded ? entry.category : (entry.category.length > 14 ? entry.category.slice(0, 12) + '…' : entry.category)}
      </span>
      <span style={{ color: color, fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {isIncome ? '+' : '−'}{fmtSmall(entry.amount)}
      </span>
    </div>
  )
}

// ------------------ Pending approval row (in side panel / day view) ------------------
function PendingRow({ entry, clients, onApprove, onSkip, onEdit }: { entry: CalendarEntry; clients: ClientSummary[]; onApprove: () => void; onSkip: () => void; onEdit: () => void }) {
  const isIncome = entry.type === 'income'
  const color = isIncome ? colors.accent : colors.red
  const client = entry.clientId ? clients.find(c => c.id === entry.clientId) : undefined

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '10px 12px',
      background: 'rgba(227,179,65,0.04)',
      border: `1px dashed ${colors.yellow}`,
      borderRadius: borders.radius.medium,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
            {entry.category}
          </div>
          <div style={{ fontSize: 11, color: colors.textMuted }}>
            {[client?.business, entry.note].filter(Boolean).join(' · ') || 'Recurring'}
          </div>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {isIncome ? '+' : '−'}{fmt(entry.amount)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onApprove} style={{
          flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
          background: colors.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Confirm</button>
        <button onClick={onEdit} style={{
          flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
          background: 'transparent', color: colors.text,
          border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Edit</button>
        <button onClick={onSkip} style={{
          flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
          background: 'transparent', color: colors.textMuted,
          border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Skip</button>
      </div>
    </div>
  )
}

// ------------------ Confirmed transaction row ------------------
function TxRow({ entry, clients, onDelete, onEdit }: { entry: CalendarEntry; clients: ClientSummary[]; onDelete: () => void; onEdit: () => void }) {
  const isIncome = entry.type === 'income'
  const color = isIncome ? colors.accent : colors.red
  const client = entry.clientId ? clients.find(c => c.id === entry.clientId) : undefined

  return (
    <div
      onClick={onEdit}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEdit() } }}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: colors.cardBgElevated,
        borderRadius: borders.radius.medium,
        cursor: 'pointer', transition: 'background 0.12s',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {entry.category}
        </div>
        <div style={{ fontSize: 11, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {[client?.business, entry.note].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
        {isIncome ? '+' : '−'}{fmt(entry.amount)}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onEdit() }}
        title="Edit"
        style={{
          background: 'none', border: 'none', color: colors.textMuted,
          cursor: 'pointer', fontSize: 12, opacity: 0.55, padding: '4px 6px',
        }}
      >
        ✎
      </button>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        title="Delete"
        style={{
          background: 'none', border: 'none', color: colors.textMuted,
          cursor: 'pointer', fontSize: 12, opacity: 0.4, padding: '4px 6px',
        }}
      >
        ✕
      </button>
    </div>
  )
}

// ------------------ Approval popover ------------------
function ApprovalPopover({
  projection, x, y, onApprove, onSkip, onEdit,
}: {
  projection: ProjectedTransaction
  x: number; y: number
  onApprove: () => void
  onSkip: () => void
  onEdit: () => void
}) {
  const isIncome = projection.type === 'income'
  const color = isIncome ? colors.accent : colors.red
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', top: y + 8, left: x,
        zIndex: 200, width: 240,
        background: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: borders.radius.medium,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        padding: 12,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: colors.yellow, letterSpacing: '0.08em', marginBottom: 8 }}>
        PENDING APPROVAL
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{projection.category}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
          {isIncome ? '+' : '−'}{fmt(projection.amount)}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onApprove} style={{
          flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
          background: colors.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Confirm</button>
        <button onClick={onEdit} style={{
          flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
          background: 'transparent', color: colors.text,
          border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Edit</button>
        <button onClick={onSkip} style={{
          flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
          background: 'transparent', color: colors.textMuted,
          border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>Skip</button>
      </div>
    </div>
  )
}
