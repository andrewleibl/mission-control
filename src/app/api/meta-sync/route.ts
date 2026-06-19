export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { runMetaSync } from '@/lib/meta-sync'

// Manual sync, triggered by the "Sync Meta" button on the Service Delivery page.
// Shares runMetaSync() with the scheduled cron (GET /api/cron/meta-sync).
export async function POST(req: Request) {
  let preset = 'last_30d'
  try { const body = await req.json(); if (body?.preset) preset = String(body.preset) } catch { /* default */ }

  const res = await runMetaSync(preset)
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status })
  return NextResponse.json({ synced: res.synced, accounts: res.accounts, errors: res.errors, flags: res.flags })
}
