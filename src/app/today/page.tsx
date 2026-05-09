'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Star, Pencil, Trash2, Check, Square, CheckSquare } from 'lucide-react'
import CalendarView from './_calendar'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  Task, TaskStatus, Bucket, BUCKET_LABELS,
  loadTasks, saveTasks, todayIso, daysFromToday,
  groupByBucket, tasksDueToday, tasksOverdue, tasksUpcoming, starredOpen,
} from '@/lib/today-data'
import { Client, loadClients } from '@/lib/clients-data'

type ViewMode = 'list' | 'calendar'
type FilterKey = 'all' | 'today' | 'overdue' | 'starred'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'starred', label: 'Starred' },
]

const BUCKET_ORDER: Bucket[] = ['overdue', 'today', 'this-week', 'later', 'no-date']

const BUCKET_ACCENT: Record<Bucket, string> = {
  overdue: colors.red,
  today: colors.accent,
  'this-week': colors.yellow,
  later: colors.textMuted,
  'no-date': colors.textMuted,
}

function fmtDueDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// =================================================================
// Page
// =================================================================
export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [view, setView] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [showCompleted, setShowCompleted] = useState(false)
  const [modal, setModal] = useState<
    | { kind: 'add'; defaultDate?: string }
    | { kind: 'edit'; task: Task }
    | null
  >(null)

  useEffect(() => {
    setTasks(loadTasks())
    setClients(loadClients())
  }, [])

  function persistTasks(next: Task[]) { setTasks(next); saveTasks(next) }

  function addTask(data: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) {
    const newTask: Task = {
      ...data,
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    }
    persistTasks([newTask, ...tasks])
  }
  function updateTask(updated: Task) {
    persistTasks(tasks.map(t => t.id === updated.id ? updated : t))
  }
  function deleteTask(id: string) {
    persistTasks(tasks.filter(t => t.id !== id))
  }
  function toggleDone(id: string) {
    persistTasks(tasks.map(t => {
      if (t.id !== id) return t
      const isDone = t.status === 'done'
      return { ...t, status: isDone ? 'open' : 'done', completedAt: isDone ? undefined : Date.now() }
    }))
  }
  function toggleStar(id: string) {
    persistTasks(tasks.map(t => t.id === id ? { ...t, starred: !t.starred } : t))
  }

  // ─── Derived ───────────────────────────────────────────────

  const todayCount = tasksDueToday(tasks).length
  const overdueCount = tasksOverdue(tasks).length
  const upcomingCount = tasksUpcoming(tasks, 7).length
  const starredCount = starredOpen(tasks).length

  const visible = useMemo(() => {
    let v = tasks
    if (!showCompleted) v = v.filter(t => t.status !== 'done')
    switch (filter) {
      case 'today': return v.filter(t => t.dueDate === todayIso())
      case 'overdue': return v.filter(t => t.dueDate && t.dueDate < todayIso() && t.status !== 'done')
      case 'starred': return v.filter(t => t.starred)
      default: return v
    }
  }, [tasks, filter, showCompleted])

  return (
    <PageContainer>
      <PageHeader
        title="Today"
        subtitle="Agency-level tasks. What needs to get done — across clients, ops, and admin."
        action={
          <button
            onClick={() => setModal({ kind: 'add' })}
            style={primaryButtonStyle}
          >
            <Plus size={14} strokeWidth={2.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Add Task
          </button>
        }
      />

      {/* KPI Strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Kpi label="Due Today" value={String(todayCount)} accent={todayCount > 0 ? colors.accent : colors.textMuted} />
        <Kpi label="Overdue" value={String(overdueCount)} accent={overdueCount > 0 ? colors.red : colors.textMuted} />
        <Kpi label="Upcoming 7d" value={String(upcomingCount)} accent={upcomingCount > 0 ? colors.accent : colors.textMuted} />
        <Kpi label="Starred Open" value={String(starredCount)} accent={starredCount > 0 ? colors.yellow : colors.textMuted} />
      </div>

      {/* Filter chips + Show completed toggle + View toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {FILTERS.map(f => {
            const active = filter === f.key
            const count = f.key === 'all' ? tasks.filter(t => t.status !== 'done').length :
              f.key === 'today' ? todayCount :
              f.key === 'overdue' ? overdueCount :
              starredCount
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px',
                borderRadius: borders.radius.medium,
                border: `1px solid ${active ? colors.accent : colors.border}`,
                background: active ? 'rgba(56,161,87,0.1)' : 'transparent',
                color: active ? colors.accent : colors.textMuted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                {f.label} <span style={{ ...mono, opacity: 0.6, marginLeft: 4 }}>{count}</span>
              </button>
            )
          })}
          <button onClick={() => setShowCompleted(!showCompleted)} style={{
            padding: '6px 14px',
            borderRadius: borders.radius.medium,
            border: `1px solid ${showCompleted ? colors.accent : colors.border}`,
            background: showCompleted ? 'rgba(56,161,87,0.1)' : 'transparent',
            color: showCompleted ? colors.accent : colors.textMuted,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            {showCompleted ? <CheckSquare size={12} strokeWidth={2} /> : <Square size={12} strokeWidth={2} />}
            Show Completed
          </button>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Body */}
      {view === 'list' && (
        <ListView
          tasks={visible}
          clients={clients}
          onToggleDone={toggleDone}
          onToggleStar={toggleStar}
          onEdit={t => setModal({ kind: 'edit', task: t })}
          onDelete={deleteTask}
        />
      )}
      {view === 'calendar' && (
        <CalendarView
          tasks={visible}
          clients={clients}
          onAddForDay={date => setModal({ kind: 'add', defaultDate: date })}
        />
      )}

      {/* Add/Edit modal */}
      {modal && (
        <TaskModal
          mode={modal.kind}
          existing={modal.kind === 'edit' ? modal.task : undefined}
          defaultDate={modal.kind === 'add' ? modal.defaultDate : undefined}
          clients={clients}
          onClose={() => setModal(null)}
          onSave={data => {
            if (modal.kind === 'add') addTask(data)
            else updateTask({ ...modal.task, ...data })
            setModal(null)
          }}
        />
      )}
    </PageContainer>
  )
}

