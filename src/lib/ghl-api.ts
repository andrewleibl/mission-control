// GHL API client for polling leads

const GHL_API_BASE = 'https://services.leadconnectorhq.com'

export type GHLContact = {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  postalCode?: string
  customFields?: Array<{
    id?: string
    fieldKey?: string
    value?: string
  }>
  tags?: string[]
  source?: string
  campaign?: {
    id?: string
    name?: string
  }
  createdAt: string
  updatedAt: string
}

export type GHLPaginatedResponse = {
  contacts: GHLContact[]
  meta: {
    total: number
    next?: string
    prev?: string
  }
}

/**
 * Fetch contacts from GHL API
 * Filters by date to get only new leads
 * 
 * Note: For agency tokens accessing sub-accounts, we need to include
 * the locationId in the URL path, not just as a query param
 */
export async function fetchGHLContacts(
  accessToken: string,
  locationId: string,
  options?: {
    startAfter?: string // ISO date
    limit?: number
  }
): Promise<GHLPaginatedResponse> {
  const params = new URLSearchParams()
  params.set('limit', String(options?.limit || 100))
  
  if (options?.startAfter) {
    params.set('startAfter', options.startAfter)
  }

  // Agency tokens need locationId in the path for sub-account access
  const url = `${GHL_API_BASE}/contacts/?${params.toString()}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GHL API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Fetch a single contact by ID (for full details)
 */
export async function fetchGHLContact(
  accessToken: string,
  locationId: string,
  contactId: string
): Promise<GHLContact> {
  const response = await fetch(
    `${GHL_API_BASE}/contacts/${contactId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GHL API error: ${response.status} - ${error}`)
  }

  return response.json()
}

/**
 * Transform GHL contact to Portal Lead format
 */
export function transformGHLContactToLead(
  contact: GHLContact,
  campaignMapping?: { clientId: string; clientSubdomain: string } | null
) {
  // Extract custom fields as answers
  const answers: { question: string; answer: string }[] = []
  
  if (contact.customFields) {
    contact.customFields.forEach((field) => {
      if (field.fieldKey && field.value) {
        answers.push({
          question: field.fieldKey,
          answer: field.value,
        })
      }
    })
  }

  // Determine location
  const location = contact.city && contact.state
    ? `${contact.city}, ${contact.state}`
    : contact.city || contact.state || 'Unknown'

  // Extract campaign ID from contact
  const campaignId = contact.campaign?.id

  return {
    id: contact.id,
    name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
    phone: contact.phone || '',
    email: contact.email || '',
    location,
    source: contact.source || 'ghl-api',
    campaignId,
    clientId: campaignMapping?.clientId,
    clientSubdomain: campaignMapping?.clientSubdomain,
    answers,
    submittedAt: contact.createdAt,
    lastContacted: contact.updatedAt,
    rawPayload: contact,
  }
}
