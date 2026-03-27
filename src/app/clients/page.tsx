'use client'
import React, { useState } from 'react'

// Client Command Center - Track all active accounts
// Hector, PJ Sparks, Ricardo, Vicelia + pipeline

type Client = {
  id: string
  name: string
  business: string
  status: 'active' | 'at_risk' | 'churned' | 'prospect'
  monthlySpend: number
  leadsMTD: number
  cpl: number
  renewalDate: string
  daysUntilRenewal: number
  lastContact: string
  notes: string
  healthScore: number // 0-100
}

const seedClients: Client[] = [
  {
    id: '1',
    name: 'Hector Huizar',
    business: 'Valley of the Sun Landscape',
    status: 'active',
    monthlySpend: 785,
    leadsMTD: 12,
    cpl: 65,
    renewalDate: '2026-04-10',
    daysUntilRenewal: 15,
    lastContact: '2026-03-24',
    notes: 'Under-pacing by 32%. Considering budget increase.',
    healthScore: 75,
  },
  {
    id: '2',
    name: 'PJ Sparks',
    business: 'We Do Hardscape',
    status: 'at_risk',
    monthlySpend: 285,
    leadsMTD: 4,
    cpl: 71,
    renewalDate: '2026-04-09',
    daysUntilRenewal: 14,
    lastContact: '2026-03-23',
    notes: 'CTR dropped 0.91%. Needs creative refresh.',
    healthScore: 45,
  },
  {
    id: '3',
    name: 'Ricardo Madera',
    business: 'Madera Landscape',
    status: 'active',
    monthlySpend: 285,
    leadsMTD: 8,
    cpl: 36,
    renewalDate: '2026-04-09',
    daysUntilRenewal: 14,
    lastContact: '2026-03-25',
    notes: 'Wants to compare $500 vs last month spend.',
    healthScore: 85,
  },
  {
    id: '4',
    name: 'Vicelia Tinde',
    business: 'Clutch Barber Supply',
    status: 'active',
    monthlySpend: 0, // Web design client, not ads
    leadsMTD: 0,
    cpl: 0,
    renewalDate: 'N/A',
    daysUntilRenewal: 999,
    lastContact: '2026-03-25',
    notes: 'Shopify redesign HIGH PRIORITY. $900 outstanding.',
    healthScore: 90,
  },
]

const pipelineClients: Partial<Client>[] = [
  { name: "Mike's Landscaping", business: "Mike's Landscaping", status: 'prospect', monthlySpend: 2850 },
  { name: 'Elite Outdoor', business: 'Elite Outdoor Services', status: 'prospect', monthlySpend: 3400 },
  { name: 'Summit Outdoor', business: 'Summit Outdoor', status: 'prospect', monthlySpend: 2800 },
]

