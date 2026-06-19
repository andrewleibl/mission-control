'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, Pencil, X, Upload, Layers, ImageIcon, Type, Star, Gauge, RefreshCw, Trash2, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, borders, mono } from '@/components/DesignSystem'
import { invalidate } from '@/lib/cache'
import {
  Angle, Creative, Copy, Test, Rollup, Rec, RecType, Playbook, MetaAccount,
  loadAngles, loadCreatives, loadCopy, loadTests, loadAccounts,
  upsertAngle, upsertCreative, upsertCopy, upsertTest, upsertAccount,
  deleteAngle, deleteCreative, deleteCopy, deleteTest, deleteAccount,
  newAngle, newCreative, newCopyItem, newTest, newAccount,
  rollupByAngle, rollupByCreative, rollupTests,
  buildRecommendations, buildPlaybooks,
  parseMetaCsv, testFromCsvRow, uploadCreativeImage,
  CreativeStatus, CopyStatus, AngleStatus,
} from '@/lib/service-delivery'

type Tab = 'command' | 'angles' | 'creatives' | 'copy' | 'campaigns'

const STATUS_COLOR: Record<string, string> = {
  active: colors.blue, testing: colors.yellow, winner: colors.accent, retired: colors.textSubtle,
  idea: colors.textMuted, fatigued: colors.orange, killed: colors.red,
}

export default function ServiceDeliveryPage() {
  const [angles, setAngles] = useState<Angle[]>([])
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [copy, setCopy] = useState<Copy[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [accounts, setAccounts] = useState<MetaAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('command')
  const [campaignClient, setCampaignClient] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let off = false
    Promise.all([loadAngles(), loadCreatives(), loadCopy(), loadTests(), loadAccounts()]).then(([a, c, cp, t, ac]) => {
      if (off) return
      setAngles(a); setCreatives(c); setCopy(cp); setTests(t); setAccounts(ac); setLoading(false)
    })
    return () => { off = true }
  }, [])

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t) }, [toast])
  const flash = (m: string) => setToast(m)

  const angleName = useMemo(() => new Map(angles.map(a => [a.id, a.name])), [angles])
  const niches = useMemo(() => {
    const s = new Set<string>()
    for (const x of [...angles, ...creatives, ...copy, ...tests]) if (x.niche) s.add(x.niche)
    return [...s].sort()
  }, [angles, creatives, copy, tests])
  const recs = useMemo(() => buildRecommendations(tests), [tests])

  return (
    <PageContainer>
      <PageHeader
        title="Service Delivery"
        subtitle="Your media-buyer-in-a-box — angles, creatives, copy, and tests that learn across every client."
      />
      <Tabs tab={tab} onChange={setTab} counts={{ command: recs.length, angles: angles.length, creatives: creatives.length, copy: copy.length, campaigns: tests.length }} />

      {loading ? (
        <div style={{ color: colors.textMuted, padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : tab === 'command' ? (
        <CommandTab recs={recs} tests={tests} angles={angles} creatives={creatives} copy={copy} niches={niches} angleName={angleName} onJump={setTab}
          onOpenClient={(client) => { setCampaignClient(client); setTab('campaigns') }}
          onDeploy={async (p, client) => {
            const t = newTest()
            t.client = client; t.niche = p.niche
            t.angleId = p.angle?.id ?? null; t.creativeId = p.creative?.id ?? null; t.copyId = p.copy?.id ?? null
            t.label = `${p.angle?.name ?? p.niche} → ${client}`
            await upsertTest(t); setTests(prev => merge(prev, t)); flash('Stack deployed — now tracked in Campaigns'); setCampaignClient(client); setTab('campaigns')
          }} />
      ) : tab === 'angles' ? (
        <AnglesTab angles={angles} tests={tests} niches={niches}
          onSave={async a => { await upsertAngle(a); setAngles(p => merge(p, a)); flash('Angle saved') }}
          onDelete={async id => { await deleteAngle(id); setAngles(p => p.filter(x => x.id !== id)); flash('Angle deleted') }} />
      ) : tab === 'creatives' ? (
        <CreativesTab creatives={creatives} angles={angles} tests={tests} niches={niches} angleName={angleName}
          onSave={async c => { await upsertCreative(c); setCreatives(p => merge(p, c)); flash('Creative saved') }}
          onDelete={async id => { await deleteCreative(id); setCreatives(p => p.filter(x => x.id !== id)); flash('Creative deleted') }} />
      ) : tab === 'copy' ? (
        <CopyTab copy={copy} angles={angles} niches={niches} angleName={angleName}
          onSave={async c => { await upsertCopy(c); setCopy(p => merge(p, c)); flash('Copy saved') }}
          onDelete={async id => { await deleteCopy(id); setCopy(p => p.filter(x => x.id !== id)); flash('Copy deleted') }} />
      ) : (
        <CampaignsTab tests={tests} angles={angles} creatives={creatives} copy={copy} niches={niches} angleName={angleName}
          selectedClient={campaignClient} setSelectedClient={setCampaignClient}
          onSave={async t => { await upsertTest(t); setTests(p => merge(p, t)); flash('Campaign saved') }}
          onDelete={async id => { await deleteTest(id); setTests(p => p.filter(x => x.id !== id)); flash('Campaign deleted') }}
          onImport={async rows => {
            const byLabel = new Map(tests.map(t => [t.label, t]))
            let n = 0
            for (const r of rows) { const t = testFromCsvRow(r, byLabel.get(r.label)); await upsertTest(t); setTests(p => merge(p, t)); n++ }
            flash(`Imported ${n} campaign${n === 1 ? '' : 's'}`)
          }}
          accounts={accounts}
          onSaveAccount={async a => { await upsertAccount(a); setAccounts(p => merge(p, a)); flash('Account saved') }}
          onDeleteAccount={async id => { await deleteAccount(id); setAccounts(p => p.filter(x => x.id !== id)); flash('Account removed') }}
          onSync={async () => {
            const r = await fetch('/api/meta-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preset: 'last_30d' }) })
            const j = await r.json()
            if (!r.ok) { flash(j.error || 'Sync failed'); return }
            invalidate('sd_tests'); setTests(await loadTests())
            flash(`Synced ${j.synced} campaign${j.synced === 1 ? '' : 's'}${j.errors?.length ? ` · ${j.errors.length} error(s)` : ''}${j.flags?.length ? ` · ${j.flags.length} to verify` : ''}`)
          }} />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: colors.accent, color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 300, boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>{toast}</div>
      )}
    </PageContainer>
  )
}

function merge<T extends { id: string }>(arr: T[], item: T): T[] {
  const i = arr.findIndex(x => x.id === item.id)
  if (i >= 0) { const n = arr.slice(); n[i] = item; return n }
  return [item, ...arr]
}

// =================================================================
function Tabs({ tab, onChange, counts }: { tab: Tab; onChange: (t: Tab) => void; counts: Record<Tab, number> }) {
  const items: { key: Tab; label: string; Icon: typeof Layers }[] = [
    { key: 'command', label: 'Command', Icon: Gauge },
    { key: 'angles', label: 'Angles', Icon: Layers },
    { key: 'creatives', label: 'Creatives', Icon: ImageIcon },
    { key: 'copy', label: 'Copywriting', Icon: Type },
    { key: 'campaigns', label: 'Campaigns', Icon: Briefcase },
  ]
  return (
    <div style={{ display: 'inline-flex', background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, padding: 3, gap: 2, marginBottom: 18, flexWrap: 'wrap' }}>
      {items.map(({ key, label, Icon }) => {
        const active = tab === key
        return (
          <button key={key} onClick={() => onChange(key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: active ? colors.accent + '22' : 'transparent', border: 'none',
            borderRadius: borders.radius.small, color: active ? colors.accent : colors.textMuted,
            fontSize: 13, fontWeight: 600, padding: '7px 12px', cursor: 'pointer',
          }}>
            <Icon size={14} strokeWidth={2} /><span>{label}</span>
            <span style={{ ...mono, fontSize: 11, opacity: 0.7 }}>{counts[key]}</span>
          </button>
        )
      })}
    </div>
  )
}

// =================================================================
// Shared bits
// =================================================================
function StarRating({ value, onChange, size = 15 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size}
          onClick={onChange ? (e => { e.stopPropagation(); onChange(n === value ? 0 : n) }) : undefined}
          style={{ cursor: onChange ? 'pointer' : 'default' }}
          fill={n <= value ? colors.yellow : 'none'}
          color={n <= value ? colors.yellow : colors.textSubtle} />
      ))}
    </span>
  )
}

