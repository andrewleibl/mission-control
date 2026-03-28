#!/usr/bin/env node
/**
 * Daily Adjustment Generator for Apollo
 * Analyzes yesterday's Meta Ads performance and suggests 1-2 improvements
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'live-clients.json');
const MEMORY_PATH = '/Users/poseidon/.openclaw/workspace/memory';

function loadData() {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load data:', e.message);
    return null;
  }
}

function analyzePerformance(client) {
  const performance = client.performance || [];
  if (performance.length < 2) {
    return { canAnalyze: false, reason: 'Not enough historical data' };
  }

  const yesterday = performance[performance.length - 1];
  const dayBefore = performance[performance.length - 2];
  const avgCpl = client.spendMTD / client.leads;
  
  // Calculate trends
  const cplTrend = yesterday.leads > 0 && dayBefore.leads > 0 
    ? (yesterday.spend / yesterday.leads) - (dayBefore.spend / dayBefore.leads)
    : 0;
  
  const ctrTrend = yesterday.ctr - dayBefore.ctr;
  const spendTrend = yesterday.spend - dayBefore.spend;
  
  // Budget pacing
  const daysInMonth = 22; // Current day
  const budgetPace = (client.spendMTD / client.monthlyBudget) * 100;
  const expectedPace = (daysInMonth / 31) * 100;
  const paceDiff = budgetPace - expectedPace;
  
  return {
    canAnalyze: true,
    client: client.name,
    yesterday: {
      spend: yesterday.spend,
      leads: yesterday.leads,
      ctr: yesterday.ctr,
      cpl: yesterday.leads > 0 ? (yesterday.spend / yesterday.leads).toFixed(2) : 'N/A'
    },
    trends: {
      cpl: cplTrend,
      ctr: ctrTrend,
      spend: spendTrend
    },
    pacing: {
      current: budgetPace.toFixed(1),
      expected: expectedPace.toFixed(1),
      diff: paceDiff.toFixed(1)
    },
    avgCpl: avgCpl.toFixed(2)
  };
}

function generateRecommendations(analysis) {
  if (!analysis.canAnalyze) {
    return [analysis.reason];
  }

  const recommendations = [];
  const { yesterday, trends, pacing, avgCpl } = analysis;

  // Recommendation 1: Budget or Creative based on pacing
  if (parseFloat(pacing.diff) > 15) {
    recommendations.push({
      area: 'Budget Pacing',
      issue: `Spending ${pacing.diff}% faster than expected (${pacing.current}% vs ${pacing.expected}% expected)`,
      options: [
        `Reduce daily budget by 20% to stretch remaining $${(analysis.client?.monthlyBudget - analysis.client?.spendMTD).toFixed(0)} through month-end`,
        `Keep pace but pause lowest-performing creative to focus spend on winners`
      ]
    });
  } else if (parseFloat(pacing.diff) < -10) {
    recommendations.push({
      area: 'Budget Pacing',
      issue: `Under-pacing by ${Math.abs(parseFloat(pacing.diff))}% — not spending enough to hit goals`,
      options: [
        `Increase daily budget by 25% to capture more leads before month-end`,
        `Expand audience targeting to increase impression volume`
      ]
    });
  }

  // Recommendation 2: Creative or Targeting based on performance
  if (trends.cpl > 10) {
    recommendations.push({
      area: 'Creative Performance',
      issue: `CPL increased by $${trends.cpl.toFixed(2)} from previous day`,
      options: [
        `Refresh ad creative — fatigue likely setting in (frequency check recommended)`,
        `Narrow audience targeting to improve relevance and lower CPL`
      ]
    });
  } else if (trends.ctr < -0.3) {
    recommendations.push({
      area: 'Click-Through Rate',
      issue: `CTR dropped ${Math.abs(trends.ctr).toFixed(2)}% — hook losing effectiveness`,
      options: [
        `Test new headline/hook on top performer: "${yesterday.ctr}% is below benchmark"`,
        `Review ad placements — may be showing in low-quality inventory`
      ]
    });
  }

  // If no issues, give optimization recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      area: 'Scale Opportunity',
      issue: `Performance stable at $${avgCpl} CPL`,
      options: [
        `Increase budget 15% to capture more volume while maintaining efficiency`,
        `Duplicate top-performing creative with slight hook variation to test`
      ]
    });
  }

  return recommendations.slice(0, 2); // Max 2 recommendations
}

function formatMessage(clientName, recommendations) {
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  let message = `📊 **Daily Adjustment — ${clientName}**\n`;
  message += `*${date}*\n\n`;
  
  recommendations.forEach((rec, i) => {
    message += `**${i + 1}. ${rec.area}**\n`;
    message += `Issue: ${rec.issue}\n`;
    message += `Options:\n`;
    rec.options.forEach((opt, j) => {
      message += `  ${String.fromCharCode(65 + j)}) ${opt}\n`;
    });
    message += `\n`;
  });
  
  return message;
}

function main() {
  console.log('🔍 Analyzing yesterday\'s results...\n');
  
  const data = loadData();
  if (!data || !data.clients) {
    console.log('No data available');
    process.exit(1);
  }

  // Only analyze active clients with spend
  const activeClients = data.clients.filter(c => c.spendMTD > 0);
  
  if (activeClients.length === 0) {
    console.log('No active campaigns to analyze');
    process.exit(0);
  }

  const results = [];
  
  for (const client of activeClients) {
    const analysis = analyzePerformance(client);
    const recommendations = generateRecommendations(analysis);
    
    if (recommendations.length > 0 && typeof recommendations[0] === 'object') {
      const message = formatMessage(client.name, recommendations);
      results.push({
        client: client.id,
        message,
        recommendations
      });
      console.log(message);
      console.log('---\n');
    }
  }

  // Save to memory file
  const today = new Date().toISOString().split('T')[0];
  const memoryFile = path.join(MEMORY_PATH, `${today}.md`);
  
  let memoryContent = `# Daily Adjustments — ${today}\n\n`;
  results.forEach(r => {
    memoryContent += r.message + '\n---\n\n';
  });
  
  fs.appendFileSync(memoryFile, memoryContent);
  console.log(`✅ Saved to ${memoryFile}`);
  
  return results;
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { analyzePerformance, generateRecommendations, formatMessage };
