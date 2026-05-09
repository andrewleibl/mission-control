// Shared client module — single source of truth across the app.
// Used by /clients (full command center) and /finances (per-client tagging).

export type ClientStatus = 'active' | 'at_risk' | 'churned' | 'prospect' | 'onboarding'

export type ServiceType = 'ads' | 'web' | 'retainer' | 'project' | 'other'

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ads: 'Ads',
  web: 'Web Design',
  retainer: 'Retainer',
  project: 'Project',
  other: 'Other',
}

export type Client = {
  id: string
  name: string
  business: string
  status: ClientStatus
  serviceType: ServiceType
  monthlyRetainer: number // what they pay you per month; 0 for project-only
  startDate?: string // ISO date — when relationship began
  renewalDate: string // ISO date or 'N/A' (for project-only)
  lastContact: string // ISO date
  contactEmail?: string
  contactPhone?: string
  notes: string
  createdAt: number
}

export const seedClients: Client[] = [
  {
    id: '1',
    name: 'Hector Huizar',
    business: 'Valley of the Sun Landscape',
    status: 'active',
    serviceType: 'ads',
    monthlyRetainer: 785,
    startDate: '2026-01-15',
    renewalDate: '2026-07-10',
    lastContact: '2026-05-06',
    notes: 'Under-pacing by 32%. Considering budget increase.',
    createdAt: Date.now(),
  },
  {
    id: '2',
    name: 'PJ Sparks',
    business: 'We Do Hardscape',
    status: 'at_risk',
    serviceType: 'ads',
    monthlyRetainer: 285,
    startDate: '2026-02-09',
    renewalDate: '2026-08-09',
    lastContact: '2026-04-21',
    notes: 'CTR dropped 0.91%. Needs creative refresh.',
    createdAt: Date.now(),
  },
  {
    id: '3',
    name: 'Ricardo Madera',
    business: 'Madera Landscape',
    status: 'active',
    serviceType: 'ads',
    monthlyRetainer: 285,
    startDate: '2026-02-09',
    renewalDate: '2026-08-09',
    lastContact: '2026-05-07',
    notes: 'Wants to compare $500 vs last month spend.',
    createdAt: Date.now(),
  },
  {
    id: '4',
    name: 'Vicelia Tinde',
    business: 'Clutch Barber Supply',
    status: 'active',
    serviceType: 'web',
    monthlyRetainer: 0,
    startDate: '2026-04-15',
    renewalDate: 'N/A',
    lastContact: '2026-05-05',
    notes: 'Shopify redesign HIGH PRIORITY. $900 outstanding.',
    createdAt: Date.now(),
  },
]

// ---- Comms log ----

export type CommsType = 'call' | 'email' | 'text' | 'meeting' | 'other'

export interface CommsEntry {
  id: string
  clientId: string
  date: string // YYYY-MM-DD
  type: CommsType
  summary: string // required — the substance of the conversation
  context?: string // optional — longer notes / detail
  pinned: boolean
  createdAt: number
}

// ---- Action items ----

export interface ActionItem {
  id: string
  clientId: string
  commsEntryId?: string // link to the conversation that spawned this
  title: string
  dueDate?: string // YYYY-MM-DD
  completed: boolean
  completedAt?: number
  createdAt: number
}

// =================================================================
// Storage
// =================================================================

const CLIENTS_KEY = 'mc_clients_v1'
const COMMS_KEY = 'mc_comms_v1'
const ACTIONS_KEY = 'mc_actions_v1'

