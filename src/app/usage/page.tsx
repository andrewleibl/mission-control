'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import usageData from '@/data/usage.json'

export default function UsagePage() {
  const data = usageData

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Usage & Cost</h1>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{data.month} — AI spend tracker</p>
      </div>

      {/* Monthly total hero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="stat-card">
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Monthly Total</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#E53E3E' }}>${data.monthlyTotal.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>{(data.monthlyTokens / 1000000).toFixed(2)}M tokens</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Avg Daily Spend</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#F7FAFC' }}>
            ${(data.dailySpend.reduce((s, d) => s + d.spend, 0) / data.dailySpend.length).toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>last 7 days</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Sessions Running</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#F7FAFC' }}>{data.sessionBreakdown.length}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>active contexts</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Daily spend bar chart */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Daily Spend (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailySpend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, color: '#F7FAFC' }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Spend']}
              />
              <Bar dataKey="spend" fill="#E53E3E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Session breakdown pie */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Spend by Session</div>
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
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Cost']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model breakdown table */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC', marginBottom: 16 }}>Model Breakdown</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['Model', 'Input Tokens', 'Output Tokens', 'Cost'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.modelBreakdown.map((row) => (
              <tr key={row.model} style={{ borderBottom: '1px solid #1A1A1A' }}>
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#F7FAFC', fontFamily: 'monospace' }}>{row.model}</td>
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#718096' }}>{(row.inputTokens / 1000).toFixed(0)}K</td>
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#718096' }}>{(row.outputTokens / 1000).toFixed(0)}K</td>
                <td style={{ padding: '12px 12px', fontSize: 14, fontWeight: 600, color: '#E53E3E' }}>${row.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
