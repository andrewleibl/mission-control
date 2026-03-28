/**
 * Meta Marketing API Connector for Apollo
 * Handles OAuth, API calls, and data parsing for Meta Ads accounts
 */

const META_API_VERSION = 'v18.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

class MetaAdsConnector {
  constructor(config) {
    this.config = config;
    this.accessToken = config.accessToken;
    this.adAccountId = config.adAccountId;
  }

  /**
   * Fetch campaigns for the ad account
   * @param {Object} params - Filter params (date_preset, limit, etc)
   * @returns {Promise<Array>} Campaigns array
   */
  async getCampaigns(params = {}) {
    const defaultParams = {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,insights{spend,impressions,clicks,ctr,cpc,cpp,cpm,actions,cost_per_action_type}',
      date_preset: 'last_30d',
      limit: 100,
      ...params
    };

    const url = `${META_API_BASE}/act_${this.adAccountId}/campaigns?${new URLSearchParams(defaultParams)}&access_token=${this.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data.data || [];
  }

  /**
   * Fetch ad sets for a campaign
   * @param {string} campaignId - Campaign ID
   * @param {Object} params - Filter params
   * @returns {Promise<Array>} Ad sets array
   */
  async getAdSets(campaignId, params = {}) {
    const defaultParams = {
      fields: 'id,name,status,daily_budget,lifetime_budget,targeting,attribution_spec,insights{spend,impressions,clicks,ctr,cpc,cpp,cpm,actions,cost_per_action_type}',
      ...params
    };

    const url = `${META_API_BASE}/${campaignId}/adsets?${new URLSearchParams(defaultParams)}&access_token=${this.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data.data || [];
  }

  /**
   * Fetch ads for an ad set
   * @param {string} adSetId - Ad Set ID
   * @param {Object} params - Filter params
   * @returns {Promise<Array>} Ads array
   */
  async getAds(adSetId, params = {}) {
    const defaultParams = {
      fields: 'id,name,status,creative{effective_object_story_id,object_story_spec},insights{spend,impressions,clicks,ctr,cpc,cpp,cpm,actions,cost_per_action_type,conversions}',
      ...params
    };

    const url = `${META_API_BASE}/${adSetId}/ads?${new URLSearchParams(defaultParams)}&access_token=${this.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data.data || [];
  }

  /**
   * Get insights (performance data) with breakdowns
   * @param {string} objectId - Campaign, AdSet, or Ad ID
   * @param {string} objectType - 'campaign', 'adset', or 'ad'
   * @param {Object} params - Query params including date_range, breakdowns
   * @returns {Promise<Array>} Insights data
   */
  async getInsights(objectId, objectType = 'campaign', params = {}) {
    const defaultParams = {
      fields: 'spend,impressions,clicks,ctr,cpc,cpp,cpm,actions,cost_per_action_type,conversions,conversion_values,frequency',
      date_preset: 'last_7d',
      level: objectType,
      ...params
    };

    // Support for breakdowns (age, gender, country, etc)
    if (params.breakdowns) {
      defaultParams.breakdowns = params.breakdowns.join(',');
    }

    const url = `${META_API_BASE}/${objectId}/insights?${new URLSearchParams(defaultParams)}&access_token=${this.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data.data || [];
  }

  /**
   * Make changes to a campaign (pause, activate, update budget)
   * @param {string} campaignId - Campaign ID
   * @param {Object} changes - Fields to update
   * @returns {Promise<Object>} Updated campaign
   */
  async updateCampaign(campaignId, changes) {
    const url = `${META_API_BASE}/${campaignId}?access_token=${this.accessToken}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes)
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data;
  }

  /**
   * Fetch account-level insights (totals across all campaigns)
   * @param {Object} params - Date range, etc
   * @returns {Promise<Object>} Account insights
   */
  async getAccountInsights(params = {}) {
    const defaultParams = {
      fields: 'spend,impressions,clicks,ctr,cpc,cpp,cpm,actions,cost_per_action_type,conversions,conversion_values,frequency',
      date_preset: 'last_7d',
      ...params
    };

    const url = `${META_API_BASE}/act_${this.adAccountId}/insights?${new URLSearchParams(defaultParams)}&access_token=${this.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Meta API Error: ${data.error.message}`);
    }

    return data.data?.[0] || {};
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connected
   */
  async testConnection() {
    try {
      const url = `${META_API_BASE}/act_${this.adAccountId}?fields=name,account_status&access_token=${this.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        console.error('Connection test failed:', data.error.message);
        return false;
      }
      
      console.log(`✅ Connected to: ${data.name} (Status: ${data.account_status})`);
      return true;
    } catch (error) {
      console.error('Connection test error:', error.message);
      return false;
    }
  }
}

module.exports = { MetaAdsConnector };
