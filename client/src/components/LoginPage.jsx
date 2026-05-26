import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a username'); return }
    onLogin(name.trim())
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'var(--text)', color: 'var(--bg)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px',
            fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 22,
            letterSpacing: '-0.02em',
          }}>T</div>
          <h1 className="page-title" style={{ fontSize: 32, marginBottom: 8 }}>Tendon</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: 15, margin: 0 }}>
            Track your training. Protect your body.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
          <div style={{ marginBottom: 22 }}>
            <label className="label">Username</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your username"
              className="input"
              autoFocus
            />
          </div>

          {error && <p style={{ color: 'var(--risk-crit)', fontSize: 12.5, marginBottom: 16, marginTop: -8 }}>{error}</p>}

          <button type="submit" className="btn primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14 }}>
            Get Started
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Injury Risk Predictor · CS 220 Final Project
        </p>
      </div>
    </div>
  )
}
