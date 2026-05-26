import { useEffect, useState } from 'react'
import { IconChev, IconSparkle, IconActivity } from '../icons'
import { aggregateScore, RISK_COLORS, MUSCLE_LABEL, loadToRisk } from '../data'
import { api } from '../services/api'

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

const emptyCoach = { analysis: null, plan: null, report: null }

function cacheKey(username) {
  return `irp_ai_coach_${username}`
}

function hasGeminiSource(data) {
  return [data?.analysis, data?.plan, data?.report].some(item => item?.source === 'gemini')
}

function readCachedCoach(username) {
  try {
    const raw = sessionStorage.getItem(cacheKey(username))
    const data = raw ? JSON.parse(raw) : null
    return hasGeminiSource(data) ? data : null
  } catch {
    return null
  }
}

function writeCachedCoach(username, data) {
  try {
    sessionStorage.setItem(cacheKey(username), JSON.stringify(data))
  } catch {
    // Cache is an optimization; ignore storage failures.
  }
}

export default function Insights({ load, sessions, trend, username }) {
  const score = aggregateScore(load)
  const [aiCoach, setAiCoach] = useState(() => readCachedCoach(username) || emptyCoach)
  const [aiStatus, setAiStatus] = useState(() => readCachedCoach(username) ? 'cached' : 'idle')
  const [aiError, setAiError] = useState('')
  const analysis = aiCoach?.analysis
  const plan = aiCoach?.plan
  const report = aiCoach?.report
  const isLoadingAi = aiStatus === 'loading'

  async function loadAiCoach({ force = false } = {}) {
    if (!username) return
    const cached = readCachedCoach(username)
    if (cached && !force) {
      setAiCoach(cached)
      setAiStatus('cached')
      setAiError('')
      return
    }

    setAiStatus('loading')
    setAiError('')
    try {
      const [analysisResult, planResult, reportResult] = await Promise.all([
        api.getAiAnalysis(username),
        api.getAiPlan(username),
        api.getAiReport(username),
      ])
      const next = {
        analysis: analysisResult,
        plan: planResult,
        report: reportResult,
        cachedAt: new Date().toISOString(),
      }
      setAiCoach(next)
      const usedGemini = hasGeminiSource(next)
      if (usedGemini) {
        writeCachedCoach(username, next)
      } else {
        sessionStorage.removeItem(cacheKey(username))
      }
      setAiStatus(usedGemini ? 'gemini' : 'demo')
    } catch (error) {
      setAiStatus('error')
      setAiError(error.message || 'Unable to load AI coach guidance.')
    }
  }

  useEffect(() => {
    setAiCoach(readCachedCoach(username) || emptyCoach)
    setAiStatus(readCachedCoach(username) ? 'cached' : 'idle')
    setAiError('')
    loadAiCoach()
  }, [username])

  const sourceLabel = report?.source === 'gemini'
    ? 'Gemini'
    : report?.source === 'demo'
      ? 'demo mode'
      : aiStatus === 'cached'
        ? 'cached'
        : ''

  const statusCopy = {
    idle: 'AI coach will load when this page opens.',
    loading: 'Loading AI coach guidance from Gemini. This uses your API quota once per session.',
    cached: 'Showing cached AI coach guidance for this session.',
    gemini: 'Gemini-backed response loaded.',
    demo: 'Demo mode shown because Gemini is unavailable or rate-limited.',
    error: aiError,
  }[aiStatus]

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
              AI coach summary {sourceLabel ? `· ${sourceLabel}` : ''}
            </div>
            {statusCopy && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {statusCopy}
              </div>
            )}
            <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--text)', marginBottom: 10 }}>
              {isLoadingAi
                ? 'Generating personalized coaching text from your workout and risk data...'
                : report?.summary || 'Log workouts to generate a coach-style training health report.'}
            </div>
            {report?.trend && (
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-soft)', marginBottom: 10 }}>
                {report.trend}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => loadAiCoach({ force: true })} disabled={isLoadingAi}>
                {isLoadingAi ? 'Generating...' : 'Refresh AI coach'}
              </button>
              <button className="btn ghost" onClick={() => {
                sessionStorage.removeItem(cacheKey(username))
                setAiCoach(emptyCoach)
                loadAiCoach({ force: true })
              }}>
                Clear cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {(analysis || plan || report) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div className="card">
            <div className="card-title">
              <span>Smart workout analyzer</span>
              <span className="badge">{analysis?.source || 'demo'}</span>
            </div>
            {(analysis?.patterns || []).slice(0, 4).map((pattern, index) => (
              <div key={index} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13.5, color: 'var(--text-soft)', lineHeight: 1.45 }}>
                {pattern}
              </div>
            ))}
            {analysis?.focus_area && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 6, background: 'var(--bg-sidebar)', fontSize: 13, color: 'var(--text)' }}>
                <strong>Focus:</strong> {analysis.focus_area}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span>7-day plan preview</span>
              <span className="badge">{plan?.source || 'demo'}</span>
            </div>
            {(plan?.plan || []).slice(0, 4).map((day) => (
              <div key={day.day} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{day.day} · {day.focus}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
                  {day.exercises?.slice(0, 3).join(', ')}
                </div>
              </div>
            ))}
            {report?.disclaimer && (
              <div style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {report.disclaimer}
              </div>
            )}
          </div>
        </div>
      )}

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
