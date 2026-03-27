'use client'
import React, { useState, useEffect } from 'react'

// Andrew's #1 bottleneck: Getting 3-5 sales calls daily
// This tracks lead flow, conversion, and calendar fill rate

type Lead = {
  id: string
  name: string
  source: 'cold_call' | 'meta_ads' | 'referral' | 'website' | 'linkedin'
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'closed_won' | 'closed_lost'
  value: number
  date: string
  notes: string
}

const SOURCES = [
  { key: 'cold_call', label: 'Cold Call', color: '#9F7AEA' },
  { key: 'meta_ads', label: 'Meta Ads', color: '#3B82F6' },
  { key: 'referral', label: 'Referral', color: '#48BB78' },
  { key: 'website', label: 'Website', color: '#F6AD55' },
  { key: 'linkedin', label: 'LinkedIn', color: '#63B3ED' },
]

const STATUS_COLORS: Record<string, string> = {
  new: '#718096',
  contacted: '#ECC94B',
  qualified: '#F6AD55',
  proposal_sent: '#9F7AEA',
  closed_won: '#48BB78',
  closed_lost: '#E53E3E',
}

const seedLeads: Lead[] = [
  { id: '1', name: "Mike's Landscaping", source: 'cold_call', status: 'proposal_sent', value: 2850, date: '2026-03-25', notes: 'Wants to start next month, waiting on approval' },
  { id: '2', name: 'Elite Outdoor Services', source: 'meta_ads', status: 'qualified', value: 3400, date: '2026-03-24', notes: 'Budget confirmed, ready to move forward' },
  { id: '3', name: 'Premier Grounds', source: 'referral', status: 'new', value: 2100, date: '2026-03-26', notes: 'Referred by Hector' },
  { id: '4', name: 'GreenScape Pro', source: 'cold_call', status: 'contacted', value: 1900, date: '2026-03-23', notes: 'Left voicemail, follow up tomorrow' },
  { id: '5', name: 'Valley View Landscape', source: 'website', status: 'closed_won', value: 4200, date: '2026-03-20', notes: 'Signed yesterday, onboarding scheduled' },
  { id: '6', name: 'Summit Outdoor', source: 'linkedin', status: 'qualified', value: 2800, date: '2026-03-25', notes: 'Decision maker identified, proposal ready' },
]

export default function SalesDashboard() {
  const [leads, setLeads] = useState<Lead[]>(seedLeads)
  const [weekTarget] = useState(20) // 4 calls/day × 5 days
  const [weekActual, setWeekActual] = useState(0)
  const [pipelineValue, setPipelineValue] = useState(0)
 
  useEffect(() => {
    // Calculate this week's booked calls
    const weekStart = new Date('2026-03-23')
    const weekEnd = new Date('2026-03-29')
    const thisWeekLeads = leads.filter(l => {
      const d = new Date(l.date)
      return d >= weekStart && d <= weekEnd
    })
    setWeekActual(thisWeekLeads.filter(l => ['qualified', 'proposal_sent', 'closed_won'].includes(l.status)).length)
    
    // Calculate pipeline value
    const pipeline = leads
      .filter(l => ['qualified', 'proposal_sent'].includes(l.status))
      .reduce((sum, l) => sum + l.value, 0)
    setPipelineValue(pipeline)
  }, [leads])

  const bySource = SOURCES.map(s => ({
    ...s,
    count: leads.filter(l => l.source === s.key).length,
    value: leads.filter(l => l.source === s.key).reduce((sum, l) => sum + l.value, 0),
  }))

  const byStatus = Object.entries(STATUS_COLORS).map(([status, color]) => ({
    status,
    color,
    count: leads.filter(l => l.status === status).length,
    label: status.replace(/_/g, ' ').toUpperCase(),
  }))

  const closedWon = leads.filter(l => l.status === 'closed_won')
  const closedLost = leads.filter(l => l.status === 'closed_lost')
  const winRate = closedWon.length + closedLost.length > 0 
    ? Math.round((closedWon.length / (closedWon.length + closedLost.length)) * 100) 
    : 0

  const fillRate = Math.min(100, Math.round((weekActual / weekTarget) * 100))

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Sales Pipeline</h1>
        <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>
          Target: 4 qualified calls/day · Week Goal: {weekTarget} · Current: {weekActual}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={statsGridStyle}>
        {/* Calendar Fill Rate - THE KEY METRIC */}
        <div style={{ ...statCardStyle, borderLeft: '3px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: fillRate >= 80 ? '#48BB78' : fillRate >= 50 ? '#ECC94B' : '#E53E3E' }}>
                {weekActual}/{weekTarget}
              </div>
              <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Sales Calls This Week</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#F7FAFC' }}>{fillRate}%</div>
              <div style={{ fontSize: 10, color: '#718096' }}>Fill Rate</div>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 6, background: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${fillRate}%`,
              height: '100%',
              background: fillRate >= 80 ? '#48BB78' : fillRate >= 50 ? '#ECC94B' : '#E53E3E',
              borderRadius: 3,
              transition: 'width 0.3s ease'
            }} />
          </div>
          {fillRate < 100 && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#718096' }}>
              Need {weekTarget - weekActual} more calls to hit target
            </div>
          )}
        </div>

        {/* Pipeline Value */}
        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F6AD55' }}>
            ${pipelineValue.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Active Pipeline</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            {leads.filter(l => ['qualified', 'proposal_sent'].includes(l.status)).length} deals in flight
          </div>
        </div>

        {/* Win Rate */}
        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#48BB78' }}>
            {winRate}%
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Close Rate</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            {closedWon.length} won · {closedLost.length} lost
          </div>
        </div>

        {/* Revenue MTD */}
        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#48BB78' }}>
            ${closedWon.reduce((sum, l) => sum + l.value, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Revenue Closed</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            March 2026
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: Lead List */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Active Leads</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leads
              .filter(l => l.status !== 'closed_lost')
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(lead => (
              <div key={lead.id} style={leadCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#F7FAFC' }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
                      {SOURCES.find(s => s.key === lead.source)?.label} · ${lead.value.toLocaleString()}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#0D0D0D',
                    background: STATUS_COLORS[lead.status],
                    padding: '3px 8px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}>
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#4A5568', lineHeight: 1.4 }}>{lead.notes}</div>
                <div style={{ marginTop: 8, fontSize: 10, color: '#2A2A2A' }}>
                  {new Date(lead.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Source Breakdown */}
        <div style={{ width: 320 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Lead Sources</h2>
          </div>
          
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            {bySource.map(source => (
              <div key={source.key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#CBD5E0' }}>{source.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#F7FAFC' }}>{source.count}</span>
                </div>
                <div style={{ height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${leads.length > 0 ? (source.count / leads.length) * 100 : 0}%`,
                    background: source.color,
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: '#4A5568', marginTop: 2 }}>
                  ${source.value.toLocaleString()} pipeline
                </div>
              </div>
            ))}
          </div>

          {/* Status Breakdown */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>Pipeline Status</h3>
            {byStatus.filter(s => s.count > 0).map(s => (
              <div key={s.status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: '#CBD5E0' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F7FAFC' }}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>Quick Actions</h3>
            <button style={actionButtonStyle}>+ Add New Lead</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>📅 View Calendar</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>📞 Call Log</button>
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

const leadCardStyle: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  padding: '14px 16px',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
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