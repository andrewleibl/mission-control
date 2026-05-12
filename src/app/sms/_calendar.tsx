'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ThumbsUp, CalendarCheck2, Send } from 'lucide-react'
import { colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { SmsTemplate, SmsSend, SmsWin } from '@/lib/sms'

type Granularity = 'day' | 'week' | 'month'

interface DayCell {
  iso: string
  date: Date
  inMonth: boolean
  isToday: boolean
}

interface DayTemplateStats {
  templateId: string
  label: string
  status: SmsTemplate['status']
  sent: number
  positives: number
  booked: number
}

interface DayTotals {
  sent: number
  positives: number
  booked: number
  templates: DayTemplateStats[]
}

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  r.setDate(r.getDate() - r.getDay())
  return r
}

function buildMonth(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - startDayOfWeek)
  const todayIso = ymd(new Date())
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push({
      iso: ymd(d), date: d,
      inMonth: d.getMonth() === month,
      isToday: ymd(d) === todayIso,
    })
  }
  return cells
}

function buildWeek(anchor: Date): DayCell[] {
  const start = startOfWeek(anchor)
  const todayIso = ymd(new Date())
  const cells: DayCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({
      iso: ymd(d), date: d, inMonth: true,
      isToday: ymd(d) === todayIso,
    })
  }
  return cells
}

function getDayStats(
  iso: string,
  templates: SmsTemplate[],
  sends: SmsSend[],
  wins: SmsWin[],
): DayTotals {
  const dayStart = new Date(iso + 'T00:00:00').getTime()
  const dayEnd = new Date(iso + 'T23:59:59.999').getTime()
  const perTemplate = new Map<string, DayTemplateStats>()
  for (const t of templates) {
    perTemplate.set(t.id, {
      templateId: t.id, label: t.label, status: t.status,
      sent: 0, positives: 0, booked: 0,
    })
  }
  for (const s of sends) {
    if (s.day !== iso) continue
    const e = perTemplate.get(s.templateId)
    if (e) e.sent += s.count
  }
  for (const w of wins) {
    if (w.loggedAt < dayStart || w.loggedAt > dayEnd) continue
    const e = perTemplate.get(w.templateId)
    if (!e) continue
    if (w.type === 'positive_reply') e.positives++
    else e.booked++
  }
  const active: DayTemplateStats[] = []
  let sent = 0, positives = 0, booked = 0
  for (const stats of perTemplate.values()) {
    sent += stats.sent
    positives += stats.positives
    booked += stats.booked
    if (stats.sent > 0 || stats.positives > 0 || stats.booked > 0) active.push(stats)
  }
  active.sort((a, b) => b.sent - a.sent || b.positives - a.positives)
  return { sent, positives, booked, templates: active }
}

