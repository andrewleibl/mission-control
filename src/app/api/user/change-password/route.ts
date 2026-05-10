export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserById, saveUser } from '@/lib/user-storage'
import { hashPassword, verifyPassword } from '@/lib/auth'

// POST - Change user password
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { currentPassword, newPassword } = await request.json()
    
    // Validate
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password required' },
        { status: 400 }
      )
    }
    
    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters' },
        { status: 400 }
      )
    }
    
    // Get full user record
    const userRecord = await getUserById(user.userId)
    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Verify current password
    const isValid = await verifyPassword(currentPassword, userRecord.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)
    
    // Update user
    userRecord.passwordHash = newPasswordHash
    userRecord.updatedAt = new Date().toISOString()
    await saveUser(userRecord)
    
    return NextResponse.json({ success: true, message: 'Password updated successfully' })
    
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
