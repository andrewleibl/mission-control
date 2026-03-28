'use client'
import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import * as Dialog from '@radix-ui/react-dialog'
import seedTasksRaw from '@/data/tasks.json'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Video,
  Phone,
  MessageSquare,
  X,
  Clock,
  GripVertical,
  Trash2,
  LayoutGrid,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string
  assignee: 'andrew' | 'poseidon'
  project: string
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdAt: string
  status: 'recurring' | 'backlog' | 'inprogress' | 'review' | 'done'
}

const seedTasks = seedTasksRaw as Task[]

// ─── Client Retention Types ─────────────────────────────────────────────────

interface ReportData {
  spend: number
  leads: number
  cpl: number
  ctr: number
  leadsChange: number
  cplChange: number
  direction: 'positive' | 'negative' | 'neutral'
  campaignStatus: {
    summary: string
    whatsWorking?: string[]
    keepBallRolling?: string[]
    whatChanged?: string[]
    fixes?: string[]
    optimization?: string[]
  }
  changesThisWeek: string[]
  changeImpact: string
  nextWeek: {
    expectation: string
    targets: string[]
    focusAreas: string[]
  }
  htmlReportUrl: string
}

interface RetentionEvent {
  id: string
  title: string
  client: string
  type: 'loom' | 'biweekly' | 'text' | 'report' | 'start' | 'end'
  date: string // YYYY-MM-DD
  time: string
  notes: string
  completed: boolean
  reportData?: ReportData // Only for weekly reports
}

const COLUMNS: { key: Task['status']; label: string; color: string }[] = [
  { key: 'recurring', label: 'Recurring', color: '#9F7AEA' },
  { key: 'backlog', label: 'Backlog', color: '#4A5568' },
  { key: 'inprogress', label: 'In Progress', color: '#ECC94B' },
  { key: 'review', label: 'Review', color: '#63B3ED' },
  { key: 'done', label: 'Done', color: '#48BB78' },
]

const ASSIGNEE_COLORS: Record<string, string> = {
  andrew: '#E53E3E',
  poseidon: '#63B3ED',
}

const PROJECT_COLORS: Record<string, string> = {
  Agency: '#F6AD55',
  'Mission Control': '#63B3ED',
  'Clutch Barber': '#68D391',
}

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  high: '#FC8181',
  medium: '#F6E05E',
  low: '#718096',
}

const PROJECTS = ['Agency', 'Mission Control', 'Clutch Barber', 'Nightly Builds']

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type AddTaskDialogProps = {
  columnStatus: Task['status']
  onAdd: (task: Task) => void
}

