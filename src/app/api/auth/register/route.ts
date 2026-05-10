export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { signAccessToken, signRefreshToken, setAuthCookies, hashPassword } from '@/lib/auth'
import { getUserByEmail, saveUser, generateId } from '@/lib/user-storage'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role = 'client', clientId, subdomain } = await request.json()
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }
    
    // Hash password
    const passwordHash = await hashPassword(password)
    
    // Create user
    const user = {
      id: await generateId('user'),
      email: email.toLowerCase(),
      passwordHash,
      role,
      clientId,
      subdomain,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await saveUser(user)
    
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
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
