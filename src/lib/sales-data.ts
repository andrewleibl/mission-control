import { cached, invalidate } from '@/lib/cache'

export type CallSource = 'website' | 'referral' | 'cold_outreach' | 'meta_ads' | 'instagram' | 'other'
export type CallOutcome = 'pending' | 'no_show' | 'rescheduled' | 'not_qualified' | 'proposal' | 'closed_won' | 'closed_lost'

export type SalesCall = {
  id: string
  createdAt: number
  date: string       // YYYY-MM-DD — the scheduled call date
  time?: string
  name: string       // prospect name
  business: string
  service?: string
  source: CallSource
  showed: boolean
  qualified: boolean
  outcome: CallOutcome
  value?: number     // deal value in dollars
  notes?: string
}

// ─── Persistence (Supabase) ──────────────────────────────────────────
// Sales calls live in the `sales_calls` table. They used to live in
// localStorage under LEGACY_KEY; loadCalls() runs a one-time, idempotent
// import on first load and keeps the localStorage copy as a backup.

const CK_CALLS = 'sales_calls'
const LEGACY_KEY = 'mc_sales_calls'
const IMPORT_FLAG = 'mc_sales_calls_migrated'

function newId(): string {
  return `sc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function rowToCall(r: Record<string, unknown>): SalesCall {
  return {
    id: r.id as string,
    createdAt: r.created_at as number,
    date: r.date as string,
    time: (r.call_time as string) ?? undefined,
    name: (r.name as string) ?? '',
    business: (r.business as string) ?? '',
    service: (r.service as string) ?? undefined,
    source: r.source as CallSource,
    showed: !!r.showed,
    qualified: !!r.qualified,
    outcome: r.outcome as CallOutcome,
    value: r.value == null ? undefined : Number(r.value),
    notes: (r.notes as string) ?? undefined,
  }
}

function callToRow(c: SalesCall): Record<string, unknown> {
  return {
    id: c.id,
    created_at: c.createdAt,
    date: c.date,
    call_time: c.time ?? null,
    name: c.name,
    business: c.business,
    service: c.service ?? null,
    source: c.source,
    showed: c.showed,
    qualified: c.qualified,
    outcome: c.outcome,
    value: c.value ?? null,
    notes: c.notes ?? null,
  }
}

// One-time import of legacy localStorage calls into Supabase. Idempotent
// (upsert by id) and non-destructive (localStorage copy is left intact as a
// backup). Resets its in-memory guard on failure so the next load retries.
let migrationDone = false
async function migrateFromLocalStorage(): Promise<void> {
  if (migrationDone || typeof window === 'undefined') return
  migrationDone = true
  try {
    if (localStorage.getItem(IMPORT_FLAG)) return
    const raw = localStorage.getItem(LEGACY_KEY)
    const legacy = raw ? JSON.parse(raw) : []
    if (!Array.isArray(legacy) || legacy.length === 0) {
      localStorage.setItem(IMPORT_FLAG, '1')
      return
    }
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { error } = await sb.from('sales_calls').upsert(
      (legacy as SalesCall[]).map(callToRow),
      { onConflict: 'id' },
    )
    if (error) { console.error('sales migrate', error); migrationDone = false; return }
    localStorage.setItem(IMPORT_FLAG, '1')
  } catch (e) {
    console.error('sales migrate failed', e)
    migrationDone = false
  }
}

export async function loadCalls(): Promise<SalesCall[]> {
  return cached(CK_CALLS, async () => {
    await migrateFromLocalStorage()
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data, error } = await sb.from('sales_calls')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) { console.error('loadCalls', error); return [] }
    return (data ?? []).map(rowToCall)
  })
}

export async function createCall(data: Omit<SalesCall, 'id' | 'createdAt'>): Promise<SalesCall> {
  const call: SalesCall = { ...data, id: newId(), createdAt: Date.now() }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sales_calls').insert(callToRow(call))
  if (error) throw error
  invalidate(CK_CALLS)
  return call
}

export async function updateCall(id: string, data: Omit<SalesCall, 'id' | 'createdAt'>): Promise<void> {
  const row = callToRow({ ...data, id, createdAt: 0 })
  delete row.id
  delete row.created_at
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sales_calls').update(row).eq('id', id)
  if (error) throw error
  invalidate(CK_CALLS)
}

export async function deleteCall(id: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sales_calls').delete().eq('id', id)
  if (error) throw error
  invalidate(CK_CALLS)
}

// ─── Labels & colors ────────────────────────────────────────────────

export const SOURCE_META: Record<CallSource, { label: string; color: string }> = {
  website:       { label: 'Website',       color: '#38A157' },
  referral:      { label: 'Referral',      color: '#9F7AEA' },
  cold_outreach: { label: 'Cold Outreach', color: '#63B3ED' },
  meta_ads:      { label: 'Meta Ads',      color: '#3B82F6' },
  instagram:     { label: 'Instagram',     color: '#F6AD55' },
  other:         { label: 'Other',         color: '#718096' },
}

export const OUTCOME_META: Record<CallOutcome, { label: string; color: string }> = {
  pending:       { label: 'Pending',       color: '#718096' },
  no_show:       { label: 'No Show',       color: '#FC8181' },
  rescheduled:   { label: 'Rescheduled',   color: '#63B3ED' },
  not_qualified: { label: 'Not Qualified', color: '#F6AD55' },
  proposal:      { label: 'Proposal Out',  color: '#9F7AEA' },
  closed_won:    { label: 'Closed Won',    color: '#38A157' },
  closed_lost:   { label: 'Closed Lost',   color: '#FC8181' },
}

// ─── Derived stats ───────────────────────────────────────────────────

export type SalesStats = {
  total: number
  showed: number
  showRate: number
  qualified: number
  qualRate: number
  closedWon: number
  closeRate: number
  revenue: number
  pipeline: number
  avgDeal: number
}

export function computeStats(calls: SalesCall[]): SalesStats {
  const past = calls.filter(c => c.outcome !== 'pending' && c.outcome !== 'rescheduled')
  const showed = past.filter(c => c.showed).length
  const qualified = past.filter(c => c.qualified).length
  const closedWon = past.filter(c => c.outcome === 'closed_won').length
  const revenue = past.filter(c => c.outcome === 'closed_won').reduce((s, c) => s + (c.value || 0), 0)
  const pipeline = calls.filter(c => c.outcome === 'proposal').reduce((s, c) => s + (c.value || 0), 0)
  const avgDeal = closedWon > 0 ? revenue / closedWon : 0

  return {
    total: calls.length,
    showed,
    showRate: past.length > 0 ? (showed / past.length) * 100 : 0,
    qualified,
    qualRate: showed > 0 ? (qualified / showed) * 100 : 0,
    closedWon,
    closeRate: qualified > 0 ? (closedWon / qualified) * 100 : 0,
    revenue,
    pipeline,
    avgDeal,
  }
}

// ─── Date helpers ────────────────────────────────────────────────────

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const WEEKDAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function isoWeek(isoDate: string): string {
  const d = new Date(isoDate)
  const monday = new Date(d)
  monday.setDate(d.getDate() - d.getDay() + 1)
  return toISO(monday)
}

export function fmtCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

export function fmtPct(n: number): string {
  return `${Math.round(n)}%`
}
