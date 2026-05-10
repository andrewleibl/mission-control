export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getLeads } from '@/lib/lead-storage'
import { getClients } from '@/lib/user-storage'
import { getCurrentUser } from '@/lib/auth'

// GET - Get analytics statistics
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const leads = await getLeads()
    const clients = await getClients()
    
    // Overall stats
    const totalLeads = leads.length
    const hotLeads = leads.filter(l => l.status === 'Hot').length
    const warmLeads = leads.filter(l => l.status === 'Warm').length
    const coldLeads = leads.filter(l => l.status === 'Cold').length
    
    // Calculate conversion rate (Hot + Warm / Total)
    const activeLeads = hotLeads + warmLeads
    const conversionRate = totalLeads > 0 ? Math.round((activeLeads / totalLeads) * 100) : 0
    
    // Average lead score
    const avgScore = leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)
      : 0
    
    // Leads by source
    const leadsBySource = leads.reduce((acc, lead) => {
      const source = lead.source || 'Unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Leads by client
    const leadsByClient = clients.map(client => {
      const clientLeads = leads.filter(l => l.clientId === client.id)
      return {
        clientId: client.id,
        clientName: client.name,
        subdomain: client.subdomain,
        total: clientLeads.length,
        hot: clientLeads.filter(l => l.status === 'Hot').length,
        warm: clientLeads.filter(l => l.status === 'Warm').length,
        cold: clientLeads.filter(l => l.status === 'Cold').length,
        avgScore: clientLeads.length > 0 
          ? Math.round(clientLeads.reduce((sum, l) => sum + l.score, 0) / clientLeads.length)
          : 0
      }
    })
    
    // Recent leads (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentLeads = leads.filter(l => {
      const leadDate = new Date(l.createdAt)
      return leadDate >= sevenDaysAgo
    }).length
    
    return NextResponse.json({
      overall: {
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        conversionRate,
        avgScore,
        recentLeads
      },
      bySource: leadsBySource,
      byClient: leadsByClient,
      clients: clients.length
    })
    
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