function Badge({ status }: { status: string }) {
  const c = STATUS_COLOR[status] ?? colors.textMuted
  return <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: c, padding: '2px 6px', border: `1px solid ${c}55`, borderRadius: 4, background: c + '15' }}>{status}</span>
}

function fmtMoney(n: number) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 }) }
function RollupStrip({ r }: { r: Rollup }) {
  if (r.tests === 0) return <span style={{ ...mono, fontSize: 11, color: colors.textSubtle }}>no test data yet</span>
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', ...mono, fontSize: 11 }}>
      <span style={{ color: r.cpl > 0 ? colors.accent : colors.textMuted }}>CPL {fmtMoney(r.cpl)}</span>
      <span style={{ color: colors.textMuted }}>{r.leads} leads</span>
      {r.booked > 0 && <span style={{ color: colors.purple }}>{r.booked} booked</span>}
      {r.closed > 0 && <span style={{ color: colors.accent }}>{r.closed} closed</span>}
      <span style={{ color: colors.textSubtle }}>{r.tests} test{r.tests === 1 ? '' : 's'} · {fmtMoney(r.spend)} spent</span>
    </div>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.accent, border: `1px solid ${colors.accent}`, borderRadius: borders.radius.medium, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 14px', cursor: 'pointer' }}><Plus size={15} strokeWidth={2.2} /><span>{label}</span></button>
}
const inputStyle: React.CSSProperties = { width: '100%', background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, padding: '9px 12px', color: colors.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ ...mono, display: 'block', fontSize: 11, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 5 }}>{label}</label>{children}</div>
}
function NicheInput({ value, onChange, niches }: { value: string; onChange: (v: string) => void; niches: string[] }) {
  return (<><input list="sd-niches" value={value} onChange={e => onChange(e.target.value)} placeholder="e.g. tree service" style={inputStyle} />
    <datalist id="sd-niches">{niches.map(n => <option key={n} value={n} />)}</datalist></>)
}
function AngleSelect({ value, onChange, angles }: { value: string | null; onChange: (v: string | null) => void; angles: Angle[] }) {
  return <select value={value ?? ''} onChange={e => onChange(e.target.value || null)} style={inputStyle}><option value="">— none —</option>{angles.map(a => <option key={a.id} value={a.id}>{a.name}{a.niche ? ` (${a.niche})` : ''}</option>)}</select>
}