export function loadClients(): Client[] {
  if (typeof window === 'undefined') return seedClients
  try {
    const raw = localStorage.getItem(CLIENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return seedClients
}

export function saveClients(clients: Client[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))
}

export function loadComms(): CommsEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(COMMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveComms(entries: CommsEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(COMMS_KEY, JSON.stringify(entries))
}

export function loadActions(): ActionItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(ACTIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveActions(items: ActionItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(items))
}

// =================================================================
// Lightweight summary (legacy compat — used by /finances tagging)
// =================================================================

export type ClientSummary = { id: string; name: string; business: string; status: ClientStatus }

export function getClientsForTagging(): ClientSummary[] {
  return loadClients().map(c => ({ id: c.id, name: c.name, business: c.business, status: c.status }))
}

export function getClientById(id: string): ClientSummary | undefined {
  const c = loadClients().find(c => c.id === id)
  return c ? { id: c.id, name: c.name, business: c.business, status: c.status } : undefined
}

// =================================================================
// Derived metrics
// =================================================================

export function daysSince(dateStr: string): number {
  if (!dateStr || dateStr === 'N/A') return Infinity
  const date = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / 86400000)
}

export function daysUntil(dateStr: string): number {
  if (!dateStr || dateStr === 'N/A') return Infinity
  const date = new Date(dateStr + 'T12:00:00')
  const now = new Date()
  return Math.floor((date.getTime() - now.getTime()) / 86400000)
}

// Compute the most-recent contact date for a client by combining
// their stored lastContact field with logged comms entries.
export function lastContactDate(client: Client, comms: CommsEntry[]): string {
  const clientComms = comms.filter(c => c.clientId === client.id)
  if (clientComms.length === 0) return client.lastContact
  const mostRecent = clientComms.reduce((max, c) => c.date > max ? c.date : max, client.lastContact)
  return mostRecent
}

export function openActionItems(clientId: string, items: ActionItem[]): ActionItem[] {
  return items.filter(i => i.clientId === clientId && !i.completed)
}

export function overdueActionItems(clientId: string, items: ActionItem[]): ActionItem[] {
  const todayIso = new Date().toISOString().slice(0, 10)
  return openActionItems(clientId, items).filter(i => i.dueDate && i.dueDate < todayIso)
}

// =================================================================
// Payment status — derived from Finances income transactions
// =================================================================

// Minimal shape so this lib doesn't have to import from finances.
export interface FinanceTxLite {
  type: 'income' | 'expense'
  date: string
  amount: number
  clientId?: string
  status: 'confirmed' | 'skipped'
}

export type PaymentState = 'current' | 'overdue' | 'no-billing'

export interface PaymentStatus {
  state: PaymentState
  lastPaymentDate?: string
  daysSincePayment?: number
  mtdRevenue: number
}

export function computePaymentStatus(client: Client, txs: FinanceTxLite[]): PaymentStatus {
  // Project-only / no recurring billing
  if (client.monthlyRetainer === 0) return { state: 'no-billing', mtdRevenue: 0 }

  const clientIncome = txs.filter(t =>
    t.type === 'income' && t.status === 'confirmed' && t.clientId === client.id
  )

  if (clientIncome.length === 0) {
    return { state: 'overdue', mtdRevenue: 0 }
  }

  const sorted = [...clientIncome].sort((a, b) => b.date.localeCompare(a.date))
  const lastPaymentDate = sorted[0].date
  const daysSincePayment = daysSince(lastPaymentDate)

  // MTD revenue
  const monthIso = new Date().toISOString().slice(0, 7)
  const mtdRevenue = clientIncome
    .filter(t => t.date.slice(0, 7) === monthIso)
    .reduce((s, t) => s + t.amount, 0)

  // Overdue if no payment in 35+ days (gives a bit of grace beyond a 30-day cycle)
  const state: PaymentState = daysSincePayment > 35 ? 'overdue' : 'current'

  return { state, lastPaymentDate, daysSincePayment, mtdRevenue }
}

// =================================================================
// Lifetime Value
// =================================================================

export interface LTV {
  total: number // sum of all confirmed income tagged to this client
  tenureDays: number // days since startDate (or createdAt fallback)
  tenureLabel: string // human-friendly: "<1 mo" / "3 mo" / "1y 4mo"
  avgPerMonth: number // total / (tenureDays/30), or 0 if no tenure
  paymentCount: number // number of income transactions
}

function formatTenure(days: number): string {
  if (days < 30) return '<1 mo'
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  if (remMonths === 0) return `${years}y`
  return `${years}y ${remMonths}mo`
}

export function computeLTV(client: Client, txs: FinanceTxLite[]): LTV {
  const incomeTx = txs.filter(t =>
    t.type === 'income' && t.status === 'confirmed' && t.clientId === client.id
  )
  const total = incomeTx.reduce((s, t) => s + t.amount, 0)

  // Determine tenure from startDate, falling back to createdAt
  const startMs = client.startDate
    ? new Date(client.startDate + 'T12:00:00').getTime()
    : client.createdAt
  const tenureDays = Math.max(1, Math.floor((Date.now() - startMs) / 86400000))
  const tenureMonths = tenureDays / 30
  const avgPerMonth = tenureMonths > 0 ? total / tenureMonths : 0

  return {
    total,
    tenureDays,
    tenureLabel: formatTenure(tenureDays),
    avgPerMonth,
    paymentCount: incomeTx.length,
  }
}

// =================================================================
// Health score (recalibrated for relationship + payment, not ad performance)
// =================================================================

export interface HealthBreakdown {
  score: number // 0-100
  components: { label: string; impact: number }[]
}

const STATUS_BASE: Record<ClientStatus, number> = {
  active: 85,
  onboarding: 70,
  at_risk: 40,
  prospect: 60,
  churned: 10,
}

export function computeHealth(
  client: Client,
  comms: CommsEntry[],
  actions: ActionItem[],
  txs: FinanceTxLite[] = [],
): HealthBreakdown {
  const base = STATUS_BASE[client.status]
  let score = base

  // Communication recency: penalize stale contact (>14 days)
  const lastContact = lastContactDate(client, comms)
  const daysSinceContact = daysSince(lastContact)
  let contactPenalty = 0
  if (daysSinceContact > 14) {
    contactPenalty = -Math.min((daysSinceContact - 14) * 1.5, 40)
  }
  score += contactPenalty

  // Open overdue action items
  const overdueCount = overdueActionItems(client.id, actions).length
  let overduePenalty = 0
  if (overdueCount > 0) {
    overduePenalty = -Math.min(overdueCount * 5, 30)
  }
  score += overduePenalty

  // Renewal urgency
  const daysToRenewal = daysUntil(client.renewalDate)
  let renewalPenalty = 0
  if (daysToRenewal < 30 && daysToRenewal > 0) {
    renewalPenalty = -Math.min((30 - daysToRenewal) * 0.5, 15)
  }
  score += renewalPenalty

  // Payment status (only meaningful for billing clients)
  let paymentPenalty = 0
  let paymentLabel: string | null = null
  const payment = computePaymentStatus(client, txs)
  if (payment.state === 'overdue' && client.monthlyRetainer > 0) {
    if (payment.daysSincePayment !== undefined) {
      paymentPenalty = -Math.min((payment.daysSincePayment - 35) * 0.5 + 10, 25)
      paymentLabel = `Payment overdue (${payment.daysSincePayment}d since last)`
    } else {
      paymentPenalty = -15
      paymentLabel = 'No payment logged yet'
    }
    score += paymentPenalty
  }

  const components: { label: string; impact: number }[] = [
    { label: `Status: ${client.status.replace('_', ' ')}`, impact: base },
  ]
  if (contactPenalty !== 0) components.push({ label: `Stale contact (${daysSinceContact}d)`, impact: Math.round(contactPenalty) })
  if (overduePenalty !== 0) components.push({ label: `${overdueCount} overdue item${overdueCount === 1 ? '' : 's'}`, impact: Math.round(overduePenalty) })
  if (renewalPenalty !== 0) components.push({ label: `Renewal in ${daysToRenewal}d`, impact: Math.round(renewalPenalty) })
  if (paymentPenalty !== 0 && paymentLabel) components.push({ label: paymentLabel, impact: Math.round(paymentPenalty) })

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    components,
  }
}

export function healthColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 45) return 'yellow'
  return 'red'
}
