export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// GET - Get current authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json({
      userId: user.userId,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      subdomain: user.subdomain
    })
    
  } catch (error) {
    console.error('Failed to get current user:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
