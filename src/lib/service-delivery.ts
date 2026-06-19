// Service Delivery — media-buyer-in-a-box. Four linked libraries (angles,
// creatives, copy, tests) + cross-client rollups + Meta CSV import.
// Targeted upsert/insert/update/delete (NOT the wipe-and-reinsert pattern).
import { cached, invalidate } from '@/lib/cache'

export type AngleStatus = 'active' | 'testing' | 'winner' | 'retired'
export type CreativeStatus = 'idea' | 'testing' | 'winner' | 'fatigued' | 'killed'
export type CreativeFormat = 'image' | 'video' | 'carousel'
export type CopyKind = 'hook' | 'primary' | 'headline'
export type CopyStatus = 'idea' | 'testing' | 'winner' | 'killed'

export interface Angle {
  id: string; name: string; niche: string; description: string
  status: AngleStatus; notes: string; createdAt: number
}
export interface Creative {
  id: string; name: string; angleId: string | null; niche: string
  format: CreativeFormat; assetUrl: string; thumbUrl: string
  rating: number; status: CreativeStatus; notes: string; createdAt: number
}
export interface Copy {
  id: string; name: string; kind: CopyKind; body: string
  angleId: string | null; niche: string; rating: number
  status: CopyStatus; notes: string; createdAt: number
}
export interface Test {
  id: string; label: string
  creativeId: string | null; copyId: string | null; angleId: string | null
  niche: string; client: string
  startedOn: string | null; endedOn: string | null
  spend: number; leads: number; cpl: number; ctr: number; frequency: number
  booked: number; closed: number; notes: string; createdAt: number
  delivery: string  // Meta effective_status: ACTIVE / PAUSED / etc ('' if manual/unknown)
  syncedAt: number | null  // epoch ms of the last Meta sync that touched this row (null if manual)
}

export interface MetaAccount { id: string; client: string; adAccountId: string; active: boolean; createdAt: number }

const CK_ANGLES = 'sd_angles', CK_CREATIVES = 'sd_creatives', CK_COPY = 'sd_copy', CK_TESTS = 'sd_tests', CK_ACCOUNTS = 'sd_accounts'

