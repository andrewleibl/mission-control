export type MetaAdsOverview = {
  id: string
  name: string
  brand: string
  accountStatus: 'Scaling' | 'Stable' | 'Needs Attention'
  monthlyBudget: number
  spendMTD: number
  revenueMTD: number
  roas: number
  cpa: number
  leads: number
  primaryObjective: string
}

export type PerformancePoint = {
  date: string
  spend: number
  revenue: number
  leads: number
  ctr: number
}

export type CampaignRow = {
  id: string
  name: string
  objective: string
  status: 'Active' | 'Learning' | 'Paused'
  spend: number
  revenue: number
  roas: number
  cpl: number
}

export type CreativeRow = {
  id: string
  name: string
  format: string
  hook: string
  spend: number
  ctr: number
  cpa: number
  thumb: string
}

export type MetaAdsClientDetail = MetaAdsOverview & {
  description: string
  lastUpdated: string
  audienceNote: string
  topLine: {
    impressions: number
    clicks: number
    purchases: number
    frequency: number
  }
  performance: PerformancePoint[]
  campaigns: CampaignRow[]
  creatives: CreativeRow[]
}

export const metaAdsClients: MetaAdsClientDetail[] = [
  {
    id: 'hector-huizar',
    name: 'Hector Huizar',
    brand: 'Huizar Injury Law',
    accountStatus: 'Scaling',
    monthlyBudget: 18000,
    spendMTD: 12640,
    revenueMTD: 61200,
    roas: 4.84,
    cpa: 74,
    leads: 171,
    primaryObjective: 'Qualified personal injury consultations',
    description: 'Lead generation focused on Spanish-first accident and injury cases across Houston and surrounding metros.',
    lastUpdated: '2026-03-22T09:00:00.000Z',
    audienceNote: 'Broad + engaged-video retargeting is producing the highest booked consult rate.',
    topLine: {
      impressions: 382400,
      clicks: 11592,
      purchases: 171,
      frequency: 2.7,
    },
    performance: [
      { date: 'Mar 1', spend: 620, revenue: 2480, leads: 8, ctr: 2.1 },
      { date: 'Mar 5', spend: 710, revenue: 3190, leads: 10, ctr: 2.4 },
      { date: 'Mar 9', spend: 780, revenue: 3740, leads: 12, ctr: 2.6 },
      { date: 'Mar 13', spend: 860, revenue: 4180, leads: 14, ctr: 2.8 },
      { date: 'Mar 17', spend: 930, revenue: 4510, leads: 16, ctr: 2.9 },
      { date: 'Mar 21', spend: 1010, revenue: 4920, leads: 18, ctr: 3.1 },
    ],
    campaigns: [
      { id: 'hh-1', name: 'Houston PI - Broad', objective: 'Leads', status: 'Active', spend: 5480, revenue: 27800, roas: 5.07, cpl: 68 },
      { id: 'hh-2', name: 'Spanish Retargeting', objective: 'Leads', status: 'Active', spend: 3240, revenue: 16900, roas: 5.22, cpl: 59 },
      { id: 'hh-3', name: 'MVA Lookalikes', objective: 'Leads', status: 'Learning', spend: 1920, revenue: 8300, roas: 4.32, cpl: 82 },
    ],
    creatives: [
      { id: 'hh-c1', name: 'Attorney POV UGC', format: 'Video', hook: 'Injured in a wreck? Here is what to do in the first 24 hours.', spend: 2410, ctr: 3.8, cpa: 61, thumb: 'POV' },
      { id: 'hh-c2', name: 'Settlement Carousel', format: 'Carousel', hook: 'Recent case wins with fast claim response messaging.', spend: 1870, ctr: 2.9, cpa: 72, thumb: 'SET' },
      { id: 'hh-c3', name: 'Spanish FAQ Reel', format: 'Reel', hook: 'Three questions clients ask before filing a claim.', spend: 1620, ctr: 3.4, cpa: 66, thumb: 'FAQ' },
    ],
  },
  {
    id: 'pj-sparks',
    name: 'PJ Sparks',
    brand: 'Sparks Roofing & Solar',
    accountStatus: 'Stable',
    monthlyBudget: 14000,
    spendMTD: 9320,
    revenueMTD: 32840,
    roas: 3.52,
    cpa: 96,
    leads: 97,
    primaryObjective: 'Storm repair and solar estimate requests',
    description: 'Regional service lead generation mixing emergency roof repair demand capture with solar financing offers.',
    lastUpdated: '2026-03-22T09:00:00.000Z',
    audienceNote: 'Creative fatigue is starting to show on older storm claim ads; fresh proof-driven video is needed.',
    topLine: {
      impressions: 291800,
      clicks: 8024,
      purchases: 97,
      frequency: 2.2,
    },
    performance: [
      { date: 'Mar 1', spend: 480, revenue: 1420, leads: 5, ctr: 1.8 },
      { date: 'Mar 5', spend: 550, revenue: 1890, leads: 7, ctr: 1.9 },
      { date: 'Mar 9', spend: 610, revenue: 2170, leads: 8, ctr: 2.0 },
      { date: 'Mar 13', spend: 690, revenue: 2430, leads: 9, ctr: 2.1 },
      { date: 'Mar 17', spend: 760, revenue: 2810, leads: 10, ctr: 2.2 },
      { date: 'Mar 21', spend: 840, revenue: 3320, leads: 12, ctr: 2.4 },
    ],
    campaigns: [
      { id: 'pj-1', name: 'Storm Damage Search Retargeting', objective: 'Leads', status: 'Active', spend: 4210, revenue: 16120, roas: 3.83, cpl: 84 },
      { id: 'pj-2', name: 'Solar Financing Offer', objective: 'Leads', status: 'Learning', spend: 2860, revenue: 9180, roas: 3.21, cpl: 104 },
      { id: 'pj-3', name: 'Neighborhood Proof Ads', objective: 'Traffic', status: 'Paused', spend: 940, revenue: 2280, roas: 2.43, cpl: 118 },
    ],
    creatives: [
      { id: 'pj-c1', name: 'Storm Before/After', format: 'Video', hook: 'See the 48-hour roof replacement after hail impact.', spend: 2110, ctr: 2.7, cpa: 89, thumb: 'BA' },
      { id: 'pj-c2', name: 'Solar Savings Explainer', format: 'Carousel', hook: 'Payment comparison versus utility bill increases.', spend: 1580, ctr: 2.2, cpa: 102, thumb: 'SOL' },
      { id: 'pj-c3', name: 'Insurance Claim Checklist', format: 'Image', hook: 'Download the homeowner checklist before filing.', spend: 1290, ctr: 2.0, cpa: 111, thumb: 'CHK' },
    ],
  },
  {
    id: 'ricardo-madera',
    name: 'Ricardo Madera',
    brand: 'Madera Med Spa',
    accountStatus: 'Needs Attention',
    monthlyBudget: 12000,
    spendMTD: 8840,
    revenueMTD: 21180,
    roas: 2.4,
    cpa: 123,
    leads: 72,
    primaryObjective: 'High-intent cosmetic consultation bookings',
    description: 'Appointment generation for injectables and body contouring with a heavier dependency on remarketing.',
    lastUpdated: '2026-03-22T09:00:00.000Z',
    audienceNote: 'Prospecting CPMs climbed this week and form completion rate dropped on the current body-sculpt offer.',
    topLine: {
      impressions: 244600,
      clicks: 5880,
      purchases: 72,
      frequency: 3.4,
    },
    performance: [
      { date: 'Mar 1', spend: 430, revenue: 1250, leads: 4, ctr: 1.6 },
      { date: 'Mar 5', spend: 520, revenue: 1410, leads: 5, ctr: 1.7 },
      { date: 'Mar 9', spend: 640, revenue: 1690, leads: 6, ctr: 1.8 },
      { date: 'Mar 13', spend: 760, revenue: 1860, leads: 7, ctr: 1.9 },
      { date: 'Mar 17', spend: 820, revenue: 2070, leads: 8, ctr: 1.8 },
      { date: 'Mar 21', spend: 910, revenue: 2330, leads: 9, ctr: 1.7 },
    ],
    campaigns: [
      { id: 'rm-1', name: 'Injectables Consult Funnel', objective: 'Leads', status: 'Active', spend: 3320, revenue: 9720, roas: 2.93, cpl: 108 },
      { id: 'rm-2', name: 'Body Sculpt Prospecting', objective: 'Leads', status: 'Learning', spend: 2980, revenue: 6210, roas: 2.08, cpl: 136 },
      { id: 'rm-3', name: 'Past Lead Reactivation', objective: 'Leads', status: 'Active', spend: 1460, revenue: 5250, roas: 3.6, cpl: 89 },
    ],
    creatives: [
      { id: 'rm-c1', name: 'Transformation Testimonial', format: 'Video', hook: 'Client story focused on confidence after treatment.', spend: 1740, ctr: 2.1, cpa: 118, thumb: 'TR' },
      { id: 'rm-c2', name: 'Offer Graphic', format: 'Image', hook: 'Limited-time consult bonus with urgency framing.', spend: 1490, ctr: 1.6, cpa: 137, thumb: 'OFF' },
      { id: 'rm-c3', name: 'Doctor Q&A Reel', format: 'Reel', hook: 'What recovery really looks like after body contouring.', spend: 1210, ctr: 1.9, cpa: 126, thumb: 'DOC' },
    ],
  },
]

export function getMetaAdsOverview(): MetaAdsOverview[] {
  return metaAdsClients.map((client) => ({
    id: client.id,
    name: client.name,
    brand: client.brand,
    accountStatus: client.accountStatus,
    monthlyBudget: client.monthlyBudget,
    spendMTD: client.spendMTD,
    revenueMTD: client.revenueMTD,
    roas: client.roas,
    cpa: client.cpa,
    leads: client.leads,
    primaryObjective: client.primaryObjective,
  }))
}

export function getMetaAdsClient(clientId: string): MetaAdsClientDetail | undefined {
  return metaAdsClients.find((client) => client.id === clientId)
}
