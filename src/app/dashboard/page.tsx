'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, Users, CheckSquare, Phone, DollarSign, MessageSquare,
  AlertTriangle, Clock, Star, ArrowRight, Zap, Target,
} from 'lucide-react'
import {
  PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono,
} from '@/components/DesignSystem'

// Data libs — load* fetchers for the Supabase-backed data now run server-side
// via /api/dashboard (one round-trip). Only sales calls (localStorage) load here.
import { tasksOverdue, tasksDueToday, tasksUpcoming, Task } from '@/lib/today-data'
import { Client } from '@/lib/clients-data'
import { RetentionEvent, overdueEvents, upcomingEvents, daysSinceLastEvent, toIso, addDays } from '@/lib/retention-data'
import { loadCalls, computeStats, SalesCall } from '@/lib/sales-data'
import { loadTemplates, loadSends, loadWins, SmsTemplate, SmsSend, SmsWin, getStats, coolingSignal } from '@/lib/sms'
import { Transaction, sumIncome, sumExpenses, netProfit, txsInMonth } from '@/lib/finances'

// ─── Helpers ────────────────────────────────────────────────────────────────

const TODAY = toIso(new Date())
const NOW_MONTH = TODAY.slice(0, 7)

function fmtCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

function fmtPct(n: number): string {
  return `${Math.round(n)}%`
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon, href }: {
  label: string; value: string; sub?: string; color: string
  icon: React.ElementType; href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        ...cardStyleAccent,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'transform 0.1s',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon size={14} color={color} strokeWidth={2} />
          <span style={{ ...mono, fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            {label}
          </span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{sub}</div>}
      </div>
    </Link>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{title}</span>
      <Link href={href} style={{ ...mono, fontSize: 10, fontWeight: 600, color: colors.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
        Open <ArrowRight size={10} />
      </Link>
    </div>
  )
}

// ─── Urgency row item ─────────────────────────────────────────────────────────

function UrgencyItem({ label, sub, color, href }: { label: string; sub?: string; color: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px',
        background: colors.cardBgElevated, border: `1px solid ${color}30`,
        borderLeft: `3px solid ${color}`, borderRadius: borders.radius.medium,
        cursor: 'pointer', transition: 'background 0.1s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = colors.cardBgElevated)}
      >
        <AlertTriangle size={12} color={color} style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
    </Link>
  )
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function Timeline({ tasks, events, clients }: { tasks: Task[]; events: RetentionEvent[]; clients: Client[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i)
    const iso = toIso(d)
    const dayTasks = tasks.filter(t => t.dueDate === iso && t.status !== 'done')
    const dayEvents = events.filter(e => e.date === iso && !e.completed)
    return { iso, d, dayTasks, dayEvents, total: dayTasks.length + dayEvents.length }
  })

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
      {days.map(({ iso, d, dayTasks, dayEvents, total }) => {
        const isToday = iso === TODAY
        return (
          <div key={iso} style={{
            padding: '8px 6px', borderRadius: borders.radius.medium, minHeight: 80,
            border: `1px solid ${isToday ? colors.accent : colors.border}`,
            background: isToday ? 'rgba(56,161,87,0.06)' : colors.cardBg,
          }}>
            <div style={{ ...mono, fontSize: 9, fontWeight: 700, color: isToday ? colors.accent : colors.textMuted, marginBottom: 2 }}>
              {weekdays[d.getDay()]}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? colors.accent : colors.text, marginBottom: 6 }}>
              {d.getDate()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {dayTasks.slice(0, 2).map(t => (
                <div key={t.id} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, background: 'rgba(56,161,87,0.12)', color: colors.accent, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {t.title}
                </div>
              ))}
              {dayEvents.slice(0, 2).map(e => {
                const c = clients.find(cl => cl.id === e.clientId)
                return (
                  <div key={e.id} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, background: 'rgba(99,179,237,0.12)', color: colors.blue, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {c?.business ?? e.title}
                  </div>
                )
              })}
              {total > 4 && (
                <div style={{ ...mono, fontSize: 9, color: colors.textMuted }}>+{total - 4} more</div>
              )}
              {total === 0 && (
                <div style={{ ...mono, fontSize: 9, color: colors.border, marginTop: 4 }}>—</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Sales Funnel ─────────────────────────────────────────────────────────────

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: colors.text, fontWeight: 500 }}>{label}</span>
        <span style={{ ...mono, fontSize: 11, color: colors.textMuted }}>{value}</span>
      </div>
      <div style={{ height: 6, background: colors.cardBg, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  )
}

// ─── Client dot ──────────────────────────────────────────────────────────────

function clientDotColor(status: string, daysSince: number): string {
  if (status === 'churned') return colors.red
  if (daysSince > 21) return colors.red
  if (daysSince > 14) return colors.yellow
  return colors.accent
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [events, setEvents] = useState<RetentionEvent[]>([])
  const [calls, setCalls] = useState<SalesCall[]>([])
  const [templates, setTemplates] = useState<SmsTemplate[]>([])
  const [sends, setSends] = useState<SmsSend[]>([])
  const [wins, setWins] = useState<SmsWin[]>([])
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Heavy Supabase data (tasks/clients/events/transactions) comes from ONE
    // server round-trip — the mobile bottleneck was 7 separate client queries.
    // SMS (RLS-sensitive) + Sales (localStorage) load client-side, as before.
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      loadCalls(),
      loadTemplates(), loadSends(), loadWins(),
    ]).then(([d, sc, tmpl, s, w]) => {
      setTasks(d.tasks ?? []); setClients(d.clients ?? []); setEvents(d.events ?? [])
      setCalls(sc); setTemplates(tmpl); setSends(s); setWins(w)
      setTxs(d.txs ?? []); setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  // ─── Derived ──────────────────────────────────────────────────────────────

  const overdueTaskList = useMemo(() => tasksOverdue(tasks), [tasks])
  const todayTaskList = useMemo(() => tasksDueToday(tasks), [tasks])
  const upcomingTaskList = useMemo(() => tasksUpcoming(tasks, 7), [tasks])

  const overdueEventList = useMemo(() => overdueEvents(events), [events])
  const upcomingEventList = useMemo(() => upcomingEvents(events, 7), [events])

  const activeClients = useMemo(() => clients.filter(c => c.status === 'active'), [clients])
  const staleClients = useMemo(() => activeClients.filter(c => daysSinceLastEvent(c.id, events) > 14), [activeClients, events])

  const salesStats = useMemo(() => computeStats(calls), [calls])
  const monthCalls = useMemo(() => calls.filter(c => c.date.startsWith(NOW_MONTH)), [calls])

  const monthTxs = useMemo(() => txsInMonth(txs, NOW_MONTH), [txs])
  const monthRevenue = useMemo(() => sumIncome(monthTxs), [monthTxs])
  const monthExpenses = useMemo(() => sumExpenses(monthTxs), [monthTxs])
  const monthNet = useMemo(() => netProfit(monthTxs), [monthTxs])

  const liveTemplates = useMemo(() => templates.filter(t => t.status !== 'killed'), [templates])
  const hotTemplates = useMemo(() =>
    liveTemplates
      .filter(t => !coolingSignal(t.id, sends, wins))
      .sort((a, b) => {
        const sa = getStats(a.id, sends, wins)
        const sb = getStats(b.id, sends, wins)
        return sb.all.positiveRate - sa.all.positiveRate
      })
      .slice(0, 4),
    [liveTemplates, sends, wins]
  )
  const smsWinsThisWeek = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
    return wins.filter(w => w.loggedAt > cutoff.getTime()).length
  }, [wins])

  // ─── Urgency items ────────────────────────────────────────────────────────

  const urgencyItems = useMemo(() => {
    const items: { label: string; sub?: string; color: string; href: string }[] = []
    if (overdueTaskList.length > 0) {
      overdueTaskList.slice(0, 3).forEach(t => {
        items.push({ label: t.title, sub: `Overdue task · ${t.dueDate ?? 'no date'}`, color: colors.red, href: '/today' })
      })
    }
    if (staleClients.length > 0) {
      staleClients.slice(0, 2).forEach(c => {
        const days = daysSinceLastEvent(c.id, events)
        items.push({ label: c.business, sub: `No touchpoint in ${days}d — check in now`, color: colors.yellow, href: '/client-retention' })
      })
    }
    if (overdueEventList.length > 0) {
      overdueEventList.slice(0, 2).forEach(e => {
        const cl = clients.find(c => c.id === e.clientId)
        items.push({ label: e.title, sub: `${cl?.business ?? ''} · ${e.date}`, color: colors.orange, href: '/client-retention' })
      })
    }
    return items
  }, [overdueTaskList, staleClients, overdueEventList, clients, events])

  if (!loaded) {
    return (
      <PageContainer>
        <PageHeader title="Dashboard" subtitle="Loading..." />
        <div style={{ color: colors.textMuted, fontSize: 13 }}>Loading data...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Command center`}
      />

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div className="stat-strip-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 }}>
        <KpiCard label="Revenue MTD" value={fmtCurrency(monthRevenue)} sub={`net ${fmtCurrency(monthNet)}`} color={colors.accent} icon={DollarSign} href="/finances" />
        <KpiCard label="Active Clients" value={String(activeClients.length)} sub={`${staleClients.length} need attention`} color={staleClients.length > 0 ? colors.yellow : colors.accent} icon={Users} href="/clients" />
        <KpiCard label="Overdue Tasks" value={String(overdueTaskList.length)} sub={`${todayTaskList.length} due today`} color={overdueTaskList.length > 0 ? colors.red : colors.accent} icon={CheckSquare} href="/today" />
        <KpiCard label="Calls (Month)" value={String(monthCalls.length)} sub={`${fmtPct(salesStats.showRate)} show rate`} color={colors.blue} icon={Phone} href="/sales" />
        <KpiCard label="Close Rate" value={fmtPct(salesStats.closeRate)} sub={`${salesStats.closedWon} won all time`} color={colors.purple} icon={Target} href="/sales" />
        <KpiCard label="SMS Wins (7d)" value={String(smsWinsThisWeek)} sub={`${liveTemplates.length} live templates`} color={colors.accent} icon={MessageSquare} href="/sms" />
      </div>

      {/* ── Row 2: Timeline + Urgency ──────────────────────────────────── */}
      <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Timeline */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title="Next 7 Days" href="/today" />
          <Timeline tasks={tasks} events={events} clients={clients} />
        </div>

        {/* Urgency */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title="Needs Attention" href="/today" />
          {urgencyItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: colors.textMuted, fontSize: 12 }}>
              All clear — nothing urgent right now
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {urgencyItems.map((item, i) => (
                <UrgencyItem key={i} {...item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Sales Funnel + Client Health + SMS Hot List ─────────── */}
      <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Sales funnel */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title="Sales Funnel (Month)" href="/sales" />
          <FunnelBar label="Booked" value={monthCalls.length} max={monthCalls.length} color={colors.textMuted} />
          <FunnelBar label="Showed" value={monthCalls.filter(c => c.showed).length} max={monthCalls.length} color={colors.blue} />
          <FunnelBar label="Qualified" value={monthCalls.filter(c => c.qualified).length} max={monthCalls.length} color={colors.purple} />
          <FunnelBar label="Closed Won" value={monthCalls.filter(c => c.outcome === 'closed_won').length} max={monthCalls.length} color={colors.accent} />
          <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.border}` }}>
            All-time close rate: <span style={{ color: colors.accent, fontWeight: 700 }}>{fmtPct(salesStats.closeRate)}</span>
          </div>
        </div>

        {/* Client health */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title="Client Health" href="/client-retention" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeClients.length === 0 ? (
              <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No active clients yet</div>
            ) : (
              activeClients.map(c => {
                const days = daysSinceLastEvent(c.id, events)
                const dotColor = clientDotColor(c.status, days)
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{c.business}</span>
                    </div>
                    <span style={{ ...mono, fontSize: 10, color: days > 14 ? dotColor : colors.textMuted }}>
                      {days === Infinity ? 'never' : `${days}d ago`}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* SMS hot list */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title="SMS — Ready to Fire" href="/sms" />
          {hotTemplates.length === 0 ? (
            <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>All templates cooling — check back tomorrow</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hotTemplates.map(t => {
                const s = getStats(t.id, sends, wins)
                return (
                  <div key={t.id} style={{ padding: '8px 10px', borderRadius: borders.radius.medium, background: colors.cardBgElevated, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{t.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Zap size={10} color={colors.accent} />
                        <span style={{ ...mono, fontSize: 10, color: colors.accent, fontWeight: 700 }}>
                          {fmtPct(s.all.positiveRate)}
                        </span>
                      </div>
                    </div>
                    <div style={{ ...mono, fontSize: 9, color: colors.textMuted }}>{s.all.positives} wins · {s.all.sent} sent</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Finances + Upcoming events ──────────────────────────── */}
      <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Financial snapshot */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title={`Finances — ${NOW_MONTH}`} href="/finances" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Revenue', value: fmtCurrency(monthRevenue), color: colors.accent },
              { label: 'Expenses', value: fmtCurrency(monthExpenses), color: colors.red },
              { label: 'Net', value: fmtCurrency(monthNet), color: monthNet >= 0 ? colors.accent : colors.red },
            ].map(item => (
              <div key={item.label} style={{ ...cardStyleAccent, padding: '10px 12px' }}>
                <div style={{ ...mono, fontSize: 9, color: colors.textMuted, marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming retention events */}
        <div style={{ ...cardStyle, padding: 18 }}>
          <SectionHeader title="Upcoming Touchpoints" href="/client-retention" />
          {upcomingEventList.length === 0 ? (
            <div style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No upcoming events in the next 7 days</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingEventList.slice(0, 5).map(e => {
                const c = clients.find(cl => cl.id === e.clientId)
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${colors.border}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>{c?.business}</div>
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: colors.textMuted, textAlign: 'right' as const }}>
                      {e.date}
                      {e.time && <div>{e.time}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