export default function SmsCalendar({
  templates, sends, wins,
}: {
  templates: SmsTemplate[]
  sends: SmsSend[]
  wins: SmsWin[]
}) {
  const [granularity, setGranularity] = useState<Granularity>('month')
  const [cursor, setCursor] = useState<Date>(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  })

  function navBy(delta: number) {
    const next = new Date(cursor)
    if (granularity === 'day') next.setDate(next.getDate() + delta)
    else if (granularity === 'week') next.setDate(next.getDate() + delta * 7)
    else next.setMonth(next.getMonth() + delta)
    setCursor(next)
  }

  function goToday() {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    setCursor(t)
  }

  function selectDay(iso: string) {
    setCursor(new Date(iso + 'T12:00:00'))
    setGranularity('day')
  }

  let title = ''
  if (granularity === 'day') {
    title = cursor.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
  } else if (granularity === 'week') {
    const start = startOfWeek(cursor)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    const sameMonth = start.getMonth() === end.getMonth()
    if (sameMonth) {
      title = `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
    } else {
      title = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
  } else {
    title = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div>
      {/* Top bar: granularity toggle + nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 14, flexWrap: 'wrap',
      }}>
        <GranularityToggle value={granularity} onChange={setGranularity} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={() => navBy(-1)}><ChevronLeft size={16} /></NavBtn>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text, minWidth: 220, textAlign: 'center' }}>
            {title}
          </h2>
          <NavBtn onClick={() => navBy(1)}><ChevronRight size={16} /></NavBtn>
          <button
            onClick={goToday}
            style={{
              ...mono,
              background: 'transparent', border: `1px solid ${colors.border}`,
              borderRadius: borders.radius.small, color: colors.textMuted,
              fontSize: 12, padding: '5px 12px', cursor: 'pointer', marginLeft: 4,
            }}
          >
            Today
          </button>
        </div>
      </div>

      {granularity === 'day' && (
        <DayView iso={ymd(cursor)} templates={templates} sends={sends} wins={wins} />
      )}
      {granularity === 'week' && (
        <WeekView anchor={cursor} templates={templates} sends={sends} wins={wins} onSelectDay={selectDay} />
      )}
      {granularity === 'month' && (
        <MonthView cursor={cursor} templates={templates} sends={sends} wins={wins} onSelectDay={selectDay} />
      )}
    </div>
  )
}

// =================================================================
// Granularity toggle
// =================================================================
function GranularityToggle({
  value, onChange,
}: { value: Granularity; onChange: (g: Granularity) => void }) {
  const opts: Granularity[] = ['day', 'week', 'month']
  return (
    <div style={{
      display: 'inline-flex', background: colors.cardBg,
      border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium,
      padding: 3, gap: 2,
    }}>
      {opts.map(o => {
        const active = value === o
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              ...mono,
              background: active ? colors.accent + '22' : 'transparent',
              border: 'none', borderRadius: borders.radius.small,
              color: active ? colors.accent : colors.textMuted,
              fontSize: 12, fontWeight: 600, padding: '7px 14px',
              cursor: 'pointer', textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: `1px solid ${colors.border}`,
        borderRadius: borders.radius.small, color: colors.textMuted, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// =================================================================
// Month View
// =================================================================
function MonthView({
  cursor, templates, sends, wins, onSelectDay,
}: {
  cursor: Date
  templates: SmsTemplate[]
  sends: SmsSend[]
  wins: SmsWin[]
  onSelectDay: (iso: string) => void
}) {
  const cells = useMemo(() => buildMonth(cursor.getFullYear(), cursor.getMonth()), [cursor])
  const dayStatsByIso = useMemo(() => {
    const m = new Map<string, DayTotals>()
    for (const c of cells) m.set(c.iso, getDayStats(c.iso, templates, sends, wins))
    return m
  }, [cells, templates, sends, wins])
  const maxSent = useMemo(() => {
    let mx = 0
    for (const v of dayStatsByIso.values()) if (v.sent > mx) mx = v.sent
    return mx
  }, [dayStatsByIso])

  function intensity(sent: number): string {
    if (maxSent === 0 || sent === 0) return 'transparent'
    const ratio = Math.min(1, sent / maxSent)
    return `rgba(56, 161, 87, ${(0.08 + ratio * 0.22).toFixed(3)})`
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{
            ...mono, fontSize: 10, letterSpacing: '0.08em',
            color: colors.textMuted, textTransform: 'uppercase' as const,
            textAlign: 'center', padding: '4px 0',
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map(cell => {
          const stats = dayStatsByIso.get(cell.iso)!
          const hasActivity = stats.sent > 0 || stats.positives > 0 || stats.booked > 0
          return (
            <button
              key={cell.iso}
              className="sms-month-cell"
              onClick={() => onSelectDay(cell.iso)}
              style={{
                background: hasActivity ? intensity(stats.sent) : 'transparent',
                border: cell.isToday
                  ? `1px solid ${colors.accent}`
                  : `1px solid ${colors.border}`,
                borderRadius: borders.radius.small,
                minHeight: 88, padding: 6,
                opacity: cell.inMonth ? 1 : 0.35,
                cursor: 'pointer', textAlign: 'left',
                color: colors.text, display: 'flex', flexDirection: 'column',
                gap: 4, transition: 'all 0.12s', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  ...mono, fontSize: 12, fontWeight: cell.isToday ? 700 : 500,
                  color: cell.isToday ? colors.accent : colors.text,
                }}>
                  {cell.date.getDate()}
                </span>
                {hasActivity && (
                  <span className="sms-month-cell-tplcount" style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.04em' }}>
                    {stats.templates.length} tpl
                  </span>
                )}
              </div>
              {hasActivity && (
                <div className="sms-month-cell-detail" style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                  {stats.templates.slice(0, 2).map(t => (
                    <div key={t.templateId} style={{
                      ...mono, fontSize: 10, color: colors.textMuted,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      <span style={{ color: colors.text }}>{t.label}</span>
                      <span style={{ color: colors.accent, marginLeft: 4 }}>{t.sent}</span>
                      {t.positives > 0 && (
                        <span style={{ color: colors.accent, marginLeft: 4 }}>+{t.positives}</span>
                      )}
                    </div>
                  ))}
                  {stats.templates.length > 2 && (
                    <div style={{ ...mono, fontSize: 9, color: colors.textSubtle }}>
                      +{stats.templates.length - 2} more
                    </div>
                  )}
                </div>
              )}
              {hasActivity && (
                <div className="sms-month-cell-detail" style={{
                  marginTop: 'auto',
                  display: 'flex', gap: 6, ...mono, fontSize: 9,
                  color: colors.textSubtle, alignItems: 'center',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <Send size={9} /> {stats.sent}
                  </span>
                  {stats.positives > 0 && (
                    <span style={{ color: colors.accent, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <ThumbsUp size={9} /> {stats.positives}
                    </span>
                  )}
                  {stats.booked > 0 && (
                    <span style={{ color: colors.purple, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <CalendarCheck2 size={9} /> {stats.booked}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div style={{
        display: 'flex', gap: 16, marginTop: 14, ...mono,
        fontSize: 10, color: colors.textMuted, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span>Click any day for the full breakdown.</span>
        {maxSent > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(r => (
              <span key={r} style={{
                width: 14, height: 12,
                background: `rgba(56, 161, 87, ${(0.08 + r * 0.22).toFixed(3)})`,
                border: `1px solid ${colors.border}`, borderRadius: 2,
              }} />
            ))}
            <span>More</span>
          </span>
        )}
      </div>
    </>
  )
}

// =================================================================
// Week View
// =================================================================
function WeekView({
  anchor, templates, sends, wins, onSelectDay,
}: {
  anchor: Date
  templates: SmsTemplate[]
  sends: SmsSend[]
  wins: SmsWin[]
  onSelectDay: (iso: string) => void
}) {
  const cells = useMemo(() => buildWeek(anchor), [anchor])
  const dayStats = useMemo(() =>
    cells.map(c => ({ cell: c, stats: getDayStats(c.iso, templates, sends, wins) })),
    [cells, templates, sends, wins],
  )

  const maxSent = useMemo(() => {
    let mx = 0
    for (const { stats } of dayStats) if (stats.sent > mx) mx = stats.sent
    return mx
  }, [dayStats])

  function intensity(sent: number): string {
    if (maxSent === 0 || sent === 0) return 'transparent'
    const ratio = Math.min(1, sent / maxSent)
    return `rgba(56, 161, 87, ${(0.08 + ratio * 0.22).toFixed(3)})`
  }

  return (
    <div className="sms-week-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {dayStats.map(({ cell, stats }) => {
        const hasActivity = stats.sent > 0 || stats.positives > 0 || stats.booked > 0
        return (
          <button
            key={cell.iso}
            className="sms-week-cell"
            onClick={() => onSelectDay(cell.iso)}
            style={{
              background: hasActivity ? intensity(stats.sent) : 'transparent',
              border: cell.isToday
                ? `1px solid ${colors.accent}`
                : `1px solid ${colors.border}`,
              borderRadius: borders.radius.small,
              padding: 10, minHeight: 130,
              cursor: 'pointer', textAlign: 'left',
              display: 'flex', flexDirection: 'column', gap: 8,
              color: colors.text,
            }}
          >
            <div>
              <div style={{ ...mono, fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
                {cell.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{
                ...mono, fontSize: 22, fontWeight: 700,
                color: cell.isToday ? colors.accent : colors.text,
                lineHeight: 1,
              }}>
                {cell.date.getDate()}
              </div>
            </div>
            {hasActivity && (
              <div style={{
                marginTop: 'auto',
                display: 'flex', gap: 10, ...mono, fontSize: 11,
                color: colors.textSubtle, alignItems: 'center', flexWrap: 'wrap',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Send size={11} /> {stats.sent}
                </span>
                {stats.positives > 0 && (
                  <span style={{ color: colors.accent, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <ThumbsUp size={11} /> {stats.positives}
                  </span>
                )}
                {stats.booked > 0 && (
                  <span style={{ color: colors.purple, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <CalendarCheck2 size={11} /> {stats.booked}
                  </span>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// =================================================================
// Day View
// =================================================================
function DayView({
  iso, templates, sends, wins,
}: {
  iso: string
  templates: SmsTemplate[]
  sends: SmsSend[]
  wins: SmsWin[]
}) {
  const stats = useMemo(
    () => getDayStats(iso, templates, sends, wins),
    [iso, templates, sends, wins],
  )

  const dayStart = new Date(iso + 'T00:00:00').getTime()
  const dayEnd = new Date(iso + 'T23:59:59.999').getTime()
  const tplLabel = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of templates) m.set(t.id, t.label)
    return m
  }, [templates])

  const timeline = useMemo(() =>
    wins
      .filter(w => w.loggedAt >= dayStart && w.loggedAt <= dayEnd)
      .sort((a, b) => b.loggedAt - a.loggedAt),
    [wins, dayStart, dayEnd],
  )

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* KPI strip */}
      <div className="sms-day-kpi-strip" style={{
        ...cardStyle, padding: 18,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
      }}>
        <DayKpi icon={<Send size={14} />} label="Sent" value={stats.sent.toLocaleString()} />
        <DayKpi
          icon={<ThumbsUp size={14} />} label="+1 Replies" value={String(stats.positives)}
          accent={colors.accent} divider
          sub={stats.sent > 0 ? `${((stats.positives / stats.sent) * 100).toFixed(1)}% rate` : undefined}
        />
        <DayKpi
          icon={<CalendarCheck2 size={14} />} label="Booked" value={String(stats.booked)}
          accent={colors.purple} divider
          sub={stats.positives > 0 ? `${((stats.booked / stats.positives) * 100).toFixed(1)}% of replies` : undefined}
        />
        <DayKpi
          label="Templates active" value={String(stats.templates.length)} divider
        />
      </div>

      {/* Per-template breakdown */}
      <div style={{ ...cardStyle, padding: 18 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: colors.text }}>
          Templates active on this day
        </h3>
        {stats.templates.length === 0 ? (
          <p style={{ ...mono, color: colors.textMuted, fontSize: 12, margin: 0 }}>
            Nothing was sent or logged on this day.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {stats.templates.map(t => (
              <div key={t.templateId} style={{
                padding: '12px 14px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: borders.radius.small,
                opacity: t.status === 'killed' ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: colors.text, fontSize: 13 }}>{t.label}</span>
                  {t.status !== 'active' && (
                    <span style={{
                      ...mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: t.status === 'paused' ? colors.yellow : colors.textMuted,
                      padding: '1px 5px',
                      border: `1px solid ${(t.status === 'paused' ? colors.yellow : colors.textMuted)}55`,
                      borderRadius: 4,
                    }}>{t.status}</span>
                  )}
                </div>
                <div className="sms-day-tpl-stats" style={{ display: 'flex', gap: 18, ...mono, fontSize: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: colors.text }}>
                    <span style={{ color: colors.textMuted }}>sent </span>
                    <span style={{ fontWeight: 700 }}>{t.sent}</span>
                  </span>
                  <span style={{ color: colors.accent }}>
                    <span style={{ color: colors.textMuted }}>+1 </span>
                    <span style={{ fontWeight: 700 }}>{t.positives}</span>
                    {t.sent > 0 && (
                      <span style={{ color: colors.textSubtle, marginLeft: 4 }}>
                        ({((t.positives / t.sent) * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                  <span style={{ color: colors.purple }}>
                    <span style={{ color: colors.textMuted }}>booked </span>
                    <span style={{ fontWeight: 700 }}>{t.booked}</span>
                    {t.positives > 0 && (
                      <span style={{ color: colors.textSubtle, marginLeft: 4 }}>
                        ({((t.booked / t.positives) * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Win timeline */}
      <div style={{ ...cardStyle, padding: 18 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: colors.text }}>
          Win timeline
        </h3>
        {timeline.length === 0 ? (
          <p style={{ ...mono, color: colors.textMuted, fontSize: 12, margin: 0 }}>
            No wins logged on this day.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {timeline.map(w => (
              <div key={w.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: borders.radius.small,
              }}>
                <span style={{
                  ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  color: w.type === 'positive_reply' ? colors.accent : colors.purple,
                  padding: '2px 6px', borderRadius: 4,
                  background: (w.type === 'positive_reply' ? colors.accent : colors.purple) + '22',
                  minWidth: 70, textAlign: 'center',
                }}>
                  {w.type === 'positive_reply' ? '+1 Reply' : 'Booked'}
                </span>
                <span style={{ flex: 1, color: colors.text, fontSize: 13 }}>
                  {tplLabel.get(w.templateId) ?? '(deleted)'}
                </span>
                <span style={{ ...mono, fontSize: 11, color: colors.textMuted }}>
                  {new Date(w.loggedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DayKpi({
  icon, label, value, sub, accent, divider,
}: {
  icon?: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: string
  divider?: boolean
}) {
  return (
    <div style={{
      padding: '4px 18px',
      borderLeft: divider ? `1px solid ${colors.border}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        ...mono, fontSize: 10, color: colors.textMuted,
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: accent ?? colors.text, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ ...mono, fontSize: 11, color: colors.textSubtle }}>{sub}</div>}
    </div>
  )
}
