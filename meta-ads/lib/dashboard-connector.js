/**
 * Apollo Dashboard Connector
 * Fetches live Meta Ads data and transforms for Mission Control dashboard
 */

const { MetaAdsConnector } = require('./meta-api-connector');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'config');

/**
 * Load client configuration
 */
function loadClientConfig(clientId) {
  const configPath = path.join(CONFIG_DIR, `${clientId}.json`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found: ${clientId}`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Transform Meta API data to dashboard format
 */
function transformToDashboardFormat(rawData, clientConfig) {
  const insights = rawData.insights?.data?.[0] || {};
  const campaigns = rawData.campaigns?.data || [];
  const adSets = rawData.adSets?.data || [];
  const ads = rawData.ads?.data || [];

  // Calculate metrics
  const spend = parseFloat(insights.spend) || 0;
  const impressions = parseInt(insights.impressions) || 0;
  const clicks = parseInt(insights.clicks) || 0;
  const ctr = parseFloat(insights.ctr) || 0;
  const cpc = parseFloat(insights.cpc) || 0;
  const frequency = parseFloat(insights.frequency) || 0;

  // Calculate leads - ONLY count action_type === 'lead' (actual form submissions)
  // WARNING: Other lead-related actions like 'offsite_complete_registration_add_meta_leads',
  // 'offsite_search_add_meta_leads', 'onsite_conversion.lead_grouped' are NOT actual form fills
  const actions = insights.actions || [];
  const leads = actions
    .filter(a => a.action_type === 'lead')
    .reduce((sum, a) => sum + parseInt(a.value), 0) || 0;

  const cpl = leads > 0 ? Math.round(spend / leads) : 0;

  // Determine status based on performance
  let accountStatus = 'Stable';
  if (cpa > 0 && cpa < 50) accountStatus = 'Scaling';
  if (cpa > 80 || frequency > 3) accountStatus = 'Needs Attention';

  // Transform campaigns
  const campaignRows = campaigns.map(c => {
    const cInsights = c.insights?.data?.[0] || {};
    const cSpend = parseFloat(cInsights.spend) || 0;
    const cRevenue = cSpend * 3; // Estimated ROAS placeholder
    return {
      id: c.id,
      name: c.name,
      objective: c.objective?.replace('_', ' ') || 'Leads',
      status: c.status === 'ACTIVE' ? 'Active' : c.status === 'PAUSED' ? 'Paused' : 'Learning',
      spend: cSpend,
      revenue: cRevenue,
      roas: cRevenue / Math.max(cSpend, 1),
      cpl: leads > 0 ? cSpend / leads : 0
    };
  });

  // Transform ads (creatives)
  const creativeRows = ads.map(ad => {
    const aInsights = ad.insights?.data?.[0] || {};
    const aSpend = parseFloat(aInsights.spend) || 0;
    const aClicks = parseInt(aInsights.clicks) || 0;
    const aImpressions = parseInt(aInsights.impressions) || 0;
    const aCtr = aImpressions > 0 ? (aClicks / aImpressions) * 100 : 0;
    const aLeads = (aInsights.actions || [])
      .filter(a => a.action_type?.includes('lead'))
      .reduce((sum, a) => sum + parseInt(a.value), 0) || 0;

    return {
      id: ad.id,
      name: ad.name,
      format: ad.creative?.object_story_spec?.video_data ? 'Video' : 'Image',
      hook: ad.name.slice(0, 60) + (ad.name.length > 60 ? '...' : ''),
      spend: aSpend,
      ctr: aCtr,
      cpa: aLeads > 0 ? aSpend / aLeads : 0,
      thumb: ad.name.slice(0, 3).toUpperCase()
    };
  });

  return {
    id: clientConfig.id,
    name: clientConfig.client,
    brand: clientConfig.business,
    accountStatus,
    monthlyBudget: clientConfig.monthlyBudget || 10000,
    spendMTD: spend,
    leads,
    cpl, // Cost Per Lead - your key metric
    ctr: parseFloat(ctr.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    frequency: parseFloat(frequency.toFixed(2)),
    primaryObjective: 'Lead Generation',
    description: `Meta Ads campaign for ${clientConfig.business}`,
    lastUpdated: new Date().toISOString(),
    audienceNote: getAudienceNote(frequency, cpl),
    topLine: {
      impressions,
      clicks,
      leads,
      frequency
    },
    performance: generatePerformanceHistory(spend, leads, ctr),
    campaigns: campaignRows,
    creatives: creativeRows
  };
}

function getAudienceNote(frequency, cpl) {
  if (frequency > 3) return 'Frequency elevated — refresh creative or expand audience';
  if (cpl > 50) return 'CPL above target — review targeting and creative';
  if (cpl < 25) return 'CPL excellent — scale budget if possible';
  return 'Performance stable — continue current strategy';
}

function generatePerformanceHistory(currentSpend, currentLeads, currentCtr) {
  // Generate last 6 data points for charts
  const history = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i * 4);
    const factor = 1 - (i * 0.05); // Slight variation
    const periodLeads = Math.max(1, Math.round(currentLeads * factor / 6));
    const periodSpend = Math.round(currentSpend * factor / 6);
    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      spend: periodSpend,
      cpl: periodLeads > 0 ? Math.round(periodSpend / periodLeads) : 0,
      leads: periodLeads,
      ctr: parseFloat((currentCtr * (0.9 + Math.random() * 0.2)).toFixed(2))
    });
  }
  return history;
}

/**
 * Fetch live data for a client
 */
async function fetchLiveClientData(clientId) {
  const config = loadClientConfig(clientId);
  
  if (!config.accessToken) {
    throw new Error(`No access token for ${clientId}`);
  }

  const connector = new MetaAdsConnector({
    accessToken: config.accessToken,
    adAccountId: config.adAccountId
  });

  // Fetch all data in parallel
  const [campaigns, accountInsights] = await Promise.all([
    connector.getCampaigns({ date_preset: 'last_30d', limit: 50 }),
    connector.getAccountInsights({ date_preset: 'last_30d' })
  ]);

  // Fetch creatives for each campaign
  const campaignsWithCreatives = await Promise.all(
    campaigns.map(async (campaign) => {
      const adSets = await connector.getAdSets(campaign.id, { limit: 10 });
      const ads = [];
      for (const adSet of adSets.slice(0, 3)) {
        const adSetAds = await connector.getAds(adSet.id, { limit: 5 });
        ads.push(...adSetAds);
      }
      return { ...campaign, adSets, ads };
    })
  );

  // Flatten all ads
  const allAds = campaignsWithCreatives.flatMap(c => c.ads || []);

  return transformToDashboardFormat({
    campaigns: { data: campaigns },
    adSets: { data: [] },
    ads: { data: allAds },
    insights: { data: [accountInsights] }
  }, config);
}

/**
 * Get all clients for overview
 */
async function getAllClientsOverview() {
  const clientIds = ['hector-huizar']; // Add pj-sparks, ricardo-madera when ready
  
  const clients = await Promise.all(
    clientIds.map(async (id) => {
      try {
        return await fetchLiveClientData(id);
      } catch (err) {
        console.error(`Failed to fetch ${id}:`, err.message);
        return null;
      }
    })
  );

  return clients.filter(Boolean);
}

module.exports = {
  fetchLiveClientData,
  getAllClientsOverview
};
