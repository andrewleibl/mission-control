import { NextResponse } from 'next/server'
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
  }
}
