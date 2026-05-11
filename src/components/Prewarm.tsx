'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const ROUTES = ['/today', '/clients', '/client-retention', '/finances', '/growth', '/sops']

// Kicks off every Supabase load AND prefetches every route's JS bundle as
// soon as the app mounts. Data lands in src/lib/cache.ts; route chunks land
// in Next.js's prefetch cache. Result: navigation is near-instant.
export default function Prewarm() {
  const router = useRouter()

  useEffect(() => {
    const idle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb: () => void) => (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(cb)
        : (cb: () => void) => setTimeout(cb, 50)

    idle(() => {
      // 1. Prefetch every route's bundle so tap → instant navigation.
      for (const r of ROUTES) router.prefetch(r)

      // 2. Prefetch every dataset so pages render with cached data.
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
  }, [router])

  return null
}
