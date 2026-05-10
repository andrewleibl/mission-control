export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getClients, saveClient, generateId } from '@/lib/user-storage'
import { getCurrentUser } from '@/lib/auth'
import { generatePIN } from '@/lib/auth'

// GET - Fetch all clients (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const clients = await getClients()
    return NextResponse.json({ clients })
    
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST - Create new client (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { name, subdomain, email } = await request.json()
    
    // Validate
    if (!name || !subdomain) {
      return NextResponse.json(
        { error: 'Name and subdomain required' },
        { status: 400 }
      )
    }
    
    // Check if subdomain exists
    const clients = await getClients()
    const existing = clients.find(c => c.subdomain.toLowerCase() === subdomain.toLowerCase())
    if (existing) {
      return NextResponse.json(
        { error: 'Subdomain already exists' },
        { status: 409 }
      )
    }
    
    // Generate PIN for client access
    const pin = generatePIN()
    
    // Create client
    const client = {
      id: await generateId('client'),
      name,
      subdomain: subdomain.toLowerCase(),
      isActive: true,
      pin, // Store PIN (in real app, hash this)
      createdAt: new Date().toISOString(),
    }
    
    await saveClient(client)
    
    // If email provided, create user account for client
    let userAccount = null
    if (email) {
      const { saveUser, hashPassword } = await import('@/lib/user-storage')
      const { generateId: genUserId } = await import('@/lib/user-storage')
      
      const passwordHash = await hashPassword(pin) // Use PIN as initial password
      
      userAccount = {
        id: await genUserId('user'),
        email: email.toLowerCase(),
        passwordHash,
        role: 'client' as const,
        clientId: client.id,
        subdomain: client.subdomain,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      await saveUser(userAccount)
    }
    
    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        subdomain: client.subdomain,
        pin,
        loginUrl: `http://${client.subdomain}.localhost:3000/login`,
      },
      userAccount: userAccount ? {
        email: userAccount.email,
        tempPassword: pin,
      } : null
    })
    
  } catch (error) {
    console.error('Failed to create client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}