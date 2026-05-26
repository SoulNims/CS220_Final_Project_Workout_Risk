import { useState } from 'react'
import { IconChev, IconPlus, IconTrash } from '../icons'
import { INITIAL_LOAD, RISK_COLORS, RISK_KEY, MUSCLE_LABEL, loadToRisk, formatDate } from '../data'

function FilterChip({ label, active, onClick, count, dot }) {
  return (
    <button onClick={onClick} className="pill" style={{
      background: active ? 'var(--text)' : 'transparent',
      color: active ? 'var(--bg)' : 'var(--text-soft)',
      border: active ? '1px solid var(--text)' : '1px solid var(--border-strong)',
      padding: '4px 10px', fontSize: 12, fontWeight: 500,
      cursor: 'pointer', transition: 'all 0.1s',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />}
      <span>{label}</span>
      {count != null && <span style={{ opacity: 0.6, fontSize: 11 }}>{count}</span>}
    </button>
  )
}

export default function WorkoutsLog({ sessions, onAddWorkout, onEditWorkout, onDelete }) {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('date')

  let list = sessions
  if (filter !== 'all') {
    list = list.filter(s => s.groups.some(g => {
      const r = loadToRisk(INITIAL_LOAD[g] || 0)
      return RISK_KEY[r] === filter
    }))
  }
  if (sort === 'date')     list = [...list].sort((a, b) => b.date.localeCompare(a.date))
  if (sort === 'rpe')      list = [...list].sort((a, b) => b.rpe - a.rpe)
  if (sort === 'duration') list = [...list].sort((a, b) => b.duration - a.duration)

  return (
    <div className="fade-up">
      <div className="page-breadcrumb">
        <span className="crumb">Tendon</span>
        <span className="sep"><IconChev size={11} /></span>
        <span className="crumb" style={{ color: 'var(--text)' }}>Workouts</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 }}>
        <h1 className="page-title">Workouts</h1>
        <button className="btn primary" onClick={onAddWorkout}>
          <IconPlus size={14} /> New workout
        </button>
      </div>
      <p className="page-subtitle">
        {sessions.length} sessions logged · {sessions.reduce((a, b) => a + b.duration, 0)} minutes total
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
        <FilterChip label="All"      active={filter === 'all'}  onClick={() => setFilter('all')}  count={sessions.length} />
        <FilterChip label="Critical" active={filter === 'crit'} onClick={() => setFilter('crit')} dot="#C4564F" />
        <FilterChip label="High"     active={filter === 'high'} onClick={() => setFilter('high')} dot="#C66D3F" />
        <FilterChip label="Moderate" active={filter === 'mod'}  onClick={() => setFilter('mod')}  dot="#C99845" />
        <FilterChip label="Low"      active={filter === 'low'}  onClick={() => setFilter('low')}  dot="#5A8FC7" />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Sort by</span>
        <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="date">Date</option>
          <option value="rpe">RPE</option>
          <option value="duration">Duration</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1.6fr 1fr 80px 70px 90px 32px', gap: 14, alignItems: 'center', padding: '6px 8px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>
          <div /><div>Name</div><div>Muscle groups</div>
          <div style={{ textAlign: 'right' }}>RPE</div>
          <div style={{ textAlign: 'right' }}>Duration</div>
          <div style={{ textAlign: 'right' }}>Date</div>
          <div />
        </div>

        {list.map((s) => {
          const max = Math.max(...s.groups.map(g => INITIAL_LOAD[g] || 0))
          const risk = loadToRisk(max)
          return (
            <div key={s.id}
                 onClick={() => onEditWorkout && onEditWorkout(s)}
                 style={{ display: 'grid', gridTemplateColumns: '32px 1.6fr 1fr 80px 70px 90px 32px', gap: 14, alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.08s' }}
                 onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: RISK_COLORS[risk], display: 'inline-block' }} />
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {s.groups.map((g, i) => (
                  <span key={i} className="pill" style={{ fontSize: 10.5, padding: '1px 6px' }}>
                    {MUSCLE_LABEL[g]?.split(' ')[0] || g}
                  </span>
                ))}
              </div>
              <div className="mono" style={{ fontSize: 12.5, textAlign: 'right', color: s.rpe >= 8 ? 'var(--risk-high)' : 'var(--text)' }}>{s.rpe}</div>
              <div className="mono" style={{ fontSize: 12.5, textAlign: 'right', color: 'var(--text-soft)' }}>{s.duration}m</div>
              <div className="mono" style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-muted)' }}>{formatDate(s.date)}</div>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onDelete(s.id) }}>
                <IconTrash size={13} />
              </button>
            </div>
          )
        })}

        {list.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No workouts match this filter.
          </div>
        )}
      </div>

      <button onClick={onAddWorkout} style={{ width: '100%', marginTop: 8, padding: '10px 8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRadius: 4 }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <IconPlus size={13} /> New workout
      </button>
    </div>
  )
}
