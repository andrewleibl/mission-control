// SOP — Standard Operating Procedures library.
// Each SOP is a titled document with ordered steps. Steps can be checked off
// when "running" the SOP for a specific execution (e.g. onboarding a new client).

export type SOPCategory = 'onboarding' | 'campaigns' | 'reporting' | 'creative' | 'client-comms' | 'offboarding' | 'admin' | 'other'

export interface SOPStep {
  id: string
  title: string
  description?: string
}

export interface SOP {
  id: string
  title: string
  description?: string
  category: SOPCategory
  steps: SOPStep[]
  lastUpdated: number
  createdAt: number
}

// The "run state" tracks which steps are checked in an active execution.
// Stored separately so the SOP template stays clean.
export type SOPRunState = Record<string, boolean> // stepId → checked

// =================================================================
// Constants
// =================================================================

export const CATEGORY_LABELS: Record<SOPCategory, string> = {
  onboarding: 'Onboarding',
  campaigns: 'Campaigns',
  reporting: 'Reporting',
  creative: 'Creative',
  'client-comms': 'Client Comms',
  offboarding: 'Offboarding',
  admin: 'Admin',
  other: 'Other',
}

export const CATEGORY_COLOR: Record<SOPCategory, { fg: string; bg: string }> = {
  onboarding: { fg: '#38A157', bg: 'rgba(56,161,87,0.12)' },
  campaigns: { fg: '#63B3ED', bg: 'rgba(99,179,237,0.12)' },
  reporting: { fg: '#9F7AEA', bg: 'rgba(159,122,234,0.12)' },
  creative: { fg: '#F6AD55', bg: 'rgba(246,173,85,0.12)' },
  'client-comms': { fg: '#E3B341', bg: 'rgba(227,179,65,0.12)' },
  offboarding: { fg: '#FF7B72', bg: 'rgba(255,123,114,0.12)' },
  admin: { fg: '#7D8A99', bg: 'rgba(125,138,153,0.12)' },
  other: { fg: '#7D8A99', bg: 'rgba(125,138,153,0.12)' },
}

export const CATEGORY_ORDER: SOPCategory[] = [
  'onboarding', 'campaigns', 'reporting', 'creative', 'client-comms', 'offboarding', 'admin', 'other',
]

// =================================================================
// Seed SOPs (SMMA-specific starting templates)
// =================================================================

export const seedSOPs: SOP[] = [
  {
    id: 'sop_onboarding',
    title: 'Client Onboarding',
    description: 'Full process for onboarding a new client from contract to first campaign.',
    category: 'onboarding',
    steps: [
      { id: 's1', title: 'Send and collect signed contract' },
      { id: 's2', title: 'Collect initial payment / set up billing' },
      { id: 's3', title: 'Send welcome email with onboarding packet' },
      { id: 's4', title: 'Request Meta Business Manager access' },
      { id: 's5', title: 'Request Facebook Page admin access' },
      { id: 's6', title: 'Request Google Analytics / GTM access (if applicable)' },
      { id: 's7', title: 'Schedule kickoff strategy call' },
      { id: 's8', title: 'Complete intake form / gather brand assets' },
      { id: 's9', title: 'Build initial campaign strategy doc and share for review' },
      { id: 's10', title: 'Install pixel and verify events are firing' },
      { id: 's11', title: 'Build and launch first campaign' },
      { id: 's12', title: 'Send "we\'re live!" confirmation to client' },
    ],
    lastUpdated: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sop_campaign_setup',
    title: 'Meta Campaign Setup',
    description: 'Step-by-step for building and launching a new Meta Ads campaign.',
    category: 'campaigns',
    steps: [
      { id: 's1', title: 'Define campaign objective and KPIs with client' },
      { id: 's2', title: 'Set up or verify pixel is firing on thank-you page' },
      { id: 's3', title: 'Create custom audiences (website visitors, customer list)' },
      { id: 's4', title: 'Build Lookalike audiences from top 1-5%' },
      { id: 's5', title: 'Define target audience (geo, demo, interests)' },
      { id: 's6', title: 'Set budget — daily or lifetime, confirm with client' },
      { id: 's7', title: 'Create ad sets — at least 2 audiences to test' },
      { id: 's8', title: 'Upload creatives — static and video if available' },
      { id: 's9', title: 'Write ad copy — 3 variants (hook, body, CTA)' },
      { id: 's10', title: 'QA review: URLs, pixel, tracking parameters' },
      { id: 's11', title: 'Submit for review — check Meta policy compliance' },
      { id: 's12', title: 'Launch and monitor CPM/CTR/CPL for first 48h' },
      { id: 's13', title: 'Log campaign notes and initial targets in dashboard' },
    ],
    lastUpdated: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sop_weekly_report',
    title: 'Weekly Report Delivery',
    description: 'Standard process for preparing and sending a weekly performance report.',
    category: 'reporting',
    steps: [
      { id: 's1', title: 'Pull data from Meta Ads Manager (last 7 days)' },
      { id: 's2', title: 'Note: spend, leads, CPL, CTR, reach, impressions' },
      { id: 's3', title: 'Compare to previous week — flag significant changes' },
      { id: 's4', title: 'Identify what worked (top creative / audience / copy)' },
      { id: 's5', title: 'Identify what underperformed — explain why' },
      { id: 's6', title: 'List changes made this week' },
      { id: 's7', title: 'Set expectations for next 7 days' },
      { id: 's8', title: 'Record a Loom walkthrough (2-4 min max)' },
      { id: 's9', title: 'Send report + Loom to client via text or email' },
      { id: 's10', title: 'Log delivery in Retention calendar' },
    ],
    lastUpdated: Date.now(),
    createdAt: Date.now(),
  },
  {
    id: 'sop_creative',
    title: 'Creative Request & Production',
    description: 'Process for requesting, producing, and approving ad creatives.',
    category: 'creative',
    steps: [
      { id: 's1', title: 'Identify need: refresh existing creative or new concept?' },
      { id: 's2', title: 'Write creative brief: hook, problem, solution, CTA' },
      { id: 's3', title: 'Specify format: static (1080x1080) or video (9:16 recommended)' },
      { id: 's4', title: 'Provide brand guidelines / assets to designer or video editor' },
      { id: 's5', title: 'Set deadline — minimum 3 business days turnaround' },
      { id: 's6', title: 'Internal QA: check branding, CTA clarity, headline hook' },
      { id: 's7', title: 'Send to client for approval (if required)' },
      { id: 's8', title: 'Upload to Meta Ads Manager — add to ad set for testing' },
      { id: 's9', title: 'Note launch date and expected A/B variant performance' },
    ],
    lastUpdated: Date.now(),
    createdAt: Date.now(),
  },
]

// =================================================================
// Storage
// =================================================================

const SOPS_KEY = 'mc_sops_v1'
const RUN_STATE_KEY = 'mc_sop_run_state_v1' // Record<sopId, SOPRunState>

export function loadSOPs(): SOP[] {
  if (typeof window === 'undefined') return seedSOPs
  try {
    const raw = localStorage.getItem(SOPS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.length > 0 ? parsed : seedSOPs
    }
  } catch { /* ignore */ }
  return seedSOPs
}

export function saveSOPs(sops: SOP[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOPS_KEY, JSON.stringify(sops))
}

export function loadRunState(): Record<string, SOPRunState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(RUN_STATE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export function saveRunState(state: Record<string, SOPRunState>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(RUN_STATE_KEY, JSON.stringify(state))
}
