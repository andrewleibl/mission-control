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
      const prevWeekStart = daysAgoIso(13)
      return {
        total_all_time: rows.length,
        this_week: inWeek.length,
        last_week: rows.filter(r => r.date >= prevWeekStart && r.date < last7).length,
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
      return { label: 'Sales calls per day', points: Object.entries(counts).map(([label, value]) => ({ label, value })) }
    },
    async byOutcome() {
      const { data } = await sb.from('sales_calls').select('outcome')
      const c = {}
      for (const r of (data ?? [])) c[r.outcome] = (c[r.outcome] || 0) + 1
      return { label: 'Calls by outcome', points: Object.entries(c).map(([label, value]) => ({ label, value })) }
    },
    async bySource() {
      const { data } = await sb.from('sales_calls').select('source')
      const c = {}
      for (const r of (data ?? [])) c[r.source] = (c[r.source] || 0) + 1
      return { label: 'Calls by source', points: Object.entries(c).map(([label, value]) => ({ label, value })) }
    },
    async seriesBySource({ days = 30 }) {
      const since = daysAgoIso(days - 1)
      const { data } = await sb.from('sales_calls').select('date,source').gte('date', since)
      const sources = new Set()
      const byDaySource = {}
      for (let i = days - 1; i >= 0; i--) byDaySource[daysAgoIso(i)] = {}
      for (const r of (data ?? [])) {
        const src = r.source || 'other'
        sources.add(src)
        if (r.date in byDaySource) byDaySource[r.date][src] = (byDaySource[r.date][src] || 0) + 1
      }
      const seriesKeys = [...sources].sort()
      const points = Object.entries(byDaySource).map(([day, counts]) => {
        const pt = { label: day }
        for (const s of seriesKeys) pt[s] = counts[s] || 0
        return pt
      })
      return { label: 'Calls booked by source', points, seriesKeys }
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
      return { label: 'Ad spend per day', points: Object.entries(byDay).map(([label, value]) => ({ label, value: +value.toFixed(2) })) }
    },
    async byClient() {
      const { data } = await sb.from('sd_tests').select('client,spend,delivery')
      const active = (data ?? []).filter(r => (r.delivery || '').toUpperCase() === 'ACTIVE')
      const m = {}
      for (const r of active) m[r.client] = (m[r.client] || 0) + (Number(r.spend) || 0)
      return { label: 'Active spend by client', points: Object.entries(m).map(([label, value]) => ({ label, value: +value.toFixed(2) })) }
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
        return { label: mk, value: +(inc - exp).toFixed(2) }
      })
      return { label: 'Net profit by month', points }
    },
  },

  sms: {
    description: 'cold SMS funnel — sends, positive replies, booked meetings, follow-up pipeline, and best/worst performing templates over the last 7 & 30 days',
    async summarize() {
      const [tpl, sends, wins, pros] = await Promise.all([
        sb.from('sms_templates').select('id,label,status'),
        sb.from('sms_sends').select('template_id,day,count'),
        sb.from('sms_wins').select('template_id,type,logged_at'),
        sb.from('sms_prospects').select('stage'),
      ])
      const templates = tpl.data ?? [], sendRows = sends.data ?? [], winRows = wins.data ?? []
      const last7 = daysAgoIso(6), last30 = daysAgoIso(29)
      const sentAll = sendRows.reduce((s, r) => s + (r.count || 0), 0)
      const sentWeek = sendRows.filter(r => r.day >= last7).reduce((s, r) => s + (r.count || 0), 0)
      const positives = winRows.filter(r => r.type === 'positive_reply').length
      const booked = winRows.filter(r => r.type === 'booked_meeting').length
      const stages = {}
      for (const r of (pros.data ?? [])) stages[r.stage] = (stages[r.stage] || 0) + 1
      // Tag each win with its LOCAL calendar day so template windows line up with send windows.
      const winsByDay = winRows.map(r => ({ ...r, day: iso(new Date(Number(r.logged_at))) }))
      // Per-template performance within a window (since = inclusive YYYY-MM-DD start).
      const perf = (since) => templates.map(t => {
        const s = sendRows.filter(r => r.template_id === t.id && r.day >= since).reduce((a, r) => a + (r.count || 0), 0)
        const w = winsByDay.filter(r => r.template_id === t.id && r.day >= since)
        const pos = w.filter(r => r.type === 'positive_reply').length
        const bk = w.filter(r => r.type === 'booked_meeting').length
        return { template: t.label, status: t.status, sends: s, positive_replies: pos, booked: bk, positive_rate: s ? `${(pos / s * 100).toFixed(1)}%` : 'n/a' }
      }).filter(r => r.sends > 0 || r.positive_replies > 0 || r.booked > 0)
        .sort((a, b) => (parseFloat(b.positive_rate) || 0) - (parseFloat(a.positive_rate) || 0) || b.booked - a.booked || b.sends - a.sends)
      return {
        active_templates: templates.filter(t => t.status === 'active').length,
        total_sent: sentAll, sent_this_week: sentWeek,
        positive_replies_all_time: positives, booked_meetings_all_time: booked,
        positive_rate_all_time: sentAll ? `${(positives / sentAll * 100).toFixed(1)}%` : 'n/a',
        prospects_following_up: stages.following_up || 0, prospects_booked: stages.booked || 0, prospects_lost: stages.lost || 0,
        template_performance_last_7d: perf(last7),
        template_performance_last_30d: perf(last30),
        template_ranking_note: 'Per-template arrays are sorted best→worst by positive-reply rate (tiebreak: booked, then volume). Low send counts make the rate noisy — weigh by "sends". Rank by whichever metric the user asks: "positive_rate" = copy quality, "booked" = appointments. Only templates with activity in the window are listed.',
      }
    },
  },

  tasks: {
    description: 'task list — overdue, due today, upcoming, open count',
    async summarize() {
      const { data } = await sb.from('tasks').select('due_date,starred,completed_at')
      const open = (data ?? []).filter(r => !r.completed_at)
      const in7 = daysAgoIso(-7)
      return {
        open: open.length,
        overdue: open.filter(r => r.due_date && r.due_date < TODAY_ISO).length,
        due_today: open.filter(r => r.due_date === TODAY_ISO).length,
        upcoming_7d: open.filter(r => r.due_date && r.due_date > TODAY_ISO && r.due_date <= in7).length,
        starred_open: open.filter(r => r.starred).length,
      }
    },
  },

  clients: {
    description: 'active clients and recurring monthly revenue (MRR)',
    async summarize() {
      const { data } = await sb.from('clients').select('name,status,monthly_retainer')
      const active = (data ?? []).filter(r => r.status === 'active')
      const mrr = active.reduce((s, r) => s + (Number(r.monthly_retainer) || 0), 0)
      return { active_clients: active.length, mrr: +mrr.toFixed(2), active_names: active.map(r => r.name), total_clients: (data ?? []).length }
    },
  },

  growth: {
    description: 'growth goals — targets and current progress',
    async summarize() {
      const { data } = await sb.from('goals').select('*')
      return {
        goals: (data ?? []).map(r => ({
          name: r.name ?? r.title ?? r.label ?? 'goal',
          target: r.target_value, current: r.current_value, status: r.status,
          progress: r.target_value ? `${Math.min(100, Math.round((r.current_value / r.target_value) * 100))}%` : 'n/a',
        })),
      }
    },
  },

  retention: {
    description: 'client retention events/check-ins — open, overdue, due today',
    async summarize() {
      const { data } = await sb.from('retention_events').select('date,completed,type')
      const open = (data ?? []).filter(r => !r.completed)
      return {
        open_events: open.length,
        overdue: open.filter(r => r.date && r.date < TODAY_ISO).length,
        due_today: open.filter(r => r.date === TODAY_ISO).length,
        total_logged: (data ?? []).length,
      }
    },
  },

  projections: {
    description: 'revenue projection targets (monthly net goal)',
    async summarize() {
      const { data } = await sb.from('projection_settings').select('scope,monthly_net_goal')
      const rows = data ?? []
      const g = rows.find(r => r.scope === 'global') ?? rows[0]
      return { monthly_net_goal: g?.monthly_net_goal ?? null }
    },
  },

  sops: {
    description: 'standard operating procedures — count and categories',
    async summarize() {
      const { data } = await sb.from('sops').select('title,category')
      const cats = {}
      for (const r of (data ?? [])) cats[r.category || 'uncategorized'] = (cats[r.category || 'uncategorized'] || 0) + 1
      return { total_sops: (data ?? []).length, by_category: cats, titles: (data ?? []).map(r => r.title).slice(0, 25) }
    },
  },

  reports: {
    description: 'per-client weekly ad/campaign reports (spend, leads, revenue, ROAS)',
    async summarize() {
      const { data } = await sb.from('reports').select('client,report_type,week_start,spend,leads,revenue,roas,created_at').order('created_at', { ascending: false }).limit(15)
      return { recent: (data ?? []).map(r => ({ client: r.client, type: r.report_type, week: r.week_start, spend: r.spend, leads: r.leads, revenue: r.revenue, roas: r.roas })) }
    },
  },

  // Reference knowledge (not live data): Andrew's mentor's media-buying framework
  // — the Miro "Media Buying Breakdown". Lets Percy answer how-to/process
  // questions about structuring, launching, and optimizing Meta ad campaigns.
  media_buying: {
    description: 'media-buying framework / SOP (Andrew\'s mentor\'s playbook) — how to structure, launch, and optimize Meta ad campaigns (B2C client + B2B)',
    async summarize() {
      return {
        _note: 'Reference SOP, not live numbers. Use it to answer how-to/process questions about running ad campaigns. Do not treat its example figures as current account data.',
        b2c_client_ad_structure: {
          campaign: 'CBO (Campaign Budget Optimization), $50-100/day, broad targeting — NO interest targeting',
          ad_set: {
            ages: '30-65+ (for most niches)',
            ads: '8-12 diverse ads',
            creative_mix: '60% video, 40% static',
            offers: '3-4 different offers/angles per campaign — test variations of offers & angles',
            placements: 'FB & IG Feed, FB & IG Stories, FB & IG Reels',
            location: 'whatever area the client wants to target',
          },
          copy: {
            primary_texts: "3 primary text/angles — don't reuse the same primary text across different angle types (a 'free estimate' angle and a 'get 20% off' angle need different primary text)",
            headlines: '3 headlines',
            descriptions: '1 description',
          },
          optimization_matrix: [
            'Campaign launched → do NOT touch for 3-5 days (let it learn)',
            'Getting a couple leads → let it run and continue to monitor',
            'Got 1 lead → give it 24-48 more hours',
            'No leads after the initial window → duplicate the campaign & change out ALL the ads, let it run 3-5 more days',
            'Still no leads → duplicate the campaign & remove the ads that got most of the spend (usually 1-3)',
          ],
        },
        b2b_ad_structure: {
          campaign: 'CBO, $50-100/day, broad targeting — NO interest targeting',
          ad_set: {
            ages: '25-65+',
            ads: '8-12 diverse ads; start with all static ads',
            creative_mix: '60% direct-offer ads, 30% proven ads from Noah/competitors, 10% ads based on your ICP pain points/goals',
            placements: 'FB & IG Feed, FB & IG Stories, FB & IG Reels',
            location: 'the whole USA (or whatever market you are targeting)',
          },
          copy: '3 primary texts, 3 headlines, 1 description',
        },
        key_caveats: 'This is a TRAFFIC framework — it gets clicks cheaply and lets the algorithm find buyers; it assumes the funnel downstream of the click (lead capture → booking → follow-up) actually works. ALWAYS verify a test lead flows all the way through the funnel BEFORE spending. The matrix triggers on "leads," so a broken capture step makes a working ad look dead (this exact gap cost a real campaign ~$118 with a healthy 2.56% CTR and 0 captured leads). Minimum budget is $50/day per the framework — never run below $40/day or Meta cannot exit the learning phase.',
      }
    },
  },
}

