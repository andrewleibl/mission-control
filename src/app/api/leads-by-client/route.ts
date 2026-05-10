export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getLeads } from '@/lib/lead-storage'
import { getCurrentUser } from '@/lib/auth'
import { getClientBySubdomain, Client } from '@/lib/user-storage'

// Get leads filtered by client/subdomain
export async function GET(request: NextRequest) {
  try {
    // Get current user from cookies
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check for viewAs parameter (admin viewing specific client)
    const { searchParams } = new URL(request.url)
    const viewAs = searchParams.get('viewAs')
    
    // Get all leads
    const leads = await getLeads()
    
    // Filter logic based on user role
    let filteredLeads = leads
    let viewAsClient: Client | null = null
    
    if (user.role === 'admin' && viewAs) {
      // Admin viewing specific client
      viewAsClient = await getClientBySubdomain(viewAs)
      if (viewAsClient) {
        filteredLeads = leads.filter(lead => lead.clientId === viewAsClient?.id)
      }
    } else if (user.role === 'client') {
      // Clients only see leads assigned to their clientId
      filteredLeads = leads.filter(lead => lead.clientId === user.clientId)
    }
    // Admin without viewAs sees all leads
    
    return NextResponse.json({ 
      leads: filteredLeads,
      user: {
        role: user.role,
        clientId: user.clientId,
        subdomain: user.subdomain
      },
      viewAs: viewAsClient ? {
        id: viewAsClient.id,
        name: viewAsClient.name,
        subdomain: viewAsClient.subdomain
      } : null
    })
    
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
