// Lead types for Pipeline Portal

export type PipelineStatus = 'Hot' | 'Warm' | 'Cold'

export type LeadSource = 'ghl' | 'facebook' | 'test' | 'manual'

export type LeadAnswer = {
  question: string
  answer: string
}

export type ContactPoint = {
  id: string
  at: string
  type: 'Call' | 'Text' | 'Email' | 'Voicemail'
  outcome: 'Connected' | 'No Answer' | 'Left VM' | 'Replied' | 'Booked' | 'Not Interested'
  note: string
}

export type Lead = {
  id: string
  name: string
  phone: string
  location: string
  status: PipelineStatus
  score: number // 1-10
  submittedAt: string
  lastContacted?: string
  nextAction?: string
  answers: LeadAnswer[]
  contactPoints?: ContactPoint[]
  source: LeadSource
  clientId?: string // Which client this lead belongs to
  clientSubdomain?: string // Client subdomain for routing
  campaignId?: string // Facebook/GHL campaign ID for routing
  rawPayload: any // original webhook data
  createdAt: string
  updatedAt: string
}

export type WebhookLog = {
  id: string
  timestamp: string
  source: LeadSource
  leadName: string
  leadId: string
  status: 'success' | 'error' | 'pending'
  errorMessage?: string
  clientId?: string // Which client this webhook belongs to
  rawPayload: any
  parsedLead?: Lead
}

// GHL Webhook payload structure
export type GHLLeadPayload = {
  id?: string
  contact?: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
    address?: string
    city?: string
    state?: string
    zip?: string
  }
  customFields?: Array<{
    id?: string
    key?: string
    value?: string
  }>
  formData?: Array<{
    fieldId?: string
    name?: string
    value?: string
  }>
  campaign?: {
    id?: string
    name?: string
  }
  source?: string
  createdAt?: string
}

// Facebook Lead payload structure
export type FacebookLeadPayload = {
  leadgenId?: string
  pageId?: string
  formId?: string
  createdTime?: string
  fieldData?: Array<{
    name: string
    values: string[]
  }>
}
