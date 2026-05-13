'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X,
  Video, Phone, MessageSquare, Mail, Users as UsersIcon, FileText, Flag,
  Pencil, Trash2, Check, ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  RetentionEvent, EventType, EVENT_TYPE_LABELS,
  loadEvents, saveEvents, commsEntryFromEvent,
  toIso, fromIso, startOfWeek, addDays, addMonths,
  eventsThisWeek, overdueEvents, upcomingEvents, daysSinceLastEvent,
} from '@/lib/retention-data'
import {
  Client, CommsEntry,
  loadClients, loadComms, saveComms,
} from '@/lib/clients-data'

// =================================================================
// Type lookups
// =================================================================

const TYPE_COLOR: Record<EventType, { fg: string; bg: string }> = {
  loom: { fg: colors.red, bg: 'rgba(255,123,114,0.12)' },
  call: { fg: colors.accent, bg: 'rgba(56,161,87,0.12)' },
  text: { fg: colors.yellow, bg: 'rgba(227,179,65,0.12)' },
  meeting: { fg: colors.purple, bg: 'rgba(159,122,234,0.12)' },
  report: { fg: colors.blue, bg: 'rgba(99,179,237,0.12)' },
  milestone: { fg: colors.orange, bg: 'rgba(246,173,85,0.12)' },
}

const TYPE_ICON: Record<EventType, LucideIcon> = {
  loom: Video,
  call: Phone,
  text: MessageSquare,
  meeting: UsersIcon,
  report: FileText,
  milestone: Flag,
}

type ViewMode = 'day' | 'week' | 'month'
type FilterKey = 'all' | 'upcoming' | 'overdue' | 'completed'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
]

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const TODAY_ISO = toIso(new Date())

function fmtTime(s?: string): string { return s || '' }

