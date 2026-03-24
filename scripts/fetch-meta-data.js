// Fetch Meta Ads data for PJ and Ricardo
const META_TOKEN = 'EAAVIlOFSQp4BRMHThrjriZCCA5XwFkNKx4Ib5gz0JBS8ZBt1sFvIWXyHsnchDpMgzZB1lIThuO6VMgTkjzqvAtvJhMDFB2iOG9gXXQ2I39Qwjk8KiZCpooZA0c819lBrds5GyST5vMLxp5znZBw1eMqamzGtLnDtPICXSYkuBgK2xBnskIsUzFCzZCxZBKeyZAbF3V29I'

const ACCOUNTS = [
  { id: 'pj-sparks', name: 'PJ Sparks', brand: 'We Do Hardscape', accountId: '78776600' },
  { id: 'ricardo-madera', name: 'Ricardo Madera', brand: 'Madera Landscape', accountId: '1472634561111079' }
]

async function fetchAccountData(account) {
  const since = '2026-03-01'
  const until = '2026-03-23'
  
  const url = `https://graph.facebook.com/v18.0/act_${account.accountId}/insights?` + 
    `fields=campaign_id,campaign_name,spend,clicks,ctr,actions,action_values,cost_per_action_type,frequency,impressions&` +
    `time_range={'since':'${since}','until':'${until}'}&` +
    `level=campaign&` +
    `access_token=${META_TOKEN}`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.error) {
      console.error(`Error for ${account.name}:`, data.error.message)
      return null
    }
    
    return { account, data: data.data || [] }
  } catch (e) {
    console.error(`Failed to fetch ${account.name}:`, e.message)
    return null
  }
}

async function fetchCampaigns(account) {
  const url = `https://graph.facebook.com/v18.0/act_${account.accountId}/campaigns?` +
    `fields=id,name,status,objective,daily_budget,budget_remaining&` +
    `access_token=${META_TOKEN}`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    return data.data || []
  } catch (e) {
    return []
  }
}

function countLeads(actions) {
  if (!actions) return 0
  // CRITICAL: Only count exact 'lead' action type
  const leadAction = actions.find(a => a.action_type === 'lead')
  return leadAction ? parseInt(leadAction.value) : 0
}

async function main() {
  console.log('Fetching Meta Ads data...\n')
  
  for (const account of ACCOUNTS) {
    console.log(`\n=== ${account.name} (${account.accountId}) ===`)
    
    const insights = await fetchAccountData(account)
    const campaigns = await fetchCampaigns(account)
    
    if (!insights || !insights.data.length) {
      console.log('No data or no campaigns running')
      continue
    }
    
    // Aggregate data
    let totalSpend = 0
    let totalLeads = 0
    let totalImpressions = 0
    let totalClicks = 0
    let totalFrequency = 0
    
    insights.data.forEach(row => {
      totalSpend += parseFloat(row.spend || 0)
      totalLeads += countLeads(row.actions)
      totalImpressions += parseInt(row.impressions || 0)
      totalClicks += parseInt(row.clicks || 0)
      totalFrequency += parseFloat(row.frequency || 0)
    })
    
    const avgFrequency = insights.data.length > 0 ? totalFrequency / insights.data.length : 0
    const cpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : 'N/A'
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0
    
    console.log(`Spend MTD: $${totalSpend.toFixed(2)}`)
    console.log(`Leads: ${totalLeads}`)
    console.log(`CPL: $${cpl}`)
    console.log(`Impressions: ${totalImpressions.toLocaleString()}`)
    console.log(`Clicks: ${totalClicks}`)
    console.log(`CTR: ${ctr}%`)
    console.log(`Frequency: ${avgFrequency.toFixed(2)}`)
    console.log(`Active Campaigns: ${campaigns.filter(c => c.status === 'ACTIVE').length}`)
    
    campaigns.slice(0, 3).forEach(c => {
      console.log(`  - ${c.name} (${c.status})`)
    })
  }
}

main().catch(console.error)
