import { NextResponse } from 'next/server'
<<<<<<< HEAD
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-static'

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw gateway usage-cost --json --days 30', {
      timeout: 15000
    })
    const raw = JSON.parse(stdout)

    // Build response shaped for the dashboard
    const daily = (raw.daily || []).map((d: {date: string, totalCost: number, totalTokens: number}) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spend: parseFloat(d.totalCost.toFixed(2)),
      tokens: d.totalTokens
    }))

    const totals = raw.totals || {}

    const response = {
      lastUpdated: new Date().toISOString(),
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      dailySpend: daily,
      totals: {
        totalCost: parseFloat((totals.totalCost || 0).toFixed(2)),
        totalTokens: totals.totalTokens || 0,
        inputCost: parseFloat((totals.inputCost || 0).toFixed(4)),
        outputCost: parseFloat((totals.outputCost || 0).toFixed(2)),
        cacheReadCost: parseFloat((totals.cacheReadCost || 0).toFixed(2)),
        cacheWriteCost: parseFloat((totals.cacheWriteCost || 0).toFixed(2))
      },
      sessionBreakdown: [
        { name: 'Cache Writes', cost: parseFloat((totals.cacheWriteCost || 0).toFixed(2)), tokens: totals.cacheWrite || 0, color: '#E53E3E' },
        { name: 'Cache Reads', cost: parseFloat((totals.cacheReadCost || 0).toFixed(2)), tokens: totals.cacheRead || 0, color: '#C53030' },
        { name: 'Output', cost: parseFloat((totals.outputCost || 0).toFixed(2)), tokens: totals.output || 0, color: '#FC8181' },
        { name: 'Input', cost: parseFloat((totals.inputCost || 0).toFixed(4)), tokens: totals.input || 0, color: '#FEB2B2' }
      ]
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('usage-cost fetch failed:', err)
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 })
=======

const GATEWAY = 'http://localhost:18789'
const TOKEN = 'f034d1977a68ee431c961fb370b585f9b6f540d04837d9e5'

// Blended rates per 1M tokens (input+output combined estimate)
const RATES: Record<string, number> = {
  'claude-sonnet-4-6': 6.0,
  'claude-haiku-4-5': 0.5,
}
const DEFAULT_RATE = 6.0 // fallback to sonnet rate

function displayName(key: string, label?: string): string {
  if (key === 'agent:main:main') return 'Main (Webchat)'
  if (key === 'agent:main:telegram:direct:6005829549') return 'Telegram'
  if (key === 'agent:main:whatsapp:direct:+14145171561') return 'WhatsApp'
  if (key.includes('agent:main:cron:') && label) return label
  if (key.includes('subagent')) return 'Sub-agent'
  return key
}

function detectModel(session: Record<string, unknown>): string {
  const model = (session.model as string) || ''
  if (model.includes('haiku')) return 'claude-haiku-4-5'
  if (model.includes('sonnet')) return 'claude-sonnet-4-6'
  return model || 'claude-sonnet-4-6'
}

export async function GET() {
  try {
    const res = await fetch(`${GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ tool: 'sessions_list', args: { limit: 50, messageLimit: 0 } }),
    })

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Gateway returned ${res.status}` }, { status: 502 })
    }

    const data = await res.json()

    const rawSessions = data?.result?.details?.sessions ?? data?.sessions
    if (!data.ok || !Array.isArray(rawSessions)) {
      return NextResponse.json({ ok: false, error: 'Invalid response from Gateway' }, { status: 502 })
    }

    const sessions = rawSessions.map((s: Record<string, unknown>) => {
      const key = (s.key as string) || ''
      const label = (s.label as string) || ''
      const totalTokens = (s.totalTokens as number) || 0
      const model = detectModel(s)
      const rate = RATES[model] ?? DEFAULT_RATE
      const estimatedCost = (totalTokens / 1_000_000) * rate

      return {
        key,
        label: displayName(key, label),
        totalTokens,
        model,
        estimatedCost,
      }
    })

    // Sort by tokens descending
    sessions.sort((a: { totalTokens: number }, b: { totalTokens: number }) => b.totalTokens - a.totalTokens)

    const totalTokens = sessions.reduce((sum: number, s: { totalTokens: number }) => sum + s.totalTokens, 0)
    const estimatedCost = sessions.reduce((sum: number, s: { estimatedCost: number }) => sum + s.estimatedCost, 0)

    return NextResponse.json({
      ok: true,
      sessions,
      totals: {
        totalTokens,
        estimatedCost,
        sessionCount: sessions.length,
      },
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
>>>>>>> 2878498 (Add client retention page)
  }
}
