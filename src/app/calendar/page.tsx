import cronsData from '@/data/crons.json'

type CronJob = {
  id: string
  name: string
  description: string
  schedule: string
  cronExpr: string
  nextRun: string
  lastRun: string
  lastStatus: string
  model: string
  category: string
}

function StatusDot({ status }: { status: string }) {
  if (status === 'success') return <span style={{ color: '#48BB78' }}>● success</span>
  if (status === 'fail') return <span style={{ color: '#FC8181' }}>● failed</span>
  return <span style={{ color: '#ECC94B' }}>● pending</span>
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    hour12: true, timeZone: 'America/Chicago'
  }) + ' CDT'
}

const CATEGORY_COLORS: Record<string, string> = {
  brief: '#63B3ED',
  build: '#E53E3E',
  monitor: '#48BB78',
  maintenance: '#9F7AEA',
  reminder: '#ECC94B',
}

export default function CalendarPage() {
  const crons = cronsData as CronJob[]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#F7FAFC' }}>Calendar</h1>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
          {crons.length} scheduled jobs — all times in CDT
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {crons.map((job) => (
          <div key={job.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {/* Category badge */}
            <div style={{
              width: 4,
              borderRadius: 2,
              alignSelf: 'stretch',
              background: CATEGORY_COLORS[job.category] || '#718096',
              flexShrink: 0,
            }} />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#F7FAFC' }}>{job.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                  background: CATEGORY_COLORS[job.category] + '22',
                  color: CATEGORY_COLORS[job.category] || '#718096',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  {job.category}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#718096' }}>
                  Model: <span style={{ color: '#A0AEC0' }}>{job.model}</span>
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#718096', marginBottom: 10 }}>{job.description}</div>
              <div style={{ display: 'flex', gap: 28, fontSize: 12 }}>
                <div>
                  <span style={{ color: '#4A5568', marginRight: 6 }}>Schedule:</span>
                  <span style={{ color: '#CBD5E0' }}>{job.schedule}</span>
                </div>
                <div>
                  <span style={{ color: '#4A5568', marginRight: 6 }}>Next run:</span>
                  <span style={{ color: '#CBD5E0' }}>{formatTime(job.nextRun)}</span>
                </div>
                <div>
                  <span style={{ color: '#4A5568', marginRight: 6 }}>Last run:</span>
                  <span style={{ color: '#CBD5E0' }}>{formatTime(job.lastRun)}</span>
                </div>
                <div>
                  <span style={{ color: '#4A5568', marginRight: 6 }}>Status:</span>
                  <StatusDot status={job.lastStatus} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
