'use client'
import React, { useState } from 'react'

// Caller Performance Tracker
// Andrew has 2 cold callers in training - track their daily metrics

type Caller = {
  id: string
  name: string
  status: 'training' | 'active' | 'ramping' | 'needs_improvement'
  startDate: string
  dailyTarget: number
  weeklyStats: {
    day: string
    dials: number
    connects: number
    appointments: number
    timeOnPhone: number // minutes
  }[]
  totalStats: {
    dials: number
    connects: number
    appointments: number
    hoursWorked: number
  }
  scriptScore: number // 0-100
  notes: string
}

const seedCallers: Caller[] = [
  {
    id: '1',
    name: 'Caller 1',
    status: 'active',
    startDate: '2026-03-15',
    dailyTarget: 100,
    weeklyStats: [
      { day: 'Mon', dials: 95, connects: 12, appointments: 2, timeOnPhone: 45 },
      { day: 'Tue', dials: 102, connects: 15, appointments: 3, timeOnPhone: 52 },
      { day: 'Wed', dials: 88, connects: 10, appointments: 1, timeOnPhone: 38 },
      { day: 'Thu', dials: 110, connects: 18, appointments: 4, timeOnPhone: 61 },
      { day: 'Fri', dials: 96, connects: 14, appointments: 2, timeOnPhone: 48 },
    ],
    totalStats: { dials: 491, connects: 69, appointments: 12, hoursWorked: 24 },
    scriptScore: 85,
    notes: 'Already booking consistently. Strong potential.',
  },
  {
    id: '2',
    name: 'Caller 2',
    status: 'ramping',
    startDate: '2026-03-20',
    dailyTarget: 80,
    weeklyStats: [
      { day: 'Mon', dials: 65, connects: 8, appointments: 0, timeOnPhone: 28 },
      { day: 'Tue', dials: 72, connects: 9, appointments: 1, timeOnPhone: 32 },
      { day: 'Wed', dials: 78, connects: 11, appointments: 1, timeOnPhone: 38 },
      { day: 'Thu', dials: 0, connects: 0, appointments: 0, timeOnPhone: 0 },
      { day: 'Fri', dials: 0, connects: 0, appointments: 0, timeOnPhone: 0 },
    ],
    totalStats: { dials: 215, connects: 28, appointments: 2, hoursWorked: 12 },
    scriptScore: 72,
    notes: 'First live session done, showing strong potential. Needs more reps.',
  },
]

