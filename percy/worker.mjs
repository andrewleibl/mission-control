#!/usr/bin/env node
/**
 * Percy worker — runs on the always-on Mac.
 *
 * Watches the `percy_chats` Supabase table for pending questions, gathers the
 * relevant Mission Control data, runs Opus 4.8 via the local Claude CLI (your
 * Claude Max subscription — no API key), and writes the answer back.
 *
 * Outbound-only: the Mac never accepts inbound connections. See docs/PERCY_DESIGN.md.
 *
 * Run:  node percy/worker.mjs          (loop forever — the service)
 *       node percy/worker.mjs --once   (process current pending then exit — for testing)
 */

import { createClient } from '@supabase/supabase-js'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CLAUDE_BIN = '/opt/homebrew/bin/claude'
const ONCE = process.argv.includes('--once')

// ── env ───────────────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
  return env
}
const env = loadEnv()
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// ── date helpers (local time, to avoid the UTC "today" trap) ────────────────
const pad = n => String(n).padStart(2, '0')
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const TODAY = new Date()
const TODAY_ISO = iso(TODAY)
function daysAgoIso(n) { const d = new Date(TODAY); d.setDate(d.getDate() - n); return iso(d) }
function monthKey(dateStr) { return dateStr.slice(0, 7) } // YYYY-MM

// ── skills (each: summarize for text, series for charts) ────────────────────
const skills = {
  sales_calls: {
    description: 'sales call counts, show rate, qualification, outcomes',
    async summarize() {
      const { data } = await sb.from('sales_calls').select('date,showed,qualified,outcome,value')
      const rows = data ?? []
      const last7 = daysAgoIso(6), thisMonth = TODAY_ISO.slice(0, 7), lastMonthDate = new Date(TODAY); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
      const lastMonth = iso(lastMonthDate).slice(0, 7)
      const inWeek = rows.filter(r => r.date >= last7 && r.date <= TODAY_ISO)
      const inMonth = rows.filter(r => monthKey(r.date) === thisMonth)
      const outcomes = {}
      for (const r of rows) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1
      return {
        total_all_time: rows.length,
        this_week: inWeek.length,
        this_month: inMonth.length,
        last_month: rows.filter(r => monthKey(r.date) === lastMonth).length,
        show_rate_all_time: rows.length ? `${Math.round(rows.filter(r => r.showed).length / rows.length * 100)}%` : 'n/a',
        outcomes_all_time: outcomes,
      }
    },
    async series({ days = 14 }) {
      const since = daysAgoIso(days - 1)
      const { data } = await sb.from('sales_calls').select('date').gte('date', since)
      const counts = {}
      for (let i = days - 1; i >= 0; i--) counts[daysAgoIso(i)] = 0
      for (const r of (data ?? [])) if (r.date in counts) counts[r.date]++
      return { label: 'Sales calls per day', points: Object.entries(counts).map(([day, value]) => ({ day, value })) }
    },
  },

  campaigns: {
    description: 'active ad campaigns, spend, leads, CPL, by client',
    async summarize() {
      const { data } = await sb.from('sd_tests').select('client,label,spend,leads,cpl,delivery')
      const rows = data ?? []
      const active = rows.filter(r => (r.delivery || '').toUpperCase() === 'ACTIVE')
      const spend = active.reduce((s, r) => s + (Number(r.spend) || 0), 0)
      const leads = active.reduce((s, r) => s + (r.leads || 0), 0)
      const byClient = {}
      for (const r of active) byClient[r.client] = (byClient[r.client] || 0) + 1
      return {
        active_count: active.length,
        active_spend: +spend.toFixed(2),
        active_leads: leads,
        blended_cpl: leads ? +(spend / leads).toFixed(2) : null,
        active_by_client: byClient,
      }
    },
    async series({ days = 14 }) {
      const since = daysAgoIso(days - 1)
      const { data } = await sb.from('sd_daily').select('day,spend').gte('day', since)
      const byDay = {}
      for (let i = days - 1; i >= 0; i--) byDay[daysAgoIso(i)] = 0
      for (const r of (data ?? [])) if (r.day in byDay) byDay[r.day] += Number(r.spend) || 0
      return { label: 'Ad spend per day', points: Object.entries(byDay).map(([day, value]) => ({ day, value: +value.toFixed(2) })) }
    },
  },

  finances: {
    description: 'revenue, expenses, and net profit by month',
    async summarize() {
      const { data } = await sb.from('transactions').select('type,date,amount')
      const rows = data ?? []
      const thisMonth = TODAY_ISO.slice(0, 7)
      const lm = new Date(TODAY); lm.setMonth(lm.getMonth() - 1)
      const lastMonth = iso(lm).slice(0, 7)
      const net = mk => {
        const inc = rows.filter(r => r.type === 'income' && monthKey(r.date) === mk).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const exp = rows.filter(r => r.type === 'expense' && monthKey(r.date) === mk).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        return { income: +inc.toFixed(2), expense: +exp.toFixed(2), net: +(inc - exp).toFixed(2) }
      }
      return { this_month: { month: thisMonth, ...net(thisMonth) }, last_month: { month: lastMonth, ...net(lastMonth) } }
    },
    async series({ months = 6 }) {
      const { data } = await sb.from('transactions').select('type,date,amount')
      const rows = data ?? []
      const keys = []
      for (let i = months - 1; i >= 0; i--) { const d = new Date(TODAY); d.setMonth(d.getMonth() - i); keys.push(iso(d).slice(0, 7)) }
      const points = keys.map(mk => {
        const inc = rows.filter(r => r.type === 'income' && monthKey(r.date) === mk).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        const exp = rows.filter(r => r.type === 'expense' && monthKey(r.date) === mk).reduce((s, r) => s + (Number(r.amount) || 0), 0)
        return { day: mk, value: +(inc - exp).toFixed(2) }
      })
      return { label: 'Net profit by month', points }
    },
  },
}

