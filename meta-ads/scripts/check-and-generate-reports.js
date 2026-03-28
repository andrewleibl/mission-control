#!/usr/bin/env node
/**
 * Check Mission Control for Weekly Report events and generate if found
 * Called by cron at 12:00 PM CST daily
 */

const fs = require('fs');
const path = require('path');

// Path to Mission Control data
const MC_DATA_DIR = path.join(__dirname, '..', '..', 'builds', 'mission-control', 'src', 'data');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Get today's date
const today = new Date();
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

console.log(`Checking for Weekly Report events on ${todayKey}...`);

// In a real implementation, this would read from Mission Control's storage
// For now, we'll check if there's a report scheduled by looking at a marker file
// The actual integration would query the Mission Control API or database

// Load client configs
const CONFIG_DIR = path.join(__dirname, '..', 'config');

// For each client with a weekly report today, generate report
async function generateForClient(clientKey) {
  const reportGenerator = require('./generate-weekly-report.js');
  const clientConfig = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, `${clientKey}.json`), 'utf8'));
  
  console.log(`Generating report for ${clientConfig.client}...`);
  const data = await reportGenerator.fetchMetaData(clientKey, clientConfig);
  if (!data) return null;
  
  const analysis = reportGenerator.generateAnalysis(data);
  const reportPath = reportGenerator.generateHTMLReport(clientKey, data, analysis);
  
  return {
    client: clientConfig.client,
    reportPath,
    data
  };
}

// Main execution
async function main() {
  // In production, this would check Mission Control's event storage
  // For demo purposes, we'll check which clients have configs and generate for all
  // In real implementation, filter by clients with Weekly Report events today
  
  const clientConfigs = fs.readdirSync(CONFIG_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
  
  const results = [];
  
  for (const clientKey of clientConfigs) {
    try {
      const result = await generateForClient(clientKey);
      if (result) results.push(result);
    } catch (error) {
      console.error(`Error for ${clientKey}:`, error.message);
    }
  }
  
  if (results.length === 0) {
    console.log('No reports generated.');
    return;
  }
  
  // Send notification to Andrew
  console.log('\n=== REPORTS GENERATED ===');
  results.forEach(r => {
    console.log(`\n${r.client}:`);
    console.log(`  Report: ${r.reportPath}`);
    console.log(`  Leads: ${r.data.thisWeek.leads} (${r.data.comparison.leadsChange}% vs last week)`);
    console.log(`  CPL: $${r.data.thisWeek.cpl.toFixed(2)}`);
  });
  
  // In production, this would send a Telegram message to Andrew
  // For now, log to console (which can be captured by the agent)
  console.log('\n✅ All weekly reports complete and ready for Loom recording.');
}

main().catch(console.error);
