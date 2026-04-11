'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type PipelineStatus = 'Hot' | 'Warm' | 'Cold'

type Lead = {
  id: string
  name: string
  phone: string
  location: string
  budget: string
  timeline: string
  status: PipelineStatus
  note: string
  owner: 'Andrew' | 'Client Team'
  budgetValue: number
}

const leadsMock: Lead[] = [
  { id: 'l1', name: 'Mike Johnson', phone: '(214) 555-0192', location: 'Grand Prairie', budget: '$3,500', budgetValue: 3500, timeline: 'This month', status: 'Hot', note: 'Ready for estimate call now.', owner: 'Andrew' },
  { id: 'l2', name: 'Sandra Ortiz', phone: '(469) 555-0144', location: 'Arlington', budget: '$2,100', budgetValue: 2100, timeline: '2-4 weeks', status: 'Warm', note: 'Needs follow-up text after payday.', owner: 'Client Team' },
  { id: 'l3', name: 'Tyler Banks', phone: '(972) 555-0122', location: 'Dallas', budget: '$1,800', budgetValue: 1800, timeline: 'Undecided', status: 'Cold', note: 'No clear timeline, archive for now.', owner: 'Client Team' },
  { id: 'l4', name: 'Ramon Lee', phone: '(214) 555-0168', location: 'Irving', budget: '$4,200', budgetValue: 4200, timeline: 'ASAP', status: 'Hot', note: 'Requested same-day callback.', owner: 'Andrew' },
  { id: 'l5', name: 'Jada Cruz', phone: '(682) 555-0148', location: 'Fort Worth', budget: '$2,900', budgetValue: 2900, timeline: 'Within 30 days', status: 'Warm', note: 'Asked for financing options.', owner: 'Andrew' },
]

const tabs: PipelineStatus[] = ['Hot', 'Warm', 'Cold']

const statusStyles: Record<PipelineStatus, { bg: string; border: string; badge: string; badgeText: string; rail: string }> = {
  Hot: { bg: '#171111', border: '#3a1c1c', badge: '#7f1d1d', badgeText: '#fecaca', rail: '#ef4444' },
  Warm: { bg: '#17140f', border: '#3a2c1b', badge: '#7c2d12', badgeText: '#fed7aa', rail: '#f59e0b' },
  Cold: { bg: '#121417', border: '#22303d', badge: '#1e293b', badgeText: '#cbd5e1', rail: '#64748b' },
}

