'use client'
import { useEffect, useState, useCallback } from 'react'
<<<<<<< HEAD
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const REFRESH_INTERVAL_MS = 15 * 60 * 1000 // 15 minutes

interface UsageData {
  lastUpdated: string
  month: string
  creditBalance?: number
  pendingThisPeriod?: number
  dailySpend: { date: string; spend: number; tokens: number }[]
  totals: {
    totalCost: number
    totalTokens: number
    inputCost: number
    outputCost: number
    cacheReadCost: number
    cacheWriteCost: number
  }
  sessionBreakdown: { name: string; cost: number; tokens: number; color: string }[]
}
=======
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SessionData {
  key: string
  label: string
  totalTokens: number
  model: string
  estimatedCost: number
}

interface UsageData {
  ok: boolean
  sessions: SessionData[]
  totals: {
    totalTokens: number
    estimatedCost: number
    sessionCount: number
  }
  error?: string
}

function formatTokens(n: number): string {
  return n.toLocaleString('en-US')
}

function modelShortName(model: string): string {
  if (model.includes('sonnet')) return 'Sonnet'
  if (model.includes('haiku')) return 'Haiku'
  return model
}

const BAR_COLORS = ['#E53E3E', '#C53030', '#FC8181', '#F56565', '#FEB2B2', '#E53E3E', '#C53030', '#FC8181']
>>>>>>> 2878498 (Add client retention page)

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
<<<<<<< HEAD
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [nextRefresh, setNextRefresh] = useState<number>(REFRESH_INTERVAL_MS)

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/usage')
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date())
      setNextRefresh(REFRESH_INTERVAL_MS)
    } catch (e) {
      console.error('Usage fetch error:', e)
=======
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage')
      const json = await res.json()
      if (json.ok) {
        setData(json)
        setLastUpdated(new Date())
        setError(null)
      } else {
        setError(json.error || 'Failed to load usage data')
      }
    } catch (e) {
      setError(String(e))
>>>>>>> 2878498 (Add client retention page)
    } finally {
      setLoading(false)
    }
  }, [])

<<<<<<< HEAD
  // Initial load
  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  // Auto-refresh every 15 min
  useEffect(() => {
    const interval = setInterval(fetchUsage, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchUsage])

  // Countdown timer
  useEffect(() => {
    const tick = setInterval(() => {
      setNextRefresh((prev) => Math.max(0, prev - 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastRefresh])

  const formatCountdown = (ms: number) => {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: '#718096', fontSize: 14 }}>Loading usage data...</div>
      </div>
    )
  }

  if (!data) return null

  const avgDaily = data.dailySpend.length
    ? data.dailySpend.reduce((s, d) => s + d.spend, 0) / data.dailySpend.length
    : 0
=======
  useEffect(() => {
    fetchUsage()
    const interval = setInterval(fetchUsage, 30_000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  // Tick "seconds ago" counter
  useEffect(() => {
    if (!lastUpdated) return
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  const totals = data?.totals
  const sessions = data?.sessions ?? []

  // Chart data — top 8 sessions by tokens
  const chartData = sessions.slice(0, 8).map((s) => ({
    name: s.label.length > 14 ? s.label.slice(0, 13) + '…' : s.label,
    tokens: s.totalTokens,
  }))
>>>>>>> 2878498 (Add client retention page)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Usage & Cost</h1>
<<<<<<< HEAD
          <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{data.month} — live data from OpenClaw</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#4A5568' }}>
            Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}
          </div>
          <div style={{ fontSize: 11, color: '#4A5568', marginTop: 2 }}>
            Refreshes in: <span style={{ color: '#E53E3E' }}>{formatCountdown(nextRefresh)}</span>
          </div>
          <button
            onClick={fetchUsage}
            style={{
              marginTop: 6, fontSize: 11, color: '#718096', background: 'none',
              border: '1px solid #2A2A2A', borderRadius: 4, padding: '3px 8px', cursor: 'pointer'
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh now'}
          </button>
        </div>
      </div>

      {/* Credit balance banner */}
      {data.creditBalance !== undefined && (
        <div style={{
          background: '#1A1A1A', border: '1px solid #E53E3E33', borderRadius: 10,
          padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Credit Balance</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: data.creditBalance < 5 ? '#E53E3E' : '#68D391' }}>
              ${data.creditBalance.toFixed(2)}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: '#2A2A2A' }} />
          <div>
            <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pending This Period</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#F7FAFC' }}>${data.pendingThisPeriod?.toFixed(2)}</div>
          </div>
          {data.creditBalance < 5 && (
            <div style={{
              marginLeft: 'auto', background: '#E53E3E22', border: '1px solid #E53E3E',
              borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#FC8181'
            }}>
              ⚠️ Low balance — top up soon
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Spent (Period)</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#E53E3E' }}>${data.totals.totalCost.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{(data.totals.totalTokens / 1000000).toFixed(2)}M tokens</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Avg Daily Spend</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#F7FAFC' }}>${avgDaily.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>based on {data.dailySpend.length} days</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Cache Efficiency</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#F7FAFC' }}>
            {data.totals.totalCost > 0
              ? Math.round((data.totals.cacheReadCost / data.totals.totalCost) * 100)
              : 0}%
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>spend via cache reads</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Daily Spend</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailySpend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
=======
          <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>Live AI token usage — auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: 12, color: '#4A5568' }}>
              Updated {secondsAgo}s ago
            </span>
          )}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '7px 14px',
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              borderRadius: 6,
              color: '#F7FAFC',
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>↗</span> Anthropic Console
          </a>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ color: '#718096', fontSize: 14, marginBottom: 20 }}>Loading usage data…</div>
      )}
      {error && (
        <div style={{ color: '#FC8181', fontSize: 13, marginBottom: 20, padding: '10px 14px', background: '#1A1A1A', border: '1px solid #E53E3E', borderRadius: 8 }}>
          ⚠ {error}
        </div>
      )}

      {/* Hero stats */}
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <div className="stat-card">
            <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Estimated Cost</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#E53E3E' }}>${totals.estimatedCost.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>estimated</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Total Tokens</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#F7FAFC' }}>{(totals.totalTokens / 1_000_000).toFixed(2)}M</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{formatTokens(totals.totalTokens)} tokens</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Active Sessions</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#F7FAFC' }}>{totals.sessionCount}</div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>tracked contexts</div>
          </div>
        </div>
      )}

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Token Usage by Session</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#718096', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              />
>>>>>>> 2878498 (Add client retention page)
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F7FAFC' }}
                formatter={(v) => [formatTokens(Number(v)), 'Tokens']}
              />
              <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

