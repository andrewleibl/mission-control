export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getWebhookLogs, clearWebhookLogs } from '@/lib/lead-storage'

// GET - Fetch all webhook logs
export async function GET() {
  try {
    const logs = await getWebhookLogs()
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

// DELETE - Clear all webhook logs
export async function DELETE() {
  try {
    await clearWebhookLogs()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to clear logs:', error)
    return NextResponse.json(
      { error: 'Failed to clear logs' },
      { status: 500 }
    )
  }
}
