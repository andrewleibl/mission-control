'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart,
} from 'recharts'
import { Trophy, TrendingDown, Flame, Send, ThumbsUp, CalendarCheck2, ArrowRight } from 'lucide-react'
import { colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { SmsTemplate, SmsSend, SmsWin, getStats, coolingSignal } from '@/lib/sms'

type Period = '7d' | '30d' | '90d' | 'all'

const PERIOD_LABEL: Record<Period, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All-time',
}

const MIN_SENDS_FOR_LEADERBOARD = 20

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function periodBounds(p: Period): { fromIso: string | null; toIso: string | null } {
  if (p === 'all') return { fromIso: null, toIso: null }
  const days = p === '7d' ? 6 : p === '30d' ? 29 : 89
  return { fromIso: isoDaysAgo(days), toIso: todayIso() }
}

interface Totals {
  sent: number
  positives: number
  booked: number
  positiveRate: number
  bookedRate: number
}

function aggregate(
  templates: SmsTemplate[],
  sends: SmsSend[],
  wins: SmsWin[],
  fromIso: string | null,
  toIso: string | null,
  templateFilter?: (t: SmsTemplate) => boolean,
): Totals {
  const allowed = new Set(
    templates.filter(t => !templateFilter || templateFilter(t)).map(t => t.id)
  )
  let sent = 0, positives = 0, booked = 0
  for (const s of sends) {
    if (!allowed.has(s.templateId)) continue
    if (fromIso && s.day < fromIso) continue
    if (toIso && s.day > toIso) continue
    sent += s.count
  }
  const fromTs = fromIso ? new Date(fromIso + 'T00:00:00').getTime() : -Infinity
  const toTs = toIso ? new Date(toIso + 'T23:59:59').getTime() : Infinity
  for (const w of wins) {
    if (!allowed.has(w.templateId)) continue
    if (w.loggedAt < fromTs || w.loggedAt > toTs) continue
    if (w.type === 'positive_reply') positives++
    else booked++
  }
  return {
    sent, positives, booked,
    positiveRate: sent > 0 ? positives / sent : 0,
    bookedRate: positives > 0 ? booked / positives : 0,
  }
}

interface TemplateRanked {
  id: string
  label: string
  status: SmsTemplate['status']
  sent: number
  positives: number
  positiveRate: number
  booked: number
}

function rankTemplates(
  templates: SmsTemplate[],
  sends: SmsSend[],
  wins: SmsWin[],
  fromIso: string | null,
  toIso: string | null,
): TemplateRanked[] {
  return templates
    .filter(t => t.status !== 'killed')
    .map(t => {
      const r = aggregate([t], sends, wins, fromIso, toIso)
      return {
        id: t.id, label: t.label, status: t.status,
        sent: r.sent, positives: r.positives, positiveRate: r.positiveRate, booked: r.booked,
      }
    })
    .filter(t => t.sent >= MIN_SENDS_FOR_LEADERBOARD)
    .sort((a, b) => b.positiveRate - a.positiveRate)
}

interface TrendPoint {
  date: string
  sent: number
  positives: number
  booked: number
  rate: number
}

function buildTrend(
  sends: SmsSend[],
  wins: SmsWin[],
  days: number,
): TrendPoint[] {
  const out: TrendPoint[] = []
  const sendsByDay = new Map<string, number>()
  for (const s of sends) sendsByDay.set(s.day, (sendsByDay.get(s.day) ?? 0) + s.count)
  const positivesByDay = new Map<string, number>()
  const bookedByDay = new Map<string, number>()
  for (const w of wins) {
    const day = new Date(w.loggedAt).toISOString().slice(0, 10)
    if (w.type === 'positive_reply') positivesByDay.set(day, (positivesByDay.get(day) ?? 0) + 1)
    else bookedByDay.set(day, (bookedByDay.get(day) ?? 0) + 1)
  }
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const sent = sendsByDay.get(iso) ?? 0
    const positives = positivesByDay.get(iso) ?? 0
    const booked = bookedByDay.get(iso) ?? 0
    out.push({
      date: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
      sent, positives, booked,
      rate: sent > 0 ? (positives / sent) * 100 : 0,
    })
  }
  return out
}

