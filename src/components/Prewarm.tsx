'use client'

import { useEffect } from 'react'

// Kicks off every Supabase load in the background as soon as the app mounts.
// Results land in the cache layer (src/lib/cache.ts), so by the time the user
// navigates to a section, useEffect hits the cache instead of the network.
export default function Prewarm() {
  useEffect(() => {
    const idle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb: () => void) => (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 50)

    idle(() => {
      void import('@/lib/today-data').then(m => m.loadTasks()).catch(() => {})
      void import('@/lib/clients-data').then(m => {
        m.loadClients().catch(() => {})
        m.loadComms().catch(() => {})
        m.loadActions().catch(() => {})
      })
      void import('@/lib/finances').then(m => {
        m.loadTransactions().catch(() => {})
        m.loadRules().catch(() => {})
      })
      void import('@/lib/growth-data').then(m => m.loadGoals()).catch(() => {})
      void import('@/lib/sop-data').then(m => {
        m.loadSOPs().catch(() => {})
        m.loadRunState().catch(() => {})
      })
      void import('@/lib/retention-data').then(m => m.loadEvents()).catch(() => {})
    })
  }, [])

  return null
}
