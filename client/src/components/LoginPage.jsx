import { useState } from 'react'

export default function LoginPage({ onLogin, error: serverError, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter an email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    onLogin({ email: email.trim(), password, mode })
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
            <button
              type="button"
              className={mode === 'login' ? 'btn primary' : 'btn ghost'}
              onClick={() => { setMode('login'); setError('') }}
              style={{ justifyContent: 'center' }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'btn primary' : 'btn ghost'}
              onClick={() => { setMode('register'); setError('') }}
              style={{ justifyContent: 'center' }}
            >
              Create account
            </button>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="input"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {(error || serverError) && (
            <p style={{ color: 'var(--risk-crit)', fontSize: 12.5, marginBottom: 16, marginTop: -8 }}>
              {error || serverError}
            </p>
          )}

          <button type="submit" className="btn primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Connecting...' : mode === 'login' ? 'Sign in' : 'Create secure account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Injury Risk Predictor · CS 220 Final Project
        </p>
      </div>
    </div>
  )
}