interface DowPoint {
  day: string
  sent: number
  positives: number
  rate: number
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildDowStats(sends: SmsSend[], wins: SmsWin[], fromIso: string | null, toIso: string | null): DowPoint[] {
  const sentByDow = [0, 0, 0, 0, 0, 0, 0]
  const positivesByDow = [0, 0, 0, 0, 0, 0, 0]
  for (const s of sends) {
    if (fromIso && s.day < fromIso) continue
    if (toIso && s.day > toIso) continue
    const dow = new Date(s.day + 'T12:00:00').getDay()
    sentByDow[dow] += s.count
  }
  const fromTs = fromIso ? new Date(fromIso + 'T00:00:00').getTime() : -Infinity
  const toTs = toIso ? new Date(toIso + 'T23:59:59').getTime() : Infinity
  for (const w of wins) {
    if (w.type !== 'positive_reply') continue
    if (w.loggedAt < fromTs || w.loggedAt > toTs) continue
    const dow = new Date(w.loggedAt).getDay()
    positivesByDow[dow]++
  }
  return DOW_LABELS.map((day, i) => ({
    day,
    sent: sentByDow[i],
    positives: positivesByDow[i],
    rate: sentByDow[i] > 0 ? (positivesByDow[i] / sentByDow[i]) * 100 : 0,
  }))
}

export default function SmsStats({
  templates, sends, wins,
}: {
  templates: SmsTemplate[]
  sends: SmsSend[]
  wins: SmsWin[]
}) {
  const [period, setPeriod] = useState<Period>('30d')
  const bounds = periodBounds(period)

  const totals = useMemo(
    () => aggregate(templates, sends, wins, bounds.fromIso, bounds.toIso),
    [templates, sends, wins, bounds.fromIso, bounds.toIso],
  )

  const ranked = useMemo(
    () => rankTemplates(templates, sends, wins, bounds.fromIso, bounds.toIso),
    [templates, sends, wins, bounds.fromIso, bounds.toIso],
  )
  const top = ranked.slice(0, 3)
  const bottom = ranked.length > 3 ? ranked.slice(-3).reverse() : []

  const cooling = useMemo(
    () => templates.filter(t => t.status === 'active' && coolingSignal(t.id, sends, wins)),
    [templates, sends, wins],
  )

  const trendDays = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const trend = useMemo(() => buildTrend(sends, wins, trendDays), [sends, wins, trendDays])

  const dow = useMemo(
    () => buildDowStats(sends, wins, bounds.fromIso, bounds.toIso),
    [sends, wins, bounds.fromIso, bounds.toIso],
  )

  const activeCount = templates.filter(t => t.status === 'active').length
  const pausedCount = templates.filter(t => t.status === 'paused').length
  const killedCount = templates.filter(t => t.status === 'killed').length

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Period selector */}
      <PeriodSelector value={period} onChange={setPeriod} />

      {/* Top KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
      }}>
        <KpiCard
          icon={<Send size={16} />} label="Sent" value={totals.sent.toLocaleString()}
          sub={PERIOD_LABEL[period]}
        />
        <KpiCard
          icon={<ThumbsUp size={16} />} label="Positive Replies"
          value={totals.positives.toLocaleString()}
          sub={`${(totals.positiveRate * 100).toFixed(1)}% reply rate`}
          accent={colors.accent}
        />
        <KpiCard
          icon={<CalendarCheck2 size={16} />} label="Booked"
          value={totals.booked.toLocaleString()}
          sub={`${(totals.bookedRate * 100).toFixed(1)}% of replies`}
          accent={colors.purple}
        />
        <KpiCard
          icon={null} label="Templates"
          value={String(activeCount)}
          sub={`${pausedCount} paused · ${killedCount} killed`}
        />
      </div>

      {/* Funnel */}
      <Section title="Conversion Funnel" subtitle={PERIOD_LABEL[period]}>
        <Funnel totals={totals} />
      </Section>

