'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'client' }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/pipeline')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Mission Control dark theme colors
  const colors = {
    bg: '#0D0D0D',
    cardBg: '#141414',
    border: 'rgba(229, 62, 62, 0.1)',
    borderHover: 'rgba(229, 62, 62, 0.3)',
    text: '#F7FAFC',
    textMuted: '#94A3B8',
    inputBg: '#1A1A1A',
    red: '#E53E3E',
    redGlow: '0 0 20px rgba(229, 62, 62, 0.2)',
  }

  return (
    <>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${colors.bg} 0%, #0a0a0a 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '16px',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: 24 }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.2em',
            color: colors.red,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Straight Point Marketing
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            marginBottom: 8,
          }}>
            Create Account
          </h1>
          <p style={{
            fontSize: 14,
            color: colors.textMuted,
            margin: 0,
          }}>
            Join the Pipeline Portal
          </p>
        </div>

        {/* Register Card */}
        <div style={{
          background: `linear-gradient(180deg, ${colors.cardBg} 0%, rgba(229, 62, 62, 0.02) 100%)`,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 32,
          boxShadow: colors.redGlow,
        }}>
          {error && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 8,
              color: '#FCA5A5',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.red
                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.red
                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{
                marginTop: 6,
                fontSize: 11,
                color: colors.textMuted,
              }}>
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: colors.textMuted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  color: colors.text,
                  fontSize: 15,
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.red
                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: loading
                  ? 'linear-gradient(135deg, rgba(229, 62, 62, 0.5), rgba(229, 62, 62, 0.3))'
                  : 'linear-gradient(135deg, rgba(229, 62, 62, 0.9), rgba(229, 62, 62, 0.7))',
                border: `1px solid ${colors.red}`,
                borderRadius: 8,
                color: colors.text,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s',
                boxShadow: '0 0 20px rgba(229, 62, 62, 0.2)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(229, 62, 62, 0.4)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(229, 62, 62, 0.2)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div style={{
            marginTop: 24,
            textAlign: 'center',
          }}>
            <span style={{ color: colors.textMuted, fontSize: 14 }}>
              Already have an account?{' '}
            </span>
            <Link
              href="/login"
              style={{
                color: colors.red,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
