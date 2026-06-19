'use client'

import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, X, Phone, Copy, Check, ArrowRight, CalendarCheck2, Trash2, Pencil } from 'lucide-react'
import { colors, cardStyle } from '@/components/DesignSystem'
import {
  SmsTemplate, SmsProspect, FOLLOWUP_MESSAGES,
  loadProspects, createProspect, advanceProspect, setProspectDay, bookProspect, deleteProspect,
  dueToday,
} from '@/lib/sms'
import { createCall } from '@/lib/sales-data'

const DAYS = [1, 2, 3]

// Display a phone as (123) 456-7890. Formats the last 10 digits of any
// 10+ digit input; falls back to raw if there aren't enough digits.
function fmtPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  const t = d.length > 10 ? d.slice(-10) : d
  if (t.length === 10) return `(${t.slice(0, 3)}) ${t.slice(3, 6)}-${t.slice(6)}`
  return raw
}
const telHref = (raw: string) => `tel:${raw.replace(/\D/g, '')}`

export default function SmsPipeline({ templates, onWinsChanged }: { templates: SmsTemplate[]; onWinsChanged?: () => void }) {
  const live = useMemo(() => templates.filter(t => t.status !== 'killed'), [templates])
  const [prospects, setProspects] = useState<SmsProspect[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<SmsProspect | null>(null)
  const [messages, setMessages] = useState<Record<number, string>>(FOLLOWUP_MESSAGES)

  useEffect(() => {
    let cancelled = false
    loadProspects().then(p => { if (!cancelled) { setProspects(p); setLoading(false) } })
    try {
      const saved = JSON.parse(localStorage.getItem('sms_followup_messages') || '{}')
      setMessages({ 1: saved[1] ?? FOLLOWUP_MESSAGES[1], 2: saved[2] ?? FOLLOWUP_MESSAGES[2], 3: saved[3] ?? FOLLOWUP_MESSAGES[3] })
    } catch { /* keep defaults */ }
    return () => { cancelled = true }
  }, [])

  function saveMessage(day: number, body: string) {
    setMessages(prev => {
      const next = { ...prev, [day]: body }
      try { localStorage.setItem('sms_followup_messages', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const active = useMemo(() => prospects.filter(p => p.stage === 'following_up'), [prospects])
  const byDay = (d: number) => active.filter(p => p.day === d)
    .sort((a, b) => (Number(dueToday(b)) - Number(dueToday(a))) || (b.createdAt - a.createdAt))
  const dueCount = useMemo(() => active.filter(dueToday).length, [active])
  const tplLabel = (id: string | null) => templates.find(t => t.id === id)?.label ?? 'Unknown'

  async function onDragEnd(result: DropResult) {
    const { draggableId, destination, source } = result
    if (!destination || destination.droppableId === source.droppableId) return
    const day = Number(destination.droppableId.replace('day-', ''))
    const p = prospects.find(x => x.id === draggableId)
    if (!p) return
    setProspects(prev => prev.map(x => x.id === p.id ? { ...x, day, lastActionAt: Date.now() } : x))
    try { await setProspectDay(p.id, day) } catch (e) { console.error(e); setProspects(prev => prev.map(x => x.id === p.id ? { ...x, day: source.droppableId === destination.droppableId ? x.day : Number(source.droppableId.replace('day-', '')) } : x)) }
  }

  async function handleAdd(company: string, phone: string, sourceTemplateId: string | null) {
    const p = await createProspect(company, phone, sourceTemplateId)
    setProspects(prev => [p, ...prev])
    setShowAdd(false)
    // createProspect auto-logs a positive_reply win against the source template —
    // tell the parent so the Templates tab reflects it without a reload.
    if (sourceTemplateId) onWinsChanged?.()
  }

  function syncSelected(updater: (p: SmsProspect) => SmsProspect) {
    setProspects(prev => prev.map(p => (selected && p.id === selected.id ? updater(p) : p)))
    setSelected(s => (s ? updater(s) : s))
  }

  // Booking → create a Sales call on the chosen date AND mark the prospect booked.
  async function bookWithSale(p: SmsProspect, date: string, time: string) {
    await createCall({
      date, time: time || undefined,
      name: p.company || p.phone, business: p.company,
      source: 'cold_outreach', showed: false, qualified: false, outcome: 'pending',
      notes: p.notes || undefined,
    })
    await bookProspect(p)
    setProspects(prev => prev.map(x => x.id === p.id ? { ...x, stage: 'booked' } : x))
    setSelected(null)
    // bookProspect auto-logs a booked_meeting win — sync the Templates tab.
    if (p.sourceTemplateId) onWinsChanged?.()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 14, color: colors.textMuted }}>
          <strong style={{ color: dueCount > 0 ? colors.accent : colors.text, fontSize: 18 }}>{dueCount}</strong> due for follow-up today · {active.length} active
        </span>
        <button onClick={() => setShowAdd(true)} style={btnPrimary}><Plus size={15} /> Add Prospect</button>
      </div>

      {showAdd && <AddForm templates={live} onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}

      {loading ? (
        <div style={{ color: colors.textMuted, padding: 24, textAlign: 'center' }}>Loading…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', width: '100%', paddingBottom: 8 }}>
            {DAYS.map(day => {
              const items = byDay(day)
              return (
                <Droppable droppableId={`day-${day}`} key={day}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} style={{
                      flex: '1 1 0', minWidth: 200, background: snapshot.isDraggingOver ? 'rgba(56,161,87,0.06)' : colors.cardBg,
                      border: `1px solid ${colors.border}`, borderRadius: 12, padding: 10, minHeight: 220,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 6px 10px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors.blue, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Day {day}</span>
                        <span style={{ fontSize: 11, color: colors.textMuted }}>{items.length}</span>
                      </div>
                      {items.map((p, i) => {
                        const due = dueToday(p)
                        return (
                          <Draggable draggableId={p.id} index={i} key={p.id}>
                            {(dp) => (
                              <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps}
                                onClick={() => setSelected(p)}
                                style={{ ...cardStyle, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', border: `1px solid ${colors.border}`, boxShadow: due ? '0 0 12px rgba(56,161,87,0.30)' : undefined, ...dp.draggableProps.style }}>
                                <div style={{ color: colors.text, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.company || 'No company'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                  <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{p.phone ? fmtPhone(p.phone) : '—'}</span>
                                  {due && <span style={{ fontSize: 9, fontWeight: 700, color: colors.accent, background: 'rgba(56,161,87,0.12)', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase' }}>Call today</span>}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                      {items.length === 0 && <div style={{ fontSize: 11, color: colors.textSubtle, textAlign: 'center', padding: '16px 0' }}>—</div>}
                    </div>
                  )}
                </Droppable>
              )
            })}
          </div>
        </DragDropContext>
      )}

      <div style={{ fontSize: 11, color: colors.textSubtle, marginTop: 8 }}>Drag a card across days, or tap it to call, copy the message, and book.</div>

      {selected && (
        <ProspectModal
          prospect={selected}
          templateLabel={tplLabel(selected.sourceTemplateId)}
          message={messages[selected.day] ?? ''}
          onSaveMessage={(body) => saveMessage(selected.day, body)}
          onClose={() => setSelected(null)}
          onAdvance={async () => {
            const cur = selected.day
            if (cur >= 3) { await deleteProspect(selected.id); setProspects(prev => prev.filter(p => p.id !== selected.id)); setSelected(null) }
            else { await advanceProspect(selected.id, cur); syncSelected(p => ({ ...p, day: cur + 1, lastActionAt: Date.now() })) }
          }}
          onBook={(date, time) => bookWithSale(selected, date, time)}
          onDelete={async () => { if (!confirm('Delete this prospect?')) return; await deleteProspect(selected.id); setProspects(prev => prev.filter(p => p.id !== selected.id)); setSelected(null) }}
        />
      )}
    </div>
  )
}

function AddForm({ templates, onAdd, onCancel }: { templates: SmsTemplate[]; onAdd: (c: string, p: string, t: string | null) => Promise<void>; onCancel: () => void }) {
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [tpl, setTpl] = useState<string>(templates[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div style={{ ...cardStyle, padding: 16, marginBottom: 16, display: 'grid', gap: 10 }}>
      <input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} />
      <input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} type="tel" />
      <div>
        <label style={{ fontSize: 11, color: colors.textMuted, display: 'block', marginBottom: 4 }}>Which message brought them in?</label>
        <select value={tpl} onChange={e => setTpl(e.target.value)} style={inputStyle}>
          {templates.length === 0 && <option value="">No live templates</option>}
          {templates.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {error && <div style={{ fontSize: 12, color: colors.red }}>Couldn&rsquo;t add: {error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button disabled={saving || !phone.trim()} style={{ ...btnPrimary, opacity: saving || !phone.trim() ? 0.5 : 1 }}
          onClick={async () => {
            setSaving(true); setError(null)
            try { await onAdd(company.trim(), phone.trim(), tpl || null) }
            catch (e) { setError(e instanceof Error ? e.message : 'failed'); setSaving(false) }
          }}>
          {saving ? 'Adding…' : 'Add to Pipeline'}
        </button>
      </div>
    </div>
  )
}

function ProspectModal({ prospect: p, templateLabel, message, onSaveMessage, onClose, onAdvance, onBook, onDelete }: {
  prospect: SmsProspect; templateLabel: string; message: string; onSaveMessage: (body: string) => void; onClose: () => void
  onAdvance: () => Promise<void>; onBook: (date: string, time: string) => Promise<void>; onDelete: () => Promise<void>
}) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message)
  const [booking, setBooking] = useState(false)
  const [bDate, setBDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bTime, setBTime] = useState('')
  const msg = message

  async function copy() {
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 14, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ color: colors.text, fontWeight: 700, fontSize: 17 }}>{p.company || 'No company'}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Source: {templateLabel} · Day {p.day} of 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <a href={telHref(p.phone)} style={{ ...glowGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 9, fontWeight: 700, fontSize: 15, textDecoration: 'none', marginBottom: 6 }}>
          <Phone size={16} /> Call {fmtPhone(p.phone)}
        </a>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 6px' }}>
          <span style={{ fontSize: 12, color: colors.textMuted }}>Day {p.day} of 3 — call, then send:</span>
          {!editing && (
            <button onClick={() => { setDraft(msg); setEditing(true) }} title="Edit this message" style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setEditing(false)} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={() => { onSaveMessage(draft); setEditing(false) }} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}><Check size={15} /> Save message</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: colors.cardBgElevated, border: `1px solid ${colors.border}`, borderRadius: 9, padding: 12, fontSize: 13, color: colors.text, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{msg}</div>
            <button onClick={copy} style={{ ...btnGhost, width: '100%', justifyContent: 'center', marginTop: 8, ...(copied ? { borderColor: colors.green, color: colors.green } : {}) }}>
              {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy Day {p.day} message</>}
            </button>
          </>
        )}

        {p.day < 3 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={onAdvance} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>
              <ArrowRight size={14} /> Mark done → Day {p.day + 1}
            </button>
          </div>
        )}

        {/* Book → Sales calendar */}
        {!booking ? (
          <button onClick={() => setBooking(true)} style={{ ...glowGreen, width: '100%', justifyContent: 'center', marginTop: 8, padding: '11px 14px', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            <CalendarCheck2 size={15} /> Mark Booked
          </button>
        ) : (
          <div style={{ ...cardStyle, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>Booking date &amp; time — added to your Sales calendar:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="date" value={bDate} onChange={e => setBDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <input type="time" value={bTime} onChange={e => setBTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            </div>
            <button onClick={() => onBook(bDate, bTime)} disabled={!bDate} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8, opacity: bDate ? 1 : 0.5 }}>
              <CalendarCheck2 size={15} /> Confirm Booking → Sales
            </button>
          </div>
        )}

        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: colors.red, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, margin: '16px auto 0' }}>
          <Trash2 size={13} /> Delete prospect
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: colors.cardBgElevated, border: `1px solid ${colors.border}`, borderRadius: 8,
  padding: '11px 12px', fontSize: 14, color: colors.text, outline: 'none', boxSizing: 'border-box',
}
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: colors.accent, color: '#fff',
  border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}
const glowGreen: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(56,161,87,0.12)', color: colors.accent,
  border: '1px solid rgba(56,161,87,0.45)', cursor: 'pointer', boxShadow: '0 0 16px rgba(56,161,87,0.30)',
}
const btnGhost: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', color: colors.text,
  border: `1px solid ${colors.border}`, borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
