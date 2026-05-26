import { IconChev, IconSparkle, IconActivity } from '../icons'
import { aggregateScore, RISK_COLORS, MUSCLE_LABEL, loadToRisk } from '../data'

function BreakdownRow({ label, value, contribution, note }) {
  const pos = contribution >= 0
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{label}</div>
        {note && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{note}</div>}
      </div>
      <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-soft)', minWidth: 50, textAlign: 'right' }}>{value}</span>
      <span className={'pill ' + (pos ? 'high' : 'low')} style={{ minWidth: 50, justifyContent: 'center' }}>
        {pos ? '+' : ''}{contribution}
      </span>
    </div>
  )
}

function Recommendation({ priority, title, body, tags }) {
  const colors = { high: 'var(--risk-crit)', mod: 'var(--risk-mod)', low: 'var(--risk-low)' }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '4px 1fr', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ background: colors[priority], borderRadius: 2 }} />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 8 }}>{body}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tags.map((t, i) => <span key={i} className="pill" style={{ fontSize: 10.5, padding: '2px 7px' }}>{t}</span>)}
        </div>
      </div>
    </div>
  )
}

export default function Insights({ load, sessions, trend }) {
  const score = aggregateScore(load)

  const muscleLoads = Object.entries(load)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxL = muscleLoads[0] ? muscleLoads[0][1] : 1

  return (
    <div className="fade-up">
      <div className="page-breadcrumb">
        <span className="crumb">Tendon</span>
        <span className="sep"><IconChev size={11} /></span>
        <span className="crumb" style={{ color: 'var(--text)' }}>Insights</span>
      </div>

      <h1 className="page-title">Insights</h1>
      <p className="page-subtitle">How your risk score is built and what to do about it.</p>

      <div className="card" style={{ marginBottom: 20, background: 'var(--bg-sidebar)', borderColor: 'transparent' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--text)', color: 'var(--bg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <IconSparkle size={18} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500, marginBottom: 6 }}>
              Coach summary
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--text)', marginBottom: 10 }}>
              You've stacked two climbing sessions in three days. Forearm load is at
              <strong style={{ color: 'var(--risk-crit)' }}> 3.9</strong>, well into the critical zone
              (anything above 3.5 doubles tendon injury risk in studies of grip athletes).
              Pair that with yesterday's heavy push day and your chest is also elevated.
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn">📅 Suggest rest day Friday</button>
              <button className="btn">🧘 Add forearm mobility</button>
              <button className="btn ghost">Dismiss</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">
            <span>Score breakdown</span>
            <span className="badge mono">{score} / 100</span>
          </div>

          <BreakdownRow label="Acute load (7d)"   value={42}  contribution={28} />
          <BreakdownRow label="Acute / Chronic"   value={1.6} contribution={22} note="threshold 1.3" />
          <BreakdownRow label="Peak muscle load"  value={3.9} contribution={18} note="forearms" />
          <BreakdownRow label="Soreness reports"  value={6.2} contribution={8}  note="last 7d avg" />
          <BreakdownRow label="Days since rest"   value={4}   contribution={-2} note="negative buffer" />

          <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-sidebar)', borderRadius: 6, fontSize: 12.5, color: 'var(--text-soft)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <IconActivity size={14} style={{ color: 'var(--text-muted)', marginTop: 2 }} />
            <span>Score = Σ(component contributions). See <span style={{ color: 'var(--text)', textDecoration: 'underline', textDecorationStyle: 'dotted', cursor: 'pointer' }}>api.md</span> for full formula.</span>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Top loaded muscles</span>
          </div>
          {muscleLoads.map(([key, val]) => {
            const risk = loadToRisk(val)
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span>{MUSCLE_LABEL[key]}</span>
                  <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{val.toFixed(1)}</span>
                </div>
                <div style={{ position: 'relative', height: 5, background: 'var(--bg-active)', borderRadius: 99 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(val / 4) * 100}%`, background: RISK_COLORS[risk], borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>Recommendations</span>
          <span className="badge">3 active</span>
        </div>

        <Recommendation
          priority="high"
          title="Skip grip work for 48 hours"
          body="Both forearms are at load 3.9 (critical zone). Bouldering, hangboard, and deadlifts will push you over."
          tags={['Forearm (L)', 'Forearm (R)', 'Biceps']}
        />
        <Recommendation
          priority="mod"
          title="Lower-body session is safe today"
          body="Hamstrings and glutes have low load — a moderate squat session would balance your weekly distribution."
          tags={['Hamstrings', 'Glutes']}
        />
        <Recommendation
          priority="low"
          title="No calf data in 14 days"
          body="Add a calf-focused movement (calf raises, jump rope) to fill the gap and reduce asymmetric load."
          tags={['Calves']}
        />
      </div>
    </div>
  )
}
