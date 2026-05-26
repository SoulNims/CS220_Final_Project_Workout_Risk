import { useState } from 'react'
import BodyAvatar from './BodyAvatar'
import {
  IconChev, IconPlus, IconChart, IconArrowUp, IconClose, IconSparkle,
} from '../icons'
import {
  aggregateScore, scoreLabel, INITIAL_LOAD, RISK_COLORS, RISK_KEY,
  RISK_LABELS, MUSCLE_LABEL, loadToRisk, formatDate,
} from '../data'

export default function Dashboard({ load, sessions, trend, selectedMuscle, setSelectedMuscle, onAddWorkout, onEditWorkout, setPage }) {
  const score = aggregateScore(load)
  const sl = scoreLabel(score)

  const todayIso = new Date().toISOString().slice(0, 10)
  const todays = sessions.filter(s => s.date === todayIso)

  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date)
    return (Date.now() - d.getTime()) < 7 * 24 * 3600 * 1000
  })
  const weekVolume = weekSessions.reduce((a, b) => a + b.duration, 0)
  const avgRPE = weekSessions.length
    ? (weekSessions.reduce((a, b) => a + b.rpe, 0) / weekSessions.length).toFixed(1)
    : '—'

  return (
    <div className="fade-up">
      <div className="page-breadcrumb">
        <span className="crumb">Tendon</span>
        <span className="sep"><IconChev size={11} /></span>
        <span className="crumb" style={{ color: 'var(--text)' }}>Dashboard</span>
      </div>

      <h1 className="page-title">Good morning.</h1>
      <p className="page-subtitle">
        Your last session was yesterday — heavy push day.
      </p>

      {/* Risk hero */}
      <div style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', alignItems: 'stretch', gap: 20 }}>
          <div style={{ padding: '4px 0 0' }}>
            <div className="card-title" style={{ marginBottom: 18 }}>
              <span>Today's risk score</span>
              <span className="pill"><span className="dot" />Updated now</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
              <span className="display" style={{ fontSize: 72, lineHeight: 1, color: 'var(--text)' }}>
                {score}
              </span>
              <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>/ 100</span>
              <span className={'pill ' + sl.key} style={{ marginLeft: 'auto' }}>
                <span className="dot" />{sl.label}
              </span>
            </div>

            <ScoreBar score={score} />

            <p style={{ color: 'var(--text-soft)', fontSize: 13.5, marginTop: 16, marginBottom: 0, maxWidth: 380 }}>
              {sl.text} Your forearms are <strong style={{ color: 'var(--risk-crit)' }}>critically loaded</strong> from
              back-to-back climbing sessions. Recommend 48h rest before next grip-heavy day.
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
              <button className="btn primary" onClick={onAddWorkout}>
                <IconPlus size={14} /> Log workout
              </button>
              <button className="btn" onClick={() => setPage('insights')}>
                <IconChart size={14} /> Why this score?
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-sidebar)',
            borderLeft: '1px solid var(--border)',
            padding: '24px 28px',
            display: 'grid', gridTemplateRows: 'auto 1fr',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
          }}>
            <div className="card-title" style={{ marginBottom: 16 }}>
              <span>This week</span>
              <span className="badge mono">W{Math.ceil(new Date().getDate() / 7) + (new Date().getMonth() * 4)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', alignContent: 'start' }}>
              <Stat label="Sessions"   value={weekSessions.length} delta="+2" up />
              <Stat label="Avg RPE"    value={avgRPE} delta="+0.6" up />
              <Stat label="Volume"     value={weekVolume + 'm'} delta="+38m" up />
              <Stat label="Sore zones" value="3" delta="−1" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's workouts */}
      <TodaysWorkouts sessions={todays} onAddWorkout={onAddWorkout} onEditWorkout={onEditWorkout} />

      {/* Body + trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <AvatarCard load={load} sessions={sessions} selected={selectedMuscle} onSelect={setSelectedMuscle} />
        <TrendCard trend={trend} />
      </div>

      {/* Recent workouts */}
      <div className="card">
        <div className="card-title">
          <span>Recent workouts</span>
          <button className="btn ghost" onClick={() => setPage('log')}
                  style={{ padding: '2px 6px', fontSize: 12 }}>
            View all <IconChev size={11} />
          </button>
        </div>
        <SessionList sessions={sessions.slice(0, 4)} compact onSelect={onEditWorkout} />
      </div>
    </div>
  )
}