export default function CallerPerformance() {
  const [callers, setCallers] = useState<Caller[]>(seedCallers)
  const [selectedCaller, setSelectedCaller] = useState<Caller | null>(null)

  // Calculate combined stats
  const totalDials = callers.reduce((sum, c) => sum + c.totalStats.dials, 0)
  const totalConnects = callers.reduce((sum, c) => sum + c.totalStats.connects, 0)
  const totalAppointments = callers.reduce((sum, c) => sum + c.totalStats.appointments, 0)
  const connectRate = totalDials > 0 ? Math.round((totalConnects / totalDials) * 100) : 0
  const appointmentRate = totalConnects > 0 ? Math.round((totalAppointments / totalConnects) * 100) : 0

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, marginBottom: 4 }}>Caller Performance</h1>
        <p style={{ fontSize: 13, color: '#718096', margin: 0 }}>
          2 active callers · Training in progress · Daily target: 100 dials per caller
        </p>
      </div>

      {/* Top Stats */}
      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3B82F6' }}>{totalDials}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Total Dials This Week</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ECC94B' }}>{connectRate}%</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Connect Rate</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            {totalConnects} connects / {totalDials} dials
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#48BB78' }}>{totalAppointments}</div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Appointments Set</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#4A5568' }}>
            {appointmentRate}% conversion from connects
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#9F7AEA' }}>
            {callers.reduce((sum, c) => sum + c.totalStats.hoursWorked, 0)}
          </div>
          <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>Hours Worked</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: Caller Cards */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Active Callers</h2>
            <button style={addButtonStyle}>+ Add Caller</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {callers.map(caller => {
              const weeklyDials = caller.weeklyStats.reduce((sum, day) => sum + day.dials, 0)
              const weeklyTarget = caller.dailyTarget * 5
              const weeklyProgress = Math.min(100, Math.round((weeklyDials / weeklyTarget) * 100))

              return (
                <div key={caller.id} style={callerCardStyle} onClick={() => setSelectedCaller(caller)}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: caller.status === 'active' ? '#48BB78' : caller.status === 'ramping' ? '#ECC94B' : '#E53E3E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#0D0D0D',
                      }}>
                        {caller.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#F7FAFC' }}>{caller.name}</div>
                        <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
                          Started {new Date(caller.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' · '}
                          <span style={{
                            color: caller.status === 'active' ? '#48BB78' : caller.status === 'ramping' ? '#ECC94B' : '#E53E3E',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}>
                            {caller.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, color: '#718096' }}>Script Score</div>
                      <div style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: caller.scriptScore >= 80 ? '#48BB78' : caller.scriptScore >= 60 ? '#ECC94B' : '#E53E3E',
                      }}>
                        {caller.scriptScore}%
                      </div>
                    </div>
                  </div>

                  {/* Weekly Progress */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#CBD5E0' }}>Weekly Progress</span>
                      <span style={{ fontSize: 12, color: '#F7FAFC' }}>{weeklyDials}/{weeklyTarget} dials</span>
                    </div>
                    <div style={{ height: 6, background: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${weeklyProgress}%`,
                        background: weeklyProgress >= 80 ? '#48BB78' : weeklyProgress >= 50 ? '#ECC94B' : '#E53E3E',
                        borderRadius: 3,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>{caller.totalStats.dials}</div>
                      <div style={{ fontSize: 10, color: '#718096' }}>Total Dials</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#F7FAFC' }}>{caller.totalStats.connects}</div>
                      <div style={{ fontSize: 10, color: '#718096' }}>Connects</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#48BB78' }}>{caller.totalStats.appointments}</div>
                      <div style={{ fontSize: 10, color: '#718096' }}>Appts Set</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#9F7AEA' }}>
                        {caller.totalStats.connects > 0 ? Math.round((caller.totalStats.appointments / caller.totalStats.connects) * 100) : 0}%
                      </div>
                      <div style={{ fontSize: 10, color: '#718096' }}>Conv. Rate</div>
                    </div>
                  </div>

                  {/* Daily Breakdown */}
                  <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#4A5568', marginBottom: 8 }}>This Week</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {caller.weeklyStats.map((day, i) => (
                        <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#718096', marginBottom: 4 }}>{day.day}</div>
                          <div style={{
                            height: 32,
                            background: day.appointments > 0 ? 'rgba(72, 187, 120, 0.2)' : '#1A1A1A',
                            border: `1px solid ${day.appointments > 0 ? '#48BB78' : '#2A2A2A'}`,
                            borderRadius: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 600,
                            color: day.appointments > 0 ? '#48BB78' : '#F7FAFC',
                          }}>
                            {day.appointments > 0 ? day.appointments : day.dials > 0 ? '·' : '-'}
                          </div>
                          {day.dials > 0 && (
                            <div style={{ fontSize: 9, color: '#4A5568', marginTop: 2 }}>
                              {day.dials}d
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {caller.notes && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #2A2A2A' }}>
                      <div style={{ fontSize: 11, color: '#4A5568', fontStyle: 'italic' }}>
                        "{caller.notes}"
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Live Activity & Coaching */}
        <div style={{ width: 320 }}>
          {/* Live Session Status */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>
              🔴 Live Session
            </h3>
            <div style={{ 
              background: 'rgba(229, 62, 62, 0.1)', 
              border: '1px solid rgba(229, 62, 62, 0.3)', 
              borderRadius: 6,
              padding: 12,
            }}>
              <div style={{ fontSize: 13, color: '#FC8181', fontWeight: 600 }}>No active sessions</div>
              <div style={{ fontSize: 11, color: '#718096', marginTop: 4 }}>
                Next scheduled: Tomorrow 9:00 AM
              </div>
            </div>
            <button style={{ ...actionButtonStyle, marginTop: 12 }}>▶️ Start Live Call Review</button>
          </div>

          {/* Coaching Queue */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>
              Coaching Queue
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={queueItemStyle}>
                <span style={{ fontSize: 12, color: '#F7FAFC' }}>Caller 1 - Wed 2:30 PM</span>
                <span style={{ fontSize: 10, color: '#48BB78', background: 'rgba(72,187,120,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  Reviewed
                </span>
              </div>
              <div style={queueItemStyle}>
                <span style={{ fontSize: 12, color: '#F7FAFC' }}>Caller 2 - Thu 10:00 AM</span>
                <span style={{ fontSize: 10, color: '#ECC94B', background: 'rgba(236,201,75,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                  Pending
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>
              Actions
            </h3>
            <button style={actionButtonStyle}>📝 Update Daily Stats</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>📋 View Scripts</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>🎯 Set Weekly Goals</button>
            <button style={{ ...actionButtonStyle, marginTop: 8 }}>📊 Export Performance</button>
          </div>

          {/* Targets */}
          <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0', color: '#CBD5E0' }}>
              Weekly Targets
            </h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#CBD5E0' }}>Dials</span>
                <span style={{ fontSize: 12, color: '#F7FAFC' }}>500 / 500</span>
              </div>
              <div style={{ height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#48BB78', borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#CBD5E0' }}>Connects</span>
                <span style={{ fontSize: 12, color: '#F7FAFC' }}>69 / 60</span>
              </div>
              <div style={{ height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#48BB78', borderRadius: 2 }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#CBD5E0' }}>Appointments</span>
                <span style={{ fontSize: 12, color: '#F7FAFC' }}>12 / 10</span>
              </div>
              <div style={{ height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#48BB78', borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0D0D0D',
  color: '#F7FAFC',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  padding: '24px 32px',
  boxSizing: 'border-box',
}

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 32,
}

const statCardStyle: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  padding: '16px 20px',
}

const callerCardStyle: React.CSSProperties = {
  background: '#141414',
  border: '1px solid #2A2A2A',
  borderRadius: 8,
  padding: '20px',
  cursor: 'pointer',
  transition: 'border-color 0.2s',
}

const addButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#3B82F6',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const actionButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: '#1A1A1A',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#F7FAFC',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
}

const queueItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #2A2A2A',
}