'use client'
import { useState } from 'react'
import clientsData from '@/data/clients.json'
import ClientModal from '@/components/ClientModal'

type Client = (typeof clientsData)[number]

function daysSince(dateStr: string): number {
  const last = new Date(dateStr)
  const now = new Date('2026-03-16')
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}

function HealthBadge({ health }: { health: string }) {
  if (health === 'green') return <span className="badge badge-green">● Healthy</span>
  if (health === 'yellow') return <span className="badge badge-yellow">● At Risk</span>
  return <span className="badge badge-red">● Critical</span>
}

export default function ClientsPage() {
  const [selected, setSelected] = useState<Client | null>(null)
  const clients = clientsData as Client[]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Clients CRM</h1>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
          {clients.length} active clients — click any card to expand
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {clients.map((client) => {
          const days = daysSince(client.lastContact)
          const atRisk = client.atRisk || days >= 7

          return (
            <div
              key={client.id}
              className="card"
              style={{ cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s' }}
              onClick={() => setSelected(client)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3A3A3A')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
            >
              {/* At-risk flag */}
              {atRisk && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(229,62,62,0.15)', color: '#FC8181',
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  ⚠ Needs Contact
                </div>
              )}

              {/* Notification bubble */}
              {client.openTasks > 0 && (
                <div style={{
                  position: 'absolute', top: atRisk ? 38 : 12, right: 12,
                  background: '#E53E3E', color: 'white',
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 12,
                  display: atRisk ? 'none' : 'block'
                }}>
                  {client.openTasks} tasks
                </div>
              )}

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: client.health === 'green' ? 'rgba(72,187,120,0.1)' :
                    client.health === 'yellow' ? 'rgba(236,201,75,0.1)' : 'rgba(229,62,62,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: '#F7FAFC', fontFamily: 'monospace'
                }}>
                  {client.avatar}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#F7FAFC', marginBottom: 2 }}>
                    {client.name}
                  </div>
                  <div style={{ fontSize: 13, color: '#718096', marginBottom: 8 }}>{client.company}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <HealthBadge health={client.health} />
                    <span className="badge" style={{ background: '#1A1A1A', color: '#718096' }}>
                      {client.service}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #1A1A1A'
              }}>
                <div>
                  <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Collected</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#48BB78' }}>
                    ${client.totalCollected.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Remaining</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: client.remaining > 0 ? '#ECC94B' : '#4A5568' }}>
                    ${client.remaining.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Last Contact</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: days >= 7 ? '#FC8181' : '#A0AEC0' }}>
                    {days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days}d ago`}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <ClientModal client={selected as Client} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
