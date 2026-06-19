'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Sparkles } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { PageContainer, PageHeader, colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { PercyChat, PercyChart, loadChats, askPercy, getChat, percyOnline, greetingStats } from '@/lib/percy'

function TypingDots() {
  return (
    <span style={{ color: colors.textMuted, display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      Percy is thinking
      <span className="percy-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: colors.textMuted, animationDelay: '0s' }} />
      <span className="percy-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: colors.textMuted, animationDelay: '0.2s' }} />
      <span className="percy-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: colors.textMuted, animationDelay: '0.4s' }} />
    </span>
  )
}

// ── interactive chart renderer (line / area / bar / pie) via Recharts ────────
const PALETTE = [colors.accent, colors.blue, colors.purple, colors.yellow, colors.orange, colors.red, '#4FD1C5', '#F687B3']
const tooltipStyle = { background: colors.cardBgElevated, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12 }
const axisTick = { fill: colors.textSubtle, fontSize: 10 }

function fmtLabel(s: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const [, m, d] = s.split('-'); return `${+m}/${+d}` }
  if (/^\d{4}-\d{2}$/.test(s)) { const [y, m] = s.split('-'); return `${+m}/${y.slice(2)}` }
  return s
}

function PercyChartView({ chart }: { chart: PercyChart }) {
  // Normalize (handles both new {label} and legacy {day} point shapes).
  const data = (chart.points || []).map((p: { label?: string; day?: string; value: number }) => ({ label: p.label ?? p.day ?? '', value: p.value }))
  if (data.length < 1) return null
  const type = chart.type || 'line'

  const tip = <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: colors.textMuted }} itemStyle={{ color: colors.accent }} cursor={{ fill: 'rgba(56,161,87,0.06)', stroke: colors.border }} labelFormatter={(v) => fmtLabel(String(v))} />
  const grid = <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
  const xAxis = <XAxis dataKey="label" tick={axisTick} tickFormatter={(v) => fmtLabel(String(v))} axisLine={{ stroke: colors.border }} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
  const yAxis = <YAxis tick={axisTick} axisLine={false} tickLine={false} width={34} />

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{chart.title}</div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={42} outerRadius={78} paddingAngle={2} stroke={colors.cardBg}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              {tip}
              <Legend wrapperStyle={{ fontSize: 11, color: colors.textMuted }} />
            </PieChart>
          ) : type === 'bar' ? (
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              {grid}{xAxis}{yAxis}{tip}
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs><linearGradient id="percyArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} /><stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} /></linearGradient></defs>
              {grid}{xAxis}{yAxis}{tip}
              <Area type="monotone" dataKey="value" stroke={colors.accent} strokeWidth={2} fill="url(#percyArea)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              {grid}{xAxis}{yAxis}{tip}
              <Line type="monotone" dataKey="value" stroke={colors.accent} strokeWidth={2} dot={{ r: 2.5, fill: colors.accent }} activeDot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function PercyPage() {
  const [chats, setChats] = useState<PercyChat[]>([])
  const [input, setInput] = useState('')
  const [online, setOnline] = useState<boolean | null>(null)
  const [sending, setSending] = useState(false)
  const [greet, setGreet] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadChats().then(setChats).catch(e => console.error(e)) }, [])
  useEffect(() => {
    const hr = new Date().getHours()
    const part = hr < 12 ? 'Morning' : hr < 18 ? 'Afternoon' : 'Evening'
    greetingStats()
      .then(s => setGreet(`${part}, Andrew. ${s.calls} call${s.calls === 1 ? '' : 's'} logged this week${s.campaigns ? `, ${s.campaigns} campaign${s.campaigns === 1 ? '' : 's'} live` : ''}. What do you want to know?`))
      .catch(() => setGreet(`${part}, Andrew. What do you want to know?`))
  }, [])
  useEffect(() => {
    const check = () => percyOnline().then(setOnline).catch(() => setOnline(false))
    check(); const t = setInterval(check, 20000); return () => clearInterval(t)
  }, [])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [chats])

  const send = useCallback(async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || sending) return
    setSending(true)
    setInput('')
    try {
      const chat = await askPercy(q)
      setChats(prev => [...prev, chat])
      // poll for the worker's answer
      const id = chat.id
      const poll = setInterval(async () => {
        const fresh = await getChat(id)
        if (!fresh) return
        if (fresh.status === 'answered' || fresh.status === 'error') {
          clearInterval(poll)
          setChats(prev => prev.map(c => c.id === id ? fresh : c))
          setSending(false)
        } else {
          setChats(prev => prev.map(c => c.id === id ? fresh : c))
        }
      }, 1500)
      // safety stop after 2 min
      setTimeout(() => { clearInterval(poll); setSending(false) }, 125000)
    } catch (e) {
      console.error('askPercy', e)
      setSending(false)
    }
  }, [input, sending])

  return (
    <PageContainer>
      <style>{`@keyframes percy-blink{0%,80%,100%{opacity:.25}40%{opacity:1}}.percy-dot{animation:percy-blink 1.2s infinite both}`}</style>
      <PageHeader
        title="Percy"
        subtitle="Your in-house analyst — ask about anything in Mission Control."
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...mono, fontSize: 11, color: online ? colors.accent : colors.textMuted }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? colors.accent : colors.textSubtle, boxShadow: online ? `0 0 8px ${colors.accent}` : 'none' }} />
            {online === null ? 'checking…' : online ? 'online' : 'offline'}
          </div>
        }
      />

      <div style={{ ...cardStyle, padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 420 }}>
        {/* conversation */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {chats.length === 0 && (
            <div style={{ margin: 'auto', textAlign: 'center', color: colors.textSubtle, fontSize: 13, maxWidth: 440 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, margin: '0 auto 14px', background: 'rgba(56,161,87,0.15)', border: `1px solid rgba(56,161,87,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color={colors.accent} />
              </div>
              <div style={{ color: colors.text, fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{greet || 'Ask Percy anything about your business.'}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: colors.textSubtle }}>Type your question below.</div>
            </div>
          )}
          {chats.map(c => (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* user */}
              <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'rgba(56,161,87,0.12)', border: `1px solid rgba(56,161,87,0.2)`, borderRadius: 12, borderBottomRightRadius: 3, padding: '9px 13px', fontSize: 13, color: colors.text }}>
                {c.question}
              </div>
              {/* percy */}
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 9, maxWidth: '88%' }}>
                <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7, background: 'rgba(56,161,87,0.15)', border: `1px solid rgba(56,161,87,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 12, fontWeight: 700, color: colors.accent }}>P</div>
                <div style={{ background: colors.cardBgElevated, border: `1px solid ${colors.border}`, borderRadius: 12, borderBottomLeftRadius: 3, padding: '10px 14px', fontSize: 13, color: colors.text, lineHeight: 1.55, minWidth: 60 }}>
                  {c.status === 'pending' || c.status === 'working'
                    ? <TypingDots />
                    : c.status === 'error'
                      ? <span style={{ color: colors.red }}>Couldn&apos;t answer that one — try again.</span>
                      : <>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{c.answer}</div>
                          {c.chart && <PercyChartView chart={c.chart} />}
                        </>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* input */}
        <div style={{ borderTop: `1px solid ${colors.border}`, padding: 12, display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={online === false ? 'Percy is offline — start the worker on the Mac' : 'Ask Percy…'}
            disabled={sending}
            style={{ flex: 1, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, color: colors.text, fontSize: 13, padding: '11px 14px', fontFamily: 'inherit', outline: 'none' }}
          />
          <button onClick={() => send()} disabled={sending || !input.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: colors.accent, border: 'none', borderRadius: borders.radius.medium, color: '#fff', fontSize: 13, fontWeight: 600, padding: '0 16px', cursor: sending || !input.trim() ? 'default' : 'pointer', opacity: sending || !input.trim() ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageContainer>
  )
}
