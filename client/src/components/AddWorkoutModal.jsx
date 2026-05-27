import { useState, useEffect } from 'react'
import {
  IconActivity, IconClose, IconCalendar, IconFlame, IconHeart,
  IconHistory, IconUser, IconPlus, IconCheck, IconChev,
} from '../icons'
import { MUSCLE_LABEL } from '../data'

function timeOfDayName(d = new Date()) {
  const h = d.getHours()
  if (h < 5)  return 'Late-night workout'
  if (h < 12) return 'Morning workout'
  if (h < 17) return 'Afternoon workout'
  if (h < 21) return 'Evening workout'
  return 'Night workout'
}

export default function AddWorkoutModal({ open, onClose, onSubmit, editing }) {
  const isEdit = !!(editing && editing.id)
  const [name, setName] = useState(timeOfDayName())
  const [entries, setEntries] = useState([])
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState(60)
  const [soreness, setSoreness] = useState(4)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(editing.name || timeOfDayName())
      const reconstructed = editing.entries
        ? editing.entries.map(e => {
            const fields = e.fields || []
            let setRows
            if (Array.isArray(e.setRows) && e.setRows.length) {
              setRows = e.setRows
            } else if (typeof e.sets === 'number' && e.sets > 0) {
              setRows = Array.from({ length: e.sets }, () => ({ rpe: e.rpe || editing.rpe || 7 }))
            } else {
              setRows = [{ rpe: e.rpe || editing.rpe || 7 }]
            }
            return { ...e, setRows, fields }
          })
        : (editing.groups || []).map(g => ({
            group: g,
            setRows: Array.from({ length: 3 }, () => ({ rpe: editing.rpe || 7 })),
            fields: [],
          }))
      setEntries(reconstructed)
      setRpe(editing.rpe ?? 7)
      setDuration(editing.duration ?? 60)
      setSoreness(editing.soreness ?? 4)
      setDate(editing.date || new Date().toISOString().slice(0, 10))
    } else {
      setName(timeOfDayName()); setEntries([])
      setRpe(7); setDuration(60); setSoreness(4)
      setDate(new Date().toISOString().slice(0, 10))
    }
  }, [open, editing])

  if (!open) return null

  const groups = entries.map(e => e.group)

  const toggleGroup = (g) => {
    setEntries(prev => {
      const exists = prev.find(e => e.group === g)
      if (exists) return prev.filter(e => e.group !== g)
      return [...prev, { group: g, setRows: [{ rpe }, { rpe }, { rpe }], fields: [] }]
    })
  }

  const updateEntry = (g, patch) => setEntries(prev => prev.map(e => e.group === g ? { ...e, ...patch } : e))
  const removeEntry = (g) => setEntries(prev => prev.filter(e => e.group !== g))

  const canSubmit = name.trim().length > 0 && entries.length > 0

  const submit = () => {
    if (!canSubmit) return
    onSubmit({
      id: isEdit ? editing.id : 's' + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      groups,
      entries,
      rpe, duration, soreness, date,
    }, isEdit)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg-sidebar)', display: 'grid', placeItems: 'center', color: 'var(--text-soft)' }}>
              <IconActivity size={15} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
              {isEdit ? 'Workouts / Edit' : 'Workouts / New'}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><IconClose size={14} /></button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '14px 28px 8px', flex: 1 }}>
          <input
            className="input"
            placeholder="Untitled workout"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{
              border: 'none', padding: 0, fontSize: 26,
              fontFamily: 'Fraunces, serif', fontWeight: 500,
              letterSpacing: '-0.02em', marginBottom: 20,
              background: 'transparent', color: 'var(--text)',
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: 2, marginBottom: 22 }}>
            <PropLabel icon={<IconCalendar size={13} />}>Date</PropLabel>
            <PropValue>
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '4px 6px', fontSize: 13.5, color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }}
              />
            </PropValue>

            <PropLabel icon={<IconFlame size={13} />}>RPE</PropLabel>
            <PropValue>
              <Slider value={rpe} min={1} max={10} step={1} onChange={setRpe} suffix="/ 10"
                      color={rpe >= 8 ? 'var(--risk-crit)' : rpe >= 6 ? 'var(--risk-high)' : 'var(--risk-mod)'} />
            </PropValue>

            <PropLabel icon={<IconHeart size={13} />}>Soreness</PropLabel>
            <PropValue>
              <Slider value={soreness} min={0} max={10} step={1} onChange={setSoreness} suffix=" / 10"
                      color={soreness >= 7 ? 'var(--risk-crit)' : soreness >= 4 ? 'var(--risk-mod)' : 'var(--risk-low)'} />
            </PropValue>

            <PropLabel icon={<IconHistory size={13} />}>Duration</PropLabel>
            <PropValue>
              <NumberField value={duration} onChange={setDuration} min={5} max={300} step={5} suffix="min" />
            </PropValue>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconUser size={13} />
            <span>Muscle groups</span>
            {entries.length > 0 && (
              <span style={{ color: 'var(--text-soft)', textTransform: 'none', letterSpacing: 0 }}>
                · {entries.length} added · tap to expand
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: entries.length ? 14 : 0 }}>
            {Object.entries(MUSCLE_LABEL).filter(([k]) => k !== 'head').map(([key, label]) => {
              const active = groups.includes(key)
              return (
                <button key={key} onClick={() => toggleGroup(key)}
                        style={{
                          padding: '5px 10px', fontSize: 12, fontWeight: 500, borderRadius: 999,
                          border: active ? '1px solid var(--text)' : '1px solid var(--border-strong)',
                          background: active ? 'var(--text)' : 'var(--bg-elev)',
                          color: active ? 'var(--bg)' : 'var(--text-soft)',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.08s',
                        }}>
                  {active ? <IconCheck size={11} strokeWidth={2.5} /> : <IconPlus size={11} strokeWidth={2} />}
                  {label}
                </button>
              )
            })}
          </div>

          {entries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {entries.map((e) => (
                <MuscleEntryCard
                  key={e.group}
                  entry={e}
                  defaultRpe={rpe}
                  onChange={(patch) => updateEntry(e.group, patch)}
                  onRemove={() => removeEntry(e.group)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px 20px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            {canSubmit
              ? (isEdit ? 'Edits will recompute risk on save' : 'Risk score will recompute on save')
              : 'Add a name and at least one muscle group'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={submit} disabled={!canSubmit}
                    style={{ opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
              <IconCheck size={14} strokeWidth={2.5} /> {isEdit ? 'Save changes' : 'Save workout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const OPTIONAL_FIELDS = [
  { key: 'weight', label: 'Weight' },
  { key: 'notes',  label: 'Notes' },
]

function MuscleEntryCard({ entry, onChange, onRemove, defaultRpe = 7 }) {
  const [expanded, setExpanded] = useState(true)
  const [addingField, setAddingField] = useState(false)

  const setRows = entry.setRows && entry.setRows.length ? entry.setRows : [{ rpe: defaultRpe }]
  const activeFields = entry.fields || []
  const showWeight = activeFields.includes('weight')
  const showReps   = activeFields.includes('reps')
  const showNotes  = activeFields.includes('notes')
  const availableFields = OPTIONAL_FIELDS.filter(f => !activeFields.includes(f.key))

  const avgReps = setRows.length ? Math.round(setRows.reduce((a, r) => a + (r.rpe || 0), 0) / setRows.length) : 0

  const updateRow = (i, patch) => onChange({ setRows: setRows.map((r, idx) => idx === i ? { ...r, ...patch } : r) })
  const addRow = () => { const last = setRows[setRows.length - 1] || { rpe: defaultRpe }; onChange({ setRows: [...setRows, { rpe: last.rpe, weight: last.weight, reps: last.reps }] }) }
  const removeRow = (i) => { if (setRows.length <= 1) return; onChange({ setRows: setRows.filter((_, idx) => idx !== i) }) }

  const addField = (key) => { const patch = { fields: [...activeFields, key] }; if (key === 'notes') patch.notes = ''; onChange(patch); setAddingField(false) }
  const removeField = (key) => {
    const next = { ...entry, fields: activeFields.filter(f => f !== key) }
    if (key === 'notes') delete next.notes
    if (key === 'weight') next.setRows = setRows.map(({ weight, ...r }) => r)
    if (key === 'reps')   next.setRows = setRows.map(({ reps, ...r }) => r)
    onChange(next)
  }

  const repsAccent = (v) => v >= 12 ? 'var(--risk-crit)' : v >= 8 ? 'var(--risk-high)' : 'var(--risk-mod)'

  const cols = `42px 1fr ${showWeight ? '74px ' : ''}${showReps ? '64px ' : ''}24px`

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-elev)', overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', background: expanded ? 'var(--bg-sidebar)' : 'transparent', transition: 'background 0.1s' }}
      >
        <span style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', color: 'var(--text-muted)', display: 'inline-flex' }}>
          <IconChev size={11} />
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{MUSCLE_LABEL[entry.group]}</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <span>{setRows.length} set{setRows.length === 1 ? '' : 's'}</span>
          <span>avg reps {avgReps}</span>
        </span>
        <button className="btn-icon" onClick={(ev) => { ev.stopPropagation(); onRemove() }} style={{ width: 22, height: 22 }} aria-label="Remove muscle group">
          <IconClose size={11} />
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, alignItems: 'center', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, padding: '0 2px 6px', borderBottom: '1px solid var(--border)' }}>
            <span>Set</span><span>Reps</span>
            {showWeight && <span>Weight</span>}
            {showReps && <span>Reps</span>}
            <span></span>
          </div>

          {setRows.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, alignItems: 'center', padding: '6px 2px', borderBottom: i === setRows.length - 1 ? 'none' : '1px solid var(--border)' }}>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</span>
              <SetReps value={row.rpe || defaultRpe} onChange={(v) => updateRow(i, { rpe: v })} accent={repsAccent(row.rpe || defaultRpe)} />
              {showWeight && (
                <input value={row.weight || ''} onChange={(e) => updateRow(i, { weight: e.target.value })} placeholder="—" className="mono" style={smallInput} />
              )}
              {showReps && (
                <input value={row.reps || ''} onChange={(e) => updateRow(i, { reps: e.target.value })} placeholder="—" className="mono" style={smallInput} />
              )}
              <button onClick={() => removeRow(i)} disabled={setRows.length <= 1} aria-label="Remove set" style={{ width: 20, height: 20, padding: 0, background: 'transparent', border: 'none', color: setRows.length <= 1 ? 'var(--border-strong)' : 'var(--text-muted)', cursor: setRows.length <= 1 ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', borderRadius: 4 }}>
                <IconClose size={10} />
              </button>
            </div>
          ))}

          <button onClick={addRow} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: '1px dashed var(--border-strong)', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: 'var(--text-soft)', fontSize: 12, fontWeight: 500, fontFamily: 'inherit' }}>
            <IconPlus size={11} strokeWidth={2} /> Add set
          </button>

          {showNotes && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Notes</span>
                <button onClick={() => removeField('notes')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--text-muted)', cursor: 'pointer' }} aria-label="Remove notes">
                  <IconClose size={10} />
                </button>
              </div>
              <textarea value={entry.notes || ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="felt heavy on set 3" className="input" style={{ width: '100%', minHeight: 36, padding: '6px 8px', fontSize: 12.5, fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
          )}

          {availableFields.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {!addingField ? (
                <button onClick={() => setAddingField(true)} className="btn ghost" style={{ padding: '3px 6px', fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <IconPlus size={11} /> Add field
                </button>
              ) : (
                <>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Add:</span>
                  {availableFields.map(f => (
                    <button key={f.key} onClick={() => addField(f.key)} className="btn" style={{ padding: '3px 8px', fontSize: 11.5 }}>{f.label}</button>
                  ))}
                  <button onClick={() => setAddingField(false)} className="btn ghost" style={{ padding: '3px 6px', fontSize: 11.5 }}>Cancel</button>
                </>
              )}
              {showWeight && <button onClick={() => removeField('weight')} className="btn ghost" style={{ padding: '3px 6px', fontSize: 11.5, color: 'var(--text-muted)' }}><IconClose size={10} /> Weight</button>}
              {showReps   && <button onClick={() => removeField('reps')}   className="btn ghost" style={{ padding: '3px 6px', fontSize: 11.5, color: 'var(--text-muted)' }}><IconClose size={10} /> Reps</button>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const smallInput = {
  width: '100%', padding: '4px 6px', fontSize: 12,
  border: '1px solid var(--border-strong)', borderRadius: 4,
  background: 'var(--bg-elev)', color: 'var(--text)',
  fontFamily: 'JetBrains Mono, ui-monospace, monospace', outline: 'none', textAlign: 'center',
}

function SetReps({ value, onChange, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onChange(Math.max(1, value - 1))} style={miniBtn} aria-label="Reps down">−</button>
      <span className="mono" style={{ minWidth: 28, textAlign: 'center', fontSize: 13, fontWeight: 600, color: accent }}>{value}</span>
      <button onClick={() => onChange(Math.min(50, value + 1))} style={miniBtn} aria-label="Reps up">+</button>
    </div>
  )
}

const miniBtn = {
  width: 20, height: 20, padding: 0, border: '1px solid var(--border-strong)',
  borderRadius: 4, background: 'var(--bg-elev)', cursor: 'pointer',
  color: 'var(--text-soft)', display: 'grid', placeItems: 'center',
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
}

function NumberField({ value, onChange, min = 0, max = 100, step = 1, suffix = '' }) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])

  const commit = (raw) => {
    const n = parseInt(raw, 10)
    if (Number.isNaN(n)) { setText(String(value)); return }
    const clamped = Math.max(min, Math.min(max, n))
    onChange(clamped); setText(String(clamped))
  }
  const bump = (delta) => commit(String((parseInt(text, 10) || min) + delta * step))

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-strong)', borderRadius: 6, background: 'var(--bg-elev)', overflow: 'hidden', height: 30, maxWidth: 180 }}>
      <button onClick={() => bump(-1)} style={{ width: 26, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-soft)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 500 }} aria-label="Decrement">−</button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^0-9-]/g, ''))}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'ArrowUp') { e.preventDefault(); bump(1) } if (e.key === 'ArrowDown') { e.preventDefault(); bump(-1) } }}
        inputMode="numeric"
        style={{ width: 46, textAlign: 'center', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13.5, fontWeight: 600, padding: 0, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', height: '100%' }}
      />
      <button onClick={() => bump(1)} style={{ width: 26, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-soft)', display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 500 }} aria-label="Increment">+</button>
      {suffix && <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 8px 0 6px', whiteSpace: 'nowrap' }}>{suffix}</span>}
    </div>
  )
}

function Slider({ value, min, max, step, onChange, suffix = '', color = 'var(--text)' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
      <div style={{ flex: 1, position: 'relative', height: 22, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 99, background: 'var(--bg-active)' }} />
        <div style={{ position: 'absolute', left: 0, height: 4, borderRadius: 99, width: pct + '%', background: color, transition: 'width 0.12s' }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseInt(e.target.value))}
               style={{ position: 'absolute', left: 0, right: 0, width: '100%', margin: 0, opacity: 0, height: 22, cursor: 'pointer' }} />
        <div style={{ position: 'absolute', left: `calc(${pct}% - 7px)`, width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-elev)', border: '2px solid ' + color, pointerEvents: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }} />
      </div>
      <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-soft)', minWidth: 56, textAlign: 'right' }}>{value}{suffix}</span>
    </div>
  )
}

function PropLabel({ children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 4px', fontSize: 12.5, color: 'var(--text-muted)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function PropValue({ children }) {
  return <div style={{ padding: '2px 0', display: 'flex', alignItems: 'center' }}>{children}</div>
}
