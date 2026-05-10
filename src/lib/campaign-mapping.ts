// Campaign ID to Client mapping for lead routing
// All Facebook leads flow through agency GHL account, then route by campaign ID

export type CampaignMapping = {
  campaignId: string
  clientId: string
  clientSubdomain: string
  clientName: string
}

// Active campaign mappings
// Add new entries as you onboard clients
const campaignMappings: CampaignMapping[] = [
  {
    campaignId: '120241173564380342',
    clientId: 'client-001', // Ricardo's client ID
    clientSubdomain: 'ricardo',
    clientName: 'Ricardo Madera'
  }
  // Add more clients here:
  // { campaignId: '...', clientId: 'client-002', clientSubdomain: 'maria', clientName: 'Maria Lopez' },
]

// Build lookup maps for fast routing
const campaignToClientMap = new Map(campaignMappings.map(m => [m.campaignId, m]))

/**
 * Get client info by campaign ID
 * Returns null if campaign not mapped (lead goes to unassigned/admin review)
 */
export function getClientByCampaignId(campaignId: string | null | undefined): CampaignMapping | null {
  if (!campaignId) return null
  return campaignToClientMap.get(campaignId) || null
}

/**
 * Extract campaign ID from GHL webhook payload
 * Checks multiple possible locations in payload
 */
export function extractCampaignId(payload: any): string | null {
  // Try standard GHL locations
  if (payload.campaign?.id) return payload.campaign.id
  if (payload.campaignId) return payload.campaignId
  
  // Check custom fields for campaign ID
  if (payload.customFields) {
    const campaignField = payload.customFields.find((f: any) => 
      f.key?.toLowerCase().includes('campaign') || 
      f.name?.toLowerCase().includes('campaign')
    )
    if (campaignField?.value) return campaignField.value
  }
  
  // Check form data for campaign ID
  if (payload.formData) {
    const campaignField = payload.formData.find((f: any) => 
      f.name?.toLowerCase().includes('campaign') ||
      f.fieldId?.toLowerCase().includes('campaign')
    )
    if (campaignField?.value) return campaignField.value
  }
  
  return null
}

/**
 * Get all active campaign IDs for webhook registration
 */
export function getAllCampaignIds(): string[] {
  return campaignMappings.map(m => m.campaignId)
}

/**
 * Add a new campaign mapping (for admin use)
 */
export function addCampaignMapping(mapping: CampaignMapping): void {
  campaignMappings.push(mapping)
  campaignToClientMap.set(mapping.campaignId, mapping)
}
