// Retention touchpoint scheduling — calendar of client interactions.
// Each event optionally syncs to a CommsEntry on the linked client so the
// client's /clients deep-dive timeline reflects retention activity.

import { CommsEntry, CommsType } from './clients-data'

export type EventType = 'loom' | 'call' | 'text' | 'meeting' | 'report' | 'milestone'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  loom: 'Loom',
  call: 'Call',
  text: 'Text',
  meeting: 'Meeting',
  report: 'Report',
  milestone: 'Milestone',
}

// Map retention event types → CommsEntry types (for the two-way sync).
// Loom and milestone become 'other' since there's no perfect comms equivalent.
export const EVENT_TO_COMMS_TYPE: Record<EventType, CommsType> = {
  loom: 'other',
  call: 'call',
  text: 'text',
  meeting: 'meeting',
  report: 'email',
  milestone: 'other',
}

export interface RetentionEvent {
  id: string
  clientId: string
  type: EventType
  date: string // YYYY-MM-DD
  time?: string // HH:MM (optional)
  title: string
  notes: string
  completed: boolean
  linkedCommsId?: string // bidirectional pointer to the auto-created CommsEntry
  createdAt: number
}

export async function loadEvents(): Promise<RetentionEvent[]> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data } = await sb.from('retention_events').select('*').order('date', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id, clientId: r.client_id, type: r.type, date: r.date,
    time: r.time ?? undefined, title: r.title, notes: r.notes ?? '',
    completed: r.completed, linkedCommsId: r.linked_comms_id ?? undefined,
    createdAt: r.created_at,
  }))
}

export async function saveEvents(events: RetentionEvent[]): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  const rows = events.map(e => ({
    id: e.id, client_id: e.clientId, type: e.type, date: e.date,
    time: e.time ?? null, title: e.title, notes: e.notes,
    completed: e.completed, linked_comms_id: e.linkedCommsId ?? null,
    created_at: e.createdAt, user_id: user.id,
  }))
  await sb.from('retention_events').delete().eq('user_id', user.id)
  if (rows.length > 0) await sb.from('retention_events').insert(rows)
}

// =================================================================
// Two-way sync helpers
// =================================================================

/** Build a CommsEntry payload from a retention event (for the sync). */
export function commsEntryFromEvent(event: RetentionEvent): Omit<CommsEntry, 'id' | 'createdAt'> {
  return {
    clientId: event.clientId,
    date: event.date,
    type: EVENT_TO_COMMS_TYPE[event.type],
    summary: event.title,
    context: event.notes || undefined,
    pinned: false,
  }
}

// =================================================================
// Date helpers
// =================================================================

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromIso(s: string): Date {
  return new Date(s + 'T12:00:00')
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d)
  r.setDate(d.getDate() - d.getDay())
  return r
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

// =================================================================
// Aggregation helpers (for KPI strip + churn signals)
// =================================================================

export function eventsThisWeek(events: RetentionEvent[]): RetentionEvent[] {
  const now = new Date()
  const start = toIso(startOfWeek(now))
  const end = toIso(addDays(startOfWeek(now), 6))
  return events.filter(e => e.date >= start && e.date <= end)
}

export function overdueEvents(events: RetentionEvent[]): RetentionEvent[] {
  const todayIso = toIso(new Date())
  return events.filter(e => e.date < todayIso && !e.completed)
}

export function upcomingEvents(events: RetentionEvent[], days = 7): RetentionEvent[] {
  const todayIso = toIso(new Date())
  const endIso = toIso(addDays(new Date(), days))
  return events.filter(e => e.date >= todayIso && e.date <= endIso)
}

/**
 * Returns the most recent event date for a client (or null if none).
 * Used to detect stale relationships ("no touchpoint in N days").
 */
export function lastEventDateForClient(clientId: string, events: RetentionEvent[]): string | null {
  const clientEvents = events.filter(e => e.clientId === clientId)
  if (clientEvents.length === 0) return null
  return clientEvents.reduce((max, e) => e.date > max ? e.date : max, clientEvents[0].date)
}

export function daysSinceLastEvent(clientId: string, events: RetentionEvent[]): number {
  const last = lastEventDateForClient(clientId, events)
  if (!last) return Infinity
  const d = fromIso(last)
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}
