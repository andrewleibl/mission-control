export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { invalidate } from '@/lib/cache'

// Live Meta sync: pulls each mapped ad account's campaign insights and writes
// them into sd_tests — matching existing rows by client+campaign name so your
// angle/creative/copy tags are PRESERVED and only the metrics refresh.
// Needs env META_ACCESS_TOKEN (a system-user token with ads_read).
const API = 'https://graph.facebook.com/v21.0'
// Meta reports one lead under multiple action_type aliases. Summing them
// double-counts; Ads Manager's "Results" is a single canonical event. So take
// the MAX across known lead aliases — matches the Results column.
const LEAD_ACTIONS = new Set([
  'lead', 'offsite_conversion.fb_pixel_lead', 'onsite_web_lead',
  'onsite_conversion.lead_grouped', 'leadgen.other',
  'offsite_complete_registration_add_meta_leads', 'offsite_search_add_meta_leads',
])

// Returns the canonical lead count (max across aliases — matches Ads Manager's
// "Results") plus an `ambiguous` flag when distinct lead events disagree, so a
// questionable number is surfaced, never silently trusted.
// A conversion-ish action we should recognize as a result. If one of these
// appears with value > 0 but isn't in LEAD_ACTIONS, it's an UNKNOWN result type
// → we'd silently read 0. We flag that so it's never trusted blindly.
const CONVERSIONISH = /lead|registration|complete|purchase|subscribe|contact|appointment|schedule/i

function leadResult(actions: { action_type: string; value: string }[] | undefined): { leads: number; ambiguous: boolean; unrecognized: boolean } {
  if (!actions) return { leads: 0, ambiguous: false, unrecognized: false }
  const vals = actions.filter(a => LEAD_ACTIONS.has(a.action_type)).map(a => parseInt(a.value, 10) || 0).filter(v => v > 0)
  const leads = vals.length ? Math.max(...vals) : 0
  const ambiguous = new Set(vals).size > 1
  const unrecognized = leads === 0 && actions.some(a => !LEAD_ACTIONS.has(a.action_type) && CONVERSIONISH.test(a.action_type) && (parseInt(a.value, 10) || 0) > 0)
  return { leads, ambiguous, unrecognized }
}

export async function POST(req: Request) {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN not set' }, { status: 400 })

  let preset = 'last_30d'
  try { const body = await req.json(); if (body?.preset) preset = String(body.preset) } catch { /* default */ }

  // Meta's `last_30d` preset EXCLUDES today, so a campaign live only today stays
  // invisible until tomorrow. For the default window, use an explicit time_range
  // ending today so brand-new campaigns surface same-day. Other presets (today,
  // maximum, etc.) still pass through as date_preset.
  const ymd = (d: Date) => d.toISOString().slice(0, 10)
  let windowParam: string
  if (preset === 'last_30d') {
    const until = new Date()
    const since = new Date(); since.setDate(since.getDate() - 29)
    windowParam = `time_range=${encodeURIComponent(JSON.stringify({ since: ymd(since), until: ymd(until) }))}`
  } else {
    windowParam = `date_preset=${encodeURIComponent(preset)}`
  }

  const sb = createClient()
  const { data: accRows } = await sb.from('sd_accounts').select('*').eq('active', true)
  const accounts = (accRows ?? [])
  if (accounts.length === 0) return NextResponse.json({ error: 'No active ad accounts mapped' }, { status: 400 })

  const { data: existing } = await sb.from('sd_tests').select('*')
  const byKey = new Map<string, Record<string, unknown>>()
  for (const t of existing ?? []) byKey.set(`${t.client}::${t.label}`, t)

  const rows: Record<string, unknown>[] = []
  const errors: string[] = []
  const flags: string[] = []

  for (const acc of accounts) {
    const acct = String(acc.ad_account_id).startsWith('act_') ? acc.ad_account_id : `act_${acc.ad_account_id}`
    // Pull delivery status per campaign (insights doesn't include it) → map by name.
    const statusByName = new Map<string, string>()
    try {
      const sr = await fetch(`${API}/${acct}/campaigns?fields=name,effective_status&limit=500&access_token=${encodeURIComponent(token)}`)
      const sj = await sr.json()
      for (const c of (sj.data ?? [])) if (c.name) statusByName.set(c.name, c.effective_status || '')
    } catch { /* non-fatal — delivery just stays blank */ }
    const url = `${API}/${acct}/insights?level=campaign&fields=campaign_name,spend,ctr,frequency,actions,date_start,date_stop&${windowParam}&limit=500&access_token=${encodeURIComponent(token)}`
    try {
      const r = await fetch(url)
      const j = await r.json()
      if (j.error) { errors.push(`${acc.client}: ${j.error.message}`); continue }
      for (const c of (j.data ?? [])) {
        const label = c.campaign_name || '(unnamed)'
        const spend = parseFloat(c.spend) || 0
        const { leads, ambiguous, unrecognized } = leadResult(c.actions)
        if (ambiguous) flags.push(`${acc.client}: "${label}" had multiple lead events — verify the result count`)
        if (unrecognized) flags.push(`${acc.client}: "${label}" is spending on an unrecognized result event — read 0, verify in Ads Manager`)
        const key = `${acc.client}::${label}`
        const prev = byKey.get(key)
        rows.push({
          id: (prev?.id as string) ?? `tst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          label, client: acc.client,
          creative_id: prev?.creative_id ?? null, copy_id: prev?.copy_id ?? null, angle_id: prev?.angle_id ?? null,
          niche: prev?.niche ?? '',
          started_on: c.date_start ?? null, ended_on: c.date_stop ?? null,
          spend, leads,
          cpl: leads > 0 ? +(spend / leads).toFixed(2) : 0,
          ctr: parseFloat(c.ctr) || 0,
          frequency: parseFloat(c.frequency) || 0,
          booked: (prev?.booked as number) ?? 0, closed: (prev?.closed as number) ?? 0,
          notes: (prev?.notes as string) ?? '',
          created_at: (prev?.created_at as number) ?? Date.now(),
          delivery: statusByName.get(label) ?? '',
        })
      }
    } catch (e) {
      errors.push(`${acc.client}: ${e instanceof Error ? e.message : 'fetch failed'}`)
    }
  }

  if (rows.length > 0) {
    const { error } = await sb.from('sd_tests').upsert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  invalidate('sd_tests')
  return NextResponse.json({ synced: rows.length, accounts: accounts.length, errors, flags })
}
