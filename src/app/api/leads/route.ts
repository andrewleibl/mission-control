export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLeads, saveLead, deleteLead } from '@/lib/lead-storage'
import { Lead } from '@/types/lead'

// GET - Fetch all leads
export async function GET() {
  try {
    const leads = await getLeads()
    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST - Create or update a lead
export async function POST(request: NextRequest) {
  try {
    const lead: Lead = await request.json()
    await saveLead(lead)
    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (error) {
    console.error('Failed to save lead:', error)
    return NextResponse.json(
      { error: 'Failed to save lead' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID required' },
        { status: 400 }
      )
    }
    await deleteLead(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