function newId(p: string) { return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
async function sb() { const { createClient } = await import('@/lib/supabase'); return createClient() }

// ---------- Loaders ----------
export async function loadAngles(): Promise<Angle[]> {
  return cached(CK_ANGLES, async () => {
    const { data, error } = await (await sb()).from('sd_angles').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadAngles', error); return [] }
    return (data ?? []).map(r => ({
      id: r.id, name: r.name, niche: r.niche ?? '', description: r.description ?? '',
      status: r.status, notes: r.notes ?? '', createdAt: r.created_at,
    }))
  })
}
export async function loadCreatives(): Promise<Creative[]> {
  return cached(CK_CREATIVES, async () => {
    const { data, error } = await (await sb()).from('sd_creatives').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadCreatives', error); return [] }
    return (data ?? []).map(r => ({
      id: r.id, name: r.name, angleId: r.angle_id ?? null, niche: r.niche ?? '',
      format: r.format, assetUrl: r.asset_url ?? '', thumbUrl: r.thumb_url ?? '',
      rating: r.rating ?? 0, status: r.status, notes: r.notes ?? '', createdAt: r.created_at,
    }))
  })
}
export async function loadCopy(): Promise<Copy[]> {
  return cached(CK_COPY, async () => {
    const { data, error } = await (await sb()).from('sd_copy').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadCopy', error); return [] }
    return (data ?? []).map(r => ({
      id: r.id, name: r.name, kind: r.kind, body: r.body ?? '',
      angleId: r.angle_id ?? null, niche: r.niche ?? '', rating: r.rating ?? 0,
      status: r.status, notes: r.notes ?? '', createdAt: r.created_at,
    }))
  })
}
export async function loadTests(): Promise<Test[]> {
  return cached(CK_TESTS, async () => {
    const { data, error } = await (await sb()).from('sd_tests').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadTests', error); return [] }
    return (data ?? []).map(r => ({
      id: r.id, label: r.label ?? '', creativeId: r.creative_id ?? null, copyId: r.copy_id ?? null,
      angleId: r.angle_id ?? null, niche: r.niche ?? '', client: r.client ?? '',
      startedOn: r.started_on ?? null, endedOn: r.ended_on ?? null,
      spend: Number(r.spend) || 0, leads: r.leads ?? 0, cpl: Number(r.cpl) || 0,
      ctr: Number(r.ctr) || 0, frequency: Number(r.frequency) || 0,
      booked: r.booked ?? 0, closed: r.closed ?? 0, notes: r.notes ?? '', createdAt: r.created_at,
      delivery: r.delivery ?? '',
      syncedAt: r.synced_at ?? null,
    }))
  })
}

// ---------- Writers (targeted) ----------
export async function upsertAngle(a: Angle): Promise<void> {
  const { error } = await (await sb()).from('sd_angles').upsert({
    id: a.id, name: a.name, niche: a.niche, description: a.description,
    status: a.status, notes: a.notes, created_at: a.createdAt,
  })
  if (error) throw error; invalidate(CK_ANGLES)
}
export async function upsertCreative(c: Creative): Promise<void> {
  const { error } = await (await sb()).from('sd_creatives').upsert({
    id: c.id, name: c.name, angle_id: c.angleId, niche: c.niche, format: c.format,
    asset_url: c.assetUrl, thumb_url: c.thumbUrl, rating: c.rating, status: c.status,
    notes: c.notes, created_at: c.createdAt,
  })
  if (error) throw error; invalidate(CK_CREATIVES)
}
export async function upsertCopy(c: Copy): Promise<void> {
  const { error } = await (await sb()).from('sd_copy').upsert({
    id: c.id, name: c.name, kind: c.kind, body: c.body, angle_id: c.angleId,
    niche: c.niche, rating: c.rating, status: c.status, notes: c.notes, created_at: c.createdAt,
  })
  if (error) throw error; invalidate(CK_COPY)
}
export async function upsertTest(t: Test): Promise<void> {
  const { error } = await (await sb()).from('sd_tests').upsert({
    id: t.id, label: t.label, creative_id: t.creativeId, copy_id: t.copyId, angle_id: t.angleId,
    niche: t.niche, client: t.client, started_on: t.startedOn, ended_on: t.endedOn,
    spend: t.spend, leads: t.leads, cpl: t.cpl, ctr: t.ctr, frequency: t.frequency,
    booked: t.booked, closed: t.closed, notes: t.notes, created_at: t.createdAt,
    delivery: t.delivery ?? '',
  })
  if (error) throw error; invalidate(CK_TESTS)
}
async function del(table: string, ck: string, id: string): Promise<void> {
  const { error } = await (await sb()).from(table).delete().eq('id', id)
  if (error) throw error; invalidate(ck)
}
export const deleteAngle = (id: string) => del('sd_angles', CK_ANGLES, id)
export const deleteCreative = (id: string) => del('sd_creatives', CK_CREATIVES, id)
export const deleteCopy = (id: string) => del('sd_copy', CK_COPY, id)
export const deleteTest = (id: string) => del('sd_tests', CK_TESTS, id)

// Upload a pasted/dropped/picked image to Supabase Storage; returns public URL.
// Requires the one-time `sd-creatives` public bucket (see db/service_delivery_storage.sql).
export async function uploadCreativeImage(file: File): Promise<string> {
  const client = await sb()
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const path = `creatives/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await client.storage.from('sd-creatives').upload(path, file, { upsert: true, contentType: file.type || 'image/png' })
  if (error) throw error
  return client.storage.from('sd-creatives').getPublicUrl(path).data.publicUrl
}

export async function loadAccounts(): Promise<MetaAccount[]> {
  return cached(CK_ACCOUNTS, async () => {
    const { data, error } = await (await sb()).from('sd_accounts').select('*').order('created_at', { ascending: false })
    if (error) { console.error('loadAccounts', error); return [] }
    return (data ?? []).map(r => ({ id: r.id, client: r.client ?? '', adAccountId: r.ad_account_id ?? '', active: r.active ?? true, createdAt: r.created_at }))
  })
}
export async function upsertAccount(a: MetaAccount): Promise<void> {
  const { error } = await (await sb()).from('sd_accounts').upsert({ id: a.id, client: a.client, ad_account_id: a.adAccountId, active: a.active, created_at: a.createdAt })
  if (error) throw error; invalidate(CK_ACCOUNTS)
}
export async function deleteAccount(id: string): Promise<void> { await del('sd_accounts', CK_ACCOUNTS, id) }
export function newAccount(): MetaAccount { return { id: newId('acc'), client: '', adAccountId: '', active: true, createdAt: Date.now() } }

export function newAngle(): Angle { return { id: newId('ang'), name: '', niche: '', description: '', status: 'active', notes: '', createdAt: Date.now() } }
export function newCreative(): Creative { return { id: newId('cre'), name: '', angleId: null, niche: '', format: 'image', assetUrl: '', thumbUrl: '', rating: 0, status: 'idea', notes: '', createdAt: Date.now() } }
export function newCopyItem(): Copy { return { id: newId('cpy'), name: '', kind: 'primary', body: '', angleId: null, niche: '', rating: 0, status: 'idea', notes: '', createdAt: Date.now() } }
export function newTest(): Test { return { id: newId('tst'), label: '', creativeId: null, copyId: null, angleId: null, niche: '', client: '', startedOn: null, endedOn: null, spend: 0, leads: 0, cpl: 0, ctr: 0, frequency: 0, booked: 0, closed: 0, notes: '', createdAt: Date.now(), delivery: '', syncedAt: null } }

// ---------- Rollups: aggregate test metrics up to any dimension ----------
export interface Rollup { spend: number; leads: number; cpl: number; ctr: number; frequency: number; booked: number; closed: number; tests: number }

export function rollupTests(tests: Test[]): Rollup {
  const r: Rollup = { spend: 0, leads: 0, cpl: 0, ctr: 0, frequency: 0, booked: 0, closed: 0, tests: tests.length }
  if (!tests.length) return r
  let ctrSum = 0, freqSum = 0
  for (const t of tests) {
    r.spend += t.spend; r.leads += t.leads; r.booked += t.booked; r.closed += t.closed
    ctrSum += t.ctr; freqSum += t.frequency
  }
  r.cpl = r.leads > 0 ? r.spend / r.leads : 0   // pooled, not avg-of-avgs
  r.ctr = ctrSum / tests.length
  r.frequency = freqSum / tests.length
  return r
}
export function rollupByAngle(angleId: string, tests: Test[]): Rollup {
  return rollupTests(tests.filter(t => t.angleId === angleId))
}
export function rollupByCreative(creativeId: string, tests: Test[]): Rollup {
  return rollupTests(tests.filter(t => t.creativeId === creativeId))
}

// ---------- Meta CSV import ----------
// Parses an exported "Campaigns" CSV (the kind Andrew already pulls) into Test
// rows. Maps the columns we care about; angle/creative/client get tagged after.
export interface ParsedCsvRow {
  label: string; startedOn: string | null; endedOn: string | null
  spend: number; leads: number; cpl: number; ctr: number; frequency: number
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out.map(s => s.trim())
}

export function parseMetaCsv(text: string): ParsedCsvRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length)
  if (lines.length < 2) return []
  const header = splitCsvLine(lines[0]).map(h => h.toLowerCase())
  const idx = (...names: string[]) => {
    for (const n of names) { const i = header.findIndex(h => h.includes(n)); if (i >= 0) return i }
    return -1
  }
  const ci = {
    name: idx('campaign name', 'ad set name', 'ad name'),
    start: idx('reporting starts'),
    end: idx('reporting ends'),
    spend: idx('amount spent'),
    results: idx('results'),
    cpr: idx('cost per result'),
    ctr: idx('ctr'),
    freq: idx('frequency'),
  }
  const num = (s: string) => { const v = parseFloat((s || '').replace(/[$,%]/g, '')); return isNaN(v) ? 0 : v }
  const rows: ParsedCsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i])
    const label = ci.name >= 0 ? c[ci.name] : ''
    if (!label) continue
    const spend = ci.spend >= 0 ? num(c[ci.spend]) : 0
    const leads = ci.results >= 0 ? Math.round(num(c[ci.results])) : 0
    const cpl = ci.cpr >= 0 && c[ci.cpr] ? num(c[ci.cpr]) : (leads > 0 ? spend / leads : 0)
    rows.push({
      label,
      startedOn: ci.start >= 0 ? (c[ci.start] || null) : null,
      endedOn: ci.end >= 0 ? (c[ci.end] || null) : null,
      spend, leads, cpl,
      ctr: ci.ctr >= 0 ? num(c[ci.ctr]) : 0,
      frequency: ci.freq >= 0 ? num(c[ci.freq]) : 0,
    })
  }
  return rows
}

// ---------- Decision-rules engine (the "media buyer brain") ----------
// Codifies what a good buyer does so the system tells you the move. Rules tuned
// to Andrew's own lessons: never judge before enough leads (the $27 CPL kill
// mistake), bookings veto CPL, refresh on fatigue.
export interface RecConfig {
  minLeads: number      // don't judge a test below this many leads
  fatigueFreq: number   // frequency above this = creative fatigue
  killMult: number      // CPL this many x above the angle avg = cut
  scaleFactor: number   // CPL below this fraction of angle avg = scale
}
export const DEFAULT_REC: RecConfig = { minLeads: 15, fatigueFreq: 2.5, killMult: 1.4, scaleFactor: 0.8 }

export type RecType = 'scale' | 'kill' | 'refresh' | 'watch' | 'early' | 'untagged'
export interface Rec { testId: string; label: string; client: string; type: RecType; severity: number; message: string }

function money(n: number) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 }) }

export function buildRecommendations(tests: Test[], cfg: RecConfig = DEFAULT_REC): Rec[] {
  const recs: Rec[] = []
  for (const t of tests) {
    if (t.spend === 0 && t.leads === 0) continue // nothing to judge
    const base = { testId: t.id, label: t.label || '(untitled)', client: t.client }
    if (!t.angleId) { recs.push({ ...base, type: 'untagged', severity: 1, message: 'Tag an angle so this can be benchmarked.' }); continue }
    const angleCpl = rollupByAngle(t.angleId, tests).cpl
    if (t.leads < cfg.minLeads) { recs.push({ ...base, type: 'early', severity: 1, message: `Only ${t.leads} leads — keep running, too early to call.` }); continue }
    if (t.frequency > cfg.fatigueFreq) { recs.push({ ...base, type: 'refresh', severity: 3, message: `Frequency ${t.frequency.toFixed(2)} — creative fatiguing, queue a fresh variant.` }); continue }
    if (angleCpl > 0 && t.cpl > angleCpl * cfg.killMult) { recs.push({ ...base, type: 'kill', severity: 4, message: `CPL ${money(t.cpl)} is ${Math.round((t.cpl / angleCpl - 1) * 100)}% above the angle avg (${money(angleCpl)}) — cut it.` }); continue }
    if (t.booked === 0) { recs.push({ ...base, type: 'watch', severity: 2, message: `${t.leads} leads but 0 booked — downstream isn't converting, check the funnel before scaling.` }); continue }
    if (angleCpl > 0 && t.cpl < angleCpl * cfg.scaleFactor) { recs.push({ ...base, type: 'scale', severity: 3, message: `CPL ${money(t.cpl)} is beating the angle avg (${money(angleCpl)}) and it's booking — scale the budget.` }); continue }
  }
  return recs.sort((a, b) => b.severity - a.severity)
}

