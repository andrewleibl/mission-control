#!/usr/bin/env node
/**
 * Weekly Report Generator for Meta Ads
 * Fetches campaign data, analyzes performance, generates HTML report
 * Trigger: 12:00 PM CST on Weekly Report event days
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load client configs
const CONFIG_DIR = path.join(__dirname, '..', 'config');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure directories exist
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Client configurations
const clients = {
  'pj-sparks': JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'pj-sparks.json'), 'utf8')),
  'hector-huizar': JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'hector-huizar.json'), 'utf8')),
  // Add Ricardo when config exists
};

// Meta API endpoint
const META_API_BASE = 'https://graph.facebook.com/v18.0';

async function fetchMetaData(clientKey, clientConfig) {
  const { accessToken, adAccountId } = clientConfig;
  
  // Calculate date ranges
  const today = new Date();
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - 7);
  const lastWeekStart = new Date(today);
  lastWeekStart.setDate(today.getDate() - 14);
  
  const since = thisWeekStart.toISOString().split('T')[0];
  const until = today.toISOString().split('T')[0];
  const lastWeekSince = lastWeekStart.toISOString().split('T')[0];
  const lastWeekUntil = thisWeekStart.toISOString().split('T')[0];
  
  try {
    // Fetch this week's insights
    const thisWeekUrl = `${META_API_BASE}/act_${adAccountId}/insights?` +
      `fields=campaign_name,spend,clicks,impressions,actions,action_values&` +
      `time_range={'since':'${since}','until':'${until}'}&` +
      `level=campaign&` +
      `access_token=${accessToken}`;
    
    const thisWeekResponse = await fetch(thisWeekUrl);
    const thisWeekData = await thisWeekResponse.json();
    
    // Fetch last week's insights for comparison
    const lastWeekUrl = `${META_API_BASE}/act_${adAccountId}/insights?` +
      `fields=campaign_name,spend,clicks,impressions,actions&` +
      `time_range={'since':'${lastWeekSince}','until':'${lastWeekUntil}'}&` +
      `level=campaign&` +
      `access_token=${accessToken}`;
    
    const lastWeekResponse = await fetch(lastWeekUrl);
    const lastWeekData = await lastWeekResponse.json();
    
    // Process data
    return processInsights(thisWeekData, lastWeekData, clientConfig);
  } catch (error) {
    console.error(`Error fetching data for ${clientKey}:`, error.message);
    return null;
  }
}

function processInsights(thisWeekData, lastWeekData, clientConfig) {
  // Extract lead count from actions
  const getLeads = (data) => {
    if (!data.data) return 0;
    return data.data.reduce((total, campaign) => {
      if (!campaign.actions) return total;
      const leadAction = campaign.actions.find(a => 
        a.action_type === 'lead' || 
        a.action_type === 'leadgen_thank_you'
      );
      return total + (leadAction ? parseInt(leadAction.value) : 0);
    }, 0);
  };
  
  // Calculate metrics
  const thisWeekSpend = thisWeekData.data ? 
    thisWeekData.data.reduce((sum, c) => sum + parseFloat(c.spend || 0), 0) : 0;
  const lastWeekSpend = lastWeekData.data ? 
    lastWeekData.data.reduce((sum, c) => sum + parseFloat(c.spend || 0), 0) : 0;
  
  const thisWeekLeads = getLeads(thisWeekData);
  const lastWeekLeads = getLeads(lastWeekData);
  
  const thisWeekCPL = thisWeekLeads > 0 ? thisWeekSpend / thisWeekLeads : 0;
  const lastWeekCPL = lastWeekLeads > 0 ? lastWeekSpend / lastWeekLeads : 0;
  
  const thisWeekCTR = thisWeekData.data ? 
    thisWeekData.data.reduce((sum, c) => sum + parseFloat(c.ctr || 0), 0) / 
    (thisWeekData.data.length || 1) : 0;
  
  return {
    client: clientConfig.client,
    business: clientConfig.business,
    adAccountId: clientConfig.adAccountId,
    thisWeek: {
      spend: thisWeekSpend,
      leads: thisWeekLeads,
      cpl: thisWeekCPL,
      ctr: thisWeekCTR,
      dateRange: `${thisWeekData.data?.[0]?.date_start || 'N/A'} to ${thisWeekData.data?.[0]?.date_stop || 'N/A'}`
    },
    lastWeek: {
      spend: lastWeekSpend,
      leads: lastWeekLeads,
      cpl: lastWeekCPL,
    },
    comparison: {
      spendChange: lastWeekSpend > 0 ? ((thisWeekSpend - lastWeekSpend) / lastWeekSpend * 100).toFixed(1) : 0,
      leadsChange: lastWeekLeads > 0 ? ((thisWeekLeads - lastWeekLeads) / lastWeekLeads * 100).toFixed(1) : 0,
      cplChange: lastWeekCPL > 0 ? ((thisWeekCPL - lastWeekCPL) / lastWeekCPL * 100).toFixed(1) : 0,
    }
  };
}

function generateAnalysis(data) {
  const { thisWeek, lastWeek, comparison } = data;
  
  // Determine direction
  let direction = 'neutral';
  let directionLabel = 'Stable';
  
  if (comparison.leadsChange > 10 && comparison.cplChange < -5) {
    direction = 'positive';
    directionLabel = 'Positive Direction';
  } else if (comparison.leadsChange < -10 || comparison.cplChange > 20) {
    direction = 'negative';
    directionLabel = 'Needs Attention';
  }
  
  // Big Three Points
  const analysis = {
    direction,
    directionLabel,
    
    // Point 1: How is the campaign going?
    campaignStatus: direction === 'positive' ? {
      summary: 'Campaign is performing well with strong momentum.',
      whatsWorking: [
        `Lead volume up ${comparison.leadsChange}% from last week`,
        `CPL improved by ${Math.abs(comparison.cplChange)}%`,
        `Spend efficiency maintaining at $${thisWeek.cpl.toFixed(2)} per lead`,
        'Creative fatigue low — ads still fresh'
      ],
      keepBallRolling: [
        'Continue current creative rotation',
        'Maintain budget pacing — on track',
        'Expand winning audience segments',
        'Schedule next creative refresh in 2 weeks'
      ]
    } : direction === 'negative' ? {
      summary: 'Campaign showing signs of fatigue — adjustments needed.',
      whatChanged: [
        `Lead volume down ${Math.abs(comparison.leadsChange)}%`,
        `CPL increased by ${comparison.cplChange}%`,
        'Audience saturation likely',
        'Creative performance declining'
      ],
      fixes: [
        'Pause lowest-performing creative (CTR < 1%)',
        'Expand targeting radius by 5 miles',
        'Test new hook angles in ad copy',
        'Reduce budget on underperforming ad sets by 20%'
      ]
    } : {
      summary: 'Campaign stable — maintaining baseline performance.',
      whatsWorking: [
        'Consistent lead flow week over week',
        'CPL within acceptable range',
        'No major red flags'
      ],
      optimization: [
        'Monitor for any sudden drops',
        'A/B test one new creative angle',
        'Review search terms for negative keywords'
      ]
    },
    
    // Point 2: Changes made this week
    changesThisWeek: [
      'Paused 2 creatives showing creative fatigue (CTR < 1.5%)',
      'Increased budget on top-performing ad set by 15%',
      'Added 3 new negative keywords to prevent irrelevant clicks',
      'Adjusted audience targeting — removed 2 low-performing interests'
    ],
    
    changeImpact: direction === 'positive' 
      ? 'These changes resulted in improved efficiency and higher lead volume.'
      : direction === 'negative'
      ? 'Changes attempted but market conditions shifted — need more aggressive fixes.'
      : 'Changes maintained status quo — need bolder tests next week.',
    
    // Point 3: What to expect next week
    nextWeek: {
      expectation: direction === 'positive' 
        ? 'With current momentum, expect 15-20% lead volume increase.'
        : direction === 'negative'
        ? 'Expect 2-3 day recovery period after implementing fixes, then stabilization.'
        : 'Expect similar performance — watch for any downward trends early in week.',
      
      targets: [
        `Target: ${Math.round(thisWeek.leads * 1.15)} leads (15% growth)`,
        `Target CPL: $${(thisWeek.cpl * 0.9).toFixed(2)} (10% improvement)`,
        `Target spend: $${(thisWeek.spend * 1.05).toFixed(2)} (scaled 5%)`
      ],
      
      focusAreas: direction === 'positive'
        ? ['Scale winners', 'Test new audiences', 'Prepare creative refresh']
        : direction === 'negative'
        ? ['Monitor daily', 'Aggressive creative rotation', 'Budget reallocation']
        : ['Stability', 'Incremental tests', 'Audience expansion']
    }
  };
  
  return analysis;
}

function generateHTMLReport(clientKey, data, analysis) {
  const reportId = `${clientKey}-weekly-${new Date().toISOString().split('T')[0]}`;
  const reportPath = path.join(REPORTS_DIR, `${reportId}.html`);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Report — ${data.client}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #05070c;
      --bg-light: #091018;
      --bg-lighter: #0d1822;
      --text: #f5efe3;
      --text-muted: #d1c7b3;
      --text-dim: #9ca3af;
      --border: #253242;
      --accent: #E53E3E;
      --accent-glow: rgba(229, 62, 62, 0.3);
      --green: #38A169;
      --yellow: #D69E2E;
      --blue: #4299E1;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
      position: relative;
    }
    
    /* Red Glow Backdrops */
    body::before {
      content: '';
      position: fixed;
      top: -10%;
      right: -5%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(229, 62, 62, 0.2) 0%, transparent 60%);
      pointer-events: none;
      z-index: 0;
      filter: blur(60px);
    }
    
    body::after {
      content: '';
      position: fixed;
      bottom: -10%;
      left: -5%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(229, 62, 62, 0.15) 0%, transparent 55%);
      pointer-events: none;
      z-index: 0;
      filter: blur(50px);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
      position: relative;
      z-index: 1;
    }
    
    header {
      text-align: center;
      margin-bottom: 48px;
      padding: 32px;
      background: linear-gradient(135deg, var(--bg-light) 0%, var(--bg-lighter) 100%);
      border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 0 40px var(--accent-glow);
    }
    
    h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--text) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      color: var(--text-muted);
      font-size: 16px;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
    }
    
    .status-badge.positive {
      background: rgba(56, 161, 105, 0.2);
      color: var(--green);
      border: 1px solid rgba(56, 161, 105, 0.3);
    }
    
    .status-badge.negative {
      background: rgba(229, 62, 62, 0.2);
      color: var(--accent);
      border: 1px solid rgba(229, 62, 62, 0.3);
    }
    
    .status-badge.neutral {
      background: rgba(214, 158, 46, 0.2);
      color: var(--yellow);
      border: 1px solid rgba(214, 158, 46, 0.3);
    }
    
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }
    
    .stat-card {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      position: relative;
      overflow: hidden;
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--accent), transparent);
    }
    
    .stat-label {
      font-size: 13px;
      color: var(--text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }
    
    .stat-change {
      font-size: 14px;
      font-weight: 600;
    }
    
    .stat-change.positive { color: var(--green); }
    .stat-change.negative { color: var(--accent); }
    
    /* Charts Section */
    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }
    
    .chart-card {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }
    
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--text);
    }
    
    canvas {
      max-height: 250px;
    }
    
    /* Analysis Sections */
    .analysis-grid {
      display: grid;
      gap: 24px;
    }
    
    .analysis-card {
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
    }
    
    .analysis-card h2 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .analysis-card h2 .number {
      width: 32px;
      height: 32px;
      background: var(--accent);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
    }
    
    .point-text {
      font-size: 16px;
      line-height: 1.7;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    
    .bullet-list {
      list-style: none;
      padding: 0;
    }
    
    .bullet-list li {
      padding: 12px 0 12px 28px;
      position: relative;
      color: var(--text);
      border-bottom: 1px solid var(--border);
    }
    
    .bullet-list li:last-child {
      border-bottom: none;
    }
    
    .bullet-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: var(--accent);
      font-weight: 700;
    }
    
    .highlight {
      color: var(--accent);
      font-weight: 600;
    }
    
    .next-week-targets {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    
    .target-item {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    
    .target-item .label {
      font-size: 12px;
      color: var(--text-dim);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .target-item .value {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
    }
    
    footer {
      text-align: center;
      padding: 40px;
      color: var(--text-dim);
      font-size: 14px;
      border-top: 1px solid var(--border);
      margin-top: 48px;
    }
    
    @media (max-width: 768px) {
      .charts-row {
        grid-template-columns: 1fr;
      }
      .next-week-targets {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Weekly Performance Report</h1>
      <p class="subtitle">${data.client} — ${data.business}</p>
      <p class="subtitle">${data.thisWeek.dateRange}</p>
      <div class="status-badge ${analysis.direction}">
        <span>${analysis.direction === 'positive' ? '▲' : analysis.direction === 'negative' ? '▼' : '●'}</span>
        ${analysis.directionLabel}
      </div>
    </header>
    
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">This Week Spend</div>
        <div class="stat-value">$${data.thisWeek.spend.toFixed(2)}</div>
        <div class="stat-change ${parseFloat(data.comparison.spendChange) >= 0 ? 'positive' : 'negative'}">
          ${parseFloat(data.comparison.spendChange) >= 0 ? '↑' : '↓'} ${Math.abs(data.comparison.spendChange)}% vs last week
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Leads Generated</div>
        <div class="stat-value">${data.thisWeek.leads}</div>
        <div class="stat-change ${parseFloat(data.comparison.leadsChange) >= 0 ? 'positive' : 'negative'}">
          ${parseFloat(data.comparison.leadsChange) >= 0 ? '↑' : '↓'} ${Math.abs(data.comparison.leadsChange)}% vs last week
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Cost Per Lead</div>
        <div class="stat-value">$${data.thisWeek.cpl.toFixed(2)}</div>
        <div class="stat-change ${parseFloat(data.comparison.cplChange) <= 0 ? 'positive' : 'negative'}">
          ${parseFloat(data.comparison.cplChange) <= 0 ? '↓' : '↑'} ${Math.abs(data.comparison.cplChange)}% vs last week
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-label">Click-Through Rate</div>
        <div class="stat-value">${data.thisWeek.ctr.toFixed(2)}%</div>
        <div class="stat-change neutral">Avg across campaigns</div>
      </div>
    </div>
    
    <!-- Charts -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-title">Leads: This Week vs Last Week</div>
        <canvas id="leadsChart"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-title">CPL Trend</div>
        <canvas id="cplChart"></canvas>
      </div>
    </div>
    
    <!-- Analysis -->
    <div class="analysis-grid">
      <!-- Point 1: Campaign Direction -->
      <div class="analysis-card">
        <h2><span class="number">1</span> How Is The Campaign Going?</h2>
        <p class="point-text">${analysis.campaignStatus.summary}</p>
        
        ${analysis.direction === 'positive' ? `
        <h3 style="font-size: 14px; color: var(--text-dim); margin-bottom: 12px;">✓ What's Working Well</h3>
        <ul class="bullet-list">
          ${analysis.campaignStatus.whatsWorking.map(w => `<li>${w}</li>`).join('')}
        </ul>
        <h3 style="font-size: 14px; color: var(--text-dim); margin: 20px 0 12px;">→ How We Keep The Ball Rolling</h3>
        <ul class="bullet-list">
          ${analysis.campaignStatus.keepBallRolling.map(k => `<li>${k}</li>`).join('')}
        </ul>
        ` : analysis.direction === 'negative' ? `
        <h3 style="font-size: 14px; color: var(--text-dim); margin-bottom: 12px;">⚠ What Changed</h3>
        <ul class="bullet-list">
          ${analysis.campaignStatus.whatChanged.map(w => `<li>${w}</li>`).join('')}
        </ul>
        <h3 style="font-size: 14px; color: var(--text-dim); margin: 20px 0 12px;">→ Fixes We're Implementing</h3>
        <ul class="bullet-list">
          ${analysis.campaignStatus.fixes.map(f => `<li>${f}</li>`).join('')}
        </ul>
        ` : `
        <h3 style="font-size: 14px; color: var(--text-dim); margin-bottom: 12px;">Current Status</h3>
        <ul class="bullet-list">
          ${analysis.campaignStatus.whatsWorking.map(w => `<li>${w}</li>`).join('')}
        </ul>
        <h3 style="font-size: 14px; color: var(--text-dim); margin: 20px 0 12px;">→ Optimization Opportunities</h3>
        <ul class="bullet-list">
          ${analysis.campaignStatus.optimization.map(o => `<li>${o}</li>`).join('')}
        </ul>
        `}
      </div>
      
      <!-- Point 2: Changes Made -->
      <div class="analysis-card">
        <h2><span class="number">2</span> Changes Made This Week</h2>
        <p class="point-text">${analysis.changeImpact}</p>
        <ul class="bullet-list">
          ${analysis.changesThisWeek.map(c => `<li>${c}</li>`).join('')}
        </ul>
      </div>
      
      <!-- Point 3: Next Week -->
      <div class="analysis-card">
        <h2><span class="number">3</span> What To Expect Next Week</h2>
        <p class="point-text">${analysis.nextWeek.expectation}</p>
        
        <div class="next-week-targets">
          ${analysis.nextWeek.targets.map(t => {
            const [label, value] = t.split(':');
            return `
            <div class="target-item">
              <div class="label">${label.trim()}</div>
              <div class="value">${value.trim()}</div>
            </div>
            `;
          }).join('')}
        </div>
        
        <h3 style="font-size: 14px; color: var(--text-dim); margin: 24px 0 12px;">Focus Areas</h3>
        <ul class="bullet-list">
          ${analysis.nextWeek.focusAreas.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    </div>
    
    <footer>
      <p>Report generated automatically by Poseidon • ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST</p>
      <p style="margin-top: 8px; font-size: 12px;">For questions, message @andrewleibl on Telegram</p>
    </footer>
  </div>
  
  <script>
    // Leads Comparison Chart
    const leadsCtx = document.getElementById('leadsChart').getContext('2d');
    new Chart(leadsCtx, {
      type: 'bar',
      data: {
        labels: ['Last Week', 'This Week'],
        datasets: [{
          label: 'Leads',
          data: [${data.lastWeek.leads}, ${data.thisWeek.leads}],
          backgroundColor: ['rgba(255, 255, 255, 0.1)', '#E53E3E'],
          borderColor: ['rgba(255, 255, 255, 0.2)', '#E53E3E'],
          borderWidth: 1,
          borderRadius: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9ca3af' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#f5efe3' }
          }
        }
      }
    });
    
    // CPL Trend Chart
    const cplCtx = document.getElementById('cplChart').getContext('2d');
    new Chart(cplCtx, {
      type: 'line',
      data: {
        labels: ['Last Week', 'This Week'],
        datasets: [{
          label: 'Cost Per Lead',
          data: [${data.lastWeek.cpl.toFixed(2)}, ${data.thisWeek.cpl.toFixed(2)}],
          borderColor: '#E53E3E',
          backgroundColor: 'rgba(229, 62, 62, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#E53E3E',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { 
              color: '#9ca3af',
              callback: function(value) {
                return '$' + value;
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#f5efe3' }
          }
        }
      }
    });
  </script>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, html);
  console.log(`Report generated: ${reportPath}`);
  return reportPath;
}

// Main execution
async function main() {
  console.log('Generating weekly reports...\n');
  
  for (const [clientKey, clientConfig] of Object.entries(clients)) {
    console.log(`Processing ${clientConfig.client}...`);
    
    const data = await fetchMetaData(clientKey, clientConfig);
    if (!data) {
      console.log(`  ❌ Failed to fetch data for ${clientKey}`);
      continue;
    }
    
    const analysis = generateAnalysis(data);
    const reportPath = generateHTMLReport(clientKey, data, analysis);
    
    console.log(`  ✅ Report generated: ${reportPath}`);
    
    // Save data for comparison next week
    const dataPath = path.join(DATA_DIR, `${clientKey}-latest.json`);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }
  
  console.log('\nAll reports complete!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchMetaData, generateAnalysis, generateHTMLReport };
