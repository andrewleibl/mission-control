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
  Edit3
} from 'lucide-react'

// PJ Sparks — Real Week of March 23-27, 2026
const mockCampaignData = {
  clientName: 'PJ Sparks',
  weekOf: 'March 23-27, 2026',
  totalBudget: 210, // Weekly budget ($900/month ÷ 4.3 weeks)
  spentThisWeek: 140.01,
  spentTotal: 550.66,
  leadsThisWeek: [0, 0, 0, 0, 1, 0, 0], // Mon-Sun (lead came Fri Mar 25)
  totalLeads: 2, // Lifetime
  cplThisWeek: 140.01,
  cplLastWeek: 196.98, // Week of Mar 9-15
  cplChange: -28.9, // percent improvement
  ctr: 1.06,
  ctrChange: 0.34, // percentage point improvement (0.72 → 1.06)
}



function LoomRecordingContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client') || 'hector-huizar'

  const [editingSection, setEditingSection] = useState<string | null>(null)

  // PJ Sparks — Real Week of March 23-27, 2026
  const [sectionData, setSectionData] = useState({
    section1: {
      mainText: 'Week showing improvement. CTR jumped 47% (0.72% → 1.06%) while spend decreased 34%. One lead came in on March 25th after 10-day gap from previous lead (March 15th).',
      items: [
        'Continue monitoring creative performance daily',
        'Maintain current targeting — showing signs of life',
        'Test one new hook variation on top performer',
        'Keep budget at $30/day through weekend'
      ]
    },
    section2: {
      mainText: 'Creative adjustments working. CTR climbing while spend controlled. Need consistent lead flow — currently 1 lead per week target is 3-4.',
      items: [
        'CTR improved from 0.72% to 1.06% (47% jump)',
        'Reduced overspend — $140 vs $213 last week',
        'Lead came in March 25th (10 days since last lead on March 15th)',
        'Creative fatigue showing recovery signs'
      ]
    },
    section3: {
      mainText: 'Continue momentum on CTR improvements. Target 2+ leads with sustained $140-160 weekly spend.',
      items: [
        'Monitor daily for second lead opportunity',
        'Scale winning creative if CTR holds above 1%',
        'Test new hook angle mid-week',
        'Maintain $30/day budget through April'
      ],
      targets: {
        leads: '2-3',
        cpl: '$70-90',
        spend: '$150-180'
      }
    }
  })

  // Temp state for editing
  const [tempData, setTempData] = useState({
    mainText: '',
    items: ['']
  })

  const data = mockCampaignData

  const startEdit = (sectionId: string) => {
    setEditingSection(sectionId)
    const section = sectionData[sectionId as keyof typeof sectionData]
    setTempData({
      mainText: section.mainText,
      items: [...section.items]
    })
  }

  const saveEdit = () => {
    if (editingSection) {
      setSectionData(prev => ({
        ...prev,
        [editingSection]: {
          ...prev[editingSection as keyof typeof prev],
          mainText: tempData.mainText,
          items: tempData.items
        }
      }))
      setEditingSection(null)
    }
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setTempData({ mainText: '', items: [''] })
  }

  const updateTempItem = (index: number, value: string) => {
    setTempData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? value : item)
    }))
  }

  const addTempItem = () => {
    setTempData(prev => ({
      ...prev,
      items: [...prev.items, '']
    }))
  }

  const removeTempItem = (index: number) => {
    setTempData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleDownload = () => {
    // Generate HTML report that renders the actual display
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.clientName} — Weekly Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #0D0D0D;
            color: #F7FAFC;
            padding: 40px;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #2A2A2A;
        }
        .header-top {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
        }
        .header-title {
            font-size: 24px;
            font-weight: 700;
        }
        .header-date {
            font-size: 14px;
            color: #A0AEC0;
            margin-top: 4px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
            margin-bottom: 32px;
        }
        .metric-card {
            background: #141414;
            border-radius: 16px;
            padding: 24px;
            border: 1px solid #2A2A2A;
        }
        .metric-label {
            font-size: 13px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .metric-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .metric-sub {
            font-size: 12px;
            color: #718096;
        }
        .progress-bar {
            background: #1A1A1A;
            border-radius: 8px;
            height: 12px;
            overflow: hidden;
            margin-top: 12px;
        }
        .progress-fill {
            background: linear-gradient(90deg, #E53E3E, #FC8181);
            height: 100%;
            border-radius: 8px;
        }
        .bar-chart {
            display: flex;
            align-items: end;
            gap: 8px;
            height: 100px;
            margin: 16px 0;
        }
        .bar {
            flex: 1;
            background: #2A2A2A;
            border-radius: 6px;
            min-height: 4px;
        }
        .bar.active {
            background: #48BB78;
        }
        .section {
            background: linear-gradient(180deg, #141414 0%, rgba(229, 62, 62, 0.02) 100%);
            border-radius: 16px;
            border: 1px solid rgba(229, 62, 62, 0.1);
            padding: 24px;
            margin-bottom: 20px;
        }
        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .section-number {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #E53E3E, #FC8181);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            color: #fff;
        }
        .section-title {
            font-size: 16px;
            font-weight: 700;
        }
        .section-text {
            font-size: 14px;
            color: #A0AEC0;
            line-height: 1.6;
            margin-bottom: 16px;
        }
        .subsection-label {
            font-size: 11px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 10px;
        }
        .item-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #F7FAFC;
        }
        .arrow {
            color: #E53E3E;
        }
        .targets-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 16px 0;
        }
        .target-box {
            background: #0D0D0D;
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        .target-label {
            font-size: 10px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .target-value {
            font-size: 20px;
            font-weight: 700;
        }
        .trend-positive {
            color: #48BB78;
        }
        .trend-negative {
            color: #E53E3E;
        }
        @media print {
            body { background: #fff; color: #000; }
            .metric-card, .section { background: #f5f5f5; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-top">Weekly Report</div>
            <div class="header-title">${data.clientName}</div>
            <div class="header-date">${data.weekOf}</div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Campaign Spend vs Budget</div>
                <div style="display: flex; gap: 24px; margin-bottom: 16px;">
                    <div>
                        <div class="metric-value">$${data.spentTotal.toLocaleString()}</div>
                        <div class="metric-sub">Total Spent</div>
                    </div>
                    <div>
                        <div class="metric-value" style="color: #E53E3E;">$${data.totalBudget.toLocaleString()}</div>
                        <div class="metric-sub">Total Budget</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(data.spentTotal / data.totalBudget * 100).toFixed(0)}%"></div>
                </div>
                <div style="font-size: 12px; color: #718096; margin-top: 8px;">
                    ${(data.spentTotal / data.totalBudget * 100).toFixed(1)}% of budget used
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Leads This Week (Daily)</div>
                <div class="bar-chart">
                    ${data.leadsThisWeek.map((leads, i) => {
                      const maxLeads = Math.max(...data.leadsThisWeek);
                      const height = maxLeads > 0 ? (leads / maxLeads * 80) + 20 : 20;
                      return `<div class="bar ${leads === maxLeads ? 'active' : ''}" style="height: ${height}px;"></div>`;
                    }).join('')}
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <div style="font-size: 12px; color: #718096;">Total This Week</div>
                        <div style="font-size: 24px; font-weight: 700;">${data.leadsThisWeek.reduce((a, b) => a + b, 0)}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; color: #718096;">Best Day</div>
                        <div style="font-size: 24px; font-weight: 700; color: #48BB78;">${Math.max(...data.leadsThisWeek)}</div>
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Cost Per Lead</div>
                <div style="display: flex; align-items: center; gap: 32px; margin-bottom: 16px;">
                    <div>
                        <div class="metric-value">$${data.cplThisWeek}</div>
                        <div class="metric-sub">This Week</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;" class="${data.cplChange < 0 ? 'trend-positive' : 'trend-negative'}">
                        <span style="font-size: 18px; font-weight: 600;">
                            ${data.cplChange > 0 ? '+' : ''}${data.cplChange}%
                        </span>
                    </div>
                    <div style="margin-left: auto; text-align: right;">
                        <div style="font-size: 24px; font-weight: 700; color: #718096;">$${data.cplLastWeek}</div>
                        <div style="font-size: 12px; color: #718096;">Last Week</div>
                    </div>
                </div>
                <div style="background: ${data.cplChange < 0 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(229, 62, 62, 0.1)'}; border-radius: 8px; padding: 12px; border: 1px solid ${data.cplChange < 0 ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)'}">
                    <div style="font-size: 13px; color: ${data.cplChange < 0 ? '#48BB78' : '#E53E3E'}">
                        ${data.cplChange < 0 ? 'CPL improved — optimizations working' : 'CPL increased — adjustments needed'}
                    </div>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Click-Through Rate</div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <div>
                        <div style="font-size: 48px; font-weight: 700;">${data.ctr}%</div>
                        <div style="font-size: 12px; color: #718096;">Current CTR</div>
                    </div>
                    <div style="background: ${data.ctrChange > 0 ? 'rgba(72, 187, 120, 0.1)' : 'rgba(229, 62, 62, 0.1)'}; padding: 8px 12px; border-radius: 8px;" class="${data.ctrChange > 0 ? 'trend-positive' : 'trend-negative'}">
                        ${data.ctrChange > 0 ? '+' : ''}${data.ctrChange}%
                    </div>
                </div>
                <div style="background: #1A1A1A; border-radius: 8px; height: 8px; overflow: hidden;">
                    <div style="background: ${data.ctrChange > 0 ? '#48BB78' : '#E53E3E'}; height: 100%; width: ${(data.ctr / 5 * 100).toFixed(0)}%; border-radius: 8px;"></div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <div class="section-number">1</div>
                <div class="section-title">How Is The Campaign Going?</div>
            </div>
            <div class="section-text">${sectionData.section1.mainText}</div>
            <div class="subsection-label">⚠ FIXES WE'RE IMPLEMENTING</div>
            <div class="item-list">
                ${sectionData.section1.items.map(item => `<div class="item"><span class="arrow">→</span>${item}</div>`).join('')}
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <div class="section-number">2</div>
                <div class="section-title">Changes Made This Week</div>
            </div>
            <div class="section-text">${sectionData.section2.mainText}</div>
            <div class="item-list">
                ${sectionData.section2.items.map(item => `<div class="item"><span class="arrow">→</span>${item}</div>`).join('')}
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <div class="section-number">3</div>
                <div class="section-title">What To Expect Next Week</div>
            </div>
            <div class="section-text">${sectionData.section3.mainText}</div>
            <div class="targets-grid">
                <div class="target-box">
                    <div class="target-label">Target Leads</div>
                    <div class="target-value">${sectionData.section3.targets.leads}</div>
                </div>
                <div class="target-box">
                    <div class="target-label">Target CPL</div>
                    <div class="target-value">${sectionData.section3.targets.cpl}</div>
                </div>
                <div class="target-box">
                    <div class="target-label">Target Spend</div>
                    <div class="target-value">${sectionData.section3.targets.spend}</div>
                </div>
            </div>
            <div class="subsection-label">FOCUS AREAS</div>
            <div class="item-list">
                ${sectionData.section3.items.map(item => `<div class="item"><span class="arrow">→</span>${item}</div>`).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.clientName.replace(/\s+/g, '-').toLowerCase()}-weekly-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const maxSpend = Math.max(data.spentThisWeek, data.totalBudget - data.spentTotal)
  const leadsMax = Math.max(...data.leadsThisWeek)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1A1A1A 0%, rgba(229, 62, 62, 0.02) 100%)', color: '#F7FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
              {data.clientName} - {data.weekOf}
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
        {/* Red glow background - matching retention calendar */}
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(229, 62, 62, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'linear-gradient(180deg, transparent 0%, rgba(229, 62, 62, 0.02) 100%)',
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
                {data.cplChange < 0 ? 'CPL improved - optimizations working' : 'CPL increased - adjustments needed'}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
          {/* Section 1: How Is The Campaign Going? */}
          <div style={{ background: 'linear-gradient(180deg, #141414 0%, rgba(229, 62, 62, 0.02) 100%)', borderRadius: '16px', border: '1px solid rgba(229, 62, 62, 0.1)', padding: '20px' }}>
            {/* Title with Number and Edit Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #E53E3E, #FC8181)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
              }}>1</div>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>How Is The Campaign Going?</span>
              <button onClick={() => startEdit('section1')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}>
                <Edit3 size={16} />
              </button>
            </div>

            {editingSection === 'section1' ? (
              /* Edit Mode */
              <div>
                <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Main Summary</div>
                <textarea
                  value={tempData.mainText}
                  onChange={(e) => setTempData(prev => ({ ...prev, mainText: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    background: '#0D0D0D',
                    border: '1px solid #E53E3E',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#F7FAFC',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Fixes We're Implementing</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {tempData.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#E53E3E', paddingTop: '10px' }}>→</span>
                      <input
                        value={item}
                        onChange={(e) => updateTempItem(i, e.target.value)}
                        style={{
                          flex: 1,
                          background: '#0D0D0D',
                          border: '1px solid #3A3A3A',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#F7FAFC',
                          fontSize: '14px',
                        }}
                      />
                      <button onClick={() => removeTempItem(i)} style={{ background: 'transparent', border: 'none', color: '#E53E3E', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                  <button onClick={addTempItem} style={{ background: 'transparent', border: '1px dashed #3A3A3A', borderRadius: '6px', padding: '8px', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>+ Add Item</button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveEdit} style={{ background: '#48BB78', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Save</button>
                  <button onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid #3A3A3A', borderRadius: '6px', padding: '8px 16px', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <p style={{ fontSize: '14px', color: '#A0AEC0', lineHeight: '1.6', marginBottom: '16px' }}>
                  {sectionData.section1.mainText}
                </p>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    ⚠ FIXES WE'RE IMPLEMENTING
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sectionData.section1.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#F7FAFC' }}>
                        <span style={{ color: '#E53E3E' }}>→</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Changes Made This Week */}
          <div style={{ background: 'linear-gradient(180deg, #141414 0%, rgba(229, 62, 62, 0.02) 100%)', borderRadius: '16px', border: '1px solid rgba(229, 62, 62, 0.1)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #E53E3E, #FC8181)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
              }}>2</div>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Changes Made This Week</span>
              <button onClick={() => startEdit('section2')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}>
                <Edit3 size={16} />
              </button>
            </div>

            {editingSection === 'section2' ? (
              <div>
                <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Main Summary</div>
                <textarea
                  value={tempData.mainText}
                  onChange={(e) => setTempData(prev => ({ ...prev, mainText: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    background: '#0D0D0D',
                    border: '1px solid #E53E3E',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#F7FAFC',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Changes Made</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {tempData.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#E53E3E', paddingTop: '10px' }}>→</span>
                      <input
                        value={item}
                        onChange={(e) => updateTempItem(i, e.target.value)}
                        style={{
                          flex: 1,
                          background: '#0D0D0D',
                          border: '1px solid #3A3A3A',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#F7FAFC',
                          fontSize: '14px',
                        }}
                      />
                      <button onClick={() => removeTempItem(i)} style={{ background: 'transparent', border: 'none', color: '#E53E3E', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                  <button onClick={addTempItem} style={{ background: 'transparent', border: '1px dashed #3A3A3A', borderRadius: '6px', padding: '8px', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>+ Add Item</button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveEdit} style={{ background: '#48BB78', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Save</button>
                  <button onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid #3A3A3A', borderRadius: '6px', padding: '8px 16px', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#A0AEC0', lineHeight: '1.6', marginBottom: '16px' }}>
                  {sectionData.section2.mainText}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sectionData.section2.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#F7FAFC' }}>
                      <span style={{ color: '#E53E3E' }}>→</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: What To Expect Next Week */}
          <div style={{ background: 'linear-gradient(180deg, #141414 0%, rgba(229, 62, 62, 0.02) 100%)', borderRadius: '16px', border: '1px solid rgba(229, 62, 62, 0.1)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #E53E3E, #FC8181)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                color: '#fff',
              }}>3</div>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>What To Expect Next Week</span>
              <button onClick={() => startEdit('section3')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}>
                <Edit3 size={16} />
              </button>
            </div>

            {editingSection === 'section3' ? (
              <div>
                <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Main Summary</div>
                <textarea
                  value={tempData.mainText}
                  onChange={(e) => setTempData(prev => ({ ...prev, mainText: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    background: '#0D0D0D',
                    border: '1px solid #E53E3E',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#F7FAFC',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Focus Areas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {tempData.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#E53E3E', paddingTop: '10px' }}>→</span>
                      <input
                        value={item}
                        onChange={(e) => updateTempItem(i, e.target.value)}
                        style={{
                          flex: 1,
                          background: '#0D0D0D',
                          border: '1px solid #3A3A3A',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#F7FAFC',
                          fontSize: '14px',
                        }}
                      />
                      <button onClick={() => removeTempItem(i)} style={{ background: 'transparent', border: 'none', color: '#E53E3E', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                  <button onClick={addTempItem} style={{ background: 'transparent', border: '1px dashed #3A3A3A', borderRadius: '6px', padding: '8px', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>+ Add Item</button>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveEdit} style={{ background: '#48BB78', border: 'none', borderRadius: '6px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Save</button>
                  <button onClick={cancelEdit} style={{ background: 'transparent', border: '1px solid #3A3A3A', borderRadius: '6px', padding: '8px 16px', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#A0AEC0', lineHeight: '1.6', marginBottom: '16px' }}>
                  {sectionData.section3.mainText}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#0D0D0D', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Target Leads</div>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{sectionData.section3.targets.leads}</div>
                  </div>
                  <div style={{ background: '#0D0D0D', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Target CPL</div>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{sectionData.section3.targets.cpl}</div>
                  </div>
                  <div style={{ background: '#0D0D0D', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Target Spend</div>
                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{sectionData.section3.targets.spend}</div>
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                    FOCUS AREAS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sectionData.section3.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#F7FAFC' }}>
                        <span style={{ color: '#E53E3E' }}>→</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
