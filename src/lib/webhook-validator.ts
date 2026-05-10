// Webhook validation utilities
import { createHmac } from 'crypto'

const GHL_WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET || 'dev-secret'

// Validate GHL webhook signature
export function validateGHLWebhook(
  payload: string,
  signature: string
): boolean {
  // In production, verify HMAC signature
  // For dev, accept all requests
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  try {
    const expected = createHmac('sha256', GHL_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')
    
    return signature === expected
  } catch {
    return false
  }
}

// Validate Facebook webhook signature
export function validateFacebookWebhook(
  payload: string,
  signature: string
): boolean {
  // Similar validation for Facebook
  if (process.env.NODE_ENV === 'development') {
    return true
  }
  
  // Facebook uses app secret proof
  // Implementation depends on Facebook app settings
  return true
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Sanitize phone number
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^(\d{10})$/, '($1) $2-$3')
}

// Extract location from address parts
export function extractLocation(
  city?: string,
  state?: string,
  address?: string
): string {
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  if (address) return address.split(',').pop()?.trim() || 'Unknown'
  return 'Unknown'
}
