import {
  Transaction, RecurringRule, ProjectedTransaction,
  projectRecurring, confirmed,
} from '@/lib/finances'
import { cached, invalidate } from '@/lib/cache'

export const DEFAULT_GOAL_KEY = 'default'

export interface ProjectionGoal {
  scope: string
  monthlyNetGoal: number
  updatedAt: number
}

export interface MonthBreakdown {
  iso: string                 // 'YYYY-MM'
  label: string               // 'May 2026'
  isPast: boolean
  isCurrent: boolean
  confirmedIncome: number
  confirmedExpense: number
  projectedIncome: number     // from recurring rules (not yet confirmed)
  projectedExpense: number    // from recurring rules (not yet confirmed)
  totalIncome: number         // confirmed + projected
  totalExpense: number        // confirmed + projected
  net: number                 // totalIncome - totalExpense
  goal: number
  pctOfGoal: number           // 0..∞ where 1.0 = met goal
  contributors: Contributor[]
}

export interface Contributor {
  type: 'income' | 'expense'
  category: string
  amount: number
  source: 'confirmed' | 'projected'
  clientId?: string
  note?: string
  date: string
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** First day of month containing `d` */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Last day of month containing `d` */
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export interface BuildOpts {
  monthsBack?: number      // how many past months to include
  monthsAhead?: number     // how many future months to include
  goals: Map<string, number>  // 'YYYY-MM' or 'default' → amount
}

export function buildBreakdowns(
  txs: Transaction[],
  rules: RecurringRule[],
  opts: BuildOpts,
): MonthBreakdown[] {
  const monthsBack = opts.monthsBack ?? 2
  const monthsAhead = opts.monthsAhead ?? 11
  const today = new Date()
  const todayIso = ymd(today)
  const currentMonth = monthIso(today)
  const defaultGoal = opts.goals.get(DEFAULT_GOAL_KEY) ?? 0

  const out: MonthBreakdown[] = []

  for (let offset = -monthsBack; offset <= monthsAhead; offset++) {
    const cursor = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    const monthKey = monthIso(cursor)
    const start = startOfMonth(cursor)
    const end = endOfMonth(cursor)
    const startIso = ymd(start)
    const endIso = ymd(end)

    let confirmedIncome = 0, confirmedExpense = 0
    let projectedIncome = 0, projectedExpense = 0
    const contributors: Contributor[] = []

    // Confirmed (real) transactions falling in this month
    for (const t of confirmed(txs)) {
      if (t.date < startIso || t.date > endIso) continue
      if (t.type === 'income') confirmedIncome += t.amount
      else confirmedExpense += t.amount
      contributors.push({
        type: t.type, category: t.category, amount: t.amount,
        source: 'confirmed', clientId: t.clientId, note: t.note, date: t.date,
      })
    }

    // Projected (from recurring rules) — only count entries whose scheduled
    // date has already passed. Future-dated recurrences don't get added to
    // the projection until they "fire" on their date.
    const proj = projectRecurring(rules, txs, startIso, endIso)
    for (const p of proj) {
      if (p.date > todayIso) continue
      if (p.type === 'income') projectedIncome += p.amount
      else projectedExpense += p.amount
      contributors.push({
        type: p.type, category: p.category, amount: p.amount,
        source: 'projected', clientId: p.clientId, note: p.note, date: p.date,
      })
    }

    const totalIncome = confirmedIncome + projectedIncome
    const totalExpense = confirmedExpense + projectedExpense
    const net = totalIncome - totalExpense
    const goal = opts.goals.get(monthKey) ?? defaultGoal
    const pctOfGoal = goal > 0 ? net / goal : 0

    contributors.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return b.amount - a.amount
    })

    out.push({
      iso: monthKey,
      label: monthLabel(cursor.getFullYear(), cursor.getMonth()),
      isPast: monthKey < currentMonth,
      isCurrent: monthKey === currentMonth,
      confirmedIncome,
      confirmedExpense,
      projectedIncome,
      projectedExpense,
      totalIncome,
      totalExpense,
      net,
      goal,
      pctOfGoal,
      contributors,
    })
  }

  return out
}