      {/* Leaderboard */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12,
      }}>
        <Section
          title="Top Performers"
          subtitle={`By positive-reply rate · min ${MIN_SENDS_FOR_LEADERBOARD} sends`}
          icon={<Trophy size={14} color={colors.yellow} />}
        >
          {top.length === 0 ? (
            <Empty label={`No templates yet with ≥${MIN_SENDS_FOR_LEADERBOARD} sends this period.`} />
          ) : (
            <LeaderboardRows rows={top} accent={colors.accent} />
          )}
        </Section>
        <Section
          title="Bottom Performers"
          subtitle="Likely-to-kill candidates"
          icon={<TrendingDown size={14} color={colors.red} />}
        >
          {bottom.length === 0 ? (
            <Empty label="Need at least 4 ranked templates to show bottom 3." />
          ) : (
            <LeaderboardRows rows={bottom} accent={colors.red} />
          )}
        </Section>
      </div>

      {/* Cooling */}
      <Section
        title="Cooling Watch"
        subtitle="7d reply rate down > 30% vs prior 7d (≥20 sends prior week)"
        icon={<Flame size={14} color={colors.orange} />}
      >
        {cooling.length === 0 ? (
          <Empty label="No active templates are cooling right now. 🎯" />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {cooling.map(t => {
              const s = getStats(t.id, sends, wins)
              return (
                <div key={t.id} style={{
                  padding: '10px 14px',
                  background: colors.cardBg,
                  border: `1px solid ${colors.orange}44`,
                  borderRadius: borders.radius.small,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: colors.text, fontSize: 13 }}>{t.label}</div>
                    <div style={{ ...mono, fontSize: 11, color: colors.textMuted }}>
                      7d: {(s.week.positiveRate * 100).toFixed(1)}% · prior 7d: {(s.prevWeek.positiveRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{
                    ...mono, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const, color: colors.orange,
                    padding: '3px 8px', border: `1px solid ${colors.orange}55`,
                    borderRadius: 4, background: colors.orange + '15', flexShrink: 0,
                  }}>
                    Cooling
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* Trend chart */}
      <Section
        title="Send Volume & Reply Rate Trend"
        subtitle={`Daily for ${PERIOD_LABEL[period].toLowerCase()}`}
      >
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <ComposedChart data={trend} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={{ stroke: colors.border }} tickLine={false} />
              <YAxis yAxisId="sent" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={{ stroke: colors.border }} tickLine={false} />
              <YAxis yAxisId="rate" orientation="right" tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={{ stroke: colors.border }} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{
                  background: colors.cardBgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borders.radius.small,
                  fontSize: 12,
                }}
                labelStyle={{ color: colors.text, fontWeight: 600 }}
                itemStyle={{ color: colors.textMuted }}
                formatter={(value, name) => {
                  const v = typeof value === 'number' ? value : Number(value ?? 0)
                  if (name === 'rate') return [`${v.toFixed(1)}%`, '+1 rate']
                  if (name === 'sent') return [v.toLocaleString(), 'Sent']
                  if (name === 'positives') return [v.toLocaleString(), '+1 replies']
                  return [String(v), String(name)]
                }}
              />
              <Bar yAxisId="sent" dataKey="sent" fill={colors.accent + '99'} radius={[3, 3, 0, 0]} />
              <Line yAxisId="rate" type="monotone" dataKey="rate" stroke={colors.purple} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Day-of-week */}
      <Section
        title="Day-of-Week Performance"
        subtitle={`Positive-reply rate by weekday · ${PERIOD_LABEL[period].toLowerCase()}`}
      >
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={dow} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke={colors.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={{ stroke: colors.border }} tickLine={false} />
              <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} axisLine={{ stroke: colors.border }} tickLine={false} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
              <Tooltip
                contentStyle={{
                  background: colors.cardBgElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borders.radius.small,
                  fontSize: 12,
                }}
                labelStyle={{ color: colors.text, fontWeight: 600 }}
                formatter={(value, name, item) => {
                  const v = typeof value === 'number' ? value : Number(value ?? 0)
                  if (name === 'rate') {
                    const p = (item as { payload?: DowPoint } | undefined)?.payload
                    const detail = p ? ` (${p.positives}/${p.sent.toLocaleString()})` : ''
                    return [`${v.toFixed(1)}%${detail}`, '+1 rate']
                  }
                  return [String(v), String(name)]
                }}
              />
              <Bar dataKey="rate" fill={colors.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  )
}

// =================================================================
// Sub-components
// =================================================================

function PeriodSelector({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const options: Period[] = ['7d', '30d', '90d', 'all']
  return (
    <div style={{
      display: 'inline-flex', background: colors.cardBg,
      border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium,
      padding: 3, gap: 2,
    }}>
      {options.map(opt => {
        const active = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              ...mono,
              background: active ? colors.accent + '22' : 'transparent',
              border: 'none', borderRadius: borders.radius.small,
              color: active ? colors.accent : colors.textMuted,
              fontSize: 12, fontWeight: 600, padding: '7px 14px',
              cursor: 'pointer', letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
            }}
          >
            {opt === 'all' ? 'All' : opt}
          </button>
        )
      })}
    </div>
  )
}

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent?: string
}) {
  return (
    <div style={{
      ...cardStyle, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        ...mono, fontSize: 10, color: colors.textMuted,
        letterSpacing: '0.08em', textTransform: 'uppercase' as const,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ ...mono, fontSize: 26, fontWeight: 700, color: accent ?? colors.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ ...mono, fontSize: 11, color: colors.textSubtle }}>
        {sub}
      </div>
    </div>
  )
}

