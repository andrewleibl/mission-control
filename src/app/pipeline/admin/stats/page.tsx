'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StatsData = {
  overall: {
    totalLeads: number
    hotLeads: number
    warmLeads: number
    coldLeads: number
    archivedLeads: number
    conversionRate: number
    avgScore: number
    recentLeads: number
  }
  bySource: Record<string, number>
  byClient: Array<{
    clientId: string
    clientName: string
    subdomain: string
    total: number
    hot: number
    warm: number
    cold: number
    avgScore: number
  }>
  clients: number
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Failed to load statistics')
      }
    } catch (err) {
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f7fafc', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ color: '#64748b' }}>Loading statistics...</div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f7fafc', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ color: '#ef4444' }}>{error || 'Failed to load'}</div>
        </div>
      </div>
    )
  }

  const { overall, byClient } = stats

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#f7fafc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '20px 16px 100px' }}>
        <style>{`
          @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .stats-client-table { font-size: 12px !important; }
          }
        `}</style>
        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Link 
                  href="/pipeline/admin"
                  style={{ color: '#e53e3e', textDecoration: 'none', fontSize: 14 }}
                >
                  ← Back to Client Management
                </Link>
              </div>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e53e3e', fontWeight: 700 }}>Analytics</p>
              <h1 style={{ margin: '8px 0 6px', fontSize: 30, lineHeight: 1.1, background: 'linear-gradient(135deg, #F7FAFC 0%, #E53E3E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Statistics Dashboard</h1>
              <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>Pipeline performance metrics and client analytics.</p>
            </div>
            <button 
              onClick={fetchStats}
              style={{ 
                borderRadius: 8, 
                border: '1px solid #2a2a2a', 
                background: '#1a1a1a', 
                color: '#e2e8f0', 
                padding: '10px 16px', 
                fontSize: 13, 
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        {/* Overall Stats Cards */}
        <section className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard 
            label="Total Leads" 
            value={overall.totalLeads} 
            color="#e2e8f0"
            icon="📊"
          />
          <StatCard 
            label="Hot Leads" 
            value={overall.hotLeads} 
            color="#ef4444"
            icon="🔥"
          />
          <StatCard 
            label="Warm Leads" 
            value={overall.warmLeads} 
            color="#f59e0b"
            icon="⚡"
          />
          <StatCard 
            label="Cold Leads" 
            value={overall.coldLeads} 
            color="#60a5fa"
            icon="❄️"
          />
          <StatCard 
            label="Conversion Rate" 
            value={`${overall.conversionRate}%`} 
            color="#22c55e"
            icon="📈"
          />
          <StatCard 
            label="Avg Score" 
            value={overall.avgScore} 
            color="#a855f7"
            icon="⭐"
          />
        </section>

        {/* Recent Activity Banner */}
        <section style={{ 
          border: '1px solid #22c55e30', 
          borderRadius: 12, 
          background: 'linear-gradient(135deg, #14532d10, #0a0a0a)',
          padding: 16,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ fontSize: 24 }}>📬</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
              {overall.recentLeads} new leads in the last 7 days
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Keep nurturing your pipeline
            </div>
          </div>
        </section>

        {/* Client Breakdown */}
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, color: '#F7FAFC' }}>Client Performance</h2>
          
          {byClient.length === 0 ? (
            <div style={{ 
              border: '1px dashed #2a2a2a', 
              borderRadius: 12, 
              padding: 40, 
              textAlign: 'center', 
              color: '#64748b' 
            }}>
              No clients with leads yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {byClient.map((client) => (
                <div 
                  key={client.clientId}
                  style={{ 
                    border: '1px solid #1f1f1f', 
                    borderRadius: 12, 
                    background: '#101010',
                    padding: 20,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 16, color: '#F7FAFC' }}>{client.clientName}</h3>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{client.subdomain}.straightpointmarketing.com</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#F7FAFC' }}>{client.total}</div>
                      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Total<br/>Leads</div>
                    </div>
                  </div>

                  {/* Lead Distribution Bar */}
                  {client.total > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ 
                        display: 'flex', 
                        height: 8, 
                        borderRadius: 4, 
                        overflow: 'hidden',
                        background: '#1f1f1f'
                      }}>
                        {client.hot > 0 && (
                          <div style={{ 
                            width: `${(client.hot / client.total) * 100}%`, 
                            background: '#ef4444' 
                          }} />
                        )}
                        {client.warm > 0 && (
                          <div style={{ 
                            width: `${(client.warm / client.total) * 100}%`, 
                            background: '#f59e0b' 
                          }} />
                        )}
                        {client.cold > 0 && (
                          <div style={{ 
                            width: `${(client.cold / client.total) * 100}%`, 
                            background: '#60a5fa' 
                          }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{client.hot} Hot</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{client.warm} Warm</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }} />
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{client.cold} Cold</span>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 13, color: '#a855f7' }}>
                      Avg Score: {client.avgScore}/10
                    </div>
                  </div>

                  {/* View Pipeline Link */}
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1f1f1f' }}>
                    <Link
                      href={`/pipeline?viewAs=${client.subdomain}`}
                      style={{
                        color: '#e53e3e',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      View Pipeline →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div style={{ 
      border: `1px solid ${color}30`, 
      borderRadius: 12, 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      padding: 16,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>{label}</div>
    </div>
  )
}