function ModalShell({ title, onClose, children, onSave, onDelete, saving }: { title: string; onClose: () => void; children: React.ReactNode; onSave: () => void; onDelete?: () => void; saving?: boolean }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="modal-sheet" style={{ ...cardStyle, width: '100%', maxWidth: 560, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: colors.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 16 }}>
          <div>{onDelete && <button onClick={onDelete} style={{ background: 'transparent', border: `1px solid ${colors.red}55`, borderRadius: borders.radius.medium, color: colors.red, fontSize: 13, padding: '9px 14px', cursor: 'pointer' }}>Delete</button>}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 13, padding: '9px 16px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={onSave} disabled={saving} style={{ background: colors.accent, border: `1px solid ${colors.accent}`, borderRadius: borders.radius.medium, color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 18px', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImageDrop({ value, onUploaded }: { value: string; onUploaded: (url: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onUploadedRef = useRef(onUploaded); onUploadedRef.current = onUploaded
  const handle = useCallback(async (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    setBusy(true); setErr(null)
    try { onUploadedRef.current(await uploadCreativeImage(file)) }
    catch { setErr('Upload failed — make sure the sd-creatives storage bucket is set up.') }
    finally { setBusy(false) }
  }, [])
  // Catch Cmd/Ctrl+V anywhere while the modal is open (the drop zone doesn't
  // need focus). Only acts when the clipboard actually holds an image, so
  // pasting text into the other fields still works normally.
  useEffect(() => {
    const onDocPaste = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.items ?? [])].find(i => i.type.startsWith('image/'))?.getAsFile()
      if (f) { e.preventDefault(); handle(f) }
    }
    document.addEventListener('paste', onDocPaste)
    return () => document.removeEventListener('paste', onDocPaste)
  }, [handle])
  return (
    <div
      tabIndex={0}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files?.[0]) }}
      onClick={() => inputRef.current?.click()}
      style={{ border: `1px dashed ${colors.border}`, borderRadius: borders.radius.medium, padding: 12, textAlign: 'center', cursor: 'pointer', background: colors.cardBg, outline: 'none' }}
    >
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handle(e.target.files?.[0])} />
      {value
        ? <img src={value} alt="" style={{ maxHeight: 130, maxWidth: '100%', borderRadius: 6, display: 'block', margin: '0 auto' }} />
        : <div style={{ color: colors.textMuted, fontSize: 12, padding: '18px 0' }}>{busy ? 'Uploading…' : 'Click, paste, or drop an image'}</div>}
      <div style={{ ...mono, fontSize: 10, color: busy ? colors.accent : colors.textMuted, marginTop: 6 }}>{busy ? 'Uploading…' : value ? 'Click / paste / drop to replace' : ''}</div>
      {err && <div style={{ color: colors.red, fontSize: 11, marginTop: 6 }}>{err}</div>}
    </div>
  )
}
function NicheFilter({ value, onChange, niches }: { value: string; onChange: (v: string) => void; niches: string[] }) {
  if (niches.length === 0) return null
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '7px 10px', fontSize: 13 }}>
      <option value="">All niches</option>
      {niches.map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  )
}

