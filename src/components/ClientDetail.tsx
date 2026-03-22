'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { MetaAdsClientDetail } from '@/data/metaAds'
import CreativeTable from '@/components/CreativeTable'
import PerformanceChart from '@/components/PerformanceChart'

function BudgetProgressCard({ spend, budget }: { spend: number; budget: number }) {
  const percentage = Math.min((spend / budget) * 100, 100)
  const radius = 60
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const statusColor = percentage < 50 ? '#48BB78' : percentage < 85 ? '#ECC94B' : '#E53E3E'

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 12, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        Campaign Progress
      </div>
      <div style={{ position: 'relative', width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke="#2A2A2A"
            strokeWidth={stroke}
          />
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke={statusColor}
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${radius} ${radius})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: '#F7FAFC' }}>{percentage.toFixed(0)}%</div>
          <div style={{ fontSize: 10, color: '#718096', marginTop: 2 }}>spent</div>
        </div>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>
          ${spend.toLocaleString()} <span style={{ color: '#718096', fontWeight: 400 }}>/ ${budget.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
          ${(budget - spend).toLocaleString()} remaining
        </div>
      </div>
    </div>
  )
}

function statTile(label: string, value: string, accent?: string) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || '#F7FAFC', marginTop: 8 }}>{value}</div>
    </div>
  )
}

function campaignTone(status: string) {
  if (status === 'Active') return { color: '#68D391', background: 'rgba(72,187,120,0.12)' }
  if (status === 'Learning') return { color: '#ECC94B', background: 'rgba(236,201,75,0.12)' }
  return { color: '#A0AEC0', background: 'rgba(160,174,192,0.12)' }
}

export default function ClientDetail({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<MetaAdsClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadClient() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/meta/${clientId}`)

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Client not found.' : 'Failed to load Meta Ads client.')
        }

        const data = (await response.json()) as MetaAdsClientDetail
        if (active) setClient(data)
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load Meta Ads client.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadClient()

    return () => {
      active = false
    }
  }, [clientId])

  if (loading) {
    return <div style={{ color: '#718096', fontSize: 14 }}>Loading client performance...</div>
  }

  if (error || !client) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>Meta Ads client unavailable</div>
        <div style={{ fontSize: 14, color: '#718096', marginTop: 8 }}>{error || 'No client data returned.'}</div>
        <Link href="/dashboard/meta-ads" style={{ color: '#FC8181', fontSize: 13, display: 'inline-block', marginTop: 16 }}>
          Back to overview
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/meta-ads" style={{ color: '#A0AEC0', fontSize: 13, textDecoration: 'none' }}>
          ← All Meta Ads clients
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginTop: 14, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#F7FAFC' }}>{client.name}</h1>
            <p style={{ fontSize: 14, color: '#718096', marginTop: 8, marginBottom: 0 }}>{client.brand} • {client.description}</p>
          </div>
          <div className="card" style={{ minWidth: 220, padding: '16px 18px', background: 'linear-gradient(180deg, #141414, #101010)' }}>
            <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Pulse</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#E53E3E', marginTop: 8 }}>
              ${client.leads > 0 ? (client.spendMTD / client.leads).toFixed(2) : '0.00'} CPL
            </div>
            <div style={{ fontSize: 13, color: '#A0AEC0', marginTop: 8 }}>{client.audienceNote}</div>
          </div>
        </div>
      </div>

      <div className="meta-stat-grid" style={{ gap: 16, marginBottom: 24 }}>
        {statTile('Monthly Budget', `$${client.monthlyBudget.toLocaleString()}`)}
        {statTile('Spend MTD', `$${client.spendMTD.toLocaleString()}`, '#E53E3E')}
        {statTile('Leads', `${client.leads}`)}
        {statTile('Cost Per Lead', `$${client.leads > 0 ? (client.spendMTD / client.leads).toFixed(2) : '0.00'}`)}
      </div>

      <div className="meta-stat-grid" style={{ gap: 16, marginBottom: 24 }}>
        {statTile('Impressions', client.topLine.impressions.toLocaleString())}
        {statTile('Clicks', client.topLine.clicks.toLocaleString())}
        {statTile('CTR', `${client.performance[client.performance.length - 1]?.ctr.toFixed(2) || '0.00'}%`)}
        {statTile('Frequency', `${client.topLine.frequency.toFixed(1)}x`)}
      </div>

      <div className="meta-chart-grid" style={{ marginBottom: 24 }}>
        <PerformanceChart title="Spend vs Revenue Trend" data={client.performance} variant="revenue" />
        <BudgetProgressCard spend={client.spendMTD} budget={client.monthlyBudget} />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#F7FAFC', marginBottom: 16 }}>Campaign Performance</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                {['Campaign', 'Objective', 'Status', 'Spend', 'CPL'].map((label) => (
                  <th
                    key={label}
                    style={{
                      textAlign: 'left',
                      padding: '0 0 12px',
                      fontSize: 11,
                      color: '#4A5568',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {client.campaigns.map((campaign) => {
                const tone = campaignTone(campaign.status)

                return (
                  <tr key={campaign.id} style={{ borderBottom: '1px solid #1A1A1A' }}>
                    <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#F7FAFC', fontWeight: 600 }}>{campaign.name}</td>
                    <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#A0AEC0' }}>{campaign.objective}</td>
                    <td style={{ padding: '16px 12px 16px 0' }}>
                      <span className="badge" style={{ background: tone.background, color: tone.color }}>
                        {campaign.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 12px 16px 0', fontSize: 13, color: '#F7FAFC' }}>${campaign.spend.toLocaleString()}</td>
                    <td style={{ padding: '16px 0', fontSize: 13, color: '#F7FAFC' }}>${campaign.cpl}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CreativeTable creatives={client.creatives} />
    </div>
  )
}
