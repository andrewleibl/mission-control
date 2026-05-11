// "Today" — general/operational task system. Distinct from per-client
// Action Items (which live in /clients deep dive). Tasks here are
// agency-level work: sales calls, creative production, ops, etc.

export type TaskStatus = 'open' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  dueDate?: string // YYYY-MM-DD
  dueTime?: string // HH:MM
  starred: boolean // priority flag — no levels, just "this is important"
  status: TaskStatus
  clientId?: string // optional link to a client
  notes?: string
  createdAt: number
  completedAt?: number
}

// =================================================================
// Storage — Supabase
// =================================================================

function row2task(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    dueDate: (r.due_date as string) ?? undefined,
    dueTime: (r.due_time as string) ?? undefined,
    starred: r.starred as boolean,
    status: r.status as TaskStatus,
    clientId: (r.client_id as string) ?? undefined,
    notes: (r.notes as string) ?? undefined,
    createdAt: r.created_at as number,
    completedAt: (r.completed_at as number) ?? undefined,
  }
}

export async function loadTasks(): Promise<Task[]> {
  const { createClient } = await import('@/lib/supabase')
  const sb = createClient()
  const { data, error } = await sb.from('tasks').select('*').order('created_at', { ascending: false })
  console.log('[MC] loadTasks url:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30), 'rows:', data?.length, 'error:', error?.message)
  return (data ?? []).map(row2task)
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase')
    const sb = createClient()
    const rows = tasks.map(t => ({
      id: t.id, title: t.title, due_date: t.dueDate ?? null,
      due_time: t.dueTime ?? null, starred: t.starred, status: t.status,
      client_id: t.clientId ?? null, notes: t.notes ?? null,
      created_at: t.createdAt, completed_at: t.completedAt ?? null,
    }))
    const { error: delErr } = await sb.from('tasks').delete().gte('created_at', 0)
    if (delErr) { console.error('saveTasks delete:', delErr); return }
    if (rows.length > 0) {
      const { error } = await sb.from('tasks').insert(rows)
      if (error) console.error('saveTasks insert:', error)
    }
  } catch (e) { console.error('saveTasks:', e) }
}

// =================================================================
// Date helpers
// =================================================================

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysFromToday(dateIso: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateIso + 'T12:00:00')
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

// =================================================================
// Bucketing for List view grouping
// =================================================================

export type Bucket = 'overdue' | 'today' | 'this-week' | 'later' | 'no-date'

export const BUCKET_LABELS: Record<Bucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  'this-week': 'This Week',
  later: 'Later',
  'no-date': 'No Date',
}

export function bucketFor(task: Task): Bucket {
  if (!task.dueDate) return 'no-date'
  const d = daysFromToday(task.dueDate)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d <= 7) return 'this-week'
  return 'later'
}

export function groupByBucket(tasks: Task[]): Record<Bucket, Task[]> {
  const groups: Record<Bucket, Task[]> = {
    overdue: [], today: [], 'this-week': [], later: [], 'no-date': [],
  }
  for (const t of tasks) {
    groups[bucketFor(t)].push(t)
  }
  // Sort within each bucket: starred first, then by due date asc, then by createdAt
  const sorter = (a: Task, b: Task) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1
    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    return a.createdAt - b.createdAt
  }
  for (const k of Object.keys(groups) as Bucket[]) {
    groups[k].sort(sorter)
  }
  return groups
}

// =================================================================
// Aggregations for KPI strip
// =================================================================

export function tasksDueToday(tasks: Task[]): Task[] {
  const t = todayIso()
  return tasks.filter(x => x.status !== 'done' && x.dueDate === t)
}

export function tasksOverdue(tasks: Task[]): Task[] {
  const t = todayIso()
  return tasks.filter(x => x.status !== 'done' && x.dueDate && x.dueDate < t)
}

export function tasksUpcoming(tasks: Task[], days = 7): Task[] {
  const today = todayIso()
  const end = new Date()
  end.setDate(end.getDate() + days)
  const endIso = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  return tasks.filter(x => x.status !== 'done' && x.dueDate && x.dueDate >= today && x.dueDate <= endIso)
}

export function starredOpen(tasks: Task[]): Task[] {
  return tasks.filter(x => x.starred && x.status !== 'done')
}
