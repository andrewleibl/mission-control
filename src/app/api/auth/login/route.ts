export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { signAccessToken, signRefreshToken, setAuthCookies, verifyPassword } from '@/lib/auth'
import { getUserByEmail } from '@/lib/user-storage'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Create tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      subdomain: user.subdomain,
    })
    
    const refreshToken = await signRefreshToken(user.id)
    
    // Set cookies
    await setAuthCookies(accessToken, refreshToken)
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        subdomain: user.subdomain,
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
