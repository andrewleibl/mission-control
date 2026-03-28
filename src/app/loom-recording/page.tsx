'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Download, 
  ChevronLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target, 
  MousePointer,
  Edit3,
  Check,
  X
} from 'lucide-react'

// Mock data - replace with real Meta Ads API data
const mockCampaignData = {
  clientName: 'Hector Huizar',
  weekOf: 'March 21-27, 2026',
  totalBudget: 1500,
  spentThisWeek: 487,
  spentTotal: 1247,
  leadsThisWeek: [3, 5, 2, 7, 4, 6, 4], // Mon-Sun
  totalLeads: 127,
  cplThisWeek: 81,
  cplLastWeek: 95,
  cplChange: -14.7, // percent
  ctr: 2.4,
  ctrChange: 0.3, // percent
}

const bigThreeQuestions = [
  {
    id: 'whatChanged',
    title: 'What Changed This Week?',
    placeholder: 'Describe the adjustments made to targeting, creative, or budget...',
  },
  {
    id: 'whatsWorking',
    title: "What's Working?",
    placeholder: 'Which ads, audiences, or strategies are driving results...',
  },
  {
    id: 'nextWeek',
    title: 'Next Week Focus',
    placeholder: 'What are we testing, scaling, or optimizing...',
  },
]

function LoomRecordingContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'hector-huizar'
  
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({
    whatChanged: 'Switched to lookalike audience based on past converters. Increased budget by 20% on top performers.',
    whatsWorking: 'Video creative #3 (barbershop testimonial) is crushing — 4.2% CTR, $67 CPL. Scaling to $40/day.',
    nextWeek: 'Test new hook variations on winning creative. Launch retargeting for cart abandoners.',
  })
  const [tempAnswer, setTempAnswer] = useState('')

  const data = mockCampaignData

  const startEdit = (sectionId: string) => {
    setEditingSection(sectionId)
    setTempAnswer(answers[sectionId] || '')
  }

  const saveEdit = () => {
    if (editingSection) {
      setAnswers(prev => ({ ...prev, [editingSection]: tempAnswer }))
      setEditingSection(null)
    }
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setTempAnswer('')
  }

  const handleDownload = () => {
    const reportData = {
      client: data.clientName,
      week: data.weekOf,
      spend: data.spentThisWeek,
      totalSpent: data.spentTotal,
      budget: data.totalBudget,
      leads: data.totalLeads,
      cpl: data.cplThisWeek,
      ctr: data.ctr,
      answers,
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.clientName.replace(/\s+/g, '-').toLowerCase()}-weekly-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const maxSpend = Math.max(data.spentThisWeek, data.totalBudget - data.spentTotal)
  const leadsMax = Math.max(...data.leadsThisWeek)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0D0D0D 0%, rgba(229, 62, 62, 0.03) 100%)', color: '#F7FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ 
        background: '#141414', 
        borderBottom: '1px solid #2A2A2A',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => window.history.back()}
            style={{
              background: 'transparent',
              border: '1px solid #3A3A3A',
              borderRadius: '8px',
              padding: '10px',
              cursor: 'pointer',
              color: '#718096',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Weekly Loom Recording
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              {data.clientName} — {data.weekOf}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleDownload}
          style={{
            background: '#2A2A2A',
            border: '1px solid #3A3A3A',
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            color: '#F7FAFC',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.15s',
          }}
          title="Download Report"
        >
          <Download size={18} />
        </button>
      </div>

      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        {/* Subtle red glow background */}
        <div style={{
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '400px',
          background: 'radial-gradient(ellipse at center, rgba(229, 62, 62, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        
        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
          {/* Campaign Spend Chart */}
          <div style={{ 
            background: '#141414', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #2A2A2A',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <DollarSign size={18} color="#718096" />
              <span style={{ fontSize: '13px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Campaign Spend vs Budget
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700 }}>${data.spentTotal.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Total Spent</div>
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: '#E53E3E' }}>${data.totalBudget.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Total Budget</div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: '#1A1A1A', borderRadius: '8px', height: '12px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{
                background: 'linear-gradient(90deg, #E53E3E, #FC8181)',
                height: '100%',
                width: `${(data.spentTotal / data.totalBudget) * 100}%`,
                borderRadius: '8px',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              {((data.spentTotal / data.totalBudget) * 100).toFixed(1)}% of budget used
            </div>
          </div>

          {/* Leads Per Day Chart */}
          <div style={{ 
            background: '#141414', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #2A2A2A',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Users size={18} color="#718096" />
              <span style={{ fontSize: '13px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Leads This Week (Daily)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '120px', marginBottom: '16px' }}>
              {data.leadsThisWeek.map((leads, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: leads === leadsMax ? '#48BB78' : '#2A2A2A',
                    borderRadius: '6px',
                    width: '100%',
                    height: `${(leads / leadsMax) * 100}px`,
                    minHeight: '4px',
                    transition: 'background 0.15s',
                  }} />
                  <div style={{ fontSize: '11px', color: '#718096' }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Total This Week</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>{data.leadsThisWeek.reduce((a, b) => a + b, 0)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Best Day</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#48BB78' }}>{leadsMax}</div>
              </div>
            </div>
          </div>

          {/* CPL Comparison */}
          <div style={{ 
            background: '#141414', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #2A2A2A',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Target size={18} color="#718096" />
              <span style={{ fontSize: '13px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cost Per Lead
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '42px', fontWeight: 700 }}>${data.cplThisWeek}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>This Week</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: data.cplChange < 0 ? '#48BB78' : '#E53E3E' }}>
                {data.cplChange < 0 ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                <span style={{ fontSize: '18px', fontWeight: 600 }}>
                  {data.cplChange > 0 ? '+' : ''}{data.cplChange}%
                </span>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#718096' }}>${data.cplLastWeek}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Last Week</div>
              </div>
            </div>

            <div style={{ 
              background: data.cplChange < 0 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(229, 62, 62, 0.1)', 
              borderRadius: '8px', 
              padding: '12px',
              border: `1px solid ${data.cplChange < 0 ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)'}`,
            }}>
              <div style={{ fontSize: '13px', color: data.cplChange < 0 ? '#48BB78' : '#E53E3E' }}>
                {data.cplChange < 0 ? 'CPL improved — optimizations working' : 'CPL increased — adjustments needed'}
              </div>
            </div>
          </div>

          {/* CTR */}
          <div style={{ 
            background: '#141414', 
            borderRadius: '16px', 
            padding: '24px',
            border: '1px solid #2A2A2A',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <MousePointer size={18} color="#718096" />
              <span style={{ fontSize: '13px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Click-Through Rate
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '48px', fontWeight: 700 }}>{data.ctr}%</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>Current CTR</div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: data.ctrChange > 0 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(229, 62, 62, 0.1)',
                padding: '8px 12px',
                borderRadius: '8px',
              }}>
                {data.ctrChange > 0 ? <TrendingUp size={16} color="#48BB78" /> : <TrendingDown size={16} color="#E53E3E" />}
                <span style={{ fontSize: '14px', fontWeight: 600, color: data.ctrChange > 0 ? '#48BB78' : '#E53E3E' }}>
                  {data.ctrChange > 0 ? '+' : ''}{data.ctrChange}%
                </span>
              </div>
            </div>

            <div style={{ 
              background: '#1A1A1A', 
              borderRadius: '8px', 
              height: '8px',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                background: data.ctrChange > 0 ? '#48BB78' : '#E53E3E',
                height: '100%',
                width: `${(data.ctr / 5) * 100}%`, // assuming 5% is max good CTR
                borderRadius: '8px',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#718096' }}>0%</span>
              <span style={{ fontSize: '11px', color: '#718096' }}>Industry avg: 1.5%</span>
              <span style={{ fontSize: '11px', color: '#718096' }}>5%</span>
            </div>
          </div>
        </div>

        {/* Big 3 Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
          {bigThreeQuestions.map((question) => (
            <div 
              key={question.id}
              style={{ 
                background: '#141414', 
                borderRadius: '16px', 
                padding: '24px',
                border: '1px solid #2A2A2A',
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{question.title}</div>
                
                {editingSection === question.id ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={saveEdit}
                      style={{
                        background: 'rgba(72, 187, 120, 0.1)',
                        border: '1px solid rgba(72, 187, 120, 0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#48BB78',
                      }}
                    >
                      <Check size={16} />
                    </button>
                    <button 
                      onClick={cancelEdit}
                      style={{
                        background: 'rgba(229, 62, 62, 0.1)',
                        border: '1px solid rgba(229, 62, 62, 0.2)',
                        borderRadius: '6px',
                        padding: '8px',
                        cursor: 'pointer',
                        color: '#E53E3E',
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => startEdit(question.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #3A3A3A',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      color: '#718096',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Edit3 size={16} />
                  </button>
                )}
              </div>

              {editingSection === question.id ? (
                <textarea
                  value={tempAnswer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  placeholder={question.placeholder}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    background: '#0D0D0D',
                    border: '1px solid #3A3A3A',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#F7FAFC',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <div style={{ 
                  background: '#0D0D0D', 
                  borderRadius: '8px', 
                  padding: '16px',
                  minHeight: '60px',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: answers[question.id] ? '#F7FAFC' : '#718096',
                  border: '1px solid #1A1A1A',
                }}>
                  {answers[question.id] || question.placeholder}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recording Tips Footer */}
        <div style={{ 
          marginTop: '32px',
          padding: '20px',
          background: '#1A1A1A',
          borderRadius: '12px',
          border: '1px dashed #3A3A3A',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#A0AEC0' }}>
            💡 Loom Recording Tips
          </div>
          <div style={{ fontSize: '12px', color: '#718096', lineHeight: 1.6 }}>
            Start with "Here's what I'm seeing" → show this dashboard → dive into the Big 3 → end with "Here's what to expect next week."
            Keep it under 2 minutes. Speed shows confidence.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoomRecordingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
        Loading...
      </div>
    }>
      <LoomRecordingContent />
    </Suspense>
  )
}