function AddTaskDialog({ columnStatus, onAdd }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState<'andrew' | 'poseidon'>('andrew')
  const [dueDate, setDueDate] = useState('')
  const [project, setProject] = useState('Agency')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      assignee,
      project,
      priority,
      dueDate,
      createdAt: new Date().toISOString(),
      status: columnStatus,
    }
    onAdd(newTask)
    setTitle('')
    setDescription('')
    setAssignee('andrew')
    setDueDate('')
    setProject('Agency')
    setPriority('medium')
    setOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 4,
    padding: '6px 8px',
    color: '#F7FAFC',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#718096',
    marginBottom: 4,
    display: 'block',
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          style={{
            fontSize: 11,
            color: '#718096',
            background: 'transparent',
            border: '1px dashed #333',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }}
        >
          + Add Task
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 50,
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#141414',
            border: '1px solid #2A2A2A',
            borderRadius: 8,
            padding: 24,
            width: 400,
            maxWidth: '90vw',
            zIndex: 51,
            color: '#F7FAFC',
          }}
        >
          <Dialog.Title style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Add Task
          </Dialog.Title>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Title</label>
              <input
                required
                style={inputStyle}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Assignee</label>
                <select
                  style={inputStyle}
                  value={assignee}
                  onChange={e => setAssignee(e.target.value as 'andrew' | 'poseidon')}
                >
                  <option value="andrew">Andrew</option>
                  <option value="poseidon">Poseidon</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Priority</label>
                <select
                  style={inputStyle}
                  value={priority}
                  onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Project</label>
                <select
                  style={inputStyle}
                  value={project}
                  onChange={e => setProject(e.target.value)}
                >
                  {PROJECTS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Due Date</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  style={{
                    padding: '6px 14px',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: 4,
                    color: '#718096',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                style={{
                  padding: '6px 14px',
                  background: '#3B82F6',
                  border: 'none',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Add Task
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type TaskCardProps = {
  task: Task
  index: number
}

function TaskCard({ task, index }: TaskCardProps) {
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] ?? '#718096'
  const projectColor = PROJECT_COLORS[task.project] ?? '#718096'
  const priorityColor = PRIORITY_COLORS[task.priority]

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            background: '#1A1A1A',
            border: `1px solid ${snapshot.isDragging ? '#444' : '#222'}`,
            borderRadius: 6,
            padding: '10px 12px',
            marginBottom: 8,
            cursor: 'grab',
            boxShadow: snapshot.isDragging ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
            ...provided.draggableProps.style,
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#F7FAFC',
              marginBottom: 4,
              lineHeight: 1.3,
            }}
          >
            {task.title}
          </div>
          {/* Description */}
          {task.description && (
            <div
              style={{
                fontSize: 11,
                color: '#718096',
                marginBottom: 8,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}
            >
              {task.description}
            </div>
          )}
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {/* Assignee badge */}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#fff',
                background: assigneeColor,
                borderRadius: 3,
                padding: '2px 6px',
                textTransform: 'capitalize',
              }}
            >
              {task.assignee}
            </span>
            {/* Project pill */}
            <span
              style={{
                fontSize: 10,
                color: '#0D0D0D',
                background: projectColor,
                borderRadius: 3,
                padding: '2px 6px',
                fontWeight: 600,
              }}
            >
              {task.project}
            </span>
            {/* Priority dot */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: priorityColor,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 10, color: priorityColor, textTransform: 'capitalize' }}>
                {task.priority}
              </span>
            </span>
          </div>
          {/* Dates row */}
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#4A5568' }}>
            {task.dueDate && (
              <span>Due {formatDate(task.dueDate)}</span>
            )}
            {task.createdAt && (
              <span>· Created {formatDate(task.createdAt)}</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [activity, setActivity] = useState<string[]>([
    '2026-03-17 12:01 AM — Clutch Barber Supply audit moved to In Progress',
    '2026-03-17 12:00 AM — Nightly build session started',
    '2026-03-16 11:55 PM — Caller onboarding SOP marked Done',
  ])

  // ─── Client Retention State ────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<'tasks' | 'retention'>('tasks')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week')
  const [retentionEvents, setRetentionEvents] = useState<RetentionEvent[]>([
    {
      id: 'pj-weekly-001',
      title: 'Weekly Report — Mar 23-27',
      client: 'PJ Sparks',
      type: 'report',
      date: '2026-03-27',
      time: '',
      notes: 'Week of March 23-27, 2026',
      completed: false,
      reportData: {
        spend: 140.01,
        leads: 1,
        cpl: 140.01,
        ctr: 1.06,
        leadsChange: 0,
        cplChange: -29.0,
        direction: 'positive',
        campaignStatus: {
          summary: 'Week showing improvement. CTR jumped 47% (0.72% → 1.06%) while spend decreased 34%. One lead came in on March 25th after 10-day gap from previous lead (March 15th).',
          whatsWorking: [
            'CTR trending upward — 47% improvement this week',
            'CPL down from $196 to $140 (29% better)',
            'Budget pacing improved — only spent $140 vs $213 last week',
            'Creative fatigue recovery in progress'
          ],
          fixes: [
            'Continue monitoring creative performance daily',
            'Maintain current targeting — showing signs of life',
            'Test one new hook variation on top performer',
            'Keep budget at $30/day through weekend'
          ]
        },
        changesThisWeek: [
          'CTR improved from 0.72% to 1.06% (47% jump)',
          'Reduced overspend — $140 vs $213 last week',
          'Lead came in March 25th (10 days since last lead on March 15th)',
          'Creative fatigue showing recovery signs'
        ],
        changeImpact: 'Creative adjustments working. CTR climbing while spend controlled. Need consistent lead flow — currently 1 lead per week target is 3-4.',
        nextWeek: {
          expectation: 'Continue momentum on CTR improvements. Target 2+ leads with sustained $140-160 weekly spend.',
          targets: [
            'Target Leads: 2-3 (up from 1)',
            'Target CPL: $70-90 (continue improvement)',
            'Target Spend: $150-180 weekly'
          ],
          focusAreas: [
            'Monitor daily for second lead opportunity',
            'Scale winning creative if CTR holds above 1%',
            'Test new hook angle mid-week',
            'Maintain $30/day budget through April'
          ]
        },
        htmlReportUrl: '/loom-recording?client=pj-sparks&date=2026-03-27'
      }
    }
  ])
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<RetentionEvent | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<RetentionEvent | null>(null)

  // Form state for events
  const [formTitle, setFormTitle] = useState('')
  const [formClient, setFormClient] = useState('')
  const [formType, setFormType] = useState<'loom' | 'biweekly' | 'text' | 'report' | 'start' | 'end'>('loom')
  const [formTime, setFormTime] = useState('09:00')
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mc_tasks')
      if (stored) {
        setTasks(JSON.parse(stored) as Task[])
      }
    } catch {
      // Keep seedTasks on error
    }
  }, [])

  function persist(updated: Task[]) {
    setTasks(updated)
    localStorage.setItem('mc_tasks', JSON.stringify(updated))
  }

  function addActivity(msg: string) {
    const now = new Date()
    const label = now.toLocaleString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
    setActivity(prev => [`${label} — ${msg}`, ...prev].slice(0, 10))
  }

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as Task['status']
    const updatedTasks = tasks.map(t =>
      t.id === draggableId ? { ...t, status: newStatus } : t
    )
    persist(updatedTasks)

    const movedTask = tasks.find(t => t.id === draggableId)
    if (movedTask) {
      const colLabel = COLUMNS.find(c => c.key === newStatus)?.label ?? newStatus
      addActivity(`${movedTask.title} moved to ${colLabel}`)
    }
  }

  function handleAddTask(task: Task) {
    const updated = [...tasks, task]
    persist(updated)
    addActivity(`${task.title} created`)
  }

  // ─── Client Retention Helpers ─────────────────────────────────────────────

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const weekStart = getWeekStart(currentDate)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const formatDateKey = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const getEventsForDate = (dateKey: string) => {
    return retentionEvents.filter((e) => e.date === dateKey)
  }

  const prevPeriod = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else if (calendarView === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 1)
      setCurrentDate(newDate)
    }
  }

  const nextPeriod = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else if (calendarView === 'week') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      setCurrentDate(newDate)
    } else {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 1)
      setCurrentDate(newDate)
    }
  }

  const openAddModal = (dateKey: string) => {
    setSelectedDate(dateKey)
    setEditingEvent(null)
    setFormTitle('')
    setFormClient('')
    setFormType('loom')
    setFormTime('09:00')
    setFormNotes('')
    setShowEventModal(true)
  }

  const openEditModal = (event: RetentionEvent) => {
    setEditingEvent(event)
    setSelectedDate(event.date)
    setFormTitle(event.title)
    setFormClient(event.client)
    setFormType(event.type)
    setFormTime(event.time)
    setFormNotes(event.notes)
    setShowEventModal(true)
  }

  const saveEvent = () => {
    if (!formTitle || !formClient || !selectedDate) return

    if (editingEvent) {
      setRetentionEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id
            ? { ...e, title: formTitle, client: formClient, type: formType, time: formTime, notes: formNotes }
            : e
        )
      )
    } else {
      const newEvent: RetentionEvent = {
        id: crypto.randomUUID(),
        title: formTitle,
        client: formClient,
        type: formType,
        date: selectedDate,
        time: formTime,
        notes: formNotes,
        completed: false,
      }
      setRetentionEvents((prev) => [...prev, newEvent])
    }
    setShowEventModal(false)
  }

  const deleteEvent = (id: string) => {
    setRetentionEvents((prev) => prev.filter((e) => e.id !== id))
    setShowEventModal(false)
  }

  const toggleCompleted = (id: string) => {
    setRetentionEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    )
  }

  const handleDragStart = (event: RetentionEvent) => {
    setDraggedEvent(event)
  }

  const handleDrop = (dateKey: string) => {
    if (draggedEvent) {
      setRetentionEvents((prev) =>
        prev.map((e) => (e.id === draggedEvent.id ? { ...e, date: dateKey } : e))
      )
      setDraggedEvent(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loom': return <Video size={14} />
      case 'biweekly': return <Phone size={14} />
      case 'text': return <MessageSquare size={14} />
      case 'report': return <Clock size={14} />
      case 'start': return <CalendarIcon size={14} />
      case 'end': return <CalendarIcon size={14} />
      default: return <CalendarIcon size={14} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'loom': return '#E53E3E'
      case 'biweekly': return '#38A169'
      case 'text': return '#D69E2E'
      case 'report': return '#4299E1'
      case 'start': return '#805AD5'
      case 'end': return '#DD6B20'
      default: return '#718096'
    }
  }

  // Task Board Stats
  const taskWeekStart = new Date('2026-03-15')
  const taskWeekEnd = new Date('2026-03-21')
  const tasksThisWeek = tasks.filter(t => {
    if (!t.dueDate) return false
    const d = new Date(t.dueDate)
    return d >= taskWeekStart && d <= taskWeekEnd
  }).length
  const inProgressCount = tasks.filter(t => t.status === 'inprogress').length
  const totalCount = tasks.length
  const doneCount = tasks.filter(t => t.status === 'done').length
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const statsBoxStyle: React.CSSProperties = {
    background: '#141414',
    border: '1px solid #2A2A2A',
    borderRadius: 8,
    padding: '12px 16px',
    flex: 1,
    minWidth: 100,
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0D0D',
        color: '#F7FAFC',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with View Switcher */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            {activeView === 'tasks' ? 'Task Board' : 'Client Retention'}
          </h1>
          <div
            style={{
              display: 'flex',
              background: '#0D0D0D',
              borderRadius: '8px',
              padding: '4px',
              border: '1px solid #3A3A3A',
            }}
          >
            <button
              onClick={() => setActiveView('tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeView === 'tasks' ? '#3B82F6' : 'transparent',
                color: activeView === 'tasks' ? '#fff' : '#A0AEC0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={14} />
              Tasks
            </button>
            <button
              onClick={() => setActiveView('retention')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeView === 'retention' ? '#E53E3E' : 'transparent',
                color: activeView === 'retention' ? '#fff' : '#A0AEC0',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <CalendarDays size={14} />
              Retention
            </button>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>
          {activeView === 'tasks'
            ? 'Drag cards between columns to update status'
            : 'Track touchpoints, Looms, calls, and reports. Drag events to reschedule.'}
        </p>
      </div>

      {activeView === 'tasks' ? (
        <>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={statsBoxStyle}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{tasksThisWeek}</div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>Tasks This Week</div>
        </div>
        <div style={statsBoxStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ECC94B' }}>{inProgressCount}</div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>In Progress</div>
        </div>
        <div style={statsBoxStyle}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{totalCount}</div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>Total Tasks</div>
        </div>
        <div style={statsBoxStyle}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#48BB78' }}>{completionPct}%</div>
          <div style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>Completion</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: 0, flex: 1, minHeight: 0 }}>
        {/* Kanban Columns */}
        <div style={{ flex: 1, overflowX: 'auto', paddingBottom: 8 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 'max-content' }}>
              {COLUMNS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key)
                return (
                  <div
                    key={col.key}
                    style={{
                      background: '#141414',
                      border: '1px solid #2A2A2A',
                      borderRadius: 8,
                      padding: '12px 10px',
                      minWidth: 220,
                      maxWidth: 280,
                      width: 250,
                      flexShrink: 0,
                    }}
                  >
                    {/* Column Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: col.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E0' }}>
                        {col.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: '#4A5568',
                          background: '#0D0D0D',
                          borderRadius: 10,
                          padding: '1px 6px',
                          marginLeft: 'auto',
                        }}
                      >
                        {colTasks.length}
                      </span>
                    </div>

                    {/* Add Task Button */}
                    <div style={{ marginBottom: 10 }}>
                      <AddTaskDialog columnStatus={col.key} onAdd={handleAddTask} />
                    </div>

                    {/* Cards */}
                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            minHeight: 60,
                            background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                            borderRadius: 4,
                            transition: 'background 0.15s',
                          }}
                        >
                          {colTasks.map((task, index) => (
                            <TaskCard key={task.id} task={task} index={index} />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        </div>

        {/* Live Activity Panel */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            background: '#141414',
            borderLeft: '1px solid #2A2A2A',
            padding: '16px 14px',
            marginLeft: 16,
            borderRadius: 8,
            overflowY: 'auto',
            maxHeight: '80vh',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#CBD5E0', marginBottom: 14 }}>
            Live Activity
          </div>

          {/* Active now */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 16,
              padding: '10px 10px',
              background: 'rgba(72, 187, 120, 0.05)',
              border: '1px solid rgba(72, 187, 120, 0.15)',
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#48BB78',
                flexShrink: 0,
                marginTop: 3,
                boxShadow: '0 0 0 0 rgba(72,187,120,0.4)',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: 11, color: '#9AE6B4', lineHeight: 1.4 }}>
              Poseidon is working on: <strong>Clutch Barber Supply audit</strong>
            </span>
          </div>

          {/* Activity feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activity.map((event, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  color: '#4A5568',
                  lineHeight: 1.4,
                  paddingBottom: 8,
                  borderBottom: i < activity.length - 1 ? '1px solid #1E1E1E' : 'none',
                }}
              >
                {event}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(72,187,120,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(72,187,120,0); }
          100% { box-shadow: 0 0 0 0 rgba(72,187,120,0); }
        }
      `}</style>
      </>
      ) : (
        /* ─── CLIENT RETENTION VIEW ─── */
        <>
          {/* Calendar Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #1A1A1A 0%, #1A1A1A 50%, rgba(229, 62, 62, 0.05) 100%)',
              padding: '16px 20px',
              borderRadius: '12px',
              flexWrap: 'wrap',
              gap: '16px',
              border: '1px solid rgba(229, 62, 62, 0.1)',
              boxShadow: '0 0 40px rgba(229, 62, 62, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={prevPeriod}
                style={{
                  background: '#2A2A2A',
                  border: '1px solid #3A3A3A',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#F7FAFC',
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F7FAFC', whiteSpace: 'nowrap' }}>
                {calendarView === 'month' && `${monthNames[month]} ${year}`}
                {calendarView === 'week' && `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                {calendarView === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <button
                onClick={nextPeriod}
                style={{
                  background: '#2A2A2A',
                  border: '1px solid #3A3A3A',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#F7FAFC',
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  background: '#0D0D0D',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid #3A3A3A',
                }}
              >
                {(['day', 'week', 'month'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: calendarView === v ? '#E53E3E' : 'transparent',
                      color: calendarView === v ? '#fff' : '#A0AEC0',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <button
                onClick={() => openAddModal(formatDateKey(currentDate.getDate()))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#E53E3E',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                Add Event
              </button>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { type: 'loom', label: 'Loom Video', color: '#E53E3E' },
              { type: 'biweekly', label: 'Bi-Weekly Call', color: '#38A169' },
              { type: 'text', label: 'Text', color: '#D69E2E' },
              { type: 'report', label: 'Weekly Report', color: '#4299E1' },
            ].map((item) => (
              <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color }} />
                <span style={{ fontSize: '13px', color: '#A0AEC0' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Calendar Views */}
          <div
            style={{
              background: 'linear-gradient(180deg, #1A1A1A 0%, rgba(229, 62, 62, 0.02) 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(229, 62, 62, 0.05)',
              boxShadow: 'inset 0 0 60px rgba(229, 62, 62, 0.02)',
            }}
          >
            {/* MONTH VIEW */}
            {calendarView === 'month' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {dayNames.map((day) => (
                    <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {day}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateKey = formatDateKey(day)
                    const dayEvents = getEventsForDate(dateKey)
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
                    return (
                      <div
                        key={day}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(dateKey)}
                        onClick={() => openAddModal(dateKey)}
                        style={{
                          aspectRatio: '1',
                          background: '#0D0D0D',
                          borderRadius: '8px',
                          padding: '8px',
                          cursor: 'pointer',
                          border: isToday ? '2px solid #E53E3E' : '1px solid #2A2A2A',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          minHeight: '80px',
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 600, color: isToday ? '#E53E3E' : '#F7FAFC', marginBottom: '4px' }}>
                          {day}
                        </div>
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                            style={{
                              fontSize: '10px',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              background: getTypeColor(event.type) + '20',
                              color: getTypeColor(event.type),
                              border: `1px solid ${getTypeColor(event.type)}40`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'grab',
                              opacity: event.completed ? 0.5 : 1,
                              textDecoration: event.completed ? 'line-through' : 'none',
                            }}
                          >
                            <GripVertical size={10} />
                            {event.type === 'biweekly' ? `${event.time} ` : ''}{event.client.substring(0, 8)}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '10px', color: '#718096', textAlign: 'center' }}>+{dayEvents.length - 3} more</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* WEEK VIEW */}
            {calendarView === 'week' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const date = new Date(weekStart)
                  date.setDate(date.getDate() + i)
                  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                  const dayEvents = getEventsForDate(dateKey)
                  const isToday = new Date().toDateString() === date.toDateString()
                  return (
                    <div
                      key={i}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dateKey)}
                      onClick={() => openAddModal(dateKey)}
                      style={{
                        background: '#0D0D0D',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        border: isToday ? '2px solid #E53E3E' : '1px solid #2A2A2A',
                        minHeight: '300px',
                      }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#718096', fontWeight: 700 }}>{dayNames[date.getDay()]}</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: isToday ? '#E53E3E' : '#F7FAFC' }}>{date.getDate()}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {dayEvents.sort((a, b) => a.time.localeCompare(b.time)).map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                            style={{
                              fontSize: '11px',
                              padding: '8px',
                              borderRadius: '6px',
                              background: getTypeColor(event.type) + '20',
                              color: getTypeColor(event.type),
                              border: `1px solid ${getTypeColor(event.type)}40`,
                              cursor: 'grab',
                              opacity: event.completed ? 0.5 : 1,
                              textDecoration: event.completed ? 'line-through' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                              {getTypeIcon(event.type)}
                              {event.type === 'biweekly' && <span style={{ fontWeight: 600 }}>{event.time}</span>}
                            </div>
                            <div>{event.client}</div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{event.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* DAY VIEW */}
            {calendarView === 'day' && (() => {
              const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
              const dayEvents = getEventsForDate(dateKey).sort((a, b) => a.time.localeCompare(b.time))
              return (
                <div style={{ minHeight: '400px' }}>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dateKey)}
                    onClick={() => openAddModal(dateKey)}
                    style={{
                      background: '#0D0D0D',
                      borderRadius: '12px',
                      padding: '24px',
                      cursor: 'pointer',
                      border: '1px solid #2A2A2A',
                      minHeight: '350px',
                    }}
                  >
                    {dayEvents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
                        <CalendarIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No events scheduled for this day.</p>
                        <p style={{ fontSize: '14px', marginTop: '8px' }}>Click to add an event.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              padding: '16px',
                              background: getTypeColor(event.type) + '10',
                              borderRadius: '8px',
                              border: `1px solid ${getTypeColor(event.type)}30`,
                              cursor: 'grab',
                              opacity: event.completed ? 0.5 : 1,
                            }}
                          >
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '8px',
                                background: getTypeColor(event.type) + '20',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: getTypeColor(event.type),
                              }}
                            >
                              {getTypeIcon(event.type)}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F7FAFC', marginBottom: '4px' }}>
                                {event.type === 'biweekly' ? `${event.time} — ` : ''}{event.title}
                              </div>
                              <div style={{ fontSize: '13px', color: '#A0AEC0' }}>{event.client}</div>
                              {event.notes && <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>{event.notes}</div>}
                            </div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: event.completed ? '#38A169' : getTypeColor(event.type) }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Upcoming Events List */}
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: '#F7FAFC' }}>Upcoming Events</h3>
            {retentionEvents.length === 0 ? (
              <p style={{ color: '#718096', fontSize: '14px' }}>No events yet. Click any date or the "Add Event" button to create your first retention touchpoint.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {retentionEvents
                  .filter((e) => !e.completed)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEditModal(event)}
                      style={{
                        background: '#1A1A1A',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        border: '1px solid #2A2A2A',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: getTypeColor(event.type) + '20',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: getTypeColor(event.type),
                        }}
                      >
                        {getTypeIcon(event.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#F7FAFC' }}>{event.title}</div>
                        <div style={{ fontSize: '13px', color: '#A0AEC0' }}>
                          {event.client} • {event.date}{event.type === 'biweekly' ? ` at ${event.time}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCompleted(event.id); }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #38A169',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#38A169',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Mark Done
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowEventModal(false)}
        >
          <div
            style={{
              background: '#1A1A1A',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflow: 'auto',
              margin: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#F7FAFC' }}>
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h3>
              <button onClick={() => setShowEventModal(false)} style={{ background: 'transparent', border: 'none', color: '#718096', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Weekly Report Breakdown (if editing a report) */}
              {editingEvent?.type === 'report' && editingEvent?.reportData && (
                <div style={{ background: '#0D0D0D', border: '1px solid rgba(229, 62, 62, 0.15)', borderRadius: '16px', padding: '24px' }}>
                  {/* Header: Client + Week */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #2A2A2A' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Weekly Report</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#F7FAFC' }}>{editingEvent.client}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: editingEvent.reportData.direction === 'positive' ? 'rgba(72, 187, 120, 0.1)' : editingEvent.reportData.direction === 'negative' ? 'rgba(229, 62, 62, 0.1)' : '#1A1A1A', padding: '8px 12px', borderRadius: '8px' }}>
                      {editingEvent.reportData.direction === 'positive' ? <TrendingUp size={16} color="#48BB78" /> : editingEvent.reportData.direction === 'negative' ? <TrendingDown size={16} color="#E53E3E" /> : <Target size={16} color="#718096" />}
                      <span style={{ fontSize: '13px', fontWeight: 600, color: editingEvent.reportData.direction === 'positive' ? '#48BB78' : editingEvent.reportData.direction === 'negative' ? '#E53E3E' : '#F7FAFC' }}>
                        {editingEvent.reportData.leadsChange > 0 ? '+' : ''}{editingEvent.reportData.leadsChange}% leads
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', border: '1px solid #2A2A2A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <DollarSign size={14} color="#718096" />
                        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spend</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#F7FAFC' }}>${editingEvent.reportData.spend.toFixed(0)}</div>
                    </div>
                    <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', border: '1px solid #2A2A2A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Users size={14} color="#718096" />
                        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leads</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#F7FAFC' }}>{editingEvent.reportData.leads}</div>
                    </div>
                    <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', border: '1px solid #2A2A2A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Target size={14} color="#718096" />
                        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPL</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#F7FAFC' }}>${editingEvent.reportData.cpl.toFixed(0)}</div>
                    </div>
                    <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', border: '1px solid #2A2A2A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CalendarIcon size={14} color="#718096" />
                        <span style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CTR</span>
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#F7FAFC' }}>{editingEvent.reportData.ctr.toFixed(1)}%</div>
                    </div>
                  </div>

                  {/* The Story */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>The Story This Week</div>
                    <div style={{ background: '#1A1A1A', borderRadius: '12px', padding: '16px', border: '1px solid #2A2A2A', fontSize: '14px', color: '#A0AEC0', lineHeight: 1.6 }}>
                      {editingEvent.reportData.campaignStatus.summary}
                    </div>
                  </div>

                  {/* Two Column Layout */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* What's Working */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <CheckCircle2 size={16} color="#48BB78" />
                        <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em' }}>What's Working</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {editingEvent.reportData.campaignStatus.whatsWorking?.map((item, i) => (
                          <div key={i} style={{ background: '#1A1A1A', borderRadius: '8px', padding: '12px', border: '1px solid #2A2A2A', fontSize: '13px', color: '#F7FAFC' }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* What Changed */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <AlertCircle size={16} color="#E53E3E" />
                        <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Changes Made</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {editingEvent.reportData.campaignStatus.whatChanged?.map((item, i) => (
                          <div key={i} style={{ background: '#1A1A1A', borderRadius: '8px', padding: '12px', border: '1px solid #2A2A2A', fontSize: '13px', color: '#F7FAFC' }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Next Week */}
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #2A2A2A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <ArrowRight size={16} color="#63B3ED" />
                      <span style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Week Focus</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {editingEvent.reportData.nextWeek.focusAreas?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1A1A1A', borderRadius: '8px', padding: '12px', border: '1px solid #2A2A2A' }}>
                          <div style={{ width: '24px', height: '24px', background: 'rgba(99, 179, 237, 0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#63B3ED', fontWeight: 700 }}>{i + 1}</div>
                          <span style={{ fontSize: '13px', color: '#F7FAFC' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open for Loom Button */}
                  {editingEvent.reportData.htmlReportUrl && (
                    <div style={{ marginTop: '20px' }}>
                      <a
                        href={editingEvent.reportData.htmlReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #E53E3E, #FC8181)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 20px',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <Video size={18} />
                        Open for Loom
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A0AEC0', marginBottom: '6px' }}>Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Weekly Check-in Loom"
                  style={{ width: '100%', background: '#0D0D0D', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F7FAFC', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A0AEC0', marginBottom: '6px' }}>Client</label>
                <input
                  type="text"
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  placeholder="e.g., Hector Huizar"
                  style={{ width: '100%', background: '#0D0D0D', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F7FAFC', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A0AEC0', marginBottom: '6px' }}>Date</label>
                <input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ width: '100%', background: '#0D0D0D', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F7FAFC', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A0AEC0', marginBottom: '6px' }}>Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F7FAFC', fontSize: '14px' }}
                  >
                    <option value="loom">Loom Video</option>
                    <option value="biweekly">Bi-Weekly Call</option>
                    <option value="text">Text</option>
                    <option value="report">Weekly Report</option>
                    <option value="start">Start of Campaign</option>
                    <option value="end">End of Campaign</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A0AEC0', marginBottom: '6px' }}>Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    style={{ width: '100%', background: '#0D0D0D', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F7FAFC', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#A0AEC0', marginBottom: '6px' }}>Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="What to cover in this touchpoint..."
                  rows={3}
                  style={{ width: '100%', background: '#0D0D0D', border: '1px solid #3A3A3A', borderRadius: '8px', padding: '10px 12px', color: '#F7FAFC', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                {editingEvent && (
                  <button
                    onClick={() => deleteEvent(editingEvent.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid #E53E3E', borderRadius: '8px', padding: '12px 16px', color: '#E53E3E', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                )}
                <button
                  onClick={saveEvent}
                  disabled={!formTitle || !formClient}
                  style={{ flex: 1, background: !formTitle || !formClient ? '#3A3A3A' : '#E53E3E', border: 'none', borderRadius: '8px', padding: '12px 16px', color: '#fff', cursor: !formTitle || !formClient ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  {editingEvent ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
