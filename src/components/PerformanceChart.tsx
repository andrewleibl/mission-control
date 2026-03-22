'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PerformancePoint } from '@/data/metaAds'

type PerformanceChartProps = {
  title: string
  data: PerformancePoint[]
  variant: 'leads' | 'efficiency'
}

export default function PerformanceChart({ title, data, variant }: PerformanceChartProps) {
  const tooltipStyle = {
    background: '#111111',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    color: '#F7FAFC',
  }

  const asNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value || 0))

  return (
    <div className="card">
      <div style={{ fontSize: 14, fontWeight: 700, color: '#F7FAFC', marginBottom: 16 }}>{title}</div>
      <ResponsiveContainer width="100%" height={260}>
        {variant === 'leads' ? (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1A1A1A" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [asNumber(value), 'Leads']}
            />
            <Legend formatter={() => <span style={{ color: '#A0AEC0', fontSize: 12 }}>Leads</span>} />
            <Line type="monotone" dataKey="leads" name="leads" stroke="#E53E3E" strokeWidth={3} dot={{ r: 4, fill: '#E53E3E' }} />
          </LineChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1A1A1A" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => {
                const numericValue = asNumber(value)
                if (name === 'ctr') return [`${numericValue.toFixed(1)}%`, 'CTR']
                return [numericValue, 'Leads']
              }}
            />
            <Legend formatter={(value) => <span style={{ color: '#A0AEC0', fontSize: 12 }}>{value === 'ctr' ? 'CTR' : 'Leads'}</span>} />
            <Line yAxisId="left" type="monotone" dataKey="leads" name="leads" stroke="#E53E3E" strokeWidth={3} dot={{ r: 4, fill: '#E53E3E' }} />
            <Line yAxisId="right" type="monotone" dataKey="ctr" name="ctr" stroke="#FC8181" strokeWidth={2} dot={{ r: 3, fill: '#FC8181' }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
