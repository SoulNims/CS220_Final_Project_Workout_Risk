import { useState } from 'react'
import ShaderBackground from './ui/ShaderBackground'

const SECURITY_QUESTIONS = [
  'What was the name of your high school?',
  'What is your favorite exercise?',
  'What city did you grow up in?',
  'What is your pet\'s name?',
]

export default function LoginPage({ onLogin, onForgotPassword, error: serverError, loading }) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot-email' | 'forgot-answer'
  const [error, setError] = useState('')

  // register fields
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswer] = useState('')

  // forgot-password fields
  const [forgotEmail, setForgotEmail] = useState('')
  const [fetchedQuestion, setFetchedQuestion] = useState('')
  const [forgotAnswer, setForgotAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')

  function switchMode(m) {
    setMode(m)
    setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter an email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email'); return }
    if (mode === 'register' && !firstName.trim()) { setError('Please enter your first name'); return }
    if (mode === 'register' && !lastName.trim()) { setError('Please enter your last name'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (mode === 'register' && !securityAnswer.trim()) { setError('Please provide an answer to the security question'); return }
    onLogin({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), password, mode, security_question: securityQuestion, security_answer: securityAnswer.trim() })
  }

  async function handleForgotLookup(e) {
    e.preventDefault()
    setError('')
    if (!forgotEmail.trim()) { setError('Please enter your email'); return }
    try {
      const data = await onForgotPassword({ step: 'lookup', email: forgotEmail.trim() })
      setFetchedQuestion(data.question)
      setMode('forgot-answer')
    } catch (err) {
      setError(err.message || 'Could not find that account.')
    }
  }

  async function handleForgotReset(e) {
    e.preventDefault()
    setError('')
    if (!forgotAnswer.trim()) { setError('Please enter your answer'); return }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters'); return }
    try {
      await onForgotPassword({
        step: 'reset',
        email: forgotEmail.trim(),
        security_answer: forgotAnswer.trim(),
        new_password: newPassword,
      })
    } catch (err) {
      setError(err.message || 'Reset failed. Check your answer and try again.')
    }
  }

  const cardStyle = {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.24)',
    borderRadius: 'var(--radius-lg)',
    padding: 32,
  }

  const pageStyle = {
    minHeight: '100vh',
    background: '#090102',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    position: 'relative',
    overflow: 'hidden',
    '--bg': '#090102',
    '--bg-elev': 'rgba(255, 255, 255, 0.08)',
    '--bg-hover': 'rgba(255, 255, 255, 0.12)',
    '--border': 'rgba(255, 255, 255, 0.18)',
    '--border-strong': 'rgba(255, 255, 255, 0.28)',
    '--text': '#fff7f7',
    '--text-soft': 'rgba(255, 237, 237, 0.78)',
    '--text-muted': 'rgba(255, 220, 220, 0.58)',
    '--accent': '#ef4444',
    '--accent-soft': 'rgba(239, 68, 68, 0.2)',
    '--risk-crit': '#fb7185',
  }

  const contentStyle = {
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    zIndex: 1,
  }

  const logoBlock = (
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
  )

  if (mode === 'forgot-email') {
    return (
      <div style={pageStyle}>
        <ShaderBackground />
        <div style={contentStyle}>
          {logoBlock}
          <form onSubmit={handleForgotLookup} style={cardStyle}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>Reset password</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 13, margin: '0 0 22px' }}>
              Enter your email and we'll ask your security question.
            </p>
            <div style={{ marginBottom: 22 }}>
              <label className="label">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="Enter your email"
                className="input"
                autoFocus
              />
            </div>
            {error && (
              <p style={{ color: 'var(--risk-crit)', fontSize: 12.5, marginBottom: 16, marginTop: -8 }}>{error}</p>
            )}
            <button type="submit" className="btn primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Looking up…' : 'Continue'}
            </button>
            <button type="button" onClick={() => switchMode('login')} className="btn ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              Back to sign in
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
            Injury Risk Predictor · CS 220 Final Project
          </p>
        </div>
      </div>
    )
  }

  if (mode === 'forgot-answer') {
    return (
      <div style={pageStyle}>
        <ShaderBackground />
        <div style={contentStyle}>
          {logoBlock}
          <form onSubmit={handleForgotReset} style={cardStyle}>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>Answer your security question</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 13, margin: '0 0 22px' }}>
              Answering correctly lets you set a new password.
            </p>
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13.5, color: 'var(--text)' }}>
              {fetchedQuestion}
            </div>
            <div style={{ marginBottom: 22 }}>
              <label className="label">Your answer</label>
              <input
                type="text"
                value={forgotAnswer}
                onChange={e => setForgotAnswer(e.target.value)}
                placeholder="Enter your answer"
                className="input"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label className="label">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="input"
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p style={{ color: 'var(--risk-crit)', fontSize: 12.5, marginBottom: 16, marginTop: -8 }}>{error}</p>
            )}
            <button type="submit" className="btn primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
            <button type="button" onClick={() => switchMode('login')} className="btn ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
              Back to sign in
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
            Injury Risk Predictor · CS 220 Final Project
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <ShaderBackground />
      <div style={contentStyle}>
        {logoBlock}

        <form onSubmit={handleSubmit} style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
            <button
              type="button"
              className={mode === 'login' ? 'btn primary' : 'btn ghost'}
              onClick={() => switchMode('login')}
              style={{ justifyContent: 'center' }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'btn primary' : 'btn ghost'}
              onClick={() => switchMode('register')}
              style={{ justifyContent: 'center' }}
            >
              Create account
            </button>
          </div>

          {mode === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              <div>
                <label className="label">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="input"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="label">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="input"
                  autoComplete="family-name"
                />
              </div>
            </div>
          )}

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

          <div style={{ marginBottom: mode === 'register' ? 22 : 0 }}>
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

          {mode === 'register' && (
            <>
              <div style={{ marginBottom: 22 }}>
                <label className="label">Security question</label>
                <select
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  className="input"
                  style={{ cursor: 'pointer' }}
                >
                  {SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 0 }}>
                <label className="label">Your answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  placeholder="Used to recover your account"
                  className="input"
                />
              </div>
            </>
          )}

          {(error || serverError) && (
            <p style={{ color: 'var(--risk-crit)', fontSize: 12.5, marginBottom: 16, marginTop: 16 }}>
              {error || serverError}
            </p>
          )}

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: 14, opacity: loading ? 0.7 : 1, marginTop: 22 }}
          >
            {loading ? 'Connecting...' : mode === 'login' ? 'Sign in' : 'Create secure account'}
          </button>

          {mode === 'login' && (
            <button
              type="button"
              onClick={() => switchMode('forgot-email')}
              style={{ background: 'none', border: 'none', color: 'var(--text-soft)', fontSize: 12.5, cursor: 'pointer', display: 'block', margin: '12px auto 0', padding: 0 }}
            >
              Forgot password?
            </button>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Injury Risk Predictor · CS 220 Final Project
        </p>
      </div>
    </div>
  )
}