// =================================================================
// Sub-components
// =================================================================

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '14px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
  color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 14px', cursor: 'pointer',
  whiteSpace: 'nowrap' as const, fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center',
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div style={{
      display: 'flex',
      background: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: borders.radius.medium,
      padding: 2,
    }}>
      {(['list', 'calendar'] as ViewMode[]).map(v => {
        const active = value === v
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            padding: '5px 14px',
            borderRadius: 6, border: 'none', cursor: 'pointer',
            background: active ? colors.accent : 'transparent',
            color: active ? '#fff' : colors.textMuted,
            fontSize: 12, fontWeight: 600, textTransform: 'capitalize' as const,
            fontFamily: 'inherit',
          }}>{v}</button>
        )
      })}
    </div>
  )
}

// ---- List View ----
function ListView({
  tasks, clients, onToggleDone, onToggleStar, onEdit, onDelete,
}: {
  tasks: Task[]
  clients: Client[]
  onToggleDone: (id: string) => void
  onToggleStar: (id: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const groups = useMemo(() => groupByBucket(tasks), [tasks])

  if (tasks.length === 0) {
    return (
      <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
        No tasks. Hit + Add Task to log one.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {BUCKET_ORDER.map(bucket => {
        const items = groups[bucket]
        if (items.length === 0) return null
        const accent = BUCKET_ACCENT[bucket]
        return (
          <div key={bucket}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            }}>
              <span style={{
                ...mono,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                color: accent, textTransform: 'uppercase' as const,
              }}>
                {BUCKET_LABELS[bucket]}
              </span>
              <span style={{ ...mono, fontSize: 11, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' as const }}>
                {items.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  client={t.clientId ? clients.find(c => c.id === t.clientId) : undefined}
                  onToggleDone={() => onToggleDone(t.id)}
                  onToggleStar={() => onToggleStar(t.id)}
                  onEdit={() => onEdit(t)}
                  onDelete={() => onDelete(t.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Task Row ----
function TaskRow({
  task, client, onToggleDone, onToggleStar, onEdit, onDelete,
}: {
  task: Task
  client?: Client
  onToggleDone: () => void
  onToggleStar: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isDone = task.status === 'done'
  const isOverdue = task.dueDate && task.dueDate < todayIso() && !isDone
  const isToday = task.dueDate === todayIso()

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: colors.cardBgElevated,
        border: `1px solid ${task.starred && !isDone ? 'rgba(227,179,65,0.25)' : colors.border}`,
        borderRadius: borders.radius.medium,
        opacity: isDone ? 0.55 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { e.currentTarget.style.background = colors.cardBgElevated }}
    >
      {/* Checkbox */}
      <button onClick={onToggleDone} style={{
        width: 18, height: 18, borderRadius: 4,
        border: `1.5px solid ${isDone ? colors.accent : colors.textMuted}`,
        background: isDone ? colors.accent : 'transparent',
        cursor: 'pointer', padding: 0, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} title={isDone ? 'Reopen' : 'Mark done'}>
        {isDone && <Check size={12} strokeWidth={3} color="#fff" />}
      </button>

      {/* Star */}
      <button onClick={onToggleStar} style={{
        background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
        flexShrink: 0, lineHeight: 0,
      }} title={task.starred ? 'Unstar' : 'Star (priority)'}>
        <Star
          size={14} strokeWidth={2}
          color={task.starred ? colors.yellow : colors.textMuted}
          fill={task.starred ? colors.yellow : 'none'}
          style={{ opacity: task.starred ? 1 : 0.4 }}
        />
      </button>

      {/* Title + meta */}
      <button
        onClick={onEdit}
        style={{
          flex: 1, minWidth: 0, textAlign: 'left' as const,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, fontFamily: 'inherit',
        }}
      >
        <div style={{
          fontSize: 13, fontWeight: 600, color: colors.text,
          textDecoration: isDone ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        }}>
          {task.title}
        </div>
        {(task.dueDate || client || task.notes) && (
          <div style={{
            ...mono,
            fontSize: 10, color: colors.textMuted, marginTop: 2,
            display: 'flex', gap: 8, alignItems: 'center',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {task.dueDate && (
              <span style={{ color: isOverdue ? colors.red : isToday ? colors.accent : colors.textMuted }}>
                {isOverdue ? 'Overdue · ' : ''}{fmtDueDate(task.dueDate)}{task.dueTime ? ` ${task.dueTime}` : ''}
              </span>
            )}
            {client && <span>· {client.business}</span>}
            {task.notes && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>· {task.notes}</span>}
          </div>
        )}
      </button>

      {/* Actions */}
      <button onClick={onEdit} style={iconActionStyle} title="Edit">
        <Pencil size={11} strokeWidth={2} />
      </button>
      <button onClick={onDelete} style={{ ...iconActionStyle, color: colors.textMuted }} title="Delete">
        <Trash2 size={11} strokeWidth={2} />
      </button>
    </div>
  )
}

const iconActionStyle: React.CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: colors.textMuted, padding: 4, opacity: 0.4,
  display: 'flex', alignItems: 'center',
}

// ---- Add/Edit Modal ----
function TaskModal({
  mode, existing, defaultDate, clients, onClose, onSave,
}: {
  mode: 'add' | 'edit'
  existing?: Task
  defaultDate?: string
  clients: Client[]
  onClose: () => void
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'completedAt'>) => void
}) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? defaultDate ?? '')
  const [dueTime, setDueTime] = useState(existing?.dueTime ?? '')
  const [starred, setStarred] = useState(existing?.starred ?? false)
  const [status, setStatus] = useState<TaskStatus>(existing?.status ?? 'open')
  const [clientId, setClientId] = useState(existing?.clientId ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')

  function save() {
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      starred,
      status,
      clientId: clientId || undefined,
      notes: notes.trim() || undefined,
    })
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '10px 12px',
    color: colors.text, fontSize: 14, outline: 'none', width: '100%',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    ...mono,
    fontSize: 11, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 6,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ ...cardStyle, width: 460, padding: 28, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            {mode === 'add' ? 'Add Task' : 'Edit Task'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title <span style={{ color: colors.red }}>*</span></label>
            <input
              type="text" autoFocus
              placeholder="What needs doing?"
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() } }}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Due Date (opt.)</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inputStyle, ...mono }} />
            </div>
            <div>
              <label style={labelStyle}>Time (opt.)</label>
              <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} style={{ ...inputStyle, ...mono }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Client (optional)</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">— None —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business} · {c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              placeholder="Additional context..."
              value={notes} onChange={e => setNotes(e.target.value)}
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' as const, lineHeight: 1.5 }}
            />
          </div>

          {mode === 'edit' && (
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.text, cursor: 'pointer' }}>
            <input type="checkbox" checked={starred} onChange={e => setStarred(e.target.checked)} />
            <Star size={14} strokeWidth={2} color={starred ? colors.yellow : colors.textMuted} fill={starred ? colors.yellow : 'none'} />
            Star as priority
          </label>
        </div>

        <button onClick={save} style={{
          marginTop: 20, width: '100%', padding: '11px 0',
          background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {mode === 'add' ? 'Add Task' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
