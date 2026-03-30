#!/bin/bash
# Test Meta Marketing API connection for PJ Sparks

AD_ACCOUNT_ID="act_78776600"
TOKEN="$META_ACCESS_TOKEN"

echo "Testing Meta Marketing API connection..."
echo "Ad Account: $AD_ACCOUNT_ID"
echo ""

if [ -z "$TOKEN" ]; then
  echo "ERROR: META_ACCESS_TOKEN not set"
  exit 1
fi

# Make API call
curl -s "https://graph.facebook.com/v19.0/$AD_ACCOUNT_ID/insights?fields=campaign_name,spend,ctr,cpc,cost_per_action_type,actions&date_preset=last_7d&level=campaign&access_token=$TOKEN"
