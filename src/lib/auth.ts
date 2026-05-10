// JWT Authentication utilities
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Secret key for signing JWTs (in production, use environment variable)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters!'
)

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-min-32!'
)

export type UserRole = 'admin' | 'client'

export type JWTPayload = {
  userId: string
  email: string
  role: UserRole
  clientId?: string // For client users, their client ID
  subdomain?: string // For client users, their subdomain
}

// Generate access token (short-lived)
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // 1 hour
    .sign(JWT_SECRET)
}

// Generate refresh token (long-lived)
export async function signRefreshToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(JWT_REFRESH_SECRET)
}

// Verify access token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as JWTPayload
  } catch {
    return null
  }
}

// Verify refresh token
export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

// Set auth cookies
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  
  // For local development, allow subdomains by not setting domain
  // In production, set domain to root domain for cross-subdomain cookies
  const isLocal = process.env.NODE_ENV !== 'production'
  
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
    domain: isLocal ? undefined : '.straightpointmarketing.com',
  })
  
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    domain: isLocal ? undefined : '.straightpointmarketing.com',
  })
}

// Clear auth cookies
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  
  cookieStore.delete({ name: 'access_token', path: '/' })
  cookieStore.delete({ name: 'refresh_token', path: '/' })
}

// Get current user from cookies
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  if (!token) return null
  return await verifyAccessToken(token)
}

// Generate a random secure PIN
export function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString() // 4-digit PIN
}

// Hash password (simple bcrypt alternative for demo)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify password
export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hashed
}
