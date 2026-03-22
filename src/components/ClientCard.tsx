'use client'

import Link from 'next/link'
import type { MetaAdsOverview } from '@/data/metaAds'

function statusTone(status: MetaAdsOverview['accountStatus']) {
  if (status === 'Scaling') return { color: '#48BB78', background: 'rgba(72,187,120,0.12)' }
  if (status === 'Stable') return { color: '#ECC94B', background: 'rgba(236,201,75,0.12)' }
  return { color: '#FC8181', background: 'rgba(229,62,62,0.14)' }
}

export default function ClientCard({ client }: { client: MetaAdsOverview }) {
  const tone = statusTone(client.accountStatus)

  return (
    <Link
      href={`/dashboard/meta-ads/${client.id}`}
      className="card"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>{client.name}</div>
          <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>{client.brand}</div>
        </div>
        <div
          className="badge"
          style={{ background: tone.background, color: tone.color, alignSelf: 'flex-start' }}
        >
          {client.accountStatus}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Spend MTD
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#F7FAFC', marginTop: 6 }}>
            ${client.spendMTD.toLocaleString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Leads
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#E53E3E', marginTop: 6 }}>
            {client.leads}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
            ${client.leads > 0 ? (client.spendMTD / client.leads).toFixed(2) : '0.00'} CPL
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 16, borderTop: '1px solid #1A1A1A' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Budget
          </div>
          <div style={{ fontSize: 11, color: '#718096' }}>
            ${client.spendMTD.toLocaleString()} / ${client.monthlyBudget.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            background: '#1A1A1A',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min((client.spendMTD / client.monthlyBudget) * 100, 100)}%`,
              height: '100%',
              background: client.spendMTD / client.monthlyBudget > 0.85 ? '#E53E3E' : client.spendMTD / client.monthlyBudget > 0.5 ? '#ECC94B' : '#48BB78',
              borderRadius: 4,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: '#718096', marginTop: 6, textAlign: 'right' }}>
          {((client.spendMTD / client.monthlyBudget) * 100).toFixed(0)}% spent
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#A0AEC0' }}>
        Objective: <span style={{ color: '#F7FAFC' }}>{client.primaryObjective}</span>
      </div>
    </Link>
  )
}
