'use client'
import { useState } from 'react'

type Task = { id: string; text: string; done: boolean; due: string }
type LogEntry = { date: string; note: string; type?: string }
type PerformanceData = {
  spend: number; leads: number; appointments: number;
  cpl: number; cpa: number; roas: number;
  weeklyData: { week: string; spend: number; leads: number; appointments: number }[]
} | null

type Client = {
  id: string; name: string; company: string; niche: string; status: string;
  health: string; avatar: string; service: string; signed: string;
  adsLive: string | null; renewal: string | null;
  upfront: number; totalCollected: number; remaining: number;
  monthlyRate: number | null; lastContact: string;
  phone: string; email: string; location: string; notes: string;
  atRisk: boolean; openTasks: number;
  adPerformance: PerformanceData;
  adjustmentLog: LogEntry[];
  contactLog: LogEntry[];
  tasks: Task[];
  mondayScript: string;
}

const TABS = ['Overview', 'Ad Performance', 'Adjustment Log', 'Contact Log', 'Tasks', 'Monday Script']

export default function ClientModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }} onClick={onClose}>
      <div style={{
        background: '#111111', border: '1px solid #2A2A2A', borderRadius: 16,
        width: '100%', maxWidth: 760, maxHeight: '85vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1A1A1A', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: '#1A1A1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#F7FAFC', fontFamily: 'monospace', flexShrink: 0
          }}>
            {client.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>{client.name}</div>
            <div style={{ fontSize: 13, color: '#718096' }}>{client.company} · {client.location}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#718096', fontSize: 20, padding: 4 }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #1A1A1A', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {TABS.map((tab) => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {activeTab === 'Overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Service', value: client.service },
                  { label: 'Signed', value: client.signed },
                  { label: 'Ads Live', value: client.adsLive || 'N/A' },
                  { label: 'Renewal', value: client.renewal || 'N/A' },
                  { label: 'Total Collected', value: `$${client.totalCollected.toLocaleString()}`, highlight: 'green' },
                  { label: 'Remaining', value: `$${client.remaining.toLocaleString()}`, highlight: client.remaining > 0 ? 'yellow' : 'none' },
                ].map((item) => (
                  <div key={item.label} style={{ background: '#1A1A1A', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: item.highlight === 'green' ? '#48BB78' : item.highlight === 'yellow' ? '#ECC94B' : '#F7FAFC'
                    }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.6, background: '#1A1A1A', padding: 14, borderRadius: 8 }}>
                  {client.notes}
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 13 }}>
                <span style={{ color: '#718096' }}>📞</span>
                <span style={{ color: '#A0AEC0' }}>{client.phone}</span>
                <span style={{ color: '#718096' }}>✉</span>
                <span style={{ color: '#A0AEC0' }}>{client.email}</span>
              </div>
            </div>
          )}

          {activeTab === 'Ad Performance' && (
            <div>
              {client.adPerformance ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Spend', value: `$${client.adPerformance.spend}` },
                      { label: 'Leads', value: client.adPerformance.leads },
                      { label: 'Appointments', value: client.adPerformance.appointments },
                      { label: 'Cost Per Lead', value: `$${client.adPerformance.cpl}` },
                      { label: 'Cost Per Appt', value: `$${client.adPerformance.cpa}` },
                      { label: 'ROAS', value: `${client.adPerformance.roas}x`, highlight: 'green' },
                    ].map((m) => (
                      <div key={m.label} style={{ background: '#1A1A1A', borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: m.highlight === 'green' ? '#48BB78' : '#F7FAFC' }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', marginBottom: 10 }}>Weekly Breakdown</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {client.adPerformance.weeklyData.map((w) => (
                      <div key={w.week} style={{ flex: 1, background: '#1A1A1A', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#4A5568', marginBottom: 6 }}>{w.week}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F7FAFC' }}>${w.spend}</div>
                        <div style={{ fontSize: 11, color: '#718096' }}>{w.leads} leads</div>
                        <div style={{ fontSize: 11, color: '#48BB78' }}>{w.appointments} appts</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#4A5568', textAlign: 'center', padding: '40px 0' }}>
                  No ad performance data for this client (web project)
                </div>
              )}
            </div>
          )}

          {activeTab === 'Adjustment Log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {client.adjustmentLog.map((entry, i) => (
                <div key={i} style={{ background: '#1A1A1A', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 11, color: '#4A5568', whiteSpace: 'nowrap', paddingTop: 2 }}>{entry.date}</div>
                  <div style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.5 }}>{entry.note}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Contact Log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {client.contactLog.map((entry, i) => (
                <div key={i} style={{ background: '#1A1A1A', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 16 }}>
                  <div style={{ fontSize: 11, color: '#4A5568', whiteSpace: 'nowrap', paddingTop: 2 }}>{entry.date}</div>
                  <span className={`badge ${entry.type === 'call' ? 'badge-blue' : 'badge-green'}`} style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
                    {entry.type || 'note'}
                  </span>
                  <div style={{ fontSize: 13, color: '#A0AEC0', lineHeight: 1.5 }}>{entry.note}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {client.tasks.map((task) => (
                <div key={task.id} style={{
                  background: '#1A1A1A', borderRadius: 8, padding: '12px 14px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  opacity: task.done ? 0.5 : 1
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, border: '2px solid',
                    borderColor: task.done ? '#48BB78' : '#4A5568',
                    background: task.done ? 'rgba(72,187,120,0.2)' : 'transparent',
                    flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#48BB78'
                  }}>
                    {task.done ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#F7FAFC', textDecoration: task.done ? 'line-through' : 'none' }}>
                      {task.text}
                    </div>
                    <div style={{ fontSize: 11, color: '#4A5568', marginTop: 2 }}>Due: {task.due}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Monday Script' && (
            <div>
              <div style={{ fontSize: 11, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Monday Morning Call Script — {client.name}
              </div>
              <div style={{
                background: '#1A1A1A', borderRadius: 10, padding: 20,
                fontSize: 14, color: '#CBD5E0', lineHeight: 1.8,
                fontStyle: 'italic', whiteSpace: 'pre-wrap'
              }}>
                {client.mondayScript}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
