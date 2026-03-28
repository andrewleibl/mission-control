#!/usr/bin/env node

const { MetaAdsConnector } = require('./lib/meta-api-connector');

// Load client configs
const clients = {
  'pj-sparks': require('./config/pj-sparks.json'),
  'hector-huizar': require('./config/hector-huizar.json')
};

async function testClient(name, config) {
  console.log(`\n=== Testing ${name} ===`);
  console.log(`Account ID: act_${config.adAccountId}`);
  
  const connector = new MetaAdsConnector({
    accessToken: config.accessToken,
    adAccountId: config.adAccountId
  });
  
  try {
    // Get this week's insights
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const since = weekAgo.toISOString().split('T')[0];
    const until = today.toISOString().split('T')[0];
    
    console.log(`Fetching insights from ${since} to ${until}...`);
    
    const url = `https://graph.facebook.com/v18.0/act_${config.adAccountId}/insights?` +
      `fields=campaign_name,spend,impressions,clicks,actions&` +
      `time_range={'since':'${since}','until':'${until}'}&` +
      `level=campaign&` +
      `access_token=${config.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ API Error:', data.error.message);
      return false;
    }
    
    console.log('✅ API Connection Successful!');
    
    if (data.data && data.data.length > 0) {
      const totalSpend = data.data.reduce((sum, c) => sum + parseFloat(c.spend || 0), 0);
      const totalClicks = data.data.reduce((sum, c) => sum + parseInt(c.clicks || 0), 0);
      
      // Count leads
      let totalLeads = 0;
      data.data.forEach(c => {
        if (c.actions) {
          const leadAction = c.actions.find(a => 
            a.action_type === 'lead' || a.action_type === 'leadgen_thank_you'
          );
          if (leadAction) totalLeads += parseInt(leadAction.value);
        }
      });
      
      console.log(`📊 This Week's Data:`);
      console.log(`  Spend: $${totalSpend.toFixed(2)}`);
      console.log(`  Clicks: ${totalClicks}`);
      console.log(`  Leads: ${totalLeads}`);
      console.log(`  CPL: $${totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : 'N/A'}`);
    } else {
      console.log('ℹ️ No campaign data for this period');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing Meta API Connections for Weekly Report Generator...\n');
  
  const results = [];
  
  for (const [name, config] of Object.entries(clients)) {
    const success = await testClient(name, config);
    results.push({ name, success });
  }
  
  console.log('\n=== SUMMARY ===');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });
  
  const allSuccess = results.every(r => r.success);
  process.exit(allSuccess ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
