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
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid #1A1A1A',
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ROAS
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC', marginTop: 4 }}>{client.roas.toFixed(2)}x</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            CPA
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC', marginTop: 4 }}>${client.cpa}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Leads
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC', marginTop: 4 }}>{client.leads}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#A0AEC0' }}>
        Objective: <span style={{ color: '#F7FAFC' }}>{client.primaryObjective}</span>
      </div>
    </Link>
  )
}
