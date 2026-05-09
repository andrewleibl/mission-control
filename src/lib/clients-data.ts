// Shared client module — single source of truth across the app.
// Used by /clients (full command center) and /finances (per-client tagging).

export type ClientStatus = 'active' | 'at_risk' | 'churned' | 'prospect' | 'onboarding'

export type Client = {
  id: string
  name: string
  business: string
  status: ClientStatus
  monthlySpend: number
  leadsMTD: number
  prevMonthLeads: number
  cpl: number
  prevMonthCpl: number
  renewalDate: string // ISO date or 'N/A'
  lastContact: string // ISO date
  notes: string
  createdAt: number
}

export const seedClients: Client[] = [
  {
    id: '1',
    name: 'Hector Huizar',
    business: 'Valley of the Sun Landscape',
    status: 'active',
    monthlySpend: 785,
    leadsMTD: 12,
    prevMonthLeads: 17,
    cpl: 65,
    prevMonthCpl: 47,
    renewalDate: '2026-06-10',
    lastContact: '2026-05-06',
    notes: 'Under-pacing by 32%. Considering budget increase.',
    createdAt: Date.now(),
  },
  {
    id: '2',
    name: 'PJ Sparks',
    business: 'We Do Hardscape',
    status: 'at_risk',
    monthlySpend: 285,
    leadsMTD: 4,
    prevMonthLeads: 9,
    cpl: 71,
    prevMonthCpl: 38,
    renewalDate: '2026-06-09',
    lastContact: '2026-04-21',
    notes: 'CTR dropped 0.91%. Needs creative refresh.',
    createdAt: Date.now(),
  },
  {
    id: '3',
    name: 'Ricardo Madera',
    business: 'Madera Landscape',
    status: 'active',
    monthlySpend: 285,
    leadsMTD: 8,
    prevMonthLeads: 7,
    cpl: 36,
    prevMonthCpl: 41,
    renewalDate: '2026-06-09',
    lastContact: '2026-05-07',
    notes: 'Wants to compare $500 vs last month spend.',
    createdAt: Date.now(),
  },
  {
    id: '4',
    name: 'Vicelia Tinde',
    business: 'Clutch Barber Supply',
    status: 'active',
    monthlySpend: 0,
    leadsMTD: 0,
    prevMonthLeads: 0,
    cpl: 0,
    prevMonthCpl: 0,
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
// Health score
// =================================================================

export interface HealthBreakdown {
  score: number // 0-100
  base: number
  contactPenalty: number
  overduePenalty: number
  renewalPenalty: number
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

  // Open overdue items: penalize per overdue
  const overdueCount = overdueActionItems(client.id, actions).length
  let overduePenalty = 0
  if (overdueCount > 0) {
    overduePenalty = -Math.min(overdueCount * 5, 30)
  }
  score += overduePenalty

  // Renewal urgency: penalize if renewal is approaching (signals "act now")
  const daysToRenewal = daysUntil(client.renewalDate)
  let renewalPenalty = 0
  if (daysToRenewal < 30 && daysToRenewal > 0) {
    renewalPenalty = -Math.min((30 - daysToRenewal) * 0.5, 15)
  }
  score += renewalPenalty

  const components: { label: string; impact: number }[] = [
    { label: `Status: ${client.status.replace('_', ' ')}`, impact: base },
  ]
  if (contactPenalty !== 0) components.push({ label: `Stale contact (${daysSinceContact}d)`, impact: contactPenalty })
  if (overduePenalty !== 0) components.push({ label: `${overdueCount} overdue item${overdueCount === 1 ? '' : 's'}`, impact: overduePenalty })
  if (renewalPenalty !== 0) components.push({ label: `Renewal in ${daysToRenewal}d`, impact: renewalPenalty })

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    base,
    contactPenalty: Math.round(contactPenalty),
    overduePenalty: Math.round(overduePenalty),
    renewalPenalty: Math.round(renewalPenalty),
    components,
  }
}

export function healthColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 45) return 'yellow'
  return 'red'
}