// ── chart intent (v1 keyword detection; LLM routing comes later) ────────────
const CHART_RE = /\b(graph|chart|plot|trend(ing|s)?|over time|per day|each day|by day|by month|visuali[sz]e)\b/i
function pickChart(q) {
  if (!CHART_RE.test(q)) return null
  const lower = q.toLowerCase()
  let days = 14
  const wk = lower.match(/(\d+)\s*(day|week)/)
  if (wk) days = wk[2] === 'week' ? +wk[1] * 7 : +wk[1]
  else if (/two weeks|2 weeks/.test(lower)) days = 14
  else if (/month/.test(lower)) days = 30
  if (/spend|budget/.test(lower)) return { skill: 'campaigns', kind: 'series', args: { days } }
  if (/revenue|net|profit|income|finance/.test(lower)) return { skill: 'finances', kind: 'series', args: { months: 6 } }
  return { skill: 'sales_calls', kind: 'series', args: { days } } // default
}

// ── Claude CLI (Opus 4.8 via Max subscription) ──────────────────────────────
function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, ['-p', '--model', 'opus', prompt], {
      cwd: process.env.HOME,
      env: { ...process.env, CI: 'true', NON_INTERACTIVE: '1' },
    })
    let out = '', err = ''
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('Claude CLI timeout (120s)')) }, 120000)
    child.stdout.on('data', d => out += d)
    child.stderr.on('data', d => { err += d })
    child.on('error', e => { clearTimeout(timer); reject(e) })
    child.on('close', () => {
      clearTimeout(timer)
      if (/Not logged in|Please run \/login/.test(err)) return reject(new Error('Claude CLI not authenticated'))
      // strip ANSI + trim
      resolve(out.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/^Assistant:\s*/, '').trim())
    })
  })
}

const PERSONA = `You are Percy, Andrew's in-house analyst living inside Mission Control. You answer questions about his business using ONLY the data provided.
Rules:
- Lead with the answer/number, then a short bit of context. No preamble, no fluff.
- Be direct and concise — a sharp analyst, not a chatbot. No emoji unless asked.
- If the needed data isn't in what's provided, say so plainly. Never invent numbers.
- Today's date is ${TODAY_ISO}.`

// ── answer one question ─────────────────────────────────────────────────────
async function answer(row) {
  await sb.from('percy_chats').update({ status: 'working' }).eq('id', row.id)
  try {
    const pack = {
      today: TODAY_ISO,
      sales_calls: await skills.sales_calls.summarize(),
      campaigns: await skills.campaigns.summarize(),
      finances: await skills.finances.summarize(),
    }
    const chartReq = pickChart(row.question)
    let chart = null
    let dataForPrompt = pack
    if (chartReq) {
      const s = await skills[chartReq.skill][chartReq.kind](chartReq.args)
      chart = { type: 'line', title: s.label, points: s.points }
      // Feed the actual series to Percy so his caption reflects the real daily data.
      dataForPrompt = { ...pack, chart_series: { title: s.label, points: s.points } }
    }

    const instruction = chart
      ? `A line chart of the "chart_series" data is being displayed to the user right now. Reply with ONLY one short caption sentence about the key trend in that series. No "Caption:" prefix, no bullet lists, no axis description, no claim that the data is missing — the series IS the data.`
      : `Answer the question directly from the data.`

    const prompt = `${PERSONA}\n\n${instruction}\n\nDATA:\n${JSON.stringify(dataForPrompt)}\n\nQUESTION: ${row.question}`
    const text = await runClaude(prompt)

    await sb.from('percy_chats').update({
      status: 'answered', answer: text, chart,
      skills_used: chartReq ? [chartReq.skill] : Object.keys(skills),
      answered_at: Date.now(),
    }).eq('id', row.id)
    console.log(`[answered] ${row.id} ${chart ? '(+chart)' : ''}`)
  } catch (e) {
    await sb.from('percy_chats').update({ status: 'error', error: String(e.message || e) }).eq('id', row.id)
    console.error(`[error] ${row.id}:`, e.message || e)
  }
}

async function drainPending() {
  const { data } = await sb.from('percy_chats').select('*').eq('status', 'pending').order('created_at', { ascending: true })
  for (const row of (data ?? [])) await answer(row)
  return (data ?? []).length
}

async function beat() {
  await sb.from('percy_health').upsert({ id: 'worker', last_beat_at: Date.now() })
}

// ── main ────────────────────────────────────────────────────────────────────
if (ONCE) {
  const n = await drainPending()
  console.log(`[once] processed ${n} pending`)
  process.exit(0)
} else {
  console.log('[percy] worker online — watching percy_chats')
  await beat()
  let lastBeat = Date.now()
  // simple poll loop (Realtime subscription is a later optimization)
  for (;;) {
    try { await drainPending() } catch (e) { console.error('[loop]', e.message || e) }
    if (Date.now() - lastBeat > 30000) { await beat().catch(() => {}); lastBeat = Date.now() }
    await new Promise(r => setTimeout(r, 2000))
  }
}