// ── chart intent (v1 keyword detection; LLM routing comes later) ────────────
const CHART_RE = /\b(graph|chart|plot|trend(ing|s)?|over time|per day|each day|by day|by month|by client|by outcome|by source|breakdown|split|distribution|pie|bar|visuali[sz]e|compar(e|ing)|vs)\b/i
function parseDays(l) {
  const wk = l.match(/(\d+)\s*(day|week)/)
  if (wk) return wk[2] === 'week' ? +wk[1] * 7 : +wk[1]
  if (/two weeks|2 weeks/.test(l)) return 14
  // "june 1 to 30" / "first of june to the 30th" / "this month" / "the month"
  if (/june|this month|the month/.test(l)) return 30
  if (/month/.test(l)) return 30
  return 14
}
function pickChart(q) {
  if (!CHART_RE.test(q)) return null
  const l = q.toLowerCase()
  const isComparison = /\bvs\b|\bversus\b|\bcompar|\bwhere they came from\b/.test(l)
  // categorical breakdowns → pie or bar
  if (/outcome|status/.test(l) && !/per day|each day|by day|over time/.test(l)) return { type: /pie|breakdown|split|distribution/.test(l) ? 'pie' : 'bar', skill: 'sales_calls', fn: 'byOutcome', args: {} }
  if (/source|channel/.test(l) && !/per day|each day|by day|over time/.test(l)) return { type: 'bar', skill: 'sales_calls', fn: 'bySource', args: {} }
  if (/client/.test(l) && /spend|campaign|budget/.test(l) && !/call|book/.test(l)) return { type: /pie|breakdown|split/.test(l) ? 'pie' : 'bar', skill: 'campaigns', fn: 'byClient', args: {} }
  const days = parseDays(l)
  // Calls/bookings take priority over "ad" keyword (user might say "meta ads" meaning the source, not ad spend)
  if (/call|booked|appointment|estimate/.test(l)) {
    if (isComparison || /meta.*(outreach|cold)|cold.*meta|(outreach|cold).*(meta|ad)/.test(l) || (/source|where/.test(l) && /per day|each day|by day/.test(l))) {
      return { type: 'line', skill: 'sales_calls', fn: 'seriesBySource', args: { days }, multi: true }
    }
    return { type: 'line', skill: 'sales_calls', fn: 'series', args: { days } }
  }
  if (/spend|budget/.test(l)) return { type: 'area', skill: 'campaigns', fn: 'series', args: { days } }
  if (/revenue|net|profit|income|finance/.test(l)) return { type: 'line', skill: 'finances', fn: 'series', args: { months: 6 } }
  // Only route to campaigns if explicitly about ads/campaigns AND not about calls
  if (/\bad\b|campaign/.test(l) && !/call|book/.test(l)) return { type: 'area', skill: 'campaigns', fn: 'series', args: { days } }
  return { type: 'line', skill: 'sales_calls', fn: 'series', args: { days } }
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
- Some provided items are reference knowledge (e.g. the media_buying framework/SOP), not live data — you can explain, teach, and walk through that process, not just report numbers. Don't mistake an SOP's example figures for current account data.
- Use the RECENT CONVERSATION for context — the user often builds on earlier answers ("what about last week?", "and the month before?", "graph that"). Resolve references like "that"/"those" from it.
- Today's date is ${TODAY_ISO}.`

// ── answer one question ─────────────────────────────────────────────────────
async function answer(row) {
  await sb.from('percy_chats').update({ status: 'working' }).eq('id', row.id)
  try {
    // Recent conversation so Percy can follow up ("what about last week?", "graph that").
    const { data: hist } = await sb.from('percy_chats')
      .select('question,answer,created_at').eq('status', 'answered')
      .lt('created_at', row.created_at).order('created_at', { ascending: false }).limit(8)
    const convo = (hist ?? []).reverse().map(h => `User: ${h.question}\nPercy: ${h.answer}`).join('\n\n')

    // Auto-include every skill that exposes summarize() — new skills join the
    // pack automatically. Parallel + fault-tolerant (one bad skill won't break Percy).
    const pack = { today: TODAY_ISO }
    const summable = Object.entries(skills).filter(([, s]) => typeof s.summarize === 'function')
    const sums = await Promise.all(summable.map(([, s]) => s.summarize().catch(e => { console.error('skill', e?.message); return null })))
    summable.forEach(([name], i) => { if (sums[i]) pack[name] = sums[i] })
    const chartReq = pickChart(row.question)
    let chart = null
    let dataForPrompt = pack
    if (chartReq) {
      const s = await skills[chartReq.skill][chartReq.fn](chartReq.args)
      chart = { type: chartReq.type, title: s.label, points: s.points }
      if (s.seriesKeys) chart.seriesKeys = s.seriesKeys
      dataForPrompt = { ...pack, chart_series: { title: s.label, type: chartReq.type, points: s.points, seriesKeys: s.seriesKeys || null } }
    }

    const instruction = chart
      ? `Answer the question using the data below. A chart is also being displayed to the user — reference the trends you see in chart_series naturally. Keep it concise: 1-3 sentences highlighting the key insight.`
      : `Answer the question directly from the data.`

    const convoBlock = convo ? `RECENT CONVERSATION (oldest→newest; the user may refer back to it):\n${convo}\n\n` : ''
    const prompt = `${PERSONA}\n\n${instruction}\n\n${convoBlock}DATA (live, current values):\n${JSON.stringify(dataForPrompt)}\n\nQUESTION: ${row.question}`
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