// =================================================================
// Command tab — the cockpit: action queue + client center + playbooks
// =================================================================
const REC_META: Record<RecType, { label: string; color: string }> = {
  kill: { label: 'CUT', color: colors.red },
  refresh: { label: 'REFRESH', color: colors.orange },
  scale: { label: 'SCALE', color: colors.accent },
  watch: { label: 'WATCH', color: colors.yellow },
  early: { label: 'KEEP RUNNING', color: colors.blue },
  untagged: { label: 'TAG IT', color: colors.textMuted },
}
function CommandTab({ recs, tests, angles, creatives, copy, niches, angleName, onJump, onDeploy, onOpenClient }: {
  recs: Rec[]; tests: Test[]; angles: Angle[]; creatives: Creative[]; copy: Copy[]
  niches: string[]; angleName: Map<string, string>; onJump: (t: Tab) => void
  onDeploy: (p: Playbook, client: string) => Promise<void>
  onOpenClient: (client: string) => void
}) {
  const [deploy, setDeploy] = useState<Playbook | null>(null)
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthPace = now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const clients = useMemo(() => {
    const m = new Map<string, Test[]>()
    for (const t of tests) { if (!t.client) continue; const arr = m.get(t.client) ?? []; arr.push(t); m.set(t.client, arr) }
    return [...m.entries()].map(([client, ts]) => ({
      client, r: rollupTests(ts),
      mtd: ts.filter(t => (t.startedOn ?? '').slice(0, 7) === ym).reduce((s, t) => s + t.spend, 0),
    })).sort((a, b) => b.r.spend - a.r.spend)
  }, [tests, ym])
  const playbooks = useMemo(() => buildPlaybooks(niches, angles, creatives, copy, tests), [niches, angles, creatives, copy, tests])

  const [budgets, setBudgets] = useState<Record<string, number>>({})
  useEffect(() => { try { const r = localStorage.getItem('sd_client_budgets'); if (r) setBudgets(JSON.parse(r)) } catch { } }, [])
  function setBudget(client: string, n: number) {
    setBudgets(prev => { const next = { ...prev, [client]: n }; try { localStorage.setItem('sd_client_budgets', JSON.stringify(next)) } catch { } return next })
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Action queue */}
      <div>
        <SectionTitle title="Action queue" sub="what a media buyer would do today" />
        {recs.length === 0 ? (
          <Empty msg="No actions yet. Import a CSV on Testing and tag tests with their angle — recommendations appear here automatically." />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recs.map(rec => {
              const m = REC_META[rec.type]
              return (
                <div key={rec.testId + rec.type} onClick={() => onJump('campaigns')} style={{ ...cardStyle, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderLeft: `3px solid ${m.color}` }}>
                  <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: m.color, background: m.color + '18', border: `1px solid ${m.color}44`, borderRadius: 4, padding: '3px 7px', minWidth: 96, textAlign: 'center' }}>{m.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{rec.label}{rec.client ? <span style={{ color: colors.textMuted, fontWeight: 400 }}> · {rec.client}</span> : null}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{rec.message}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Client command center */}
      {clients.length > 0 && (
        <div>
          <SectionTitle title="Client command center" sub="every account's spend, CPL, and conversion at a glance" />
          <div className="responsive-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {clients.map(({ client, r, mtd }) => (
              <div key={client} onClick={() => onOpenClient(client)} style={{ ...cardStyle, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: colors.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>{client} <ChevronRight size={14} color={colors.textMuted} /></span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Stat label="Spend (all)" value={fmtMoney(r.spend)} />
                  <Stat label="CPL" value={r.cpl ? fmtMoney(r.cpl) : '—'} color={colors.accent} />
                  <Stat label="Leads" value={String(r.leads)} />
                  <Stat label="Booked" value={String(r.booked)} color={r.booked > 0 ? colors.purple : colors.textMuted} />
                </div>
                <BudgetPacing client={client} mtd={mtd} budget={budgets[client] ?? 0} pace={monthPace} onSet={n => setBudget(client, n)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playbooks */}
      {playbooks.length > 0 && (
        <div>
          <SectionTitle title="Niche playbooks" sub="the proven winning stack to deploy on a new client" />
          <div style={{ display: 'grid', gap: 10 }}>
            {playbooks.map(p => (
              <div key={p.niche} style={{ ...cardStyle, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ ...mono, fontSize: 10, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{p.niche}</span>
                  <button onClick={() => setDeploy(p)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: colors.accent + '18', border: `1px solid ${colors.accent}44`, borderRadius: borders.radius.small, color: colors.accent, fontSize: 12, fontWeight: 600, padding: '5px 10px', cursor: 'pointer' }}><Plus size={13} /> Deploy to client</button>
                </div>
                <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <PlaybookCell label="Best angle" main={p.angle?.name ?? '—'} sub={p.angleCpl ? `CPL ${fmtMoney(p.angleCpl)}` : 'no data'} onClick={() => onJump('angles')} />
                  <PlaybookCell label="Best creative" main={p.creative?.name ?? '—'} sub={p.creative ? `${p.creative.rating}★` : 'add one'} onClick={() => onJump('creatives')} />
                  <PlaybookCell label="Best copy" main={p.copy?.name ?? '—'} sub={p.copy ? `${p.copy.rating}★` : 'add one'} onClick={() => onJump('copy')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {deploy && <DeployModal playbook={deploy} onClose={() => setDeploy(null)} onDeploy={async client => { await onDeploy(deploy, client); setDeploy(null) }} />}
    </div>
  )
}
function DeployModal({ playbook, onClose, onDeploy }: { playbook: Playbook; onClose: () => void; onDeploy: (client: string) => Promise<void> }) {
  const [client, setClient] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <ModalShell title={`Deploy ${playbook.niche} stack`} onClose={onClose} saving={saving}
      onSave={async () => { if (!client.trim()) return; setSaving(true); await onDeploy(client.trim()) }}>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
        Creates a tracked test for the new client using this niche&apos;s proven stack:
      </p>
      <div style={{ display: 'grid', gap: 6, marginBottom: 14, ...mono, fontSize: 12 }}>
        <span style={{ color: colors.text }}>Angle: <span style={{ color: colors.accent }}>{playbook.angle?.name ?? '—'}</span></span>
        <span style={{ color: colors.text }}>Creative: <span style={{ color: colors.accent }}>{playbook.creative?.name ?? '—'}</span></span>
        <span style={{ color: colors.text }}>Copy: <span style={{ color: colors.accent }}>{playbook.copy?.name ?? '—'}</span></span>
      </div>
      <Field label="New client name"><input autoFocus value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Smith Tree Co." style={inputStyle} /></Field>
    </ModalShell>
  )
}
function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return <div style={{ marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: colors.text }}>{title}</h3><span style={{ ...mono, fontSize: 11, color: colors.textMuted }}>{sub}</span></div>
}
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div><div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</div><div style={{ ...mono, fontSize: 16, fontWeight: 700, color: color ?? colors.text }}>{value}</div></div>
}
function BudgetPacing({ mtd, budget, pace, onSet }: { client: string; mtd: number; budget: number; pace: number; onSet: (n: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const expected = budget * pace
  const pct = budget > 0 ? Math.min(1, mtd / budget) : 0
  let label = '', color = colors.textMuted
  if (budget > 0) {
    if (mtd > expected * 1.1) { color = colors.orange; label = 'ahead of pace' }
    else if (mtd < expected * 0.9) { color = colors.blue; label = 'behind pace' }
    else { color = colors.accent; label = 'on pace' }
  }
  const commit = () => { const n = parseFloat(draft); if (!isNaN(n) && n >= 0) onSet(n); setEditing(false) }
  return (
    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Budget / mo</span>
        {editing ? (
          <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            style={{ ...inputStyle, width: 90, padding: '3px 6px', fontSize: 12, textAlign: 'right' }} />
        ) : (
          <button onClick={() => { setDraft(String(budget || '')); setEditing(true) }} style={{ ...mono, background: 'none', border: 'none', color: colors.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{budget > 0 ? fmtMoney(budget) : 'set'} <Pencil size={9} color={colors.textMuted} /></button>
        )}
      </div>
      {budget > 0 && (
        <>
          <div style={{ height: 6, background: colors.cardBgElevated, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct * 100}%`, height: '100%', background: color }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, ...mono, fontSize: 10 }}>
            <span style={{ color: colors.textMuted }}>{fmtMoney(mtd)} MTD</span>
            <span style={{ color }}>{label}</span>
          </div>
        </>
      )}
    </div>
  )
}
function PlaybookCell({ label, main, sub, onClick }: { label: string; main: string; sub: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ background: colors.cardBgElevated, borderRadius: borders.radius.small, padding: '10px 12px', cursor: 'pointer' }}>
      <div style={{ ...mono, fontSize: 9, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{main}</div>
      <div style={{ ...mono, fontSize: 11, color: colors.accent }}>{sub}</div>
    </div>
  )
}

// =================================================================
// Angles tab
// =================================================================
function AnglesTab({ angles, tests, niches, onSave, onDelete }: { angles: Angle[]; tests: Test[]; niches: string[]; onSave: (a: Angle) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [edit, setEdit] = useState<Angle | null>(null)
  const [filter, setFilter] = useState('')
  const shown = filter ? angles.filter(a => a.niche === filter) : angles
  const ranked = useMemo(() => shown.map(a => ({ a, r: rollupByAngle(a.id, tests) }))
    .sort((x, y) => {
      if (x.r.tests && y.r.tests) return (x.r.cpl || 1e9) - (y.r.cpl || 1e9)
      return y.r.tests - x.r.tests
    }), [shown, tests])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <NicheFilter value={filter} onChange={setFilter} niches={niches} />
        <AddBtn label="New Angle" onClick={() => setEdit(newAngle())} />
      </div>
      {ranked.length === 0 ? <Empty msg="No angles yet. Add the marketing concepts you test — creatives and copy hang off these." /> : (
        <div className="responsive-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {ranked.map(({ a, r }) => (
            <div key={a.id} onClick={() => setEdit(a)} style={{ ...cardStyle, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{a.name || '(untitled)'}</span>
                <Badge status={a.status} />
              </div>
              {a.niche && <span style={{ ...mono, fontSize: 10, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{a.niche}</span>}
              {a.description && <p style={{ margin: 0, fontSize: 12, color: colors.textMuted, lineHeight: 1.45 }}>{a.description}</p>}
              <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${colors.border}` }}><RollupStrip r={r} /></div>
            </div>
          ))}
        </div>
      )}
      {edit && <AngleModal angle={edit} niches={niches} onClose={() => setEdit(null)}
        onSave={async a => { await onSave(a); setEdit(null) }}
        onDelete={async () => { await onDelete(edit.id); setEdit(null) }} />}
    </div>
  )
}
function AngleModal({ angle, niches, onClose, onSave, onDelete }: { angle: Angle; niches: string[]; onClose: () => void; onSave: (a: Angle) => Promise<void>; onDelete: () => Promise<void> }) {
  const [a, setA] = useState(angle); const [saving, setSaving] = useState(false)
  const isNew = !angle.name
  return (
    <ModalShell title={isNew ? 'New Angle' : 'Edit Angle'} onClose={onClose} saving={saving}
      onSave={async () => { if (!a.name.trim()) return; setSaving(true); await onSave(a) }}
      onDelete={isNew ? undefined : onDelete}>
      <Field label="Name"><input autoFocus value={a.name} onChange={e => setA({ ...a, name: e.target.value })} placeholder="e.g. Pay-per-appointment" style={inputStyle} /></Field>
      <Field label="Niche"><NicheInput value={a.niche} onChange={v => setA({ ...a, niche: v })} niches={niches} /></Field>
      <Field label="Description"><textarea value={a.description} onChange={e => setA({ ...a, description: e.target.value })} rows={3} placeholder="The core concept / promise" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
      <Field label="Status"><select value={a.status} onChange={e => setA({ ...a, status: e.target.value as AngleStatus })} style={inputStyle}>{['active', 'testing', 'winner', 'retired'].map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
      <Field label="Notes"><textarea value={a.notes} onChange={e => setA({ ...a, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
    </ModalShell>
  )
}

// =================================================================
// Creatives tab
// =================================================================
function CreativesTab({ creatives, angles, tests, niches, angleName, onSave, onDelete }: { creatives: Creative[]; angles: Angle[]; tests: Test[]; niches: string[]; angleName: Map<string, string>; onSave: (c: Creative) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [edit, setEdit] = useState<Creative | null>(null)
  const [filter, setFilter] = useState('')
  const shown = (filter ? creatives.filter(c => c.niche === filter) : creatives)
    .slice().sort((a, b) => b.rating - a.rating)
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <NicheFilter value={filter} onChange={setFilter} niches={niches} />
        <AddBtn label="New Creative" onClick={() => setEdit(newCreative())} />
      </div>
      {shown.length === 0 ? <Empty msg="No creatives yet. Add your ad assets — link the file, tag the angle, rate it." /> : (
        <div className="responsive-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {shown.map(c => {
            const r = rollupByCreative(c.id, tests)
            return (
              <div key={c.id} onClick={() => setEdit(c)} style={{ ...cardStyle, padding: 0, cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 130, background: colors.cardBgElevated, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {c.thumbUrl
                    ? <img src={c.thumbUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <ImageIcon size={28} color={colors.textSubtle} />}
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name || '(untitled)'}</span>
                    <Badge status={c.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <StarRating value={c.rating} />
                    <span style={{ ...mono, fontSize: 9, color: colors.textMuted, textTransform: 'uppercase' as const }}>{c.format}</span>
                  </div>
                  {c.angleId && <span style={{ ...mono, fontSize: 10, color: colors.accent }}>{angleName.get(c.angleId) ?? ''}</span>}
                  <div style={{ marginTop: 'auto', paddingTop: 6 }}><RollupStrip r={r} /></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {edit && <CreativeModal creative={edit} angles={angles} niches={niches} onClose={() => setEdit(null)}
        onSave={async c => { await onSave(c); setEdit(null) }}
        onDelete={async () => { await onDelete(edit.id); setEdit(null) }} />}
    </div>
  )
}
function CreativeModal({ creative, angles, niches, onClose, onSave, onDelete }: { creative: Creative; angles: Angle[]; niches: string[]; onClose: () => void; onSave: (c: Creative) => Promise<void>; onDelete: () => Promise<void> }) {
  const [c, setC] = useState(creative); const [saving, setSaving] = useState(false)
  const isNew = !creative.name
  return (
    <ModalShell title={isNew ? 'New Creative' : 'Edit Creative'} onClose={onClose} saving={saving}
      onSave={async () => { if (!c.name.trim()) return; setSaving(true); await onSave(c) }}
      onDelete={isNew ? undefined : onDelete}>
      <Field label="Name"><input autoFocus value={c.name} onChange={e => setC({ ...c, name: e.target.value })} placeholder="e.g. Crews Ready - Orange Truck" style={inputStyle} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Angle"><AngleSelect value={c.angleId} onChange={v => setC({ ...c, angleId: v })} angles={angles} /></Field>
        <Field label="Niche"><NicheInput value={c.niche} onChange={v => setC({ ...c, niche: v })} niches={niches} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Format"><select value={c.format} onChange={e => setC({ ...c, format: e.target.value as Creative['format'] })} style={inputStyle}>{['image', 'video', 'carousel'].map(f => <option key={f} value={f}>{f}</option>)}</select></Field>
        <Field label="Status"><select value={c.status} onChange={e => setC({ ...c, status: e.target.value as CreativeStatus })} style={inputStyle}>{['idea', 'testing', 'winner', 'fatigued', 'killed'].map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Image — paste, drop, or click"><ImageDrop value={c.thumbUrl} onUploaded={url => setC({ ...c, thumbUrl: url, assetUrl: c.assetUrl || url })} /></Field>
      <Field label="Asset link (Meta / Drive — optional)"><input value={c.assetUrl} onChange={e => setC({ ...c, assetUrl: e.target.value })} placeholder="https://… (link to the full asset)" style={inputStyle} /></Field>
      <Field label="Rating"><StarRating value={c.rating} onChange={n => setC({ ...c, rating: n })} size={22} /></Field>
      <Field label="Notes"><textarea value={c.notes} onChange={e => setC({ ...c, notes: e.target.value })} rows={2} placeholder="What worked / when tested / observations" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
    </ModalShell>
  )
}

// =================================================================
// Copy tab
// =================================================================
function CopyTab({ copy, angles, niches, angleName, onSave, onDelete }: { copy: Copy[]; angles: Angle[]; niches: string[]; angleName: Map<string, string>; onSave: (c: Copy) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [edit, setEdit] = useState<Copy | null>(null)
  const [filter, setFilter] = useState('')
  const shown = (filter ? copy.filter(c => c.niche === filter) : copy).slice().sort((a, b) => b.rating - a.rating)
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <NicheFilter value={filter} onChange={setFilter} niches={niches} />
        <AddBtn label="New Copy" onClick={() => setEdit(newCopyItem())} />
      </div>
      {shown.length === 0 ? <Empty msg="No copy yet. Bank your hooks, primary text, and headlines — ranked." /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {shown.map(c => (
            <div key={c.id} onClick={() => setEdit(c)} style={{ ...cardStyle, padding: 14, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: colors.blue, padding: '2px 6px', border: `1px solid ${colors.blue}55`, borderRadius: 4 }}>{c.kind}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{c.name || '(untitled)'}</span>
                  {c.angleId && <span style={{ ...mono, fontSize: 10, color: colors.accent }}>{angleName.get(c.angleId) ?? ''}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><StarRating value={c.rating} /><Badge status={c.status} /></div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: colors.textMuted, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.body}</p>
            </div>
          ))}
        </div>
      )}
      {edit && <CopyModal item={edit} angles={angles} niches={niches} onClose={() => setEdit(null)}
        onSave={async c => { await onSave(c); setEdit(null) }}
        onDelete={async () => { await onDelete(edit.id); setEdit(null) }} />}
    </div>
  )
}
function CopyModal({ item, angles, niches, onClose, onSave, onDelete }: { item: Copy; angles: Angle[]; niches: string[]; onClose: () => void; onSave: (c: Copy) => Promise<void>; onDelete: () => Promise<void> }) {
  const [c, setC] = useState(item); const [saving, setSaving] = useState(false)
  const isNew = !item.name
  return (
    <ModalShell title={isNew ? 'New Copy' : 'Edit Copy'} onClose={onClose} saving={saving}
      onSave={async () => { if (!c.name.trim()) return; setSaving(true); await onSave(c) }}
      onDelete={isNew ? undefined : onDelete}>
      <Field label="Name / label"><input autoFocus value={c.name} onChange={e => setC({ ...c, name: e.target.value })} placeholder="e.g. Capacity question hook" style={inputStyle} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Type"><select value={c.kind} onChange={e => setC({ ...c, kind: e.target.value as Copy['kind'] })} style={inputStyle}>{['hook', 'primary', 'headline'].map(k => <option key={k} value={k}>{k}</option>)}</select></Field>
        <Field label="Status"><select value={c.status} onChange={e => setC({ ...c, status: e.target.value as CopyStatus })} style={inputStyle}>{['idea', 'testing', 'winner', 'killed'].map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
      </div>
      <Field label="Copy"><textarea value={c.body} onChange={e => setC({ ...c, body: e.target.value })} rows={5} placeholder="The actual text…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Angle"><AngleSelect value={c.angleId} onChange={v => setC({ ...c, angleId: v })} angles={angles} /></Field>
        <Field label="Niche"><NicheInput value={c.niche} onChange={v => setC({ ...c, niche: v })} niches={niches} /></Field>
      </div>
      <Field label="Rating"><StarRating value={c.rating} onChange={n => setC({ ...c, rating: n })} size={22} /></Field>
      <Field label="Notes"><textarea value={c.notes} onChange={e => setC({ ...c, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
    </ModalShell>
  )
}

// =================================================================
// Testing tab — leaderboard + CSV import + table
// =================================================================
function deliveryMeta(d: string): { label: string; color: string; rank: number } {
  const u = (d || '').toUpperCase()
  if (u === 'ACTIVE') return { label: 'Active', color: colors.accent, rank: 0 }
  if (u.includes('PAUSED')) return { label: 'Paused', color: colors.yellow, rank: 1 }
  if (!u) return { label: '—', color: colors.textSubtle, rank: 3 }
  return { label: u.charAt(0) + u.slice(1).toLowerCase(), color: colors.textMuted, rank: 2 }
}

// Relative "freshness" label for the last Meta sync.
function timeAgo(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function CampaignsTab({ tests, angles, creatives, copy, niches, angleName, selectedClient, setSelectedClient, onSave, onDelete, onImport, accounts, onSaveAccount, onDeleteAccount, onSync }: {
  tests: Test[]; angles: Angle[]; creatives: Creative[]; copy: Copy[]; niches: string[]; angleName: Map<string, string>
  selectedClient: string | null; setSelectedClient: (c: string | null) => void
  onSave: (t: Test) => Promise<void>; onDelete: (id: string) => Promise<void>; onImport: (rows: ReturnType<typeof parseMetaCsv>) => Promise<void>
  accounts: MetaAccount[]; onSaveAccount: (a: MetaAccount) => Promise<void>; onDeleteAccount: (id: string) => Promise<void>; onSync: () => Promise<void>
}) {
  const [edit, setEdit] = useState<Test | null>(null)
  const [showAccounts, setShowAccounts] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const creativeName = useMemo(() => new Map(creatives.map(c => [c.id, c.name])), [creatives])

  const clientGroups = useMemo(() => {
    const m = new Map<string, Test[]>()
    for (const t of tests) { const c = t.client || 'Unassigned'; const a = m.get(c) ?? []; a.push(t); m.set(c, a) }
    // Include connected-but-dormant accounts (mapped in Meta accounts, no campaigns yet)
    for (const acc of accounts) { if (acc.client && !m.has(acc.client)) m.set(acc.client, []) }
    return [...m.entries()].map(([client, ts]) => ({
      client, count: ts.length, r: rollupTests(ts),
      active: ts.filter(t => (t.delivery || '').toUpperCase() === 'ACTIVE').length,
    })).sort((a, b) => b.r.spend - a.r.spend)
  }, [tests, accounts])

  const detailTests = useMemo(() => !selectedClient ? [] : tests
    .filter(t => (t.client || 'Unassigned') === selectedClient)
    .sort((a, b) => deliveryMeta(a.delivery).rank - deliveryMeta(b.delivery).rank || b.spend - a.spend),
    [tests, selectedClient])
  const detailRollup = useMemo(() => rollupTests(detailTests), [detailTests])

  // Freshest Meta sync across all campaigns — drives the "Last synced" label so
  // you can always tell whether the numbers are live or stale.
  const lastSynced = useMemo(() => {
    const stamps = tests.map(t => t.syncedAt ?? 0).filter(Boolean)
    return stamps.length ? Math.max(...stamps) : null
  }, [tests])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const text = await f.text()
    const rows = parseMetaCsv(text)
    if (rows.length) await onImport(rows)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ ...mono, fontSize: 11, color: colors.textMuted }}>
          Sync Meta pulls live campaigns per client · or drop a CSV.
          {lastSynced && <span style={{ color: colors.text }}> · Last synced {timeAgo(lastSynced)}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
          <button onClick={() => setShowAccounts(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 13, fontWeight: 600, padding: '8px 12px', cursor: 'pointer' }}>Meta accounts</button>
          <button onClick={async () => { setSyncing(true); try { await onSync() } finally { setSyncing(false) } }} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.blue + '18', border: `1px solid ${colors.blue}44`, borderRadius: borders.radius.medium, color: colors.blue, fontSize: 13, fontWeight: 600, padding: '8px 12px', cursor: syncing ? 'wait' : 'pointer' }}><RefreshCw size={14} /><span>{syncing ? 'Syncing…' : 'Sync Meta'}</span></button>
          <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, color: colors.text, fontSize: 13, fontWeight: 600, padding: '8px 12px', cursor: 'pointer' }}><Upload size={15} /><span>Import CSV</span></button>
          <AddBtn label="New" onClick={() => { const t = newTest(); if (selectedClient && selectedClient !== 'Unassigned') t.client = selectedClient; setEdit(t) }} />
        </div>
      </div>

      {/* CLIENT LIST */}
      {!selectedClient && (
        clientGroups.length === 0
          ? <Empty msg="No campaigns yet. Sync Meta or import a CSV — they'll group by client here." />
          : (
            <div className="responsive-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {clientGroups.map(({ client, count, active, r }) => (
                <div key={client} onClick={() => setSelectedClient(client)} style={{ ...cardStyle, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{client}</span>
                    <ChevronRight size={15} color={colors.textMuted} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, ...mono, fontSize: 10, color: colors.textMuted }}>
                    {count === 0
                      ? <span style={{ color: colors.blue }}>● connected · no campaigns yet</span>
                      : <><span>{count} campaign{count === 1 ? '' : 's'}</span>{active > 0 && <span style={{ color: colors.accent }}>● {active} active</span>}</>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <Stat label="Spend" value={fmtMoney(r.spend)} />
                    <Stat label="CPL" value={r.cpl ? fmtMoney(r.cpl) : '—'} color={colors.accent} />
                    <Stat label="Leads" value={String(r.leads)} />
                    <Stat label="Booked" value={String(r.booked)} color={r.booked > 0 ? colors.purple : colors.textMuted} />
                  </div>
                </div>
              ))}
            </div>
          )
      )}

      {/* CLIENT DETAIL */}
      {selectedClient && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setSelectedClient(null)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 12, padding: '6px 10px', cursor: 'pointer' }}><ChevronLeft size={14} /> All clients</button>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{selectedClient}</h3>
            <div style={{ marginLeft: 'auto' }}><RollupStrip r={detailRollup} /></div>
          </div>
          {detailTests.length === 0 ? <Empty msg="No campaigns for this client yet." /> : (
            <div className="responsive-table" style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead><tr>{['Campaign', 'Status', 'Angle', 'Creative', 'Spend', 'Leads', 'CPL', 'CTR', 'Freq', 'Booked', ''].map(h => (
                  <th key={h} style={{ ...mono, fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.06em', textAlign: 'left', padding: '10px 8px', borderBottom: `1px solid ${colors.border}` }}>{h.toUpperCase()}</th>
                ))}</tr></thead>
                <tbody>
                  {detailTests.map(t => {
                    const dm = deliveryMeta(t.delivery)
                    return (
                      <tr key={t.id} onClick={() => setEdit(t)} style={{ cursor: 'pointer' }}>
                        <td style={{ padding: '9px 8px', fontSize: 12, color: colors.text, fontWeight: 500, borderBottom: `1px solid ${colors.border}`, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label || '(untitled)'}</td>
                        <td style={{ padding: '9px 8px', borderBottom: `1px solid ${colors.border}` }}><span style={{ ...mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: dm.color }}>{dm.label}</span></td>
                        <td style={{ padding: '9px 8px', fontSize: 11, color: colors.accent, borderBottom: `1px solid ${colors.border}` }}>{t.angleId ? (angleName.get(t.angleId) ?? '') : '—'}</td>
                        <td style={{ padding: '9px 8px', fontSize: 11, color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{t.creativeId ? (creativeName.get(t.creativeId) ?? '') : '—'}</td>
                        <td style={{ ...mono, padding: '9px 8px', fontSize: 12, color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{fmtMoney(t.spend)}</td>
                        <td style={{ ...mono, padding: '9px 8px', fontSize: 12, color: colors.text, borderBottom: `1px solid ${colors.border}` }}>{t.leads}</td>
                        <td style={{ ...mono, padding: '9px 8px', fontSize: 12, color: colors.accent, fontWeight: 600, borderBottom: `1px solid ${colors.border}` }}>{t.cpl ? fmtMoney(t.cpl) : '—'}</td>
                        <td style={{ ...mono, padding: '9px 8px', fontSize: 12, color: colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{t.ctr ? t.ctr.toFixed(2) + '%' : '—'}</td>
                        <td style={{ ...mono, padding: '9px 8px', fontSize: 12, color: t.frequency > 2.5 ? colors.orange : colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>{t.frequency ? t.frequency.toFixed(2) : '—'}</td>
                        <td style={{ ...mono, padding: '9px 8px', fontSize: 12, color: t.booked > 0 ? colors.purple : colors.textSubtle, borderBottom: `1px solid ${colors.border}` }}>{t.booked || '—'}</td>
                        <td style={{ padding: '9px 8px', borderBottom: `1px solid ${colors.border}` }}><Pencil size={13} color={colors.textSubtle} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {edit && <TestModal test={edit} angles={angles} creatives={creatives} copy={copy} niches={niches} onClose={() => setEdit(null)}
        onSave={async t => { await onSave(t); setEdit(null) }}
        onDelete={async () => { await onDelete(edit.id); setEdit(null) }} />}
      {showAccounts && <AccountsModal accounts={accounts} onClose={() => setShowAccounts(false)} onSave={onSaveAccount} onDelete={onDeleteAccount} />}
    </div>
  )
}
function AccountsModal({ accounts, onClose, onSave, onDelete }: { accounts: MetaAccount[]; onClose: () => void; onSave: (a: MetaAccount) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [draft, setDraft] = useState<MetaAccount>(newAccount())
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="modal-sheet" style={{ ...cardStyle, width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: colors.text }}>Meta ad accounts</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>Map each client to their Meta ad account ID (<span style={{ ...mono }}>act_…</span>). Sync Meta then pulls each one&apos;s campaigns automatically.</p>
        <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
          {accounts.length === 0 && <span style={{ ...mono, fontSize: 12, color: colors.textSubtle }}>None mapped yet.</span>}
          {accounts.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: colors.cardBgElevated, borderRadius: borders.radius.small }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: colors.text, fontWeight: 600 }}>{a.client}</div>
                <div style={{ ...mono, fontSize: 11, color: colors.textMuted }}>{a.adAccountId}</div>
              </div>
              <button onClick={() => onSave({ ...a, active: !a.active })} style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: a.active ? colors.accent : colors.textSubtle, background: 'transparent', border: `1px solid ${(a.active ? colors.accent : colors.textSubtle)}55`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer' }}>{a.active ? 'ACTIVE' : 'OFF'}</button>
              <button onClick={() => onDelete(a.id)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <input value={draft.client} onChange={e => setDraft({ ...draft, client: e.target.value })} placeholder="Client name" style={inputStyle} />
          <input value={draft.adAccountId} onChange={e => setDraft({ ...draft, adAccountId: e.target.value })} placeholder="act_1234567890" style={inputStyle} />
        </div>
        <button onClick={async () => { if (!draft.client.trim() || !draft.adAccountId.trim()) return; await onSave(draft); setDraft(newAccount()) }} style={{ background: colors.accent, border: `1px solid ${colors.accent}`, borderRadius: borders.radius.medium, color: '#fff', fontSize: 13, fontWeight: 600, padding: '9px 16px', cursor: 'pointer' }}>Add account</button>
      </div>
    </div>
  )
}
function TestModal({ test, angles, creatives, copy, niches, onClose, onSave, onDelete }: { test: Test; angles: Angle[]; creatives: Creative[]; copy: Copy[]; niches: string[]; onClose: () => void; onSave: (t: Test) => Promise<void>; onDelete: () => Promise<void> }) {
  const [t, setT] = useState(test); const [saving, setSaving] = useState(false)
  const isNew = !test.label && !test.spend
  const numField = (label: string, key: keyof Test, step = '1') => (
    <Field label={label}><input type="number" step={step} value={(t[key] as number) || ''} onChange={e => setT({ ...t, [key]: parseFloat(e.target.value) || 0 })} style={inputStyle} /></Field>
  )
  return (
    <ModalShell title={isNew ? 'New Test' : 'Edit Test'} onClose={onClose} saving={saving}
      onSave={async () => { setSaving(true); await onSave(t) }}
      onDelete={isNew ? undefined : onDelete}>
      <Field label="Campaign / label"><input autoFocus value={t.label} onChange={e => setT({ ...t, label: e.target.value })} placeholder="Meta campaign name" style={inputStyle} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Client"><input value={t.client} onChange={e => setT({ ...t, client: e.target.value })} placeholder="Client name" style={inputStyle} /></Field>
        <Field label="Niche"><NicheInput value={t.niche} onChange={v => setT({ ...t, niche: v })} niches={niches} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Angle"><AngleSelect value={t.angleId} onChange={v => setT({ ...t, angleId: v })} angles={angles} /></Field>
        <Field label="Creative"><select value={t.creativeId ?? ''} onChange={e => setT({ ...t, creativeId: e.target.value || null })} style={inputStyle}><option value="">— none —</option>{creatives.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      </div>
      <Field label="Copy"><select value={t.copyId ?? ''} onChange={e => setT({ ...t, copyId: e.target.value || null })} style={inputStyle}><option value="">— none —</option>{copy.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Started"><input type="date" value={t.startedOn ?? ''} onChange={e => setT({ ...t, startedOn: e.target.value || null })} style={inputStyle} /></Field>
        <Field label="Ended"><input type="date" value={t.endedOn ?? ''} onChange={e => setT({ ...t, endedOn: e.target.value || null })} style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {numField('Spend', 'spend', '0.01')}
        {numField('Leads', 'leads')}
        {numField('CPL', 'cpl', '0.01')}
        {numField('CTR %', 'ctr', '0.01')}
        {numField('Frequency', 'frequency', '0.01')}
        {numField('Booked', 'booked')}
        {numField('Closed', 'closed')}
      </div>
      <Field label="Notes"><textarea value={t.notes} onChange={e => setT({ ...t, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} /></Field>
    </ModalShell>
  )
}

function Empty({ msg }: { msg: string }) {
  return <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>{msg}</div>
}
