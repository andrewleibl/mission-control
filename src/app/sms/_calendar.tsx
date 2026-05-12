'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, ThumbsUp, CalendarCheck2, Send } from 'lucide-react'
import { colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { SmsTemplate, SmsSend, SmsWin } from '@/lib/sms'

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
      iso: ymd(d),
      date: d,
      inMonth: d.getMonth() === month,
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
    if (stats.sent > 0 || stats.positives > 0 || stats.booked > 0) {
      active.push(stats)
    }
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
  const today = new Date()
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [openDay, setOpenDay] = useState<string | null>(null)

  const cells = useMemo(() => buildMonth(view.year, view.month), [view.year, view.month])
  const monthLabel = useMemo(
    () => new Date(view.year, view.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [view.year, view.month],
  )

  const dayStatsByIso = useMemo(() => {
    const map = new Map<string, DayTotals>()
    for (const c of cells) {
      map.set(c.iso, getDayStats(c.iso, templates, sends, wins))
    }
    return map
  }, [cells, templates, sends, wins])

  const maxSent = useMemo(() => {
    let m = 0
    for (const v of dayStatsByIso.values()) if (v.sent > m) m = v.sent
    return m
  }, [dayStatsByIso])

  function navMonth(delta: number) {
    setView(v => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function intensity(sent: number): string {
    if (maxSent === 0 || sent === 0) return 'transparent'
    const ratio = Math.min(1, sent / maxSent)
    const alpha = 0.08 + ratio * 0.22
    return `rgba(56, 161, 87, ${alpha.toFixed(3)})`
  }

  const openDayStats = openDay ? dayStatsByIso.get(openDay) : null
  const openDayLabel = openDay
    ? new Date(openDay + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : ''

  return (
    <div>
      {/* Month nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={() => navMonth(-1)}><ChevronLeft size={16} /></NavBtn>
          <NavBtn onClick={() => navMonth(1)}><ChevronRight size={16} /></NavBtn>
          <h2 style={{
            margin: 0, fontSize: 16, fontWeight: 600, color: colors.text,
            marginLeft: 4,
          }}>{monthLabel}</h2>
        </div>
        <button
          onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
          style={{
            background: 'transparent', border: `1px solid ${colors.border}`,
            borderRadius: borders.radius.small, color: colors.textMuted,
            fontSize: 12, padding: '5px 12px', cursor: 'pointer', ...mono,
          }}
        >
          Today
        </button>
      </div>

      {/* Weekday header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
        marginBottom: 4,
      }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{
            ...mono, fontSize: 10, letterSpacing: '0.08em',
            color: colors.textMuted, textTransform: 'uppercase' as const,
            textAlign: 'center', padding: '4px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4,
      }}>
        {cells.map(cell => {
          const stats = dayStatsByIso.get(cell.iso)!
          const hasActivity = stats.sent > 0 || stats.positives > 0 || stats.booked > 0
          return (
            <button
              key={cell.iso}
              onClick={() => setOpenDay(cell.iso)}
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
                gap: 4, transition: 'all 0.12s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  ...mono,
                  fontSize: 12, fontWeight: cell.isToday ? 700 : 500,
                  color: cell.isToday ? colors.accent : colors.text,
                }}>
                  {cell.date.getDate()}
                </span>
                {hasActivity && (
                  <span style={{
                    ...mono, fontSize: 9, color: colors.textMuted,
                    letterSpacing: '0.04em',
                  }}>
                    {stats.templates.length} tpl
                  </span>
                )}
              </div>

              {hasActivity && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
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

              {/* Bottom totals strip */}
              {hasActivity && (
                <div style={{
                  marginTop: 'auto',
                  display: 'flex', gap: 6, ...mono, fontSize: 9,
                  color: colors.textSubtle, alignItems: 'center',
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <Send size={9} />
                    {stats.sent}
                  </span>
                  {stats.positives > 0 && (
                    <span style={{ color: colors.accent, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <ThumbsUp size={9} />
                      {stats.positives}
                    </span>
                  )}
                  {stats.booked > 0 && (
                    <span style={{ color: colors.purple, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <CalendarCheck2 size={9} />
                      {stats.booked}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 14, ...mono,
        fontSize: 10, color: colors.textMuted, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span>Click any day for full breakdown.</span>
        {maxSent > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(r => (
              <span key={r} style={{
                width: 14, height: 12,
                background: `rgba(56, 161, 87, ${(0.08 + r * 0.22).toFixed(3)})`,
                border: `1px solid ${colors.border}`,
                borderRadius: 2,
              }} />
            ))}
            <span>More</span>
          </span>
        )}
      </div>

      {/* Day detail modal */}
      {openDay && openDayStats && (
        <DayDetailModal
          label={openDayLabel}
          stats={openDayStats}
          onClose={() => setOpenDay(null)}
        />
      )}
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

function DayDetailModal({
  label, stats, onClose,
}: {
  label: string
  stats: DayTotals
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...cardStyle, width: '100%', maxWidth: 640, padding: 24,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: colors.text }}>{label}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>
              {stats.templates.length} template{stats.templates.length === 1 ? '' : 's'} active
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Day totals strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0, marginBottom: 18,
          border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium,
          background: colors.cardBg,
        }}>
          <DayKPI icon={<Send size={14} />} label="Sent" value={stats.sent} />
          <DayKPI icon={<ThumbsUp size={14} />} label="+1 Replies" value={stats.positives} accent={colors.accent} divider />
          <DayKPI icon={<CalendarCheck2 size={14} />} label="Booked" value={stats.booked} accent={colors.purple} divider />
        </div>

        {stats.templates.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
            Nothing was sent or logged on this day.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {stats.templates.map(t => (
              <div key={t.templateId} style={{
                ...cardStyle, padding: 14,
                opacity: t.status === 'killed' ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>{t.label}</h3>
                    {t.status !== 'active' && (
                      <span style={{
                        ...mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                        color: t.status === 'paused' ? colors.yellow : colors.textMuted,
                        padding: '1px 5px',
                        border: `1px solid ${(t.status === 'paused' ? colors.yellow : colors.textMuted)}55`,
                        borderRadius: 4,
                      }}>
                        {t.status}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  display: 'flex', gap: 18, ...mono, fontSize: 12,
                }}>
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
    </div>
  )
}

function DayKPI({
  icon, label, value, accent, divider,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent?: string
  divider?: boolean
}) {
  return (
    <div style={{
      padding: '12px 16px',
      borderRight: divider ? `1px solid ${colors.border}` : 'none',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{
        ...mono, fontSize: 10, letterSpacing: '0.08em',
        color: colors.textMuted, textTransform: 'uppercase' as const,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: accent ?? colors.text }}>
        {value}
      </div>
    </div>
  )
}
