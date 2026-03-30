// Test Meta Marketing API connection
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = 'act_78776600'; // PJ Sparks

if (!META_ACCESS_TOKEN) {
  console.error('ERROR: META_ACCESS_TOKEN not found in environment');
  process.exit(1);
}

console.log('Testing Meta Marketing API connection...');
console.log('Ad Account:', AD_ACCOUNT_ID);
console.log('Token available:', META_ACCESS_TOKEN.substring(0, 10) + '...');

// Test API call
curl -X GET "https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/insights?fields=campaign_name,spend,ctr,cpc,cost_per_action_type,actions&date_preset=last_7d&level=campaign&access_token=${META_ACCESS_TOKEN}"
  .then(response => response.json())
  .then(data => {
    console.log('SUCCESS! API Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('API Error:', error);
  });