function ScoreBar({ score }) {
  return (
    <div style={{ position: 'relative', height: 6, background: 'var(--bg-active)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: score + '%',
        background: 'linear-gradient(90deg, #5A8FC7 0%, #C99845 45%, #C66D3F 75%, #C4564F 100%)',
        borderRadius: 999,
        transition: 'width 0.5s ease',
      }} />
      <div style={{
        position: 'absolute', left: `calc(${score}% - 1px)`, top: -3, bottom: -3,
        width: 2, background: 'var(--text)', borderRadius: 1,
      }} />
    </div>
  )
}

function Stat({ label, value, delta, up }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="display" style={{ fontSize: 26, color: 'var(--text)' }}>{value}</span>
        {delta && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: up ? 'var(--risk-low)' : 'var(--text-muted)',
            display: 'inline-flex', alignItems: 'center', gap: 1,
          }}>
            {up ? <IconArrowUp size={10} strokeWidth={2} /> : null}{delta}
          </span>
        )}
      </div>
    </div>
  )
}

export function TrendCard({ trend }) {
  const max = Math.max(...trend.map(t => t.score))
  const min = Math.min(...trend.map(t => t.score))
  const W = 460, H = 200, P = 24
  const xs = (i) => P + (i * (W - 2 * P)) / (trend.length - 1)
  const ys = (v) => H - P - (v / 100) * (H - 2 * P)

  const points = trend.map((t, i) => [xs(i), ys(t.score)])
  const linePath = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1][0]},${H - P} L${points[0][0]},${H - P} Z`

  const [hover, setHover] = useState(null)

  return (
    <div className="card">
      <div className="card-title">
        <span>Risk trend · 14 days</span>
        <span className="badge mono">peak {max}</span>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}
             onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--text)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line x1={P} x2={W - P} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={P - 6} y={ys(v) + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)" fontFamily="JetBrains Mono">{v}</text>
            </g>
          ))}
          <path d={areaPath} fill="url(#trendFill)" />
          <path d={linePath} stroke="var(--text)" strokeWidth="1.6" fill="none" />
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'pointer' }}>
              <circle cx={p[0]} cy={p[1]} r="8" fill="transparent" />
              <circle cx={p[0]} cy={p[1]} r={hover === i ? 4 : 2.5}
                      fill={hover === i ? 'var(--risk-high)' : 'var(--text)'} />
            </g>
          ))}
          {trend.map((t, i) => (
            i % 3 === 0 && (
              <text key={i} x={xs(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontFamily="JetBrains Mono">
                {t.d.split(' ')[1]}
              </text>
            )
          ))}
          {hover != null && (
            <g>
              <line x1={points[hover][0]} x2={points[hover][0]} y1={P} y2={H - P}
                    stroke="var(--text)" strokeOpacity="0.15" strokeDasharray="2 3" />
              <g transform={`translate(${Math.min(W - 90, points[hover][0] + 8)}, ${points[hover][1] - 36})`}>
                <rect width="78" height="32" rx="4" fill="var(--text)" />
                <text x="8" y="13" fontSize="10" fill="rgba(255,255,255,0.6)" fontFamily="JetBrains Mono">
                  {trend[hover].d}
                </text>
                <text x="8" y="26" fontSize="12" fill="white" fontWeight="600">
                  {trend[hover].score} risk
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text-muted)' }}>
          <span><strong style={{ color: 'var(--text)' }}>+36</strong> vs 7d ago</span>
          <span>peak {max} · low {min}</span>
        </div>
        <button className="btn ghost" style={{ padding: '2px 6px', fontSize: 12 }}>
          Export <IconChev size={11} />
        </button>
      </div>
    </div>
  )
}

export function SessionList({ sessions, compact, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 0 : 6 }}>
      {sessions.map((s, i) => {
        const max = Math.max(...s.groups.map(g => INITIAL_LOAD[g] || 0))
        const risk = loadToRisk(max)
        return (
          <div key={s.id}
               onClick={() => onSelect && onSelect(s)}
               style={{
                 display: 'grid',
                 gridTemplateColumns: 'auto 1fr auto auto auto',
                 gap: 14, alignItems: 'center',
                 padding: '12px 8px',
                 borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                 cursor: onSelect ? 'pointer' : 'default',
                 borderRadius: 4,
               }}>
            <div style={{ width: 6, height: 36, borderRadius: 2, background: RISK_COLORS[risk] }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                <span>{formatDate(s.date)}</span>
                <span>·</span>
                <span>{s.groups.length} muscle group{s.groups.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {s.groups.slice(0, 3).map((g, j) => (
                <span key={j} className="pill" style={{ fontSize: 10.5, padding: '2px 6px' }}>
                  {MUSCLE_LABEL[g]?.split(' ')[0] || g}
                </span>
              ))}
              {s.groups.length > 3 && (
                <span className="pill" style={{ fontSize: 10.5, padding: '2px 6px' }}>+{s.groups.length - 3}</span>
              )}
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 56, textAlign: 'right' }}>
              RPE {s.rpe} · {s.duration}m
            </div>
            <IconChev size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        )
      })}
    </div>
  )
}

function TodaysWorkouts({ sessions, onAddWorkout, onEditWorkout }) {
  const empty = sessions.length === 0

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="card-title">
        <span>Today's workouts</span>
        <span className="badge mono">
          {empty ? 'none yet' : `${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {empty ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 4px' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Nothing logged yet today</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
              Start a session — you can keep adding muscle groups and sets to it through the day.
            </div>
          </div>
          <button className="btn primary" onClick={onAddWorkout}>
            <IconPlus size={14} /> Log workout
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sessions.map((s, i) => (
              <TodayRow key={s.id} session={s} onEdit={() => onEditWorkout(s)} top={i === 0} />
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Click a session to edit · add muscles, sets, or notes
            </span>
            <button className="btn" onClick={onAddWorkout}>
              <IconPlus size={13} /> Add another
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TodayRow({ session: s, onEdit, top }) {
  const max = Math.max(...s.groups.map(g => INITIAL_LOAD[g] || 0))
  const risk = loadToRisk(max)
  const setCount = s.entries
    ? s.entries.reduce((a, e) => a + (e.setRows?.length || 0), 0)
    : null
  return (
    <div
      onClick={onEdit}
      style={{
        display: 'grid', gridTemplateColumns: '6px 1fr auto auto',
        gap: 14, alignItems: 'center',
        padding: '12px 8px',
        borderTop: top ? 'none' : '1px solid var(--border)',
        cursor: 'pointer', borderRadius: 4, transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 6, height: 36, borderRadius: 2, background: RISK_COLORS[risk] }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>{s.name}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {s.groups.slice(0, 5).map((g, j) => (
            <span key={j} className="pill" style={{ fontSize: 10.5, padding: '1px 7px' }}>
              {MUSCLE_LABEL[g]?.split(' ')[0] || g}
            </span>
          ))}
          {s.groups.length > 5 && (
            <span className="pill" style={{ fontSize: 10.5, padding: '1px 7px' }}>+{s.groups.length - 5}</span>
          )}
        </div>
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
        <div>RPE {s.rpe} · {s.duration}m</div>
        {setCount != null && <div>{setCount} sets</div>}
      </div>
      <span className="btn ghost" style={{ padding: '4px 8px', fontSize: 11.5, color: 'var(--text-soft)' }}>
        <IconPlus size={11} /> Add muscle
      </span>
    </div>
  )
}

function AvatarCard({ load, sessions = [], selected, onSelect }) {
  const isSel = !!selected
  const selLoad = isSel ? (load[selected] || 0) : 0
  const selRisk = isSel ? loadToRisk(selLoad) : 0

  return (
    <div className="card" style={{ padding: '24px 24px 20px', position: 'relative' }}>
      <div
        onClick={() => onSelect && onSelect(null)}
        style={{
          textAlign: 'center', marginBottom: 18,
          fontSize: 10.5, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--text-muted)', fontWeight: 500,
          cursor: isSel ? 'pointer' : 'default',
        }}>
        {isSel ? 'Click to deselect' : 'Tap a muscle to see history'}
      </div>

      <BodyAvatar load={load} selected={selected} onSelect={onSelect} />

      <RiskLegend />

      {isSel && (
        <MuscleHistoryPanel
          muscle={selected}
          load={selLoad}
          risk={selRisk}
          sessions={sessions}
          onClose={() => onSelect && onSelect(null)}
        />
      )}
    </div>
  )
}

function RiskLegend() {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
      {RISK_LABELS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: RISK_COLORS[i], display: 'inline-block' }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-soft)', fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function MuscleHistoryPanel({ muscle, load, risk, sessions, onClose }) {
  const touched = sessions.filter(s => s.groups && s.groups.includes(muscle))

  const days = 14
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (days - 1 - i))
    const iso = d.toISOString().slice(0, 10)
    const hits = touched.filter(s => s.date === iso)
    const v = hits.reduce((a, s) => a + s.rpe, 0)
    return { d, v }
  })
  const maxV = Math.max(1, ...series.map(s => s.v))

  const lastIso = touched[0]?.date
  const daysSince = lastIso
    ? Math.max(0, Math.floor((today - new Date(lastIso)) / (1000 * 60 * 60 * 24)))
    : null

  const riskKey = RISK_KEY[risk]
  const riskColor = RISK_COLORS[risk]

  let hint = 'Cleared for normal volume.'
  if (risk >= 4) hint = `Critically loaded. Skip ${MUSCLE_LABEL[muscle]?.toLowerCase()}-dominant work for 48h.`
  else if (risk === 3) hint = 'Elevated load. Keep next session light or accessory-only.'
  else if (risk === 2) hint = 'Moderate load. Watch volume on the next session.'
  else if (risk === 1) hint = 'Low load. Cleared for hard work.'
  else if (risk === 0) hint = 'No recorded sessions yet — log a workout to start tracking.'

  return (
    <div className="fade-up" style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: riskColor, boxShadow: `0 0 0 3px ${riskColor}22` }} />
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 19, lineHeight: 1.1, letterSpacing: '-0.015em' }}>
            {MUSCLE_LABEL[muscle]}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 3, fontSize: 11.5, color: 'var(--text-muted)' }}>
            <span className={'pill ' + riskKey} style={{ padding: '1px 8px', fontSize: 10.5 }}>
              <span className="dot" />{RISK_LABELS[risk]}
            </span>
            <span className="mono">load {load.toFixed(2)}</span>
            <span>·</span>
            <span>
              {daysSince === null ? 'never worked' :
               daysSince === 0 ? 'worked today' :
               daysSince === 1 ? 'last worked yesterday' :
               `last worked ${daysSince}d ago`}
            </span>
          </div>
        </div>
        <button className="btn-icon" onClick={onClose} aria-label="Close detail">
          <IconClose size={13} />
        </button>
      </div>

      <div style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8 }}>
          <span>14-day activity</span>
          <span className="mono" style={{ letterSpacing: 0, textTransform: 'none' }}>
            {touched.length} session{touched.length === 1 ? '' : 's'}
          </span>
        </div>
        <svg viewBox="0 0 280 44" width="100%" style={{ display: 'block' }}>
          {series.map((p, i) => {
            const x = (i / (days - 1)) * 270 + 4
            const h = p.v === 0 ? 2 : (p.v / maxV) * 36 + 4
            const y = 40 - h
            const isLast = i === days - 1
            return (
              <g key={i}>
                <rect x={x - 4} y={y} width={8} height={h} rx={2}
                      fill={p.v === 0 ? 'var(--border)' : riskColor}
                      opacity={p.v === 0 ? 0.6 : isLast ? 1 : 0.85} />
              </g>
            )
          })}
          <line x1="0" x2="280" y1="40" y2="40" stroke="var(--border)" strokeWidth="1" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
          <span>{series[0].d.getMonth() + 1}/{series[0].d.getDate()}</span>
          <span>today</span>
        </div>
      </div>

      <div style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 10 }}>
        Recent sessions
      </div>
      {touched.length === 0 ? (
        <div style={{ padding: '14px 12px', textAlign: 'center', background: 'var(--bg-sidebar)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12.5 }}>
          No recorded sessions touching this muscle.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {touched.slice(0, 5).map((s, i) => {
            const entry = s.entries && s.entries.find(e => e.group === muscle)
            const setCount = entry && entry.setRows ? entry.setRows.length : null
            const firstRow = entry && entry.setRows && entry.setRows[0]
            const weight = firstRow?.weight || entry?.weight
            const reps = firstRow?.reps || entry?.reps
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '6px 1fr auto', gap: 12, alignItems: 'center', padding: '10px 4px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                <div style={{ width: 6, height: 28, borderRadius: 2, background: s.rpe >= 8 ? 'var(--risk-crit)' : s.rpe >= 6 ? 'var(--risk-high)' : 'var(--risk-mod)' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', gap: 8 }}>
                    <span>{formatDate(s.date)}</span>
                    {setCount ? <><span>·</span><span>{setCount} sets</span></> : null}
                    {reps ? <><span>·</span><span>{reps} reps</span></> : null}
                    {weight ? <><span>·</span><span>{weight}</span></> : null}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  RPE {entry?.rpe ?? s.rpe} · {s.duration}m
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 16, padding: '11px 13px', background: `${riskColor}10`, border: `1px solid ${riskColor}33`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <IconSparkle size={14} style={{ color: riskColor, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, color: 'var(--text-soft)', lineHeight: 1.5 }}>{hint}</div>
      </div>
    </div>
  )
}