// ---------- Weekly breakdown ----------

export interface WeekBreakdown {
  label: string          // "May 1 – 7"
  startIso: string
  endIso: string
  income: number
  expense: number
  net: number
  isPast: boolean        // entire week ended before today
  isCurrent: boolean     // today falls inside this week
}

export function buildWeekBreakdown(month: MonthBreakdown): WeekBreakdown[] {
  const [yearStr, mStr] = month.iso.split('-')
  const year = parseInt(yearStr, 10)
  const monthIndex = parseInt(mStr, 10) - 1
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const todayIso = ymd(new Date())

  const buckets: { start: number; end: number }[] = []
  for (let d = 1; d <= lastDay; d += 7) {
    buckets.push({ start: d, end: Math.min(d + 6, lastDay) })
  }

  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('en-US', { month: 'short' })

  return buckets.map(({ start, end }) => {
    const startIso = ymd(new Date(year, monthIndex, start))
    const endIso = ymd(new Date(year, monthIndex, end))
    let income = 0, expense = 0
    for (const c of month.contributors) {
      if (c.date < startIso || c.date > endIso) continue
      if (c.type === 'income') income += c.amount
      else expense += c.amount
    }
    const label = start === end ? `${monthLabel} ${start}` : `${monthLabel} ${start} – ${end}`
    return {
      label, startIso, endIso,
      income, expense,
      net: income - expense,
      isPast: endIso < todayIso,
      isCurrent: todayIso >= startIso && todayIso <= endIso,
    }
  })
}

// ---------- Pacing (only meaningful for current month) ----------

export interface PacingInfo {
  dayOfMonth: number
  daysInMonth: number
  pctElapsed: number     // 0..1
  expectedNet: number    // pro-rated goal for elapsed portion
  actualNet: number
  gap: number            // actualNet − expectedNet (positive = ahead, negative = behind)
  status: 'ahead' | 'behind' | 'onpace'
}

export function getPacing(month: MonthBreakdown): PacingInfo | null {
  if (!month.isCurrent || month.goal <= 0) return null
  const today = new Date()
  const [yearStr, mStr] = month.iso.split('-')
  const year = parseInt(yearStr, 10)
  const monthIndex = parseInt(mStr, 10) - 1
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const dayOfMonth = today.getDate()
  const pctElapsed = Math.min(1, dayOfMonth / daysInMonth)
  const expectedNet = month.goal * pctElapsed
  const gap = month.net - expectedNet
  let status: 'ahead' | 'behind' | 'onpace' = 'onpace'
  // 5% tolerance band around expected; outside that, ahead or behind.
  if (Math.abs(gap) > month.goal * 0.05) status = gap > 0 ? 'ahead' : 'behind'
  return { dayOfMonth, daysInMonth, pctElapsed, expectedNet, actualNet: month.net, gap, status }
}

// ---------- Goals storage (Supabase) ----------

const CK_GOALS = 'projection_goals'

export async function loadGoals(): Promise<Map<string, number>> {
  return cached(CK_GOALS, async () => {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data, error } = await sb.from('projection_settings').select('*')
    if (error) { console.error('loadGoals', error); return new Map() }
    const m = new Map<string, number>()
    for (const r of data ?? []) m.set(r.scope, Number(r.monthly_net_goal))
    return m
  })
}

export async function setGoal(scope: string, amount: number): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('projection_settings').upsert(
    { scope, monthly_net_goal: amount, updated_at: Date.now() },
    { onConflict: 'scope' },
  )
  if (error) throw error
  invalidate(CK_GOALS)
}

export async function clearGoal(scope: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('projection_settings').delete().eq('scope', scope)
  if (error) throw error
  invalidate(CK_GOALS)
}
