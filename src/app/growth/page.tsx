'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Check, ChevronRight } from 'lucide-react'
import { PageContainer, PageHeader, colors, cardStyle, cardStyleAccent, borders, mono } from '@/components/DesignSystem'
import {
  Goal, GoalHorizon, GoalStatus, GoalCategory, Milestone,
  HORIZON_LABELS, HORIZON_ORDER, CATEGORY_LABELS, CATEGORY_COLOR, STATUS_LABELS, STATUS_COLOR,
  loadGoals, saveGoals, progressPct, milestonesCompleted, nextMilestone, fmtValue, fmtDeadline,
} from '@/lib/growth-data'

export default function GrowthPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [horizonFilter, setHorizonFilter] = useState<GoalHorizon | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [goalModal, setGoalModal] = useState<{ mode: 'add' } | { mode: 'edit'; goal: Goal } | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => { loadGoals().then(setGoals) }, [])

  function persistGoals(next: Goal[]) { setGoals(next); saveGoals(next) }
  function addGoal(g: Goal) { persistGoals([g, ...goals]) }
  function updateGoal(updated: Goal) { persistGoals(goals.map(g => g.id === updated.id ? updated : g)) }
  function deleteGoal(id: string) {
    persistGoals(goals.filter(g => g.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const active = goals.filter(g => g.status !== 'completed' && g.status !== 'paused')
  const atRisk = goals.filter(g => g.status === 'at-risk')
  const completed = goals.filter(g => g.status === 'completed')
  const totalMilestonesDone = goals.reduce((s, g) => s + milestonesCompleted(g), 0)

  const visible = useMemo(() => {
    let v = showCompleted ? goals : goals.filter(g => g.status !== 'completed')
    if (horizonFilter !== 'all') v = v.filter(g => g.horizon === horizonFilter)
    const statusOrder: Record<GoalStatus, number> = { 'at-risk': 0, active: 1, paused: 2, completed: 3 }
    return [...v].sort((a, b) =>
      statusOrder[a.status] !== statusOrder[b.status]
        ? statusOrder[a.status] - statusOrder[b.status]
        : progressPct(b) - progressPct(a)
    )
  }, [goals, horizonFilter, showCompleted])

  const selectedGoal = selectedId ? goals.find(g => g.id === selectedId) : null

  return (
    <PageContainer>
      <PageHeader
        title="Growth"
        subtitle="Where you're going and the steps to get there."
        action={
          <button onClick={() => setGoalModal({ mode: 'add' })} style={primaryButtonStyle}>
            <Plus size={14} strokeWidth={2.5} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Add Goal
          </button>
        }
      />

      {/* KPI Strip */}
      <div className="kpi-strip" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Kpi label="Active Goals" value={String(active.length)} accent={active.length > 0 ? colors.accent : colors.textMuted} />
        <Kpi label="At Risk" value={String(atRisk.length)} accent={atRisk.length > 0 ? colors.red : colors.textMuted} />
        <Kpi label="Milestones Done" value={String(totalMilestonesDone)} accent={totalMilestonesDone > 0 ? colors.accent : colors.textMuted} />
        <Kpi label="Completed Goals" value={String(completed.length)} accent={completed.length > 0 ? colors.accent : colors.textMuted} />
      </div>

      {/* Horizon filters + Show Completed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' as const, gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {(['all', ...HORIZON_ORDER] as (GoalHorizon | 'all')[]).map(h => {
            const isActive = horizonFilter === h
            const label = h === 'all' ? 'All' : HORIZON_LABELS[h]
            const count = h === 'all'
              ? goals.filter(g => showCompleted || g.status !== 'completed').length
              : goals.filter(g => g.horizon === h && (showCompleted || g.status !== 'completed')).length
            return (
              <button key={h} onClick={() => setHorizonFilter(h)} style={{
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
        <button onClick={() => setShowCompleted(!showCompleted)} style={{
          padding: '6px 14px', borderRadius: borders.radius.medium,
          border: `1px solid ${showCompleted ? colors.accent : colors.border}`,
          background: showCompleted ? 'rgba(56,161,87,0.1)' : 'transparent',
          color: showCompleted ? colors.accent : colors.textMuted,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {showCompleted ? 'Hide' : 'Show'} Completed
        </button>
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div style={{ ...cardStyle, padding: 60, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>
          {goals.length === 0
            ? 'No goals yet. Hit + Add Goal to set your first target.'
            : 'No goals match this filter.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {visible.map(g => (
            <GoalCard key={g.id} goal={g} onClick={() => setSelectedId(g.id)} />
          ))}
        </div>
      )}

      {selectedGoal && (
        <GoalDetailPanel
          goal={selectedGoal}
          onClose={() => setSelectedId(null)}
          onUpdate={updateGoal}
          onDelete={() => deleteGoal(selectedGoal.id)}
          onEdit={() => setGoalModal({ mode: 'edit', goal: selectedGoal })}
        />
      )}
      {goalModal && (
        <GoalModal
          mode={goalModal.mode}
          existing={goalModal.mode === 'edit' ? goalModal.goal : undefined}
          onClose={() => setGoalModal(null)}
          onSave={g => {
            if (goalModal.mode === 'edit') updateGoal(g)
            else addGoal(g)
            setGoalModal(null)
          }}
        />
      )}
    </PageContainer>
  )
}

// ================================================================= Goal Card
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const pct = progressPct(goal)
  const cat = CATEGORY_COLOR[goal.category]
  const next = nextMilestone(goal)
  const done = milestonesCompleted(goal)
  const total = goal.milestones.length
  const isComplete = goal.status === 'completed'

  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle, padding: '18px 20px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 14,
        opacity: goal.status === 'paused' ? 0.7 : 1,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,161,87,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' as const }}>
            <span style={{ ...mono, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: cat.bg, color: cat.fg, letterSpacing: '0.08em' }}>
              {CATEGORY_LABELS[goal.category].toUpperCase()}
            </span>
            <span style={{ ...mono, fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: 'rgba(125,138,153,0.1)', color: colors.textMuted, letterSpacing: '0.06em' }}>
              {HORIZON_LABELS[goal.horizon].toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: colors.text, lineHeight: 1.2, textDecoration: isComplete ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {goal.title}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{ ...mono, fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 3, background: `${STATUS_COLOR[goal.status]}18`, color: STATUS_COLOR[goal.status], letterSpacing: '0.06em' }}>
            {STATUS_LABELS[goal.status]}
          </span>
          <ChevronRight size={14} strokeWidth={2} color={colors.textMuted} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ ...mono, fontSize: 22, fontWeight: 700, color: isComplete ? colors.accent : colors.text, fontVariantNumeric: 'tabular-nums' as const }}>
            {fmtValue(goal.currentValue, goal.unit)}
          </span>
          <span style={{ ...mono, fontSize: 12, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' as const }}>
            / {fmtValue(goal.targetValue, goal.unit)}
          </span>
        </div>
        <div style={{ height: 5, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: goal.status === 'at-risk' ? colors.red : colors.accent, borderRadius: 3, transition: 'width 0.4s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ ...mono, fontSize: 11, color: goal.status === 'at-risk' ? colors.red : colors.accent, fontWeight: 600 }}>{pct}%</span>
          {goal.deadline && <span style={{ ...mono, fontSize: 11, color: colors.textMuted }}>Due {fmtDeadline(goal.deadline)}</span>}
        </div>
      </div>

      {total > 0 && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: colors.textMuted }}>
            MILESTONES {done}/{total}
          </div>
          {next && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.text }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${colors.textMuted}`, background: 'transparent', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{next.title}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ================================================================= Detail Panel
function GoalDetailPanel({ goal, onClose, onUpdate, onDelete, onEdit }: { goal: Goal; onClose: () => void; onUpdate: (g: Goal) => void; onDelete: () => void; onEdit: () => void }) {
  const [editingCurrentValue, setEditingCurrentValue] = useState(false)
  const [currentValueDraft, setCurrentValueDraft] = useState(String(goal.currentValue))
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')

  const pct = progressPct(goal)
  const cat = CATEGORY_COLOR[goal.category]
  const done = milestonesCompleted(goal)

  function saveCurrentValue() {
    const val = parseFloat(currentValueDraft.replace(/[^0-9.]/g, ''))
    if (!isNaN(val)) {
      const updated: Goal = { ...goal, currentValue: val }
      if (val >= goal.targetValue && goal.status === 'active') {
        updated.status = 'completed'
        updated.completedAt = Date.now()
      }
      onUpdate(updated)
    }
    setEditingCurrentValue(false)
  }

  function toggleMilestone(id: string) {
    onUpdate({
      ...goal,
      milestones: goal.milestones.map(m => m.id === id
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? Date.now() : undefined }
        : m),
    })
  }

  function addMilestone() {
    if (!newMilestoneTitle.trim()) return
    onUpdate({
      ...goal,
      milestones: [...goal.milestones, {
        id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: newMilestoneTitle.trim(), completed: false,
      }],
    })
    setNewMilestoneTitle('')
    setAddingMilestone(false)
  }

  function deleteMilestone(id: string) {
    onUpdate({ ...goal, milestones: goal.milestones.filter(m => m.id !== id) })
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: 4, padding: '6px 10px', color: colors.text, fontSize: 13,
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 90 }} />
      <div className="side-panel" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 460,
        background: colors.cardBg, borderLeft: `1px solid ${colors.border}`,
        zIndex: 91, padding: 0, overflowY: 'auto',
        boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ ...mono, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 3, background: cat.bg, color: cat.fg, letterSpacing: '0.08em' }}>
                {CATEGORY_LABELS[goal.category].toUpperCase()}
              </span>
              <span style={{ ...mono, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 3, background: 'rgba(125,138,153,0.1)', color: colors.textMuted, letterSpacing: '0.06em' }}>
                {HORIZON_LABELS[goal.horizon].toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={onEdit} style={{
                ...mono, display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                background: 'transparent', border: `1px solid ${colors.border}`,
                borderRadius: 4, padding: '4px 9px', color: colors.textMuted,
                cursor: 'pointer', fontFamily: 'var(--font-mono), monospace',
              }}>
                <Pencil size={10} strokeWidth={2} /> EDIT
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0 }}>×</button>
            </div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 16 }}>{goal.title}</div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' as const }}>
            {(['active', 'at-risk', 'paused', 'completed'] as GoalStatus[]).map(s => (
              <button key={s} onClick={() => onUpdate({ ...goal, status: s, completedAt: s === 'completed' ? Date.now() : undefined })} style={{
                ...mono, fontSize: 9, fontWeight: 700, padding: '4px 9px', borderRadius: 3,
                background: goal.status === s ? `${STATUS_COLOR[s]}20` : 'transparent',
                color: goal.status === s ? STATUS_COLOR[s] : colors.textMuted,
                border: `1px solid ${goal.status === s ? `${STATUS_COLOR[s]}40` : colors.border}`,
                cursor: 'pointer', letterSpacing: '0.08em',
                fontFamily: 'var(--font-mono), monospace',
              }}>
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Progress box */}
          <div style={{ ...cardStyleAccent, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ ...mono, fontSize: 9, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 10 }}>PROGRESS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              {editingCurrentValue ? (
                <input autoFocus value={currentValueDraft} onChange={e => setCurrentValueDraft(e.target.value)}
                  onBlur={saveCurrentValue}
                  onKeyDown={e => { if (e.key === 'Enter') saveCurrentValue(); if (e.key === 'Escape') setEditingCurrentValue(false) }}
                  style={{ ...inputStyle, ...mono, fontSize: 22, fontWeight: 700, width: 140 }}
                />
              ) : (
                <button onClick={() => { setCurrentValueDraft(String(goal.currentValue)); setEditingCurrentValue(true) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit' }}
                  title="Click to update">
                  <span style={{ ...mono, fontSize: 26, fontWeight: 700, color: colors.text, fontVariantNumeric: 'tabular-nums' as const }}>
                    {fmtValue(goal.currentValue, goal.unit)}
                  </span>
                </button>
              )}
              <div>
                <div style={{ ...mono, fontSize: 12, color: colors.textMuted, fontVariantNumeric: 'tabular-nums' as const }}>/ {fmtValue(goal.targetValue, goal.unit)}</div>
                {goal.deadline && <div style={{ ...mono, fontSize: 11, color: colors.textMuted }}>Due {fmtDeadline(goal.deadline)}</div>}
              </div>
              <div style={{ ...mono, fontSize: 22, fontWeight: 700, color: colors.accent, fontVariantNumeric: 'tabular-nums' as const, marginLeft: 'auto' }}>{pct}%</div>
            </div>
            <div style={{ height: 6, background: colors.border, borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: goal.status === 'at-risk' ? colors.red : colors.accent, borderRadius: 3 }} />
            </div>
            <div style={{ ...mono, fontSize: 10, color: colors.textMuted, marginTop: 8 }}>Click the current value to update it</div>
          </div>
        </div>

        {/* Milestones */}
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em' }}>MILESTONES {done}/{goal.milestones.length}</div>
            <button onClick={() => setAddingMilestone(true)} style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', background: 'transparent', border: 'none', color: colors.accent, cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
              + ADD STEP
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {goal.milestones.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: colors.cardBgElevated, borderRadius: borders.radius.medium, border: `1px solid ${colors.border}`, opacity: m.completed ? 0.6 : 1 }}>
                <button onClick={() => toggleMilestone(m.id)} style={{
                  width: 16, height: 16, borderRadius: 3,
                  border: `1.5px solid ${m.completed ? colors.accent : colors.textMuted}`,
                  background: m.completed ? colors.accent : 'transparent',
                  cursor: 'pointer', padding: 0, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.completed && <Check size={10} strokeWidth={3} color="#fff" />}
                </button>
                <span style={{ flex: 1, fontSize: 13, color: colors.text, textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</span>
                <button onClick={() => deleteMilestone(m.id)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 2, opacity: 0.4, lineHeight: 0 }}>
                  <Trash2 size={11} strokeWidth={2} />
                </button>
              </div>
            ))}

            {addingMilestone && (
              <div style={{ display: 'flex', gap: 6 }}>
                <input autoFocus type="text" placeholder="Step to get there..." value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addMilestone(); if (e.key === 'Escape') { setAddingMilestone(false); setNewMilestoneTitle('') } }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={addMilestone} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, background: colors.accent, color: '#fff', border: 'none', borderRadius: borders.radius.medium, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
                <button onClick={() => { setAddingMilestone(false); setNewMilestoneTitle('') }} style={{ padding: '6px 10px', fontSize: 12, background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: borders.radius.medium, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            )}

            {goal.milestones.length === 0 && !addingMilestone && (
              <div style={{ padding: '14px 12px', background: colors.cardBgElevated, borderRadius: borders.radius.medium, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                No steps yet. Click "+ ADD STEP" to break this goal down.
              </div>
            )}
          </div>

          {goal.description && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', marginBottom: 8 }}>DESCRIPTION</div>
              <div style={{ padding: '10px 12px', background: colors.cardBgElevated, borderRadius: borders.radius.medium, fontSize: 13, color: colors.text, lineHeight: 1.5 }}>{goal.description}</div>
            </div>
          )}

          <button onClick={onDelete} style={{ marginTop: 24, width: '100%', padding: '10px 0', background: 'transparent', border: `1px solid rgba(255,123,114,0.3)`, borderRadius: borders.radius.medium, color: colors.red, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Trash2 size={13} strokeWidth={2} /> Delete Goal
          </button>
        </div>
      </div>
    </>
  )
}

// ================================================================= Add Modal
function GoalModal({ mode, existing, onClose, onSave }: { mode: 'add' | 'edit'; existing?: Goal; onClose: () => void; onSave: (g: Goal) => void }) {
  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState<GoalCategory>(existing?.category ?? 'revenue')
  const [horizon, setHorizon] = useState<GoalHorizon>(existing?.horizon ?? '90d')
  const [unit, setUnit] = useState(existing?.unit ?? '$')
  const [targetValue, setTargetValue] = useState(existing?.targetValue ? String(existing.targetValue) : '')
  const [currentValue, setCurrentValue] = useState(existing?.currentValue ? String(existing.currentValue) : '')
  const [deadline, setDeadline] = useState(existing?.deadline ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')

  function save() {
    const target = parseFloat(targetValue.replace(/[^0-9.]/g, ''))
    const current = parseFloat(currentValue.replace(/[^0-9.]/g, '') || '0')
    if (!title.trim() || isNaN(target)) return
    onSave(existing
      ? { ...existing, title: title.trim(), description: description.trim() || undefined, category, horizon, unit, targetValue: target, currentValue: current, deadline: deadline || undefined }
      : {
          id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: title.trim(), description: description.trim() || undefined,
          category, horizon, unit,
          targetValue: target, currentValue: current || 0,
          deadline: deadline || undefined, status: 'active',
          milestones: [], createdAt: Date.now(),
        }
    )
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    background: colors.cardBg, border: `1px solid ${colors.border}`,
    borderRadius: borders.radius.medium, padding: '10px 12px',
    color: colors.text, fontSize: 14, outline: 'none', width: '100%',
    fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    ...mono,
    fontSize: 11, color: colors.textMuted, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    display: 'block', marginBottom: 6,
  }

  const PRESET_UNITS = ['$', 'clients', '%', 'deals', 'leads', 'videos', 'posts']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-sheet" style={{ ...cardStyle, width: 500, padding: 28, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{mode === 'edit' ? 'Edit Goal' : 'Add Goal'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Goal Title <span style={{ color: colors.red }}>*</span></label>
            <input autoFocus type="text" placeholder="e.g. Reach $20k MRR" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(Object.keys(CATEGORY_LABELS) as GoalCategory[]).map(c => {
                const cp = CATEGORY_COLOR[c]
                return (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    ...mono, padding: '7px 0', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    borderRadius: borders.radius.medium,
                    border: `1px solid ${category === c ? cp.fg : colors.border}`,
                    background: category === c ? cp.bg : 'transparent',
                    color: category === c ? cp.fg : colors.textMuted,
                    cursor: 'pointer', fontFamily: 'var(--font-mono), monospace',
                  }}>
                    {CATEGORY_LABELS[c].toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Time Horizon</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {HORIZON_ORDER.map(h => (
                <button key={h} onClick={() => setHorizon(h)} style={{
                  ...mono, padding: '6px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  borderRadius: borders.radius.medium,
                  border: `1px solid ${horizon === h ? colors.accent : colors.border}`,
                  background: horizon === h ? 'rgba(56,161,87,0.12)' : 'transparent',
                  color: horizon === h ? colors.accent : colors.textMuted,
                  cursor: 'pointer', fontFamily: 'var(--font-mono), monospace',
                }}>
                  {HORIZON_LABELS[h].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Metric Unit</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {PRESET_UNITS.map(u => (
                <button key={u} onClick={() => setUnit(u)} style={{
                  ...mono, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                  borderRadius: borders.radius.medium,
                  border: `1px solid ${unit === u ? colors.accent : colors.border}`,
                  background: unit === u ? 'rgba(56,161,87,0.12)' : 'transparent',
                  color: unit === u ? colors.accent : colors.textMuted,
                  cursor: 'pointer', fontFamily: 'var(--font-mono), monospace',
                }}>
                  {u}
                </button>
              ))}
              <input type="text" placeholder="other..." value={!PRESET_UNITS.includes(unit) ? unit : ''}
                onChange={e => { if (e.target.value) setUnit(e.target.value) }}
                style={{ ...inputStyle, ...mono, width: 80, padding: '5px 8px', fontSize: 11 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Target <span style={{ color: colors.red }}>*</span></label>
              <input type="number" placeholder="e.g. 20000" value={targetValue} onChange={e => setTargetValue(e.target.value)} style={{ ...inputStyle, ...mono }} />
            </div>
            <div>
              <label style={labelStyle}>Current</label>
              <input type="number" placeholder="e.g. 14000" value={currentValue} onChange={e => setCurrentValue(e.target.value)} style={{ ...inputStyle, ...mono }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Deadline (optional)</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ ...inputStyle, ...mono }} />
          </div>

          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea placeholder="Why this goal matters..." value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as const, lineHeight: 1.5 }} />
          </div>
        </div>

        <button onClick={save} style={{ marginTop: 20, width: '100%', padding: '11px 0', background: colors.accent, border: 'none', borderRadius: borders.radius.medium, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {mode === 'edit' ? 'Save Changes' : 'Add Goal'}
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
