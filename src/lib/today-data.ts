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

const STORAGE_KEY = 'mc_today_tasks_v1'

// =================================================================
// Storage
// =================================================================

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
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
