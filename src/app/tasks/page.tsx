'use client'
import tasksData from '@/data/tasks.json'

type Task = {
  id: string
  title: string
  description: string
  priority: string
  createdAt: string
  completedAt?: string
}

type Lane = { andrew: Task[]; poseidon: Task[] }
type TasksData = { backlog: Lane; inProgress: Lane; done: Lane }

const data = tasksData as TasksData

const COLUMNS = [
  { key: 'backlog' as const, label: 'Backlog', color: '#4A5568' },
  { key: 'inProgress' as const, label: 'In Progress', color: '#ECC94B' },
  { key: 'done' as const, label: 'Done', color: '#48BB78' },
]

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === 'high' ? 'badge-high' : priority === 'medium' ? 'badge-medium' : 'badge-low'
  return <span className={`badge ${cls}`}>{priority}</span>
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="task-card">
      <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13, color: '#F7FAFC', lineHeight: 1.4 }}>
        {task.title}
      </div>
      <div style={{ fontSize: 12, color: '#718096', marginBottom: 8, lineHeight: 1.4 }}>
        {task.description}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PriorityBadge priority={task.priority} />
        <span style={{ fontSize: 11, color: '#4A5568' }}>{task.createdAt}</span>
      </div>
    </div>
  )
}

function Lane({ tasks, label }: { tasks: Task[]; label: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: label === 'Andrew' ? '#E53E3E' : '#63B3ED'
        }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, color: '#4A5568', marginLeft: 'auto' }}>{tasks.length}</span>
      </div>
      <div>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div style={{ fontSize: 12, color: '#4A5568', textAlign: 'center', padding: '24px 0' }}>Empty</div>
        )}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const totalOpen =
    data.backlog.andrew.length + data.backlog.poseidon.length +
    data.inProgress.andrew.length + data.inProgress.poseidon.length

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Task Board</h1>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
          {totalOpen} open tasks across Andrew + Poseidon
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {COLUMNS.map((col) => (
          <div key={col.key} className="kanban-col">
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #2A2A2A' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: col.color }} />
              <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#CBD5E0' }}>
                {col.label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4A5568', background: '#1A1A1A', padding: '2px 7px', borderRadius: 12 }}>
                {data[col.key].andrew.length + data[col.key].poseidon.length}
              </span>
            </div>

            {/* Two lanes */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Lane tasks={data[col.key].andrew} label="Andrew" />
              <div style={{ width: 1, background: '#2A2A2A' }} />
              <Lane tasks={data[col.key].poseidon} label="Poseidon" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