export default function ClientCommandCenter() {
  const [clients, setClients] = useState<Client[]>(seedClients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const totalMRR = clients.filter(c => c.status === 'active').reduce((sum, c) => sum + c.monthlySpend, 0)
  const totalLeads = clients.reduce((sum, c) => sum + c.leadsMTD, 0)
  const avgCPL = clients.filter(c => c.cpl > 0).length > 0
    ? Math.round(clients.filter(c => c.cpl > 0).reduce((sum, c) => sum + c.cpl, 0) / clients.filter(c => c.cpl > 0).length)
    : 0
  
  const renewalsThisMonth = clients.filter(c => c.daysUntilRenewal <= 30 && c.daysUntilRenewal > 0)
  const atRiskCount = clients.filter(c => c.status === 'at_risk').length

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Client Command Center</h1>
        <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>
          Active Accounts: {clients.filter(c => c.status === 'active').length} · 
          MRR: ${totalMRR.toLocaleString()} · 
          Renewals Due: {renewalsThisMonth.length}
        </p>
      </div>

      {/* Alert Banner for At-Risk */}
      {atRiskCount > 0 && (
        <div style={alertBannerStyle}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <span style={{ fontSize: 13 }}>
            <strong>{atRiskCount} client{atRiskCount > 1 ? 's' : ''} at risk</strong> — 
            {clients.filter(c => c.status === 'at_risk').map(c => c.business).join(', ')} need attention
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        <div style={{ ...statCardStyle, borderLeft: '3px solid #48BB78' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#48BB78' }}>
            ${totalMRR.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Monthly Recurring</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            Goal: $10,000 by May
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3B82F6' }}>
            {totalLeads}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Leads This Month</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            Across {clients.filter(c => c.leadsMTD > 0).length} active campaigns
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: avgCPL < 60 ? '#48BB78' : avgCPL < 80 ? '#ECC94B' : '#E53E3E' }}>
            ${avgCPL}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Avg Cost Per Lead</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            Target: Under $60
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: renewalsThisMonth.length > 0 ? '#ECC94B' : '#48BB78' }}>
            {renewalsThisMonth.length}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Renewals Due</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            Next 30 days
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: Client List */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Active Clients</h2>
            <button style={addButtonStyle}>+ Add Client</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clients
              .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal)
              .map(client => (
              <div 
                key={client.id} 
                style={{
                  ...clientCardStyle,
                  borderLeft: `3px solid ${client.status === 'at_risk' ? '#E53E3E' : client.daysUntilRenewal <= 14 ? '#ECC94B' : '#48BB78'}`,
                  opacity: client.status === 'churned' ? 0.5 : 1,
                }}
                onClick={() => setSelectedClient(client)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: client.healthScore >= 80 ? '#48BB78' : client.healthScore >= 60 ? '#ECC94B' : '#E53E3E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0D0D0D',
                    }}>
                      {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#F7FAFC' }}>{client.business}</div>
                      <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: '#4A5568', marginTop: 4 }}>
                        {client.status === 'at_risk' && <span style={{ color: '#E53E3E' }}>⚠️ At Risk · </span>}
                        {client.daysUntilRenewal <= 30 && client.daysUntilRenewal > 0 && (
                          <span style={{ color: '#ECC94B' }}>⏰ Renews in {client.daysUntilRenewal} days · </span>
                        )}
                        Last contact: {new Date(client.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#F7FAFC' }}>
                      ${client.monthlySpend > 0 ? client.monthlySpend.toLocaleString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
                      {client.leadsMTD > 0 && `${client.leadsMTD} leads · $${client.cpl} CPL`}
                    </div>
                  </div>
                </div>
                
                {client.notes && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #2A2A2A' }}>
                    <div style={{ fontSize: 11, color: '#4A5568' }}>{client.notes}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Pipeline & Actions */}
        <div style={{ width: 320 }}>
          {/* Pipeline Section */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>Pipeline</h3>
            {pipelineClients.map((client, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < pipelineClients.length - 1 ? '1px solid #2A2A2A' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#F7FAFC' }}>{client.business}</div>
                  <div style={{ fontSize: 10, color: '#718096' }}>Prospect · ${(client.monthlySpend || 0).toLocaleString()}</div>
                </div>
                <span style={{
                  fontSize: 10,
                  color: '#0D0D0D',
                  background: '#3B82F6',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}>
                  {client.status}
                </span>
              </div>
            ))}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #2A2A2A' }}>
              <div style={{ fontSize: 12, color: '#CBD5E0' }}>
                Pipeline Value: <strong style={{ color: '#F7FAFC' }}>${pipelineClients.reduce((sum, c) => sum + (c.monthlySpend || 0), 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>Actions</h3>
            <button style={actionButtonStyle}>📧 Send Renewal Reminder</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>📊 Download Client Report</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>🎨 Request Creative Refresh</button>
          </div>

          {/* Renewal Calendar */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>Upcoming Renewals</h3>
            {renewalsThisMonth.length > 0 ? (
              renewalsThisMonth.sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal).map(client => (
                <div key={client.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#F7FAFC' }}>{client.business}</span>
                    <span style={{ color: client.daysUntilRenewal <= 7 ? '#E53E3E' : '#ECC94B' }}>
                      {client.daysUntilRenewal}d
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#4A5568' }}>${client.monthlySpend}/month</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: 12, color: '#4A5568' }}>No renewals due this month</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0D0D0D',
  color: '#F7FAFC',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '24px 32px',
  boxSizing: 'border-box',
}

const alertBannerStyle: React.CSSProperties = {
  background: 'rgba(229, 62, 62, 0.1)',
  border: '1px solid rgba(229, 62, 62, 0.3)',
  borderRadius: 8,
  padding: '12px 16px',
  marginBottom: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#FC8181',
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 32,
}

const statCardStyle: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  padding: '16px 20px',
}

const clientCardStyle: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  padding: '16px',
  cursor: 'pointer',
  transition: 'border-color 0.2s, transform 0.1s',
}

const addButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#3B82F6',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const actionButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#1A1A1A',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#F7FAFC',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
}