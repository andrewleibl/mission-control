'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { PercyChat, PercyChart, loadChats, askPercy, getChat, percyOnline } from '@/lib/percy'

// ── interactive native line chart for Percy's graphs ────────────────────────
function PercyLineChart({ chart }: { chart: PercyChart }) {
  const pts = chart.points
  const [hover, setHover] = useState<number | null>(null)
  if (pts.length < 2) return null
  const W = 520, H = 150, padX = 8, padY = 14
  const vals = pts.map(p => p.value)
  const max = Math.max(...vals), min = Math.min(...vals, 0)
  const range = max - min || 1
  const step = (W - padX * 2) / (pts.length - 1)
  const x = (i: number) => padX + i * step
  const y = (v: number) => padY + (H - padY * 2) * (1 - (v - min) / range)
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${(H - padY).toFixed(1)} L${x(0).toFixed(1)},${(H - padY).toFixed(1)} Z`
  const fmtDay = (d: string) => { const [, m, dd] = d.split('-'); return `${+m}/${+dd}` }

  // Map a client X to the nearest data-point index (works for mouse + touch).
  const track = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect()
    const rel = (clientX - rect.left) / rect.width
    setHover(Math.max(0, Math.min(pts.length - 1, Math.round(rel * (pts.length - 1)))))
  }
  const leftPct = hover === null ? 0 : Math.max(7, Math.min(93, (x(hover) / W) * 100))

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{chart.title}</div>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', height: 'auto', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
          onMouseMove={e => track(e.clientX, e.currentTarget)}
          onMouseLeave={() => setHover(null)}
          onTouchStart={e => track(e.touches[0].clientX, e.currentTarget)}
          onTouchMove={e => track(e.touches[0].clientX, e.currentTarget)}
        >
          <path d={area} fill="rgba(56,161,87,0.10)" stroke="none" />
          <path d={line} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill={colors.accent} />)}
          {hover !== null && (
            <g>
              <line x1={x(hover)} y1={padY} x2={x(hover)} y2={H - padY} stroke={colors.textSubtle} strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(pts[hover].value)} r={4.5} fill={colors.accent} stroke={colors.bg} strokeWidth={2} />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div style={{
            position: 'absolute', top: -4, left: `${leftPct}%`, transform: 'translate(-50%, -100%)',
            background: colors.cardBgElevated, border: `1px solid ${colors.border}`, borderRadius: 6,
            padding: '4px 8px', pointerEvents: 'none', whiteSpace: 'nowrap', textAlign: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}>
            <div style={{ ...mono, fontSize: 9, color: colors.textMuted }}>{fmtDay(pts[hover].day)}</div>
            <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: colors.accent }}>{pts[hover].value}</div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', ...mono, fontSize: 9, color: colors.textSubtle, marginTop: 2 }}>
        <span>{fmtDay(pts[0].day)}</span>
        <span>peak {max}</span>
        <span>{fmtDay(pts[pts.length - 1].day)}</span>
      </div>
    </div>
  )
}

export default function PercyPage() {
  const [chats, setChats] = useState<PercyChat[]>([])
  const [input, setInput] = useState('')
  const [online, setOnline] = useState<boolean | null>(null)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadChats().then(setChats).catch(e => console.error(e)) }, [])
  useEffect(() => {
    const check = () => percyOnline().then(setOnline).catch(() => setOnline(false))
    check(); const t = setInterval(check, 20000); return () => clearInterval(t)
  }, [])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [chats])

  const send = useCallback(async () => {
    const q = input.trim()
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
      <PageHeader
        title="Percy"
        subtitle="Your in-house analyst — ask about your sales, campaigns, and finances."
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
            <div style={{ margin: 'auto', textAlign: 'center', color: colors.textSubtle, fontSize: 13, maxWidth: 360 }}>
              <Sparkles size={22} color={colors.accent} style={{ marginBottom: 10 }} />
              <div>Ask Percy anything about your business.</div>
              <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.7 }}>
                &ldquo;How many sales calls this week?&rdquo;<br />
                &ldquo;What did I net in May?&rdquo;<br />
                &ldquo;Graph my calls per day for the past two weeks&rdquo;
              </div>
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
                    ? <span style={{ color: colors.textMuted }}>Percy is thinking…</span>
                    : c.status === 'error'
                      ? <span style={{ color: colors.red }}>Couldn&apos;t answer that one — try again.</span>
                      : <>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{c.answer}</div>
                          {c.chart && <PercyLineChart chart={c.chart} />}
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
          <button onClick={send} disabled={sending || !input.trim()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: colors.accent, border: 'none', borderRadius: borders.radius.medium, color: '#fff', fontSize: 13, fontWeight: 600, padding: '0 16px', cursor: sending || !input.trim() ? 'default' : 'pointer', opacity: sending || !input.trim() ? 0.5 : 1 }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </PageContainer>
  )
}
