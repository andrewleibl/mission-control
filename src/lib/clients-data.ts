// Shared client data — single source of truth for clients across the app
// Used by /clients (full command center) and /finances (per-client tagging)

export type ClientStatus = 'active' | 'at_risk' | 'churned' | 'prospect'

export type Client = {
  id: string
  name: string
  business: string
  status: ClientStatus
  monthlySpend: number
  leadsMTD: number
  cpl: number
  renewalDate: string
  daysUntilRenewal: number
  lastContact: string
  notes: string
  healthScore: number
}

export const seedClients: Client[] = [
  {
    id: '1',
    name: 'Hector Huizar',
    business: 'Valley of the Sun Landscape',
    status: 'active',
    monthlySpend: 785,
    leadsMTD: 12,
    cpl: 65,
    renewalDate: '2026-04-10',
    daysUntilRenewal: 15,
    lastContact: '2026-03-24',
    notes: 'Under-pacing by 32%. Considering budget increase.',
    healthScore: 75,
  },
  {
    id: '2',
    name: 'PJ Sparks',
    business: 'We Do Hardscape',
    status: 'at_risk',
    monthlySpend: 285,
    leadsMTD: 4,
    cpl: 71,
    renewalDate: '2026-04-09',
    daysUntilRenewal: 14,
    lastContact: '2026-03-23',
    notes: 'CTR dropped 0.91%. Needs creative refresh.',
    healthScore: 45,
  },
  {
    id: '3',
    name: 'Ricardo Madera',
    business: 'Madera Landscape',
    status: 'active',
    monthlySpend: 285,
    leadsMTD: 8,
    cpl: 36,
    renewalDate: '2026-04-09',
    daysUntilRenewal: 14,
    lastContact: '2026-03-25',
    notes: 'Wants to compare $500 vs last month spend.',
    healthScore: 85,
  },
  {
    id: '4',
    name: 'Vicelia Tinde',
    business: 'Clutch Barber Supply',
    status: 'active',
    monthlySpend: 0,
    leadsMTD: 0,
    cpl: 0,
    renewalDate: 'N/A',
    daysUntilRenewal: 999,
    lastContact: '2026-03-25',
    notes: 'Shopify redesign HIGH PRIORITY. $900 outstanding.',
    healthScore: 90,
  },
]

// Lightweight summary used by other features (e.g. finance tagging dropdown)
export type ClientSummary = { id: string; name: string; business: string; status: ClientStatus }

export function getClientsForTagging(): ClientSummary[] {
  return seedClients.map(c => ({ id: c.id, name: c.name, business: c.business, status: c.status }))
}

export function getClientById(id: string): ClientSummary | undefined {
  const c = seedClients.find(c => c.id === id)
  return c ? { id: c.id, name: c.name, business: c.business, status: c.status } : undefined
}