<<<<<<< HEAD
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Cost Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.sessionBreakdown}
                dataKey="cost"
                nameKey="name"
                cx="45%"
                cy="50%"
                outerRadius={75}
                innerRadius={40}
              >
                {data.sessionBreakdown.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ color: '#718096', fontSize: 11 }}>{v}</span>}
              />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F7FAFC' }}
                formatter={(v) => [`$${Number(v).toFixed(4)}`, 'Cost']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Token cost breakdown table */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Cost Breakdown by Type</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['Type', 'Cost', '% of Total'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { type: 'Cache Writes', cost: data.totals.cacheWriteCost },
              { type: 'Cache Reads', cost: data.totals.cacheReadCost },
              { type: 'Output Tokens', cost: data.totals.outputCost },
              { type: 'Input Tokens', cost: data.totals.inputCost },
            ].map((row) => (
              <tr key={row.type} style={{ borderBottom: '1px solid #1A1A1A' }}>
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#F7FAFC' }}>{row.type}</td>
                <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 600, color: '#E53E3E' }}>${row.cost.toFixed(4)}</td>
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#718096' }}>
                  {data.totals.totalCost > 0 ? Math.round((row.cost / data.totals.totalCost) * 100) : 0}%
                </td>
=======
      {/* Session breakdown table */}
      {sessions.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Session Breakdown</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['Session', 'Model', 'Tokens', 'Est. Cost'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
>>>>>>> 2878498 (Add client retention page)
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.key} style={{ borderBottom: '1px solid #1A1A1A' }}>
                  <td style={{ padding: '11px 12px', fontSize: 13, color: '#F7FAFC' }}>{s.label}</td>
                  <td style={{ padding: '11px 12px', fontSize: 12, color: '#718096', fontFamily: 'monospace' }}>{modelShortName(s.model)}</td>
                  <td style={{ padding: '11px 12px', fontSize: 13, color: '#718096' }}>{formatTokens(s.totalTokens)}</td>
                  <td style={{ padding: '11px 12px', fontSize: 14, fontWeight: 600, color: s.estimatedCost > 0.01 ? '#E53E3E' : '#718096' }}>
                    ${s.estimatedCost.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ fontSize: 12, color: '#4A5568', padding: '10px 14px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8 }}>
        ⚠ Estimates based on blended token rates (Sonnet $6.00/1M, Haiku $0.50/1M). Verify exact charges at{' '}
        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FC8181' }}>
          console.anthropic.com
        </a>
      </div>
    </div>
  )
}
