export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { fetchGHLContacts, transformGHLContactToLead } from '@/lib/ghl-api'
import { fetchGHLContact } from '@/lib/ghl-api'
import { getClientByCampaignId } from '@/lib/campaign-mapping'
import { saveLead, getLeads } from '@/lib/lead-storage'
import { scoreAnswers, normalizeScore, determineStatus } from '@/lib/scoring'
import { generateId } from '@/lib/webhook-validator'

const GHL_ACCESS_TOKEN = process.env.GHL_ACCESS_TOKEN
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'QtJpxG67NrcESxHlz2hY'

/**
 * Poll GHL API for new contacts
 * This can be triggered by:
 * 1. Cron job (every few minutes)
 * 2. Manual trigger from admin panel
 * 3. Real-time polling on page load
 */
export async function POST(request: NextRequest) {
  try {
    if (!GHL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'GHL_ACCESS_TOKEN not configured' },
        { status: 500 }
      )
    }

    // Get last sync time (could store in DB, for now use query param)
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    console.log('Polling GHL for contacts since:', since)

    // Fetch contacts from GHL
    const response = await fetchGHLContacts(GHL_ACCESS_TOKEN, GHL_LOCATION_ID, {
      startAfter: since,
      limit: 100,
    })

    const contacts = response.contacts || []
    console.log(`Fetched ${contacts.length} contacts from GHL`)

    // Get existing leads to avoid duplicates
    const existingLeads = await getLeads()
    const existingIds = new Set(existingLeads.map(l => l.id))

    // Transform and save new leads
    const newLeads = []
    const errors = []

    for (const contact of contacts) {
      // Skip if already exists
      if (existingIds.has(contact.id)) {
        continue
      }

      try {
        // Get campaign mapping
        const campaignId = contact.campaign?.id
        const campaignMapping = getClientByCampaignId(campaignId)

        // Transform to lead format
        const leadData = transformGHLContactToLead(contact, campaignMapping)

        // Calculate score
        const rawScore = scoreAnswers(leadData.answers)
        const normalizedScore = normalizeScore(rawScore)
        const status = determineStatus(rawScore, leadData.answers)

        // Create full lead object
        const lead = {
          ...leadData,
          score: normalizedScore,
          status,
          nextAction: status === 'Hot' ? 'Call immediately and book estimate' :
                      status === 'Warm' ? 'Send follow-up and nurture' :
                      'Archive and check back in 30 days',
          contactPoints: [],
          source: 'ghl' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Save lead
        await saveLead(lead)
        newLeads.push(lead)

        console.log(`Saved new lead: ${lead.name} (Campaign: ${campaignId || 'none'}, Client: ${campaignMapping?.clientName || 'unassigned'})`)
      } catch (error) {
        console.error(`Failed to process contact ${contact.id}:`, error)
        errors.push({ contactId: contact.id, error: String(error) })
      }
    }

    // Broadcast update if new leads were added
    if (newLeads.length > 0) {
      const { broadcastLeadsUpdate } = await import('@/app/api/leads/stream/route')
      const allLeads = await getLeads()
      broadcastLeadsUpdate(allLeads)
    }

    return NextResponse.json({
      success: true,
      polled: contacts.length,
      new: newLeads.length,
      errors: errors.length,
      lastSync: new Date().toISOString(),
      leads: newLeads.map(l => ({ id: l.id, name: l.name, status: l.status, clientId: l.clientId })),
    })

  } catch (error) {
    console.error('GHL polling error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request)
}
