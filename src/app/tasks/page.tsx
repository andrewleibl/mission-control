'use client'
import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import * as Dialog from '@radix-ui/react-dialog'
import seedTasksRaw from '@/data/tasks.json'

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
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<string[]>([
    '2026-03-17 12:01 AM — Clutch Barber Supply audit moved to In Progress',
    '2026-03-17 12:00 AM — Nightly build session started',
    '2026-03-16 11:55 PM — Caller onboarding SOP marked Done',
  ])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mc_tasks')
      if (stored) {
        setTasks(JSON.parse(stored) as Task[])
      } else {
        setTasks(seedTasks)
      }
    } catch {
      setTasks(seedTasks)
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

  // Stats
  const weekStart = new Date('2026-03-15')
  const weekEnd = new Date('2026-03-21')
  const tasksThisWeek = tasks.filter(t => {
    if (!t.dueDate) return false
    const d = new Date(t.dueDate)
    return d >= weekStart && d <= weekEnd
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
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 4 }}>Task Board</h1>
        <p style={{ fontSize: 12, color: '#718096', margin: 0 }}>Drag cards between columns to update status</p>
      </div>

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
    </div>
  )
}