// Best-of stack per niche — the onboarding playbook ("deploy this").
export interface Playbook { niche: string; angle: Angle | null; angleCpl: number; creative: Creative | null; copy: Copy | null }
export function buildPlaybooks(niches: string[], angles: Angle[], creatives: Creative[], copy: Copy[], tests: Test[]): Playbook[] {
  return niches.map(niche => {
    const nAngles = angles.filter(a => a.niche === niche).map(a => ({ a, r: rollupByAngle(a.id, tests) }))
    const withData = nAngles.filter(x => x.r.tests > 0 && x.r.cpl > 0).sort((x, y) => x.r.cpl - y.r.cpl)
    const best = withData[0] ?? nAngles[0]
    const bestCreative = creatives.filter(c => c.niche === niche).sort((a, b) => b.rating - a.rating)[0] ?? null
    const bestCopy = copy.filter(c => c.niche === niche).sort((a, b) => b.rating - a.rating)[0] ?? null
    return { niche, angle: best?.a ?? null, angleCpl: best?.r.cpl ?? 0, creative: bestCreative, copy: bestCopy }
  }).filter(p => p.angle || p.creative || p.copy)
}

// Match an imported CSV row to an existing test by label (campaign name) so a
// re-import updates instead of duplicating.
export function testFromCsvRow(row: ParsedCsvRow, existing?: Test): Test {
  const base = existing ?? newTest()
  return {
    ...base, label: row.label,
    startedOn: row.startedOn, endedOn: row.endedOn,
    spend: row.spend, leads: row.leads, cpl: row.cpl, ctr: row.ctr, frequency: row.frequency,
  }
}
