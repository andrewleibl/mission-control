'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const CLIENTS: Record<string, { name: string; color: string }> = {
  ricardo: { name: 'Ricardo Madera', color: '#E53E3E' },
  test: { name: 'Test Client', color: '#3B82F6' },
  admin: { name: 'Admin Dashboard', color: '#10B981' },
}

type User = {
  userId: string
  email: string
  role: 'admin' | 'client'
  clientId?: string
  subdomain?: string
}

type ViewAsClient = {
  id: string
  name: string
  subdomain: string
}

export default function ClientHeader({ viewAsClient }: { viewAsClient?: ViewAsClient | null }) {
  const [subdomain, setSubdomain] = useState<string | null>(null)
  const [clientInfo, setClientInfo] = useState<{ name: string; color: string } | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Extract subdomain from hostname
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    
    if (parts.length > 2 || (parts.length === 2 && parts[1].includes('localhost'))) {
      const sub = parts[0]
      setSubdomain(sub)
      setClientInfo(CLIENTS[sub] || { name: sub, color: '#E53E3E' })
    }

    // Fetch current user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.role) {
          setUser(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Determine if this is admin viewing a client portal via viewAs
  const isAdminView = viewAsClient !== null && viewAsClient !== undefined && user?.role === 'admin'

  // Use viewAs client info if in admin view mode
  const displayClient = isAdminView && viewAsClient
    ? { name: viewAsClient.name, color: '#E53E3E' }
    : clientInfo

  if (!subdomain && !viewAsClient) {
    return null
  }

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-badge { position: relative !important; top: 0 !important; margin-bottom: 12px !important; }
          .client-header-card { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>
      {/* Admin View Badge - Removed, moved into header card */}

      {/* Client Header Card */}
      {displayClient && (
        <div
          className="client-header-card"
          style={{
            background: `linear-gradient(135deg, ${displayClient.color}20, ${displayClient.color}08)`,
            border: `1px solid ${displayClient.color}30`,
            borderRadius: 8,
            padding: '12px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: displayClient.color,
                boxShadow: `0 0 10px ${displayClient.color}`,
              }}
            />
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {isAdminView ? 'Viewing as Admin' : 'Client Portal'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>
                {displayClient.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {viewAsClient?.subdomain || subdomain}.straightpointmarketing.com
              </div>
            </div>
          </div>
          
          {/* Admin Portal Button - Green */}
          {isAdminView && (
            <Link
              href="/pipeline/admin"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.5)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              Admin Portal →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
