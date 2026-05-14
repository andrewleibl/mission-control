export type CallSource = 'website' | 'referral' | 'cold_outreach' | 'meta_ads' | 'instagram' | 'other'
export type CallOutcome = 'pending' | 'no_show' | 'not_qualified' | 'proposal' | 'closed_won' | 'closed_lost'

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

const KEY = 'mc_sales_calls'

export function loadCalls(): SalesCall[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveCalls(calls: SalesCall[]): void {
  localStorage.setItem(KEY, JSON.stringify(calls))
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
  const past = calls.filter(c => c.outcome !== 'pending')
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