function LeadCard({ lead }: { lead: Lead }) {
  const s = statusStyles[lead.status]

  return (
    <article
      style={{
        border: `1px solid ${s.border}`,
        background: s.bg,
        borderRadius: 12,
        padding: 12,
        borderLeft: `4px solid ${s.rail}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{lead.name}</div>
          <div style={{ marginTop: 3, fontSize: 12, color: '#cbd5e1' }}>{lead.phone} • {lead.location}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '4px 8px', background: s.badge, color: s.badgeText, border: `1px solid ${s.border}` }}>{lead.status}</span>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>{lead.budget} • {lead.timeline}</div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{lead.note}</p>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#64748b' }}>Owner: {lead.owner}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent', color: '#e2e8f0', padding: '6px 8px', fontSize: 11, fontWeight: 700 }}>Open Lead</button>
          <button style={{ borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent', color: '#94a3b8', padding: '6px 8px', fontSize: 11, fontWeight: 700 }}>Move Stage</button>
        </div>
      </div>
    </article>
  )
}

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<PipelineStatus>('Hot')
  const [query, setQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<'All' | 'Andrew' | 'Client Team'>('All')
  const [sortBy, setSortBy] = useState<'priority' | 'budget-desc' | 'budget-asc' | 'name-asc'>('priority')
  const [filtersOpen, setFiltersOpen] = useState(true)

  const counts = useMemo(() => ({
    Hot: leadsMock.filter((l) => l.status === 'Hot').length,
    Warm: leadsMock.filter((l) => l.status === 'Warm').length,
    Cold: leadsMock.filter((l) => l.status === 'Cold').length,
  }), [])

  const visibleLeads = useMemo(() => {
    const filtered = leadsMock
      .filter((l) => l.status === activeTab)
      .filter((l) => (ownerFilter === 'All' ? true : l.owner === ownerFilter))
      .filter((l) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return (
          l.name.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.note.toLowerCase().includes(q)
        )
      })

    if (sortBy === 'budget-desc') return [...filtered].sort((a, b) => b.budgetValue - a.budgetValue)
    if (sortBy === 'budget-asc') return [...filtered].sort((a, b) => a.budgetValue - b.budgetValue)
    if (sortBy === 'name-asc') return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    return filtered
  }, [activeTab, ownerFilter, query, sortBy])

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, rgba(229,62,62,0.08), transparent 35%), #0d0d0d', color: '#f7fafc' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 44px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', padding: 14, border: '1px solid #1a1a1a', borderRadius: 12, background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e53e3e', fontWeight: 700 }}>Lead Pipeline</p>
            <h1 style={{ margin: '8px 0 6px', fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Pipeline Dashboard</h1>
            <p style={{ margin: 0, color: '#718096', fontSize: 14 }}>Phase 1.4: richer mock data wiring, search/filter/sort controls.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={{ borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent', color: '#cbd5e1', padding: '8px 10px', fontSize: 12, fontWeight: 700 }}>Last updated: --:--</button>
            <button style={{ borderRadius: 8, border: '1px solid #e53e3e', background: '#e53e3e', color: '#fff', padding: '8px 10px', fontSize: 12, fontWeight: 700 }}>Refresh</button>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
          {[
            { label: 'Hot Leads', count: counts.Hot, accent: '#EF4444' },
            { label: 'Warm Leads', count: counts.Warm, accent: '#F59E0B' },
            { label: 'Cold Leads', count: counts.Cold, accent: '#64748B' },
          ].map((item) => (
            <article key={item.label} style={{ border: '1px solid #1f1f1f', background: 'linear-gradient(180deg, #141414 0%, #101010 100%)', borderRadius: 12, padding: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</div>
              <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: item.accent }}>{item.count}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>{item.count > 0 ? `${item.count} active` : 'No leads yet'}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ border: '1px solid #1f1f1f', background: 'linear-gradient(180deg, #121212 0%, #101010 100%)', borderRadius: 12, overflow: 'hidden', flex: '1 1 720px', minWidth: 0, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: 10, borderBottom: '1px solid #1f1f1f', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      border: '1px solid #2a2a2a',
                      background: activeTab === tab ? 'linear-gradient(180deg,#2f2f2f,#242424)' : 'transparent',
                      color: activeTab === tab ? '#f7fafc' : '#94a3b8',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                style={{ border: '1px solid #2a2a2a', borderRadius: 8, background: 'transparent', color: '#94a3b8', padding: '8px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {filtersOpen ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            <div style={{ padding: 16 }}>
              {visibleLeads.length === 0 ? (
                <div style={{ border: '1px dashed #2a2a2a', borderRadius: 10, padding: 24, textAlign: 'center', color: '#718096', fontSize: 14 }}>
                  No matching {activeTab.toLowerCase()} leads.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {visibleLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside style={{ display: filtersOpen ? 'flex' : 'none', flexDirection: 'column', gap: 12, flex: '1 1 280px', minWidth: 260, maxWidth: 320 }}>
            <div style={{ border: '1px solid #1f1f1f', background: 'linear-gradient(180deg, #141414 0%, #101010 100%)', borderRadius: 12, padding: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 13, letterSpacing: '0.02em' }}>Filters</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, location, phone..."
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #2a2a2a', background: '#0f0f0f', color: '#e2e8f0', padding: '8px 10px', fontSize: 12 }}
                />

                <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value as 'All' | 'Andrew' | 'Client Team')} style={{ width: '100%', borderRadius: 8, border: '1px solid #2a2a2a', background: '#0f0f0f', color: '#e2e8f0', padding: '8px 10px', fontSize: 12 }}>
                  <option value="All">Owner: All</option>
                  <option value="Andrew">Owner: Andrew</option>
                  <option value="Client Team">Owner: Client Team</option>
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'priority' | 'budget-desc' | 'budget-asc' | 'name-asc')} style={{ width: '100%', borderRadius: 8, border: '1px solid #2a2a2a', background: '#0f0f0f', color: '#e2e8f0', padding: '8px 10px', fontSize: 12 }}>
                  <option value="priority">Sort: Priority (default)</option>
                  <option value="budget-desc">Sort: Budget high → low</option>
                  <option value="budget-asc">Sort: Budget low → high</option>
                  <option value="name-asc">Sort: Name A → Z</option>
                </select>
              </div>
            </div>

            <div style={{ border: '1px solid #1f1f1f', background: 'linear-gradient(180deg, #141414 0%, #101010 100%)', borderRadius: 12, padding: 14, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 13, letterSpacing: '0.02em' }}>Checkpoint 1.7</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Visual rhythm and spacing refined</li>
                <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Cards upgraded with subtle depth and gradients</li>
                <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Header and tab hierarchy polished</li>
                <li style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>Admin + slug client route stubs created</li>
              </ul>
              <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
                <Link href="/pipeline/admin" style={{ color: '#cbd5e1', fontSize: 12, textDecoration: 'none' }}>→ Open /pipeline/admin</Link>
                <Link href="/pipeline/demo-client" style={{ color: '#cbd5e1', fontSize: 12, textDecoration: 'none' }}>→ Open /pipeline/[slug] demo</Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
