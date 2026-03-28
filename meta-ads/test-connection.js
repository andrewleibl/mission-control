/**
 * Test script for Meta API connection
 * Run after getting access token: node test-connection.js
 */

const { MetaAdsConnector } = require('./lib/meta-api-connector');

// Load config
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config', 'hector-huizar.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Check for token
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ META_ACCESS_TOKEN not set');
  console.log('\nSet token with:');
  console.log('  export META_ACCESS_TOKEN="your_token_here"');
  console.log('  node test-connection.js\n');
  process.exit(1);
}

async function main() {
  console.log('🔥 Apollo Meta API Test\n');
  console.log(`Client: ${config.client}`);
  console.log(`Ad Account: ${config.adAccountId}`);
  console.log('');

  const connector = new MetaAdsConnector({
    accessToken: ACCESS_TOKEN,
    adAccountId: config.adAccountId
  });

  // Test connection
  console.log('Testing connection...');
  const connected = await connector.testConnection();
  
  if (!connected) {
    console.error('❌ Failed to connect');
    process.exit(1);
  }

  // Fetch campaigns
  console.log('\nFetching campaigns (last 7 days)...\n');
  const campaigns = await connector.getCampaigns({
    date_preset: 'last_7d',
    limit: 10
  });

  if (campaigns.length === 0) {
    console.log('No active campaigns found.');
  } else {
    console.log(`Found ${campaigns.length} campaign(s):\n`);
    
    campaigns.forEach((campaign, i) => {
      const insights = campaign.insights?.data?.[0] || {};
      console.log(`${i + 1}. ${campaign.name}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Objective: ${campaign.objective}`);
      console.log(`   Spend: $${insights.spend || '0'}`);
      console.log(`   Impressions: ${insights.impressions || '0'}`);
      console.log(`   Clicks: ${insights.clicks || '0'}`);
      console.log(`   CTR: ${insights.ctr || '0'}%`);
      console.log('');
    });
  }

  // Fetch account-level insights
  console.log('Fetching account insights...');
  const accountInsights = await connector.getAccountInsights({
    date_preset: 'last_7d'
  });

  console.log('\n📊 Account Summary (Last 7 Days):');
  console.log(`   Total Spend: $${accountInsights.spend || '0'}`);
  console.log(`   Impressions: ${accountInsights.impressions || '0'}`);
  console.log(`   Clicks: ${accountInsights.clicks || '0'}`);
  console.log(`   CTR: ${accountInsights.ctr || '0'}%`);
  console.log(`   CPC: $${accountInsights.cpc || '0'}`);
  console.log(`   Frequency: ${accountInsights.frequency || '0'}`);

  console.log('\n✅ Connection test complete!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
