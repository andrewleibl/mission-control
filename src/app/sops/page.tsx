'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Check, RotateCcw, Play } from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  SOP, SOPCategory, SOPStep, SOPRunState,
  CATEGORY_LABELS, CATEGORY_COLOR, CATEGORY_ORDER,
  loadSOPs, saveSOPs, loadRunState, saveRunState,
} from '@/lib/sop-data'

export default function SOPsPage() {
  const [sops, setSOPs] = useState<SOP[]>([])
  const [runStates, setRunStates] = useState<Record<string, SOPRunState>>({})
  const [categoryFilter, setCategoryFilter] = useState<SOPCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null)

  useEffect(() => {
    loadSOPs().then(setSOPs)
    loadRunState().then(setRunStates)
  }, [])

  function persistSOPs(next: SOP[]) { setSOPs(next); saveSOPs(next) }
  function persistRunStates(next: Record<string, SOPRunState>) { setRunStates(next); saveRunState(next) }

  function addSOP(s: SOP) { persistSOPs([...sops, s]) }
  function updateSOP(updated: SOP) { persistSOPs(sops.map(s => s.id === updated.id ? updated : s)) }
  function deleteSOP(id: string) {
    persistSOPs(sops.filter(s => s.id !== id))
    const next = { ...runStates }; delete next[id]
    persistRunStates(next)
    if (selectedId === id) setSelectedId(null)
  }

  function toggleStep(sopId: string, stepId: string) {
    const current = runStates[sopId] ?? {}
    const next = { ...runStates, [sopId]: { ...current, [stepId]: !current[stepId] } }
    persistRunStates(next)
  }

  function resetRun(sopId: string) {
    persistRunStates({ ...runStates, [sopId]: {} })
  }

  const totalSOPs = sops.length
  const totalCategories = new Set(sops.map(s => s.category)).size
  const totalSteps = sops.reduce((sum, s) => sum + s.steps.length, 0)
  const stepsCompleted = Object.values(runStates).reduce((total, runState) => {
    return total + Object.values(runState).filter(Boolean).length
  }, 0)

  const visible = useMemo(() => {
    if (categoryFilter === 'all') return sops
    return sops.filter(s => s.category === categoryFilter)
  }, [sops, categoryFilter])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: sops.length }
    for (const s of sops) counts[s.category] = (counts[s.category] ?? 0) + 1
    return counts
  }, [sops])

  const selectedSOP = selectedId ? sops.find(s => s.id === selectedId) : null

  return (
    <PageContainer>
      <PageHeader
        title="SOP"
        subtitle="Standard operating procedures — how we run Straight Point Marketing."
        action={
          <button onClick={() => setShowAddModal(true)} style={primaryButtonStyle}>
            <Plus size={14} strokeWidth={2.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            New SOP
          </button>
        }
      />

      {/* KPI Strip */}
      <div className="kpi-strip" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Kpi label="Total SOPs" value={String(totalSOPs)} accent={colors.accent} />
        <Kpi label="Categories" value={String(totalCategories)} accent={colors.textMuted} />
        <Kpi label="Total Steps" value={String(totalSteps)} accent={colors.textMuted} />
        <Kpi label="Steps Run" value={String(stepsCompleted)} accent={stepsCompleted > 0 ? colors.accent : colors.textMuted} />
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
        {(['all', ...CATEGORY_ORDER] as (SOPCategory | 'all')[]).map(cat => {
          const isActive = categoryFilter === cat
          const label = cat === 'all' ? 'All' : CATEGORY_LABELS[cat]
          const count = categoryCounts[cat] ?? 0
          if (cat !== 'all' && count === 0) return null
          return (
            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
              padding: '6px 14px', borderRadius: borders.radius.medium,
              border: `1px solid ${isActive ? colors.accent : colors.border}`,
              background: isActive ? 'rgba(56,161,87,0.1)' : 'transparent',
              color: isActive ? colors.accent : colors.textMuted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {label} <span style={{ ...mono, opacity: 0.6, marginLeft: 4 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* SOP list */}
      {visible.length === 0 ? (
        <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
          No SOPs in this category yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(sop => {
            const runState = runStates[sop.id] ?? {}
            const done = sop.steps.filter(st => runState[st.id]).length
            const total = sop.steps.length
            const cat = CATEGORY_COLOR[sop.category]
            const pct = total > 0 ? Math.round((done / total) * 100) : 0
            const isActive = selectedId === sop.id

            return (
              <div
                key={sop.id}
                onClick={() => setSelectedId(isActive ? null : sop.id)}
                style={{
                  ...cardStyle, padding: '16px 20px', cursor: 'pointer',
                  border: `1px solid ${isActive ? 'rgba(56,161,87,0.35)' : colors.border}`,
                  background: isActive ? 'rgba(56,161,87,0.04)' : colors.cardBg,
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Category + title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ ...mono, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: cat.bg, color: cat.fg, letterSpacing: '0.08em', flexShrink: 0 }}>
                        {CATEGORY_LABELS[sop.category].toUpperCase()}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {sop.title}
                      </span>
                    </div>
                    {sop.description && (
                      <div style={{ fontSize: 12, color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {sop.description}
                      </div>
                    )}
                  </div>

                  {/* Step progress */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                    {done > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ ...mono, fontSize: 12, color: done === total ? colors.accent : colors.textMuted, fontWeight: 600, fontVariantNumeric: 'tabular-nums' as const }}>
                          {done}/{total} steps
                        </span>
                        <div style={{ width: 80, height: 3, background: colors.border, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: done === total ? colors.accent : colors.yellow, borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                    {done === 0 && (
                      <span style={{ ...mono, fontSize: 11, color: colors.textMuted }}>{total} steps</span>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedId(sop.id) }}
                      style={{
                        ...mono,
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                        padding: '5px 10px', borderRadius: borders.radius.medium,
                        background: done === total && total > 0 ? 'rgba(56,161,87,0.12)' : 'rgba(56,161,87,0.08)',
                        border: `1px solid rgba(56,161,87,0.2)`,
                        color: colors.accent, cursor: 'pointer',
                        fontFamily: 'var(--font-mono), monospace',
                      }}
                    >
                      <Play size={9} strokeWidth={2.5} />
                      {done === total && total > 0 ? 'DONE' : 'RUN'}
                    </button>
                  </div>
                </div>

                {/* Expanded steps */}
                {isActive && (
                  <SOPDetail
                    sop={sop}
                    runState={runStates[sop.id] ?? {}}
                    onToggleStep={(stepId) => toggleStep(sop.id, stepId)}
                    onReset={() => resetRun(sop.id)}
                    onUpdate={updateSOP}
                    onDelete={() => deleteSOP(sop.id)}
                    onEditMeta={() => setEditingSOP(sop)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && <SOPModal onClose={() => setShowAddModal(false)} onSave={addSOP} />}
      {editingSOP && (
        <SOPMetaModal
          sop={editingSOP}
          onClose={() => setEditingSOP(null)}
          onSave={updated => { persistSOPs(sops.map(s => s.id === updated.id ? updated : s)); setEditingSOP(null) }}
        />
      )}
    </PageContainer>
  )
}

// ================================================================= SOP Detail (inline expanded)
function SOPDetail({
  sop, runState, onToggleStep, onReset, onUpdate, onDelete, onEditMeta,
}: {
  sop: SOP
  runState: SOPRunState
  onToggleStep: (stepId: string) => void
  onReset: () => void
  onUpdate: (s: SOP) => void
  onDelete: () => void
  onEditMeta: () => void
}) {
  const [editMode, setEditMode] = useState(false)
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [addingStep, setAddingStep] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = sop.steps.filter(st => runState[st.id]).length
  const total = sop.steps.length

  function addStep() {
    if (!newStepTitle.trim()) return
    const newStep: SOPStep = {
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newStepTitle.trim(),
    }
    onUpdate({ ...sop, steps: [...sop.steps, newStep], lastUpdated: Date.now() })
    setNewStepTitle('')
    setAddingStep(false)
  }

  function updateStep(id: string, title: string) {
    onUpdate({ ...sop, steps: sop.steps.map(s => s.id === id ? { ...s, title } : s), lastUpdated: Date.now() })
    setEditingStepId(null)
  }

  function deleteStep(id: string) {
    onUpdate({ ...sop, steps: sop.steps.filter(s => s.id !== id), lastUpdated: Date.now() })
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: 4, padding: '6px 10px', color: colors.text,
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }} onClick={e => e.stopPropagation()}>
      {/* Run header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: done === total && total > 0 ? colors.accent : colors.textMuted }}>
          {done === total && total > 0 ? '✓ ALL DONE' : `STEP ${done + 1} OF ${total}`}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {done > 0 && (
            <button onClick={onReset} style={{ ...mono, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 4, padding: '4px 9px', color: colors.textMuted, cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
              <RotateCcw size={10} strokeWidth={2} /> RESET
            </button>
          )}
          {editMode && (
            <button onClick={onEditMeta} style={{ ...mono, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: 4, padding: '4px 9px', color: colors.textMuted, cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
              <Pencil size={10} strokeWidth={2} /> EDIT INFO
            </button>
          )}
          <button onClick={() => setEditMode(!editMode)} style={{ ...mono, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', background: editMode ? 'rgba(56,161,87,0.1)' : 'transparent', border: `1px solid ${editMode ? colors.accent : colors.border}`, borderRadius: 4, padding: '4px 9px', color: editMode ? colors.accent : colors.textMuted, cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
            <Pencil size={10} strokeWidth={2} /> {editMode ? 'DONE EDITING' : 'EDIT'}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sop.steps.map((step, i) => {
          const checked = runState[step.id] ?? false
          return (
            <div key={step.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: checked ? 'rgba(56,161,87,0.05)' : colors.cardBgElevated,
              borderRadius: borders.radius.medium,
              border: `1px solid ${checked ? 'rgba(56,161,87,0.2)' : colors.border}`,
              opacity: checked ? 0.7 : 1,
              transition: 'all 0.12s',
            }}>
              <button onClick={() => onToggleStep(step.id)} style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${checked ? colors.accent : colors.textMuted}`,
                background: checked ? colors.accent : 'transparent',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {checked && <Check size={11} strokeWidth={3} color="#fff" />}
              </button>

              <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: colors.textMuted, minWidth: 18, textAlign: 'right' as const }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              {editMode && editingStepId === step.id ? (
                <input
                  autoFocus
                  defaultValue={step.title}
                  onBlur={e => updateStep(step.id, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') updateStep(step.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') setEditingStepId(null) }}
                  style={{ ...inputStyle, flex: 1 }}
                />
              ) : (
                <span
                  style={{
                    flex: 1, fontSize: 13, color: colors.text,
                    textDecoration: checked ? 'line-through' : 'none',
                    cursor: editMode ? 'text' : 'default',
                  }}
                  onClick={editMode ? () => setEditingStepId(step.id) : undefined}
                >
                  {step.title}
                </span>
              )}

              {editMode && (
                <button onClick={() => deleteStep(step.id)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 2, opacity: 0.4, lineHeight: 0 }}>
                  <Trash2 size={12} strokeWidth={2} />
                </button>
              )}
            </div>
          )
        })}

        {editMode && (
          addingStep ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input autoFocus type="text" placeholder="New step..." value={newStepTitle}
                onChange={e => setNewStepTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addStep(); if (e.key === 'Escape') { setAddingStep(false); setNewStepTitle('') } }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addStep} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: colors.accent, color: '#fff', border: 'none', borderRadius: borders.radius.medium, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
              <button onClick={() => { setAddingStep(false); setNewStepTitle('') }} style={{ padding: '6px 10px', fontSize: 12, background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setAddingStep(true)} style={{ padding: '9px 12px', background: 'transparent', border: `1px dashed ${colors.border}`, borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const }}>
              + Add Step
            </button>
          )
        )}
      </div>

      {/* Delete */}
      {editMode && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: colors.textMuted }}>Are you sure?</span>
              <button onClick={onDelete} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, background: colors.red, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>Delete SOP</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '5px 10px', fontSize: 11, background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{ ...mono, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', background: 'transparent', border: `1px solid rgba(255,123,114,0.3)`, borderRadius: 4, padding: '4px 9px', color: colors.red, cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
              <Trash2 size={10} strokeWidth={2} /> DELETE SOP
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ================================================================= Add SOP Modal
function SOPModal({ onClose, onSave }: { onClose: () => void; onSave: (s: SOP) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SOPCategory>('other')

  function save() {
    if (!title.trim()) return
    onSave({
      id: `sop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category, steps: [],
      createdAt: Date.now(), lastUpdated: Date.now(),
    })
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '10px 12px',
    color: colors.text, fontSize: 14, outline: 'none', width: '100%', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    ...mono, fontSize: 11, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" style={{ ...cardStyle, width: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>New SOP</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title <span style={{ color: colors.red }}>*</span></label>
            <input autoFocus type="text" placeholder="e.g. Client Offboarding" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save() }} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {CATEGORY_ORDER.map(c => {
                const cp = CATEGORY_COLOR[c]
                return (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    ...mono, padding: '6px 0', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                    borderRadius: borders.radius.medium,
                    border: `1px solid ${category === c ? cp.fg : colors.border}`,
                    background: category === c ? cp.bg : 'transparent',
                    color: category === c ? cp.fg : colors.textMuted,
                    cursor: 'pointer', fontFamily: 'var(--font-mono), monospace',
                  }}>
                    {CATEGORY_LABELS[c].toUpperCase().slice(0, 9)}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea placeholder="What this SOP covers..." value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const, lineHeight: 1.5 }} />
          </div>
        </div>

        <div style={{ ...mono, marginTop: 12, padding: '8px 12px', fontSize: 10, background: 'rgba(125,138,153,0.06)', color: colors.textMuted, borderRadius: borders.radius.medium, letterSpacing: '0.04em' }}>
          Steps are added after saving — click the SOP to expand it and add steps in Edit mode.
        </div>

        <button onClick={save} style={{ marginTop: 14, width: '100%', padding: '11px 0', background: colors.accent, border: 'none', borderRadius: borders.radius.medium, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Create SOP
        </button>
      </div>
    </div>
  )
}

// ================================================================= Edit SOP metadata modal
function SOPMetaModal({ sop, onClose, onSave }: { sop: SOP; onClose: () => void; onSave: (s: SOP) => void }) {
  const [title, setTitle] = useState(sop.title)
  const [description, setDescription] = useState(sop.description ?? '')
  const [category, setCategory] = useState<SOPCategory>(sop.category)

  function save() {
    if (!title.trim()) return
    onSave({ ...sop, title: title.trim(), description: description.trim() || undefined, category, lastUpdated: Date.now() })
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '10px 12px',
    color: colors.text, fontSize: 14, outline: 'none', width: '100%', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    ...mono, fontSize: 11, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 6,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" style={{ ...cardStyle, width: 460, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Edit SOP</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title <span style={{ color: colors.red }}>*</span></label>
            <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') save() }} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {CATEGORY_ORDER.map(c => {
                const cp = CATEGORY_COLOR[c]
                return (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    ...mono, padding: '6px 0', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                    borderRadius: borders.radius.medium,
                    border: `1px solid ${category === c ? cp.fg : colors.border}`,
                    background: category === c ? cp.bg : 'transparent',
                    color: category === c ? cp.fg : colors.textMuted,
                    cursor: 'pointer', fontFamily: 'var(--font-mono), monospace',
                  }}>
                    {CATEGORY_LABELS[c].toUpperCase().slice(0, 9)}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const, lineHeight: 1.5 }} />
          </div>
        </div>
        <button onClick={save} style={{ marginTop: 20, width: '100%', padding: '11px 0', background: colors.accent, border: 'none', borderRadius: borders.radius.medium, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Save Changes
        </button>
      </div>
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...cardStyleAccent, padding: '14px 18px', flex: 1, minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted, textTransform: 'uppercase' as const, marginBottom: 6 }}>{label}</div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: accent, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  background: colors.accent, border: 'none', borderRadius: borders.radius.medium,
  color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 14px', cursor: 'pointer',
  whiteSpace: 'nowrap' as const, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center',
}
