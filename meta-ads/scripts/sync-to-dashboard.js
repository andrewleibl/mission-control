#!/usr/bin/env node
/**
 * Apollo Data Sync
 * Pulls live Meta Ads data and saves for Mission Control dashboard
 */

const { fetchLiveClientData, getAllClientsOverview } = require('../lib/dashboard-connector');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function sync() {
  console.log('🔄 Apollo Data Sync Starting...\n');
  
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Fetch Hector's live data
    console.log('📊 Fetching Hector Huizar (live)...');
    const hectorData = await fetchLiveClientData('hector-huizar');
    
    // Add id field to Hector's data
    hectorData.id = 'hector-huizar';
    
    // Save individual client data
    fs.writeFileSync(
      path.join(DATA_DIR, 'hector-huizar.json'),
      JSON.stringify(hectorData, null, 2)
    );
    console.log('✅ Hector data saved');
    
    // Create clients overview (only Hector has live data)
    const overview = {
      clients: [
        hectorData,
        // Mock data for PJ and Ricardo until connected
        {
          id: 'pj-sparks',
          name: 'PJ Sparks',
          brand: 'We Do Hardscape',
          accountStatus: 'Stable',
          monthlyBudget: 5000,
          spendMTD: 0,
          leads: 0,
          cpl: 0,
          ctr: 0,
          cpc: 0,
          frequency: 0,
          primaryObjective: 'Pending Meta connection',
          description: 'Meta Ads connection pending',
          lastUpdated: new Date().toISOString(),
          audienceNote: 'Awaiting API token',
          topLine: { impressions: 0, clicks: 0, leads: 0, frequency: 0 },
          performance: [],
          campaigns: [],
          creatives: []
        },
        {
          id: 'ricardo-madera',
          name: 'Ricardo Madera',
          brand: 'Madera Landscape',
          accountStatus: 'Needs Attention',
          monthlyBudget: 5000,
          spendMTD: 0,
          leads: 0,
          cpl: 0,
          ctr: 0,
          cpc: 0,
          frequency: 0,
          primaryObjective: 'Pending Meta connection',
          description: 'Meta Ads connection pending',
          lastUpdated: new Date().toISOString(),
          audienceNote: 'Awaiting API token',
          topLine: { impressions: 0, clicks: 0, leads: 0, frequency: 0 },
          performance: [],
          campaigns: [],
          creatives: []
        }
      ],
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(DATA_DIR, 'live-clients.json'),
      JSON.stringify(overview, null, 2)
    );
    console.log('✅ Clients overview saved\n');
    
    // Print summary
    console.log('📈 Hector Live Summary:');
    console.log(`  Spend MTD: $${hectorData.spendMTD.toLocaleString()}`);
    console.log(`  Leads: ${hectorData.leads}`);
    console.log(`  CPL: $${hectorData.cpl}`);
    console.log(`  Status: ${hectorData.accountStatus}\n`);
    
    console.log('✅ Sync complete!');
    console.log(`📁 Data saved to: ${DATA_DIR}`);
    
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
}

sync();
