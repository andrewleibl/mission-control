export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { loadTasks } from '@/lib/today-data'
import { loadClients } from '@/lib/clients-data'
import { loadEvents } from '@/lib/retention-data'
import { loadTransactions } from '@/lib/finances'
import { invalidate } from '@/lib/cache'

// Batches the dashboard's heavy Supabase reads into ONE server-side round-trip.
// Previously the client fired these queries separately from the browser —
// brutal on mobile networks. Now the server (co-located with Supabase) does
// them in parallel and returns a single payload.
// SMS (newer tables, RLS-sensitive) and Sales (localStorage) stay client-side.
export async function GET() {
  try {
    // Force fresh reads — the in-memory cache persists on warm serverless
    // instances and isn't invalidated by client-side writes.
    ;['tasks', 'clients', 'retention', 'transactions'].forEach(invalidate)
    const [tasks, clients, events, txs] = await Promise.all([
      loadTasks(),
      loadClients(),
      loadEvents(),
      loadTransactions(),
    ])
    return NextResponse.json(
      { tasks, clients, events, txs },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('dashboard batch route failed:', e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
