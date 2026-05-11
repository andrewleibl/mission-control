// Growth — goal tracking. Numeric targets with milestone breakdowns.

export type GoalHorizon = 'day' | 'week' | 'month' | '90d' | '6mo' | 'year'
export type GoalStatus = 'active' | 'at-risk' | 'paused' | 'completed'
export type GoalCategory = 'revenue' | 'clients' | 'team' | 'services' | 'marketing' | 'personal'

export interface Milestone {
  id: string
  title: string
  completed: boolean
  completedAt?: number
  dueDate?: string // YYYY-MM-DD
  notes?: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  category: GoalCategory
  horizon: GoalHorizon
  unit: string      // '$', 'clients', '%', 'deals', etc.
  targetValue: number
  currentValue: number
  deadline?: string // YYYY-MM-DD
  status: GoalStatus
  milestones: Milestone[]
  notes?: string
  createdAt: number
  completedAt?: number
}

// =================================================================
// Constants
// =================================================================

export const HORIZON_LABELS: Record<GoalHorizon, string> = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
  '90d': '90 Days',
  '6mo': '6 Months',
  year: 'This Year',
}

export const HORIZON_ORDER: GoalHorizon[] = ['day', 'week', 'month', '90d', '6mo', 'year']

export const CATEGORY_LABELS: Record<GoalCategory, string> = {
  revenue: 'Revenue',
  clients: 'Clients',
  team: 'Team',
  services: 'Services',
  marketing: 'Marketing',
  personal: 'Personal',
}

export const CATEGORY_COLOR: Record<GoalCategory, { fg: string; bg: string }> = {
  revenue: { fg: '#38A157', bg: 'rgba(56,161,87,0.12)' },
  clients: { fg: '#63B3ED', bg: 'rgba(99,179,237,0.12)' },
  team: { fg: '#9F7AEA', bg: 'rgba(159,122,234,0.12)' },
  services: { fg: '#E3B341', bg: 'rgba(227,179,65,0.12)' },
  marketing: { fg: '#F6AD55', bg: 'rgba(246,173,85,0.12)' },
  personal: { fg: '#7D8A99', bg: 'rgba(125,138,153,0.12)' },
}

export const STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'ACTIVE',
  'at-risk': 'AT RISK',
  paused: 'PAUSED',
  completed: 'COMPLETED',
}

export const STATUS_COLOR: Record<GoalStatus, string> = {
  active: '#38A157',
  'at-risk': '#FF7B72',
  paused: '#7D8A99',
  completed: '#38A157',
}

// =================================================================
// Storage
// =================================================================

export async function loadGoals(): Promise<Goal[]> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data } = await sb.from('goals').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(r => ({
    id: r.id, title: r.title, description: r.description ?? undefined,
    category: r.category, horizon: r.horizon, unit: r.unit,
    targetValue: r.target_value, currentValue: r.current_value,
    deadline: r.deadline ?? undefined, status: r.status,
    milestones: r.milestones ?? [], notes: r.notes ?? undefined,
    createdAt: r.created_at, completedAt: r.completed_at ?? undefined,
  }))
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const rows = goals.map(g => ({
    id: g.id, title: g.title, description: g.description ?? null,
    category: g.category, horizon: g.horizon, unit: g.unit,
    target_value: g.targetValue, current_value: g.currentValue,
    deadline: g.deadline ?? null, status: g.status,
    milestones: g.milestones, notes: g.notes ?? null,
    created_at: g.createdAt, completed_at: g.completedAt ?? null,
  }))
  await sb.from('goals').delete().gte('created_at', 0)
  if (rows.length > 0) await sb.from('goals').insert(rows)
}

// =================================================================
// Helpers
// =================================================================

export function progressPct(goal: Goal): number {
  if (goal.targetValue === 0) return 100
  return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
}

export function milestonesCompleted(goal: Goal): number {
  return goal.milestones.filter(m => m.completed).length
}

export function nextMilestone(goal: Goal): Milestone | undefined {
  return goal.milestones.find(m => !m.completed)
}

export function fmtValue(value: number, unit: string): string {
  if (unit === '$') return '$' + value.toLocaleString('en-US')
  if (unit === '%') return value + '%'
  return value.toLocaleString('en-US') + (unit !== 'x' ? ` ${unit}` : 'x')
}

export function fmtDeadline(iso?: string): string {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}
