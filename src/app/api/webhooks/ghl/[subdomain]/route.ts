export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { GHLLeadPayload, Lead, WebhookLog } from '@/types/lead'
import { saveLead, addWebhookLog } from '@/lib/lead-storage'
import { getClientBySubdomain } from '@/lib/user-storage'
import { validateGHLWebhook, generateId, extractLocation } from '@/lib/webhook-validator'
import { scoreAnswers, normalizeScore, determineStatus } from '@/lib/scoring'

// GHL Webhook Handler - Dynamic route by subdomain
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  const logId = generateId()
  const timestamp = new Date().toISOString()
  
  try {
    // Look up client by subdomain
    const client = await getClientBySubdomain(subdomain)
    
    if (!client) {
      console.error(`No client found for subdomain: ${subdomain}`)
      return NextResponse.json(
        { error: 'Invalid webhook URL - client not found' },
        { status: 404 }
      )
    }
    
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
    
    console.log(`GHL Webhook received for ${subdomain}:`, payload)
    
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
    
    // Create lead object with correct client ID
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
      clientId: client.id, // Dynamic client assignment!
      clientSubdomain: subdomain,
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
      status: 'success',
      clientId: client.id,
      rawPayload: payload,
      parsedLead: lead
    }
    await addWebhookLog(log)
    
    console.log(`Lead saved for ${client.name}:`, lead.name, 'Score:', normalizedScore, 'Status:', status)
    
    return NextResponse.json({
      success: true,
      leadId: lead.id,
      clientId: client.id,
      clientName: client.name,
      score: normalizedScore,
      status: status
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

// Test endpoint (for manual testing)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params
  
  // Verify client exists
  const client = await getClientBySubdomain(subdomain)
  
  if (!client) {
    return NextResponse.json(
      { error: 'Client not found for this subdomain' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({
    status: 'Webhook endpoint active',
    subdomain: subdomain,
    client: {
      id: client.id,
      name: client.name,
      isActive: client.isActive
    },
    webhookUrl: `https://api.straightpointmarketing.com/webhooks/ghl/${subdomain}`,
    method: 'POST',
    expectedPayload: {
      contact: {
        firstName: 'string',
        lastName: 'string',
        phone: 'string'
      },
      formData: [{ name: 'string', value: 'string' }]
    }
  })
}
