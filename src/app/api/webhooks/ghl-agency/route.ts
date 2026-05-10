export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { GHLLeadPayload, Lead, WebhookLog } from '@/types/lead'
import { saveLead, addWebhookLog } from '@/lib/lead-storage'
import { getClientBySubdomain } from '@/lib/user-storage'
import { validateGHLWebhook, generateId, extractLocation } from '@/lib/webhook-validator'
import { scoreAnswers, normalizeScore, determineStatus } from '@/lib/scoring'
import { extractCampaignId, getClientByCampaignId } from '@/lib/campaign-mapping'

// GHL Agency Webhook Handler - Routes leads by campaign ID
// All Facebook leads flow through agency GHL account
export async function POST(request: NextRequest) {
  const logId = generateId()
  const timestamp = new Date().toISOString()
  
  try {
    // Get raw body for signature validation
    const rawBody = await request.text()
    const signature = request.headers.get('x-webhook-signature') || ''
    
    // Validate webhook signature (dev mode allows all)
    if (!validateGHLWebhook(rawBody, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Parse payload
    let payload: GHLLeadPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }
    
    console.log('GHL Agency Webhook received:', payload)
    
    // Extract campaign ID and route to correct client
    const campaignId = extractCampaignId(payload)
    console.log('Extracted campaign ID:', campaignId)
    
    const campaignMapping = getClientByCampaignId(campaignId)
    
    if (!campaignMapping) {
      console.warn(`No client mapping found for campaign: ${campaignId}`)
      // Still save the lead but mark as unassigned for admin review
      // or return error if you want to reject unknown campaigns
    }
    
    // Get client info (from campaign mapping or use unassigned defaults)
    const clientSubdomain = campaignMapping?.clientSubdomain || 'unassigned'
    const clientId = campaignMapping?.clientId || 'unassigned'
    const clientName = campaignMapping?.clientName || 'Unassigned'
    
    // If we have a mapped client, get full client details
    let client = null
    if (campaignMapping) {
      client = await getClientBySubdomain(campaignMapping.clientSubdomain)
    }
    
    // Extract contact info
    const contact = payload.contact || {}
    const firstName = contact.firstName || ''
    const lastName = contact.lastName || ''
    const fullName = `${firstName} ${lastName}`.trim() || 'Unknown'
    const phone = contact.phone || ''
    const location = extractLocation(contact.city, contact.state, contact.address)
    
    // Build answers array from form data or custom fields
    const answers: { question: string; answer: string }[] = []
    
    // Try to extract from formData first
    if (payload.formData && Array.isArray(payload.formData)) {
      payload.formData.forEach(field => {
        if (field.name && field.value) {
          answers.push({
            question: field.name,
            answer: field.value
          })
        }
      })
    }
    
    // Fallback to customFields
    if (answers.length === 0 && payload.customFields) {
      payload.customFields.forEach(field => {
        if (field.key && field.value) {
          answers.push({
            question: field.key,
            answer: field.value
          })
        }
      })
    }
    
    // Calculate score and status
    const rawScore = scoreAnswers(answers)
    const normalizedScore = normalizeScore(rawScore)
    const status = determineStatus(rawScore, answers)
    
    // Create lead object with campaign-based client assignment
    const lead: Lead = {
      id: payload.id || generateId(),
      name: fullName,
      phone: phone,
      location: location,
      status: status,
      score: normalizedScore,
      submittedAt: payload.createdAt || new Date().toISOString(),
      lastContacted: payload.createdAt || new Date().toISOString(),
      nextAction: status === 'Hot' ? 'Call immediately and book estimate' : 
                  status === 'Warm' ? 'Send follow-up and nurture' : 
                  'Archive and check back in 30 days',
      answers: answers,
      contactPoints: [],
      source: 'ghl',
      clientId: clientId,
      clientSubdomain: clientSubdomain,
      campaignId: campaignId || undefined,
      rawPayload: payload,
      createdAt: timestamp,
      updatedAt: timestamp
    }
    
    // Save lead
    await saveLead(lead)
    
    // Broadcast update to all connected clients
    const { broadcastLeadsUpdate } = await import('@/app/api/leads/stream/route')
    const allLeads = await import('@/lib/lead-storage').then(m => m.getLeads())
    broadcastLeadsUpdate(allLeads)
    
    // Log webhook
    const log: WebhookLog = {
      id: logId,
      timestamp: timestamp,
      source: 'ghl',
      leadName: fullName,
      leadId: lead.id,
      status: campaignMapping ? 'success' : 'pending',
      clientId: clientId,
      errorMessage: campaignMapping ? undefined : `Unmapped campaign: ${campaignId}`,
      rawPayload: payload,
      parsedLead: lead
    }
    await addWebhookLog(log)
    
    console.log(`Lead saved: ${lead.name} → ${clientName}`, 'Score:', normalizedScore, 'Status:', status)
    
    return NextResponse.json({
      success: true,
      leadId: lead.id,
      clientId: clientId,
      clientName: clientName,
      campaignId: campaignId,
      score: normalizedScore,
      status: status,
      routed: !!campaignMapping
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    
    // Log error
    const log: WebhookLog = {
      id: logId,
      timestamp: timestamp,
      source: 'ghl',
      leadName: 'Error',
      leadId: 'error',
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      rawPayload: null
    }
    await addWebhookLog(log)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'GHL Agency webhook endpoint active',
    endpoint: '/api/webhooks/ghl-agency',
    method: 'POST',
    routing: 'Campaign ID based',
    activeCampaigns: [
      { id: '120241173564380342', client: 'Ricardo Madera' }
    ],
    expectedPayload: {
      contact: {
        firstName: 'string',
        lastName: 'string',
        phone: 'string'
      },
      campaign: { id: 'string' },
      formData: [{ name: 'string', value: 'string' }]
    }
  })
}