// =================================================================
// Page
// =================================================================
export default function RetentionPage() {
  const [events, setEvents] = useState<RetentionEvent[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [comms, setComms] = useState<CommsEntry[]>([])
  const [view, setView] = useState<ViewMode>('week')
  const [cursor, setCursor] = useState<Date>(new Date())
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [modal, setModal] = useState<
    | { kind: 'add'; date: string; presetClientId?: string }
    | { kind: 'edit'; event: RetentionEvent }
    | null
  >(null)

  useEffect(() => {
    loadEvents().then(setEvents)
    loadClients().then(setClients)
    loadComms().then(setComms)
  }, [])

  function persistEvents(next: RetentionEvent[]) { setEvents(next); saveEvents(next) }
  function persistComms(next: CommsEntry[]) { setComms(next); saveComms(next) }

  // ─── Two-way sync handlers ─────────────────────────────────────

  function addEvent(eventData: Omit<RetentionEvent, 'id' | 'createdAt' | 'linkedCommsId'>) {
    const eventId = `re_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const commsId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const newComms: CommsEntry = {
      id: commsId,
      createdAt: Date.now(),
      ...commsEntryFromEvent({ ...eventData, id: eventId, createdAt: Date.now() }),
    }
    const newEvent: RetentionEvent = {
      ...eventData,
      id: eventId,
      createdAt: Date.now(),
      linkedCommsId: commsId,
    }
    persistEvents([newEvent, ...events])
    persistComms([newComms, ...comms])
  }

  function updateEvent(updated: RetentionEvent) {
    persistEvents(events.map(e => e.id === updated.id ? updated : e))
    // Sync the linked CommsEntry if it exists
    if (updated.linkedCommsId) {
      const synced = commsEntryFromEvent(updated)
      persistComms(comms.map(c => c.id === updated.linkedCommsId ? { ...c, ...synced } : c))
    }
  }

  function deleteEvent(id: string) {
    const ev = events.find(e => e.id === id)
    persistEvents(events.filter(e => e.id !== id))
    if (ev?.linkedCommsId) {
      persistComms(comms.filter(c => c.id !== ev.linkedCommsId))
    }
    if (selectedEventId === id) setSelectedEventId(null)
  }

  function toggleCompleted(id: string) {
    persistEvents(events.map(e => e.id === id ? { ...e, completed: !e.completed } : e))
  }

  // ─── Derived state ─────────────────────────────────────────────

  // KPI numbers
  const weekCount = eventsThisWeek(events).length
  const overdueCount = overdueEvents(events).length
  const upcomingCount = upcomingEvents(events, 7).length
  const staleCount = clients.filter(c =>
    (c.status === 'active' || c.status === 'at_risk') &&
    daysSinceLastEvent(c.id, events) > 14
  ).length

  // Filtered events for visible calendar
  const filteredEvents = useMemo(() => {
    switch (filter) {
      case 'upcoming': return events.filter(e => e.date >= TODAY_ISO && !e.completed)
      case 'overdue': return events.filter(e => e.date < TODAY_ISO && !e.completed)
      case 'completed': return events.filter(e => e.completed)
      case 'all':
      default: return events
    }
  }, [events, filter])

  // ─── Period nav ────────────────────────────────────────────────

  function navigate(dir: -1 | 1) {
    if (view === 'day') setCursor(addDays(cursor, dir))
    else if (view === 'week') setCursor(addDays(cursor, dir * 7))
    else setCursor(addMonths(cursor, dir))
  }
  function jumpToToday() { setCursor(new Date()) }

  const periodLabel = useMemo(() => {
    if (view === 'day') return cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (view === 'week') {
      const s = startOfWeek(cursor)
      const e = addDays(s, 6)
      return `${MONTHS_LONG[s.getMonth()].slice(0, 3)} ${s.getDate()} – ${MONTHS_LONG[e.getMonth()].slice(0, 3)} ${e.getDate()}, ${e.getFullYear()}`
    }
    return `${MONTHS_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`
  }, [view, cursor])

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null

  return (
    <PageContainer>
      <PageHeader
        title="Retention"
        subtitle="Touchpoint calendar — schedule and log every client interaction."
        action={
          <button
            onClick={() => setModal({ kind: 'add', date: TODAY_ISO })}
            style={primaryButtonStyle}
          >
            <Plus size={14} strokeWidth={2.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Add Event
          </button>
        }
      />

      {/* KPI Strip */}
      <div className="kpi-strip" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Kpi label="This Week" value={String(weekCount)} accent={weekCount > 0 ? colors.accent : colors.textMuted} />
        <Kpi label="Overdue" value={String(overdueCount)} accent={overdueCount > 0 ? colors.red : colors.textMuted} />
        <Kpi label="Upcoming 7d" value={String(upcomingCount)} accent={upcomingCount > 0 ? colors.accent : colors.textMuted} />
        <Kpi label="Stale Clients" value={String(staleCount)} accent={staleCount > 0 ? colors.yellow : colors.textMuted} />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        {FILTERS.map(f => {
          const active = filter === f.key
          const count = f.key === 'all' ? events.length :
            f.key === 'upcoming' ? events.filter(e => e.date >= TODAY_ISO && !e.completed).length :
            f.key === 'overdue' ? overdueCount :
            events.filter(e => e.completed).length
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

      {/* Calendar Header */}
      <div className="retention-cal-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate(-1)} style={iconBtnStyle} title="Previous">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} style={iconBtnStyle} title="Next">
            <ChevronRight size={16} />
          </button>
          <button onClick={jumpToToday} style={pillBtnStyle}>Today</button>
          <span className="retention-period-label" style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{periodLabel}</span>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Calendar Body */}
      <div className="retention-cal-body" style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        {view === 'month' && (
          <MonthGrid
            cursor={cursor}
            events={filteredEvents}
            clients={clients}
            onSelectEvent={setSelectedEventId}
            onAddForDay={iso => setModal({ kind: 'add', date: iso })}
          />
        )}
        {view === 'week' && (
          <WeekGrid
            cursor={cursor}
            events={filteredEvents}
            clients={clients}
            onSelectEvent={setSelectedEventId}
            onAddForDay={iso => setModal({ kind: 'add', date: iso })}
          />
        )}
        {view === 'day' && (
          <DayView
            date={cursor}
            events={filteredEvents}
            clients={clients}
            onSelectEvent={setSelectedEventId}
            onAddForDay={iso => setModal({ kind: 'add', date: iso })}
          />
        )}
      </div>

      {/* Side panel */}
      {selectedEvent && (
        <SidePanel
          event={selectedEvent}
          client={clients.find(c => c.id === selectedEvent.clientId)}
          onClose={() => setSelectedEventId(null)}
          onEdit={() => { setModal({ kind: 'edit', event: selectedEvent }); setSelectedEventId(null) }}
          onDelete={() => deleteEvent(selectedEvent.id)}
          onToggleCompleted={() => toggleCompleted(selectedEvent.id)}
        />
      )}

      {/* Add/Edit modal */}
      {modal && (
        <EventModal
          mode={modal.kind}
          defaultDate={modal.kind === 'add' ? modal.date : modal.event.date}
          presetClientId={modal.kind === 'add' ? modal.presetClientId : undefined}
          existing={modal.kind === 'edit' ? modal.event : undefined}
          clients={clients}
          onClose={() => setModal(null)}
          onSave={data => {
            if (modal.kind === 'add') addEvent(data)
            else updateEvent({ ...modal.event, ...data })
            setModal(null)
          }}
        />
      )}
    </PageContainer>
  )
}

// =================================================================
// Sub-components
// =================================================================

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

const primaryButtonStyle: React.CSSProperties = {
  background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
  color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 14px', cursor: 'pointer',
  whiteSpace: 'nowrap' as const, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center',
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

// ---- Week Grid ----
function WeekGrid({
  cursor, events, clients, onSelectEvent, onAddForDay,
}: {
  cursor: Date
  events: RetentionEvent[]
  clients: Client[]
  onSelectEvent: (id: string) => void
  onAddForDay: (iso: string) => void
}) {
  const start = startOfWeek(cursor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))

  return (
    <div style={{ minWidth: 560 }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${colors.border}` }}>
        {days.map((d, i) => {
          const isToday = toIso(d) === TODAY_ISO
          return (
            <div key={i} style={{
              padding: '12px 14px',
              borderRight: i < 6 ? `1px solid ${colors.border}` : undefined,
              background: isToday ? 'rgba(56,161,87,0.05)' : 'transparent',
            }}>
              <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 4 }}>
                {WEEKDAYS[i]}
              </div>
              <div style={{
                ...mono,
                fontSize: 18, fontWeight: 600,
                color: isToday ? colors.accent : colors.text,
                fontVariantNumeric: 'tabular-nums' as const,
              }}>{d.getDate()}</div>
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 400 }}>
        {days.map((d, i) => {
          const iso = toIso(d)
          const cellEvents = events.filter(e => e.date === iso).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
          const isToday = iso === TODAY_ISO
          return (
            <div
              key={i}
              onClick={e => {
                if ((e.target as HTMLElement).closest('[data-event-chip]')) return
                onAddForDay(iso)
              }}
              style={{
                padding: '10px 8px',
                borderRight: i < 6 ? `1px solid ${colors.border}` : undefined,
                background: isToday ? 'rgba(56,161,87,0.04)' : 'transparent',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 6,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              {cellEvents.length === 0 && (
                <div style={{
                  height: 56,
                  border: `1px dashed ${colors.border}`,
                  borderRadius: 5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: colors.textMuted, opacity: 0.35,
                  ...mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                }}>
                  + Add
                </div>
              )}
              {cellEvents.map(ev => {
                const c = clients.find(c => c.id === ev.clientId)
                return (
                  <ExpandedEventChip
                    key={ev.id}
                    event={ev}
                    clientName={c?.business ?? 'Unknown'}
                    onClick={() => onSelectEvent(ev.id)}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Expanded chip (used in week view) ----
function ExpandedEventChip({ event, clientName, onClick }: { event: RetentionEvent; clientName: string; onClick: () => void }) {
  const cp = TYPE_COLOR[event.type]
  const Icon = TYPE_ICON[event.type]
  return (
    <button
      data-event-chip
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 3,
        background: cp.bg,
        borderRadius: 5,
        padding: '6px 8px',
        opacity: event.completed ? 0.55 : 1,
        textDecoration: event.completed ? 'line-through' : 'none',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        textAlign: 'left' as const,
      }}
      title={`${EVENT_TYPE_LABELS[event.type]} — ${event.title}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={10} strokeWidth={2.25} color={cp.fg} style={{ flexShrink: 0 }} />
        <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: cp.fg, letterSpacing: '0.04em' }}>
          {EVENT_TYPE_LABELS[event.type].toUpperCase()}
        </span>
        {event.time && (
          <span style={{ ...mono, fontSize: 9, color: cp.fg, opacity: 0.7, marginLeft: 'auto' }}>
            {event.time}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {clientName}
      </div>
      <div style={{ fontSize: 10, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {event.title}
      </div>
    </button>
  )
}

// ---- Day View ----
function DayView({
  date, events, clients, onSelectEvent, onAddForDay,
}: {
  date: Date
  events: RetentionEvent[]
  clients: Client[]
  onSelectEvent: (id: string) => void
  onAddForDay: (iso: string) => void
}) {
  const iso = toIso(date)
  const dayEvents = events.filter(e => e.date === iso).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
  const isToday = iso === TODAY_ISO

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: isToday ? colors.accent : colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 4 }}>
          {date.toLocaleDateString('en-US', { weekday: 'long' })}{isToday ? ' · TODAY' : ''}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: colors.text }}>
          {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{ ...mono, fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
          {dayEvents.length} {dayEvents.length === 1 ? 'EVENT' : 'EVENTS'}
        </div>
      </div>

      {dayEvents.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center',
          background: colors.cardBgElevated, borderRadius: borders.radius.medium,
          color: colors.textMuted, fontSize: 13,
        }}>
          No events for this day.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dayEvents.map(ev => {
            const c = clients.find(c => c.id === ev.clientId)
            return (
              <DayEventCard
                key={ev.id}
                event={ev}
                clientName={c?.business ?? 'Unknown'}
                clientContact={c?.name ?? ''}
                onClick={() => onSelectEvent(ev.id)}
              />
            )
          })}
        </div>
      )}

      <button
        onClick={() => onAddForDay(iso)}
        style={{
          marginTop: 16, width: '100%', padding: '11px 0',
          background: 'transparent', border: `1px dashed ${colors.border}`,
          borderRadius: borders.radius.medium,
          color: colors.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        + Add event for this day
      </button>
    </div>
  )
}

// ---- Day event card (in Day view) ----
function DayEventCard({
  event, clientName, clientContact, onClick,
}: {
  event: RetentionEvent
  clientName: string
  clientContact: string
  onClick: () => void
}) {
  const cp = TYPE_COLOR[event.type]
  const Icon = TYPE_ICON[event.type]
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: colors.cardBgElevated,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${cp.fg}`,
        borderRadius: borders.radius.medium,
        cursor: 'pointer', fontFamily: 'inherit',
        textAlign: 'left' as const,
        opacity: event.completed ? 0.6 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.cardBgElevated }}
    >
      {/* Type badge */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: 44, height: 44, borderRadius: 8,
        background: cp.bg, border: `1px solid ${cp.fg}40`,
        flexShrink: 0,
      }}>
        <Icon size={16} strokeWidth={2} color={cp.fg} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: cp.fg, letterSpacing: '0.08em' }}>
            {EVENT_TYPE_LABELS[event.type].toUpperCase()}
          </span>
          {event.time && (
            <span style={{ ...mono, fontSize: 11, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' as const }}>
              {event.time}
            </span>
          )}
          {event.completed && (
            <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: colors.accent, letterSpacing: '0.08em' }}>
              · COMPLETED
            </span>
          )}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: colors.text,
          textDecoration: event.completed ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        }}>
          {event.title}
        </div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          {clientName}{clientContact && ` · ${clientContact}`}
        </div>
      </div>
    </button>
  )
}

// ---- Month Grid ----
function MonthGrid({
  cursor, events, clients, onSelectEvent, onAddForDay,
}: {
  cursor: Date
  events: RetentionEvent[]
  clients: Client[]
  onSelectEvent: (id: string) => void
  onAddForDay: (iso: string) => void
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
            ...mono,
            padding: '10px 12px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            color: colors.textMuted, textAlign: 'left',
          }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          const iso = toIso(d)
          const cellEvents = events.filter(e => e.date === iso)
          const isToday = iso === TODAY_ISO
          const dim = !inMonth(d)
          return (
            <div
              key={i}
              onClick={e => {
                if ((e.target as HTMLElement).closest('[data-event-chip]')) return
                onAddForDay(iso)
              }}
              style={{
                minHeight: 110,
                padding: '6px 8px',
                borderRight: ((i + 1) % 7 !== 0) ? `1px solid ${colors.border}` : undefined,
                borderBottom: i < 35 ? `1px solid ${colors.border}` : undefined,
                background: isToday ? 'rgba(56,161,87,0.05)' : 'transparent',
                cursor: 'pointer',
                opacity: dim ? 0.35 : 1,
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{
                  ...mono,
                  fontSize: 12, fontWeight: isToday ? 700 : 500,
                  color: isToday ? colors.accent : colors.text,
                  fontVariantNumeric: 'tabular-nums' as const,
                }}>{d.getDate()}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                {cellEvents.slice(0, 3).map(e => {
                  const c = clients.find(c => c.id === e.clientId)
                  return (
                    <EventChip
                      key={e.id}
                      event={e}
                      clientName={c?.business ?? 'Unknown'}
                      onClick={() => onSelectEvent(e.id)}
                    />
                  )
                })}
                {cellEvents.length > 3 && (
                  <span style={{ ...mono, fontSize: 10, color: colors.textMuted, paddingLeft: 4 }}>
                    +{cellEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- Event Chip (in month cell) ----
function EventChip({ event, clientName, onClick }: { event: RetentionEvent; clientName: string; onClick: () => void }) {
  const colorPair = TYPE_COLOR[event.type]
  const Icon = TYPE_ICON[event.type]
  return (
    <button
      data-event-chip
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: colorPair.bg,
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 10,
        opacity: event.completed ? 0.55 : 1,
        textDecoration: event.completed ? 'line-through' : 'none',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap' as const, overflow: 'hidden',
        textAlign: 'left' as const,
      }}
      title={`${EVENT_TYPE_LABELS[event.type]} — ${clientName}: ${event.title}`}
    >
      <Icon size={9} strokeWidth={2.25} color={colorPair.fg} style={{ flexShrink: 0 }} />
      <span style={{ color: colorPair.fg, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {clientName.length > 18 ? clientName.slice(0, 16) + '…' : clientName}
      </span>
    </button>
  )
}

// ---- Side Panel (event detail) ----
function SidePanel({
  event, client, onClose, onEdit, onDelete, onToggleCompleted,
}: {
  event: RetentionEvent
  client?: Client
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleCompleted: () => void
}) {
  const colorPair = TYPE_COLOR[event.type]
  const Icon = TYPE_ICON[event.type]
  const eventDate = fromIso(event.date)
  const isPast = event.date < TODAY_ISO

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} />
      <div className="side-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
        background: colors.cardBg, borderLeft: `1px solid ${colors.border}`,
        zIndex: 91, padding: 28, overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <span style={{
            ...mono,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
            background: colorPair.bg, color: colorPair.fg,
            letterSpacing: '0.08em',
          }}>
            <Icon size={11} strokeWidth={2.25} />
            {EVENT_TYPE_LABELS[event.type].toUpperCase()}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: colors.text, marginBottom: 4 }}>
          {event.title}
        </div>
        <div style={{ ...mono, fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>
          {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          {event.time && ` · ${event.time}`}
        </div>

        {/* Client link */}
        {client && (
          <div style={{
            ...cardStyleAccent, padding: '12px 14px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.08em', fontWeight: 600 }}>CLIENT</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 2 }}>{client.business}</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{client.name}</div>
            </div>
            <a
              href={`/clients`}
              style={{
                ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                color: colors.accent, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 4,
                border: `1px solid rgba(56,161,87,0.25)`,
              }}
            >
              OPEN <ExternalLink size={10} strokeWidth={2.25} />
            </a>
          </div>
        )}

        {/* Notes */}
        {event.notes && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>NOTES</div>
            <div style={{
              padding: '10px 12px', background: colors.cardBgElevated,
              borderRadius: borders.radius.medium, fontSize: 13, color: colors.text,
              lineHeight: 1.5, whiteSpace: 'pre-wrap' as const,
            }}>
              {event.notes}
            </div>
          </div>
        )}

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {event.completed ? (
            <span style={{
              ...mono, fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
              background: 'rgba(56,161,87,0.12)', color: colors.accent, letterSpacing: '0.08em',
            }}>COMPLETED</span>
          ) : isPast ? (
            <span style={{
              ...mono, fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
              background: 'rgba(255,123,114,0.12)', color: colors.red, letterSpacing: '0.08em',
            }}>OVERDUE</span>
          ) : (
            <span style={{
              ...mono, fontSize: 10, fontWeight: 700, padding: '4px 9px', borderRadius: 4,
              background: 'rgba(99,179,237,0.12)', color: colors.blue, letterSpacing: '0.08em',
            }}>UPCOMING</span>
          )}
          <span style={{
            ...mono, fontSize: 10, fontWeight: 600, padding: '4px 9px', borderRadius: 4,
            background: 'rgba(125,138,153,0.1)', color: colors.textMuted, letterSpacing: '0.06em',
          }}>SYNCED → COMMS</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onToggleCompleted} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 0',
            background: event.completed ? 'transparent' : colors.accent,
            color: event.completed ? colors.textMuted : '#fff',
            border: event.completed ? `1px solid ${colors.border}` : 'none',
            borderRadius: borders.radius.medium,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Check size={14} strokeWidth={2.5} />
            {event.completed ? 'Mark as Open' : 'Mark Completed'}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', background: 'transparent', color: colors.text,
              border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Pencil size={12} strokeWidth={2} /> Edit
            </button>
            <button onClick={onDelete} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', background: 'transparent', color: colors.red,
              border: `1px solid rgba(255,123,114,0.3)`, borderRadius: borders.radius.medium,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Trash2 size={12} strokeWidth={2} /> Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ---- Add/Edit Modal ----
function EventModal({
  mode, defaultDate, presetClientId, existing, clients, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  defaultDate: string
  presetClientId?: string
  existing?: RetentionEvent
  clients: Client[]
  onClose: () => void
  onSave: (data: Omit<RetentionEvent, 'id' | 'createdAt' | 'linkedCommsId'>) => void
}) {
  const [type, setType] = useState<EventType>(existing?.type ?? 'call')
  const [date, setDate] = useState(existing?.date ?? defaultDate)
  const [time, setTime] = useState(existing?.time ?? '')
  const [clientId, setClientId] = useState(existing?.clientId ?? presetClientId ?? clients[0]?.id ?? '')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [completed, setCompleted] = useState(existing?.completed ?? false)

  function save() {
    if (!title.trim() || !clientId) return
    onSave({
      clientId, type, date,
      time: time || undefined,
      title: title.trim(),
      notes: notes.trim(),
      completed,
    })
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
      <div className="modal-sheet" style={{ ...cardStyle, width: 480, padding: 28, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {mode === 'add' ? 'Add Event' : 'Edit Event'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type pills */}
          <div>
            <label style={labelStyle}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => {
                const active = type === t
                const cp = TYPE_COLOR[t]
                const Icon = TYPE_ICON[t]
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      ...mono,
                      padding: '8px 0',
                      borderRadius: borders.radius.medium,
                      border: `1px solid ${active ? cp.fg : colors.border}`,
                      background: active ? cp.bg : 'transparent',
                      color: active ? cp.fg : colors.textMuted,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      letterSpacing: '0.06em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      fontFamily: 'var(--font-mono), monospace',
                    }}
                  >
                    <Icon size={11} strokeWidth={2.25} />
                    {EVENT_TYPE_LABELS[t].toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, ...mono }} />
            </div>
            <div>
              <label style={labelStyle}>Time (opt.)</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, ...mono }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Client</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {clients.length === 0 && <option value="">— No clients yet —</option>}
              {clients.map(c => <option key={c.id} value={c.id}>{c.business} · {c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Title <span style={{ color: colors.red }}>*</span></label>
            <input
              type="text" autoFocus
              placeholder="What's the touchpoint?"
              value={title} onChange={e => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              placeholder="Talking points, context, anything to remember..."
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' as const, lineHeight: 1.5 }}
            />
          </div>

          {mode === 'edit' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)} />
              Mark as completed
            </label>
          )}
        </div>

        <div style={{
          ...mono,
          marginTop: 14, padding: '8px 12px', fontSize: 10,
          background: 'rgba(125,138,153,0.06)', color: colors.textMuted,
          borderRadius: borders.radius.medium, letterSpacing: '0.04em',
        }}>
          {mode === 'add'
            ? 'NOTE: Saving will also create a Comms entry on the client.'
            : 'NOTE: Saving will update the linked Comms entry on the client.'}
        </div>

        <button onClick={save} style={{
          marginTop: 16, width: '100%', padding: '11px 0',
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {mode === 'add' ? 'Save Event' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
