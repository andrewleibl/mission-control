import { cached, invalidate } from '@/lib/cache'

export type TemplateStatus = 'active' | 'paused' | 'killed'
export type WinType = 'positive_reply' | 'booked_meeting'

export interface SmsTemplate {
  id: string
  label: string
  body: string
  status: TemplateStatus
  createdAt: number
}

export interface SmsSend {
  templateId: string
  day: string
  count: number
}

export interface SmsWin {
  id: string
  templateId: string
  type: WinType
  note?: string
  loggedAt: number
}

const CK_TEMPLATES = 'sms_templates'
const CK_SENDS = 'sms_sends'
const CK_WINS = 'sms_wins'

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function loadTemplates(): Promise<SmsTemplate[]> {
  return cached(CK_TEMPLATES, async () => {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data, error } = await sb.from('sms_templates').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadTemplates', error); return [] }
    return (data ?? []).map(r => ({
      id: r.id, label: r.label, body: r.body, status: r.status, createdAt: r.created_at,
    }))
  })
}

export async function loadSends(): Promise<SmsSend[]> {
  return cached(CK_SENDS, async () => {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data, error } = await sb.from('sms_sends').select('*').order('day', { ascending: false })
    if (error) { console.error('loadSends', error); return [] }
    return (data ?? []).map(r => ({ templateId: r.template_id, day: r.day, count: r.count }))
  })
}

export async function loadWins(): Promise<SmsWin[]> {
  return cached(CK_WINS, async () => {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data, error } = await sb.from('sms_wins').select('*').order('logged_at', { ascending: false })
    if (error) { console.error('loadWins', error); return [] }
    return (data ?? []).map(r => ({
      id: r.id, templateId: r.template_id, type: r.type,
      note: r.note ?? undefined, loggedAt: r.logged_at,
    }))
  })
}

export async function createTemplate(label: string, body: string): Promise<SmsTemplate> {
  const tpl: SmsTemplate = {
    id: newId('tpl'),
    label, body,
    status: 'active',
    createdAt: Date.now(),
  }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_templates').insert({
    id: tpl.id, label: tpl.label, body: tpl.body, status: tpl.status, created_at: tpl.createdAt,
  })
  if (error) throw error
  invalidate(CK_TEMPLATES)
  return tpl
}

export async function updateTemplate(id: string, patch: Partial<Pick<SmsTemplate, 'label' | 'body' | 'status'>>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.label !== undefined) row.label = patch.label
  if (patch.body !== undefined) row.body = patch.body
  if (patch.status !== undefined) row.status = patch.status
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_templates').update(row).eq('id', id)
  if (error) throw error
  invalidate(CK_TEMPLATES)
}

export async function deleteTemplate(id: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_templates').delete().eq('id', id)
  if (error) throw error
  invalidate(CK_TEMPLATES)
  invalidate(CK_SENDS)
  invalidate(CK_WINS)
}

export async function setSendCount(templateId: string, day: string, count: number): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_sends').upsert(
    { template_id: templateId, day, count },
    { onConflict: 'template_id,day' },
  )
  if (error) throw error
  invalidate(CK_SENDS)
}

export async function logWin(templateId: string, type: WinType, note?: string): Promise<SmsWin> {
  const win: SmsWin = {
    id: newId('win'),
    templateId, type, note,
    loggedAt: Date.now(),
  }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_wins').insert({
    id: win.id, template_id: win.templateId, type: win.type,
    note: win.note ?? null, logged_at: win.loggedAt,
  })
  if (error) throw error
  invalidate(CK_WINS)
  return win
}

export async function deleteWin(id: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_wins').delete().eq('id', id)
  if (error) throw error
  invalidate(CK_WINS)
}

// ---------- Aggregations ----------

export interface TemplateStats {
  sent: number
  positives: number
  booked: number
  positiveRate: number  // positives / sent
  bookedRate: number    // booked / positives
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function statsForRange(
  templateId: string,
  sends: SmsSend[],
  wins: SmsWin[],
  fromIso: string | null,
  toIso: string | null,
): TemplateStats {
  let sent = 0
  for (const s of sends) {
    if (s.templateId !== templateId) continue
    if (fromIso && s.day < fromIso) continue
    if (toIso && s.day > toIso) continue
    sent += s.count
  }
  let positives = 0, booked = 0
  const fromTs = fromIso ? new Date(fromIso + 'T00:00:00').getTime() : -Infinity
  const toTs = toIso ? new Date(toIso + 'T23:59:59').getTime() : Infinity
  for (const w of wins) {
    if (w.templateId !== templateId) continue
    if (w.loggedAt < fromTs || w.loggedAt > toTs) continue
    if (w.type === 'positive_reply') positives++
    else if (w.type === 'booked_meeting') booked++
  }
  return {
    sent, positives, booked,
    positiveRate: sent > 0 ? positives / sent : 0,
    bookedRate: positives > 0 ? booked / positives : 0,
  }
}

export function getStats(templateId: string, sends: SmsSend[], wins: SmsWin[]) {
  const today = todayIso()
  const last7 = isoDaysAgo(6)
  const prev7Start = isoDaysAgo(13)
  const prev7End = isoDaysAgo(7)
  return {
    today: statsForRange(templateId, sends, wins, today, today),
    week: statsForRange(templateId, sends, wins, last7, today),
    prevWeek: statsForRange(templateId, sends, wins, prev7Start, prev7End),
    all: statsForRange(templateId, sends, wins, null, null),
  }
}

/**
 * Returns 'cooling' if the template is active and its 7d positive-reply rate
 * is significantly worse than the prior 7d (> 30% relative drop, and prior had real signal).
 */
export function coolingSignal(templateId: string, sends: SmsSend[], wins: SmsWin[]): boolean {
  const today = todayIso()
  const last7 = isoDaysAgo(6)
  const prev7Start = isoDaysAgo(13)
  const prev7End = isoDaysAgo(7)
  const current = statsForRange(templateId, sends, wins, last7, today)
  const prior = statsForRange(templateId, sends, wins, prev7Start, prev7End)
  if (prior.sent < 20 || prior.positiveRate === 0) return false
  const dropPct = (prior.positiveRate - current.positiveRate) / prior.positiveRate
  return dropPct > 0.3
}
