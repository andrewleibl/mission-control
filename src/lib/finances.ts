// Finance data model + storage + recurring-rule projection logic.

export type TxType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TxType
  date: string // YYYY-MM-DD
  amount: number
  category: string
  clientId?: string
  note?: string
  recurringId?: string // populated when this transaction was generated from a recurring rule
  status: 'confirmed' | 'skipped'
  createdAt: number
}

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export interface RecurringRule {
  id: string
  type: TxType
  amount: number
  category: string
  clientId?: string
  note?: string
  frequency: Frequency
  startDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD; if absent, runs indefinitely
  autoConfirm: boolean
  createdAt: number
}

// A projected (not-yet-confirmed) instance of a recurring rule for a specific date.
// Generated on-the-fly; never stored. UI uses this to render faded "pending approval" chips.
export interface ProjectedTransaction {
  type: TxType
  date: string
  amount: number
  category: string
  clientId?: string
  note?: string
  recurringId: string
  status: 'projected'
}

export const INCOME_CATEGORIES = [
  'Client Retainer',
  'Project Fee',
  'Upsell',
  'Ad Management',
  'Other',
]

export const EXPENSE_CATEGORIES = [
  'Software / Tools',
  'Contractors',
  'Ad Spend',
  'Subscriptions',
  'Office / Admin',
  'Other',
]

const TX_KEY = 'mc_finances_txs_v2'
const RULES_KEY = 'mc_finances_rules_v1'

// ---------- Storage ----------

export function loadTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(TX_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTransactions(txs: Transaction[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TX_KEY, JSON.stringify(txs))
}

export function loadRules(): RecurringRule[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RULES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveRules(rules: RecurringRule[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(RULES_KEY, JSON.stringify(rules))
}

// ---------- Helpers ----------

function toDate(s: string): Date {
  return new Date(s + 'T12:00:00')
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + n)
  return r
}

function nextOccurrence(d: Date, freq: Frequency): Date {
  switch (freq) {
    case 'weekly': return addDays(d, 7)
    case 'biweekly': return addDays(d, 14)
    case 'monthly': return addMonths(d, 1)
    case 'quarterly': return addMonths(d, 3)
    case 'yearly': return addMonths(d, 12)
  }
}

// ---------- Projection ----------

/**
 * Given a date range, return projected transactions from recurring rules
 * that don't already have a confirmed/skipped Transaction record at that date.
 *
 * Used by the calendar view to render faded "pending approval" chips.
 */
export function projectRecurring(
  rules: RecurringRule[],
  txs: Transaction[],
  rangeStart: string,
  rangeEnd: string,
): ProjectedTransaction[] {
  const start = toDate(rangeStart)
  const end = toDate(rangeEnd)
  const projected: ProjectedTransaction[] = []

  // Build a quick lookup: which (recurringId|date) pairs already have a real Transaction?
  const existing = new Set(
    txs
      .filter(t => t.recurringId)
      .map(t => `${t.recurringId}|${t.date}`),
  )

  for (const rule of rules) {
    let cursor = toDate(rule.startDate)
    const ruleEnd = rule.endDate ? toDate(rule.endDate) : null

    // Fast-forward cursor until it's >= rangeStart
    while (cursor < start) {
      cursor = nextOccurrence(cursor, rule.frequency)
    }

    while (cursor <= end) {
      if (ruleEnd && cursor > ruleEnd) break
      const dateStr = toIsoDate(cursor)
      const key = `${rule.id}|${dateStr}`
      if (!existing.has(key)) {
        projected.push({
          type: rule.type,
          date: dateStr,
          amount: rule.amount,
          category: rule.category,
          clientId: rule.clientId,
          note: rule.note,
          recurringId: rule.id,
          status: 'projected',
        })
      }
      cursor = nextOccurrence(cursor, rule.frequency)
    }
  }

  return projected
}

/**
 * Approve a projected transaction — creates a real Transaction record.
 * If `overrides` is provided, those values replace the rule's defaults.
 */
export function approveProjection(
  txs: Transaction[],
  projection: ProjectedTransaction,
  overrides?: Partial<Pick<Transaction, 'amount' | 'category' | 'clientId' | 'note' | 'date'>>,
): Transaction[] {
  const newTx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: projection.type,
    date: overrides?.date ?? projection.date,
    amount: overrides?.amount ?? projection.amount,
    category: overrides?.category ?? projection.category,
    clientId: overrides?.clientId ?? projection.clientId,
    note: overrides?.note ?? projection.note,
    recurringId: projection.recurringId,
    status: 'confirmed',
    createdAt: Date.now(),
  }
  return [newTx, ...txs]
}

/**
 * Skip a projected transaction — creates a Transaction record with status: 'skipped',
 * so it won't show up as a projection again, but also doesn't count in totals.
 */
export function skipProjection(
  txs: Transaction[],
  projection: ProjectedTransaction,
): Transaction[] {
  const skipped: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: projection.type,
    date: projection.date,
    amount: 0,
    category: projection.category,
    clientId: projection.clientId,
    note: projection.note,
    recurringId: projection.recurringId,
    status: 'skipped',
    createdAt: Date.now(),
  }
  return [skipped, ...txs]
}

// ---------- Aggregations (for stats view) ----------

/** Filter to confirmed transactions only (excludes skipped, excludes projected) */
export function confirmed(txs: Transaction[]): Transaction[] {
  return txs.filter(t => t.status === 'confirmed')
}

export function sumIncome(txs: Transaction[]): number {
  return confirmed(txs).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
}

export function sumExpenses(txs: Transaction[]): number {
  return confirmed(txs).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
}

export function netProfit(txs: Transaction[]): number {
  return sumIncome(txs) - sumExpenses(txs)
}

export function txsInMonth(txs: Transaction[], yearMonth: string): Transaction[] {
  return txs.filter(t => t.date.slice(0, 7) === yearMonth)
}

export function txsInRange(txs: Transaction[], start: string, end: string): Transaction[] {
  return txs.filter(t => t.date >= start && t.date <= end)
}
