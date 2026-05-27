import { useState } from 'react'
import { IconChev } from '../icons'
import { INITIAL_LOAD, RISK_COLORS, MUSCLE_LABEL, loadToRisk, formatDate } from '../data'
import { DEFAULT_TIME_ZONE, zonedDateInputValue } from '../time'

function localDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateFromInputValue(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export default function History({ sessions, trend, timeZone = DEFAULT_TIME_ZONE }) {
  const today = dateFromInputValue(zonedDateInputValue(new Date(), timeZone))
  const days = []
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = localDateInputValue(d)
    const sess = sessions.filter(s => s.date === iso)
    let risk = 0
    if (sess.length) {
      const maxRPE = Math.max(...sess.map(s => s.rpe))
      if (maxRPE >= 9) risk = 4
      else if (maxRPE >= 7) risk = 3
      else if (maxRPE >= 5) risk = 2
      else risk = 1
    }
    days.push({ date: d, iso, sessions: sess, risk })
  }

  const firstDow = days[0].date.getDay()
  const padStart = (firstDow + 6) % 7
  const cells = Array(padStart).fill(null).concat(days)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const [hover, setHover] = useState(null)

  return (
    <div className="fade-up">
      <div className="page-breadcrumb">
        <span className="crumb">Tendon</span>
        <span className="sep"><IconChev size={11} /></span>
        <span className="crumb" style={{ color: 'var(--text)' }}>History</span>
      </div>
      <h1 className="page-title">History</h1>
      <p className="page-subtitle">12 weeks of training. Hover a cell for details.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">
          <span>Training calendar</span>
          <span className="badge mono">{sessions.length} sessions / 84d</span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 16px)', gap: 4, paddingTop: 20, fontSize: 10, color: 'var(--text-muted)' }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ height: 16, lineHeight: '16px' }}>{i % 2 === 0 ? d : ''}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 4, minWidth: 600, fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
              {weeks.map((w, i) => {
                const first = w.find(c => c)
                const showLabel = first && first.date.getDate() <= 7
                const m = first ? first.date.toLocaleDateString('en', { month: 'short' }) : ''
                return <div key={i} style={{ height: 14 }}>{showLabel ? m : ''}</div>
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 4, minWidth: 600 }}>
              {weeks.map((w, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 16px)', gap: 4 }}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const c = w[di]
                    if (!c) return <div key={di} />
                    const isHover = hover === c.iso
                    return (
                      <div key={di}
                           onMouseEnter={() => setHover(c.iso)}
                           onMouseLeave={() => setHover(null)}
                           title={`${c.iso} · ${c.sessions.length} session${c.sessions.length === 1 ? '' : 's'}`}
                           style={{ height: 16, borderRadius: 3, background: c.risk === 0 ? 'var(--bg-active)' : RISK_COLORS[c.risk], opacity: c.risk === 0 ? 0.5 : 1, cursor: 'pointer', outline: isHover ? '1.5px solid var(--text)' : 'none', outlineOffset: 1, transition: 'outline 0.05s' }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {hover ? (() => {
                  const c = days.find(d => d.iso === hover)
                  if (!c) return ''
                  return `${c.date.toDateString()} — ${c.sessions.length} session${c.sessions.length === 1 ? '' : 's'}` +
                    (c.sessions.length ? `: ${c.sessions.map(s => s.name).join(', ')}` : '')
                })() : 'Hover a cell to see details'}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Less</span>
                {[0, 1, 2, 3, 4].map(r => (
                  <div key={r} style={{ width: 12, height: 12, borderRadius: 2, background: r === 0 ? 'var(--bg-active)' : RISK_COLORS[r], opacity: r === 0 ? 0.5 : 1 }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        <div className="card-title">
          <span>Timeline</span>
          <span className="badge">Last {sessions.length} sessions</span>
        </div>
        <div style={{ position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 1.5, background: 'var(--border)' }} />
          {sessions.map((s, i) => {
            const max = Math.max(...s.groups.map(g => INITIAL_LOAD[g] || 0))
            const risk = loadToRisk(max)
            return (
              <div key={s.id} style={{ position: 'relative', padding: '10px 0' }}>
                <div style={{ position: 'absolute', left: -22, top: 14, width: 13, height: 13, borderRadius: '50%', background: RISK_COLORS[risk], border: '2.5px solid var(--bg-elev)' }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    RPE {s.rpe} · {s.duration}min{s.soreness ? ` · soreness ${s.soreness}/10` : ''}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDate(s.date)}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {s.groups.map((g, j) => (
                    <span key={j} className="pill" style={{ fontSize: 10.5, padding: '1px 6px' }}>
                      {MUSCLE_LABEL[g]}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