function Section({
  title, subtitle, icon, children,
}: {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ ...cardStyle, padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text, letterSpacing: '0.04em' }}>
            {title}
          </h3>
        </div>
        {subtitle && (
          <p style={{ ...mono, margin: '4px 0 0', fontSize: 11, color: colors.textMuted, letterSpacing: '0.04em' }}>
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <p style={{ ...mono, color: colors.textMuted, fontSize: 12, margin: 0, padding: '14px 0' }}>
      {label}
    </p>
  )
}

function Funnel({ totals }: { totals: Totals }) {
  const sentW = 1
  const positiveW = totals.sent > 0 ? totals.positives / totals.sent : 0
  const bookedW = totals.sent > 0 ? totals.booked / totals.sent : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FunnelRow label="Sent" value={totals.sent} width={sentW} fill={colors.textMuted} mainColor={colors.text} />
      <div style={{
        ...mono, fontSize: 11, color: colors.textSubtle,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <ArrowRight size={12} />
        <span>{(positiveW * 100).toFixed(1)}% reply rate</span>
      </div>
      <FunnelRow label="+1 Replies" value={totals.positives} width={Math.max(0.05, positiveW)} fill={colors.accent} mainColor={colors.accent} />
      <div style={{
        ...mono, fontSize: 11, color: colors.textSubtle,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <ArrowRight size={12} />
        <span>{totals.positives > 0 ? ((totals.booked / totals.positives) * 100).toFixed(1) : '0.0'}% book rate (of replies)</span>
      </div>
      <FunnelRow label="Booked" value={totals.booked} width={Math.max(0.05, bookedW)} fill={colors.purple} mainColor={colors.purple} />
    </div>
  )
}

function FunnelRow({ label, value, width, fill, mainColor }: { label: string; value: number; width: number; fill: string; mainColor: string }) {
  return (
    <div style={{
      position: 'relative',
      background: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: borders.radius.small,
      overflow: 'hidden', height: 44,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        width: `${Math.max(2, width * 100)}%`,
        background: `linear-gradient(90deg, ${fill}33 0%, ${fill}11 100%)`,
        borderRight: `2px solid ${fill}`,
        transition: 'width 0.3s ease',
      }} />
      <div style={{
        position: 'relative', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
      }}>
        <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: colors.text, letterSpacing: '0.04em' }}>
          {label}
        </span>
        <span style={{ ...mono, fontSize: 16, fontWeight: 700, color: mainColor }}>
          {value.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

function LeaderboardRows({ rows, accent }: { rows: TemplateRanked[]; accent: string }) {
  const maxRate = Math.max(...rows.map(r => r.positiveRate), 0.001)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map((r, i) => {
        const widthPct = (r.positiveRate / maxRate) * 100
        return (
          <div key={r.id} style={{
            position: 'relative',
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: borders.radius.small,
            padding: '10px 12px', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: 0,
              width: `${widthPct}%`,
              background: `linear-gradient(90deg, ${accent}18 0%, ${accent}06 100%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                ...mono, fontSize: 11, fontWeight: 700, color: accent,
                minWidth: 16, textAlign: 'center',
              }}>
                #{i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.label}
                </div>
                <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  {r.sent.toLocaleString()} sent · {r.positives} +1 · {r.booked} booked
                </div>
              </div>
              <span style={{ ...mono, fontSize: 16, fontWeight: 700, color: accent }}>
                {(r.positiveRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
