'use client'

import { useState, useEffect } from 'react'
import { User, Bell, Shield, Palette } from 'lucide-react'
import { PageContainer, PageHeader, cardStyle, colors, inputStyle, buttonPrimary } from '@/components/DesignSystem'

interface Settings {
  name: string
  email: string
  notifications: boolean
  theme: 'dark' | 'light'
  compactMode: boolean
}

const DEFAULT_SETTINGS: Settings = {
  name: 'Andrew Leibl',
  email: 'andrew@straightpointmarketing.com',
  notifications: true,
  theme: 'dark',
  compactMode: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('mc_settings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    }
    setIsLoaded(true)
  }, [])

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    localStorage.setItem('mc_settings', JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!isLoaded) return null

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Manage your preferences" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Profile */}
        <SettingSection title="Profile" icon={<User size={18} />}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#718096', marginBottom: '6px' }}>
                Display Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSetting('name', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#718096', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => updateSetting('email', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="Notifications" icon={<Bell size={18} />}>
          <Toggle
            label="Enable notifications"
            checked={settings.notifications}
            onChange={(v) => updateSetting('notifications', v)}
          />
        </SettingSection>

        {/* Appearance */}
        <SettingSection title="Appearance" icon={<Palette size={18} />}>
          <Toggle
            label="Compact mode"
            checked={settings.compactMode}
            onChange={(v) => updateSetting('compactMode', v)}
          />
          <div style={{ marginTop: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#718096', marginBottom: '6px' }}>
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as 'dark' | 'light')}
              style={inputStyle}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </SettingSection>

        {/* Saved indicator */}
        {saved && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            background: '#48BB78',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 600,
          }}>
            Settings saved
          </div>
        )}
      </div>
    </PageContainer>
  )
}

function SettingSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ ...cardStyle, padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ color: '#718096' }}>{icon}</span>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#CBD5E0' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '14px', color: '#F7FAFC' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: checked ? '#E53E3E' : '#2A2A2A',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}
