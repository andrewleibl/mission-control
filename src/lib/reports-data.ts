import { cached, invalidate } from '@/lib/cache'

export type ReportType = 'lead_gen' | 'sales_campaign'

export interface ClientReport {
  id: string
  clientId: string
  eventId?: string
  reportType: ReportType
  weekStart: string
  weekEnd: string
  spend?: number
  impressions?: number
  reach?: number
  clicks?: number
  ctr?: number
  leads?: number
  cpl?: number
  revenue?: number
  roas?: number
  purchases?: number
  costPerPurchase?: number
  lastWeekSummary: string
  nextWeekOutlook: string
  changesBeingMade: string
  createdAt: number
  updatedAt: number
}

const CACHE_KEY = 'reports'

function row2report(r: Record<string, unknown>): ClientReport {
  return {
    id: r.id as string,
    clientId: r.client_id as string,
    eventId: (r.event_id as string) ?? undefined,
    reportType: r.report_type as ReportType,
    weekStart: r.week_start as string,
    weekEnd: r.week_end as string,
    spend: (r.spend as number) ?? undefined,
    impressions: (r.impressions as number) ?? undefined,
    reach: (r.reach as number) ?? undefined,
    clicks: (r.clicks as number) ?? undefined,
    ctr: (r.ctr as number) ?? undefined,
    leads: (r.leads as number) ?? undefined,
    cpl: (r.cpl as number) ?? undefined,
    revenue: (r.revenue as number) ?? undefined,
    roas: (r.roas as number) ?? undefined,
    purchases: (r.purchases as number) ?? undefined,
    costPerPurchase: (r.cost_per_purchase as number) ?? undefined,
    lastWeekSummary: (r.last_week_summary as string) ?? '',
    nextWeekOutlook: (r.next_week_outlook as string) ?? '',
    changesBeingMade: (r.changes_being_made as string) ?? '',
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  }
}

function report2row(r: ClientReport): Record<string, unknown> {
  return {
    id: r.id,
    client_id: r.clientId,
    event_id: r.eventId ?? null,
    report_type: r.reportType,
    week_start: r.weekStart,
    week_end: r.weekEnd,
    spend: r.spend ?? null,
    impressions: r.impressions ?? null,
    reach: r.reach ?? null,
    clicks: r.clicks ?? null,
    ctr: r.ctr ?? null,
    leads: r.leads ?? null,
    cpl: r.cpl ?? null,
    revenue: r.revenue ?? null,
    roas: r.roas ?? null,
    purchases: r.purchases ?? null,
    cost_per_purchase: r.costPerPurchase ?? null,
    last_week_summary: r.lastWeekSummary ?? '',
    next_week_outlook: r.nextWeekOutlook ?? '',
    changes_being_made: r.changesBeingMade ?? '',
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

export async function loadReports(): Promise<ClientReport[]> {
  return cached(CACHE_KEY, async () => {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data } = await sb.from('reports').select('*').order('updated_at', { ascending: false })
    return (data ?? []).map(row2report)
  })
}

export async function getReport(id: string): Promise<ClientReport | null> {
  const all = await loadReports()
  return all.find(r => r.id === id) ?? null
}

export async function getReportByEventId(eventId: string): Promise<ClientReport | null> {
  const all = await loadReports()
  return all.find(r => r.eventId === eventId) ?? null
}

export async function upsertReport(report: ClientReport): Promise<void> {
  const next = { ...report, updatedAt: Date.now() }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  await sb.from('reports').upsert(report2row(next))
  invalidate(CACHE_KEY)
}

export async function deleteReport(id: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  await sb.from('reports').delete().eq('id', id)
  invalidate(CACHE_KEY)
}

export function fmtCurrency(n?: number): string {
  if (n === undefined || n === null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtNum(n?: number): string {
  if (n === undefined || n === null) return '—'
  return n.toLocaleString('en-US')
}
