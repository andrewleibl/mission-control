const { MetaAdsConnector } = require('./lib/meta-api-connector');

const connector = new MetaAdsConnector({
  accessToken: "EAAVKxhZB0TGQBRK184tv0BTvxnqBCAaAnwngZB9I2EGUknRM609SEPhEYK9Gl1psnhiZCupRvHGlRJpe9vkRjGOx9sHcNz4aSldcufeLAqB8FKzdO5PpipEi7quQ1ShmYoU2HSxfa3SE0x2xQJq86H7PqravO80b2VfmthnyLh3P1HCZAQ0otayC9FHsagIWQOZAMCxFIxVepGf1WWGi5LkiVT8Ti64kv",
  adAccountId: "1999744500951711"
});

async function test() {
  console.log('Testing connection to account 1999744500951711...\n');
  
  const connected = await connector.testConnection();
  if (!connected) {
    console.error('Failed to connect');
    process.exit(1);
  }
  
  console.log('\nFetching account insights...');
  const insights = await connector.getAccountInsights({ date_preset: 'this_month' });
  console.log('Account Insights:', JSON.stringify(insights, null, 2));
  
  console.log('\nFetching campaigns...');
  const campaigns = await connector.getCampaigns({ date_preset: 'this_month', limit: 10 });
  console.log(`Found ${campaigns.length} campaigns`);
  
  if (campaigns.length > 0) {
    console.log('\nFirst campaign:', campaigns[0].name);
    console.log('Campaign ID:', campaigns[0].id);
    console.log('Status:', campaigns[0].status);
  }
}

test().catch(console.error);
