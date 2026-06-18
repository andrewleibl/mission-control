import { cached, invalidate } from '@/lib/cache'

export type TemplateStatus = 'active' | 'paused' | 'killed'
export type WinType = 'positive_reply' | 'booked_meeting'

export interface SmsTemplate {
  id: string
  label: string
  body: string
  body2: string
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
      id: r.id, label: r.label, body: r.body,
      body2: r.body_2 ?? '',
      status: r.status, createdAt: r.created_at,
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

export async function createTemplate(label: string, body: string, body2: string): Promise<SmsTemplate> {
  const tpl: SmsTemplate = {
    id: newId('tpl'),
    label, body, body2,
    status: 'active',
    createdAt: Date.now(),
  }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_templates').insert({
    id: tpl.id, label: tpl.label, body: tpl.body, body_2: tpl.body2,
    status: tpl.status, created_at: tpl.createdAt,
  })
  if (error) throw error
  invalidate(CK_TEMPLATES)
  return tpl
}

export async function updateTemplate(id: string, patch: Partial<Pick<SmsTemplate, 'label' | 'body' | 'body2' | 'status'>>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.label !== undefined) row.label = patch.label
  if (patch.body !== undefined) row.body = patch.body
  if (patch.body2 !== undefined) row.body_2 = patch.body2
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

export async function logWinAt(templateId: string, type: WinType, loggedAt: number, note?: string): Promise<SmsWin> {
  const win: SmsWin = { id: newId('win'), templateId, type, note, loggedAt }
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

// =================================================================
// Follow-up pipeline — positive-reply prospects worked over 3 days
// =================================================================

export type ProspectStage = 'following_up' | 'booked' | 'lost'

export interface SmsProspect {
  id: string
  company: string
  phone: string
  sourceTemplateId: string | null
  stage: ProspectStage
  day: number // 1-3
  lastActionAt: number | null
  notes: string
  createdAt: number
  bookedAt: number | null
  lostAt: number | null
}

// The locked 3-day follow-up cadence. Each day = call + this text.
export const FOLLOWUP_MESSAGES: Record<number, string> = {
  1: `Hey- Just tried calling to talk more about the estimates, let's hop on a 30-min Google Meet and I'll walk you through exactly how it'd work for you. Pick a time that works for you: https://api.leadconnectorhq.com/widget/booking/aSDCrSPUylCiKs5TdRd0`,
  2: `Hey, tried you again today. Still wanna show you how we get tree estimates booked right onto your calendar - grab a time using the link in my message above.`,
  3: `Hey, last time reaching out - if you still want more estimates booked, grab a time here. If not, all good, best of luck this season: https://api.leadconnectorhq.com/widget/booking/aSDCrSPUylCiKs5TdRd0`,
}

const CK_PROSPECTS = 'sms_prospects'

function row2prospect(r: Record<string, unknown>): SmsProspect {
  return {
    id: r.id as string,
    company: (r.company as string) ?? '',
    phone: (r.phone as string) ?? '',
    sourceTemplateId: (r.source_template_id as string) ?? null,
    stage: r.stage as ProspectStage,
    day: (r.day as number) ?? 1,
    lastActionAt: (r.last_action_at as number) ?? null,
    notes: (r.notes as string) ?? '',
    createdAt: r.created_at as number,
    bookedAt: (r.booked_at as number) ?? null,
    lostAt: (r.lost_at as number) ?? null,
  }
}

export async function loadProspects(): Promise<SmsProspect[]> {
  return cached(CK_PROSPECTS, async () => {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const { data, error } = await sb.from('sms_prospects').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadProspects', error); return [] }
    return (data ?? []).map(row2prospect)
  })
}

// Adds a positive-reply prospect to the pipeline AND auto-logs a positive
// reply against the source template so the tracker stays in sync.
export async function createProspect(company: string, phone: string, sourceTemplateId: string | null): Promise<SmsProspect> {
  const p: SmsProspect = {
    id: newId('pro'),
    company, phone, sourceTemplateId,
    stage: 'following_up', day: 1,
    lastActionAt: null, notes: '',
    createdAt: Date.now(), bookedAt: null, lostAt: null,
  }
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_prospects').insert({
    id: p.id, company: p.company, phone: p.phone,
    source_template_id: p.sourceTemplateId, stage: p.stage, day: p.day,
    last_action_at: null, notes: '', created_at: p.createdAt,
    booked_at: null, lost_at: null,
  })
  if (error) throw error
  invalidate(CK_PROSPECTS)
  if (sourceTemplateId) {
    try { await logWin(sourceTemplateId, 'positive_reply') } catch (e) { console.error('auto-log positive:', e) }
  }
  return p
}

async function patchProspect(id: string, row: Record<string, unknown>): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_prospects').update(row).eq('id', id)
  if (error) throw error
  invalidate(CK_PROSPECTS)
}

export async function updateProspectNotes(id: string, notes: string): Promise<void> {
  await patchProspect(id, { notes })
}

// Marks today's call+text done and advances to the next day.
export async function advanceProspect(id: string, currentDay: number): Promise<void> {
  await patchProspect(id, { day: currentDay + 1, last_action_at: Date.now() })
}

// Sets a prospect's cadence day directly (used by drag-and-drop between day columns).
export async function setProspectDay(id: string, day: number): Promise<void> {
  await patchProspect(id, { day, last_action_at: Date.now() })
}

// Marks booked AND logs a booked_meeting win against the source template.
export async function bookProspect(p: SmsProspect): Promise<void> {
  await patchProspect(p.id, { stage: 'booked', booked_at: Date.now() })
  if (p.sourceTemplateId) {
    try { await logWin(p.sourceTemplateId, 'booked_meeting') } catch (e) { console.error('auto-log booked:', e) }
  }
}

export async function loseProspect(id: string): Promise<void> {
  await patchProspect(id, { stage: 'lost', lost_at: Date.now() })
}

// Move a booked/lost prospect back into active follow-up.
export async function reopenProspect(id: string): Promise<void> {
  await patchProspect(id, { stage: 'following_up', booked_at: null, lost_at: null })
}

export async function deleteProspect(id: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { error } = await sb.from('sms_prospects').delete().eq('id', id)
  if (error) throw error
  invalidate(CK_PROSPECTS)
}

// True if this prospect is due for a call+text today (in follow-up, and either
// never actioned or last actioned before today).
export function dueToday(p: SmsProspect): boolean {
  if (p.stage !== 'following_up') return false
  if (p.lastActionAt == null) return true
  const last = new Date(p.lastActionAt)
  const lastIso = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return lastIso < todayIso()
}
