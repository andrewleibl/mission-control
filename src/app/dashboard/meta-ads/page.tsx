'use client'

import { useEffect, useState } from 'react'
import ClientCard from '@/components/ClientCard'
import type { MetaAdsOverview } from '@/data/metaAds'

type MetaCampaignsResponse = {
  clients: MetaAdsOverview[]
  updatedAt: string
}

export default function MetaAdsDashboardPage() {
  const [clients, setClients] = useState<MetaAdsOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadClients() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/meta/campaigns')
        if (!response.ok) throw new Error('Failed to load Meta Ads campaigns.')
        const data = (await response.json()) as MetaCampaignsResponse
        if (active) setClients(data.clients)
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load Meta Ads campaigns.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadClients()

    return () => {
      active = false
    }
  }, [])

  const totalSpend = clients.reduce((sum, client) => sum + client.spendMTD, 0)
  const totalRevenue = clients.reduce((sum, client) => sum + client.revenueMTD, 0)
  const avgRoas = clients.length ? clients.reduce((sum, client) => sum + client.roas, 0) / clients.length : 0

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#F7FAFC' }}>Meta Ads Dashboard</h1>
          <p style={{ fontSize: 14, color: '#718096', marginTop: 8, marginBottom: 0 }}>
            Client overview for paid social performance across active Meta accounts.
          </p>
        </div>
        <div className="card" style={{ minWidth: 280, padding: '16px 18px', background: 'linear-gradient(180deg, #161616, #0E0E0E)' }}>
          <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Portfolio MTD</div>
          <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#E53E3E' }}>${totalSpend.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#718096' }}>Spend</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F7FAFC' }}>${totalRevenue.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#718096' }}>Revenue</div>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F7FAFC' }}>{avgRoas.toFixed(2)}x</div>
              <div style={{ fontSize: 11, color: '#718096' }}>Avg ROAS</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#718096', fontSize: 14 }}>Loading Meta Ads clients...</div>
      ) : error ? (
        <div className="card" style={{ maxWidth: 480 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F7FAFC' }}>Unable to load Meta Ads overview</div>
          <div style={{ fontSize: 14, color: '#718096', marginTop: 8 }}>{error}</div>
        </div>
      ) : (
        <div className="meta-overview-grid">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}
