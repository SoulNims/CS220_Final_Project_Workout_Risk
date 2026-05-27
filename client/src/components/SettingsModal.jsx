import { useState } from 'react'

export default function SettingsModal({ open, username, displayName, gender, age, onSave, onClose, onLogout }) {
  const [localGender, setLocalGender] = useState(gender || '')
  const [localAge, setLocalAge] = useState(age || '')

  if (!open) return null

  function handleSave() {
    onSave(localGender, localAge ? parseInt(localAge, 10) : null)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        boxShadow: 'var(--shadow-md)',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 4 }}>Settings</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{displayName || username}</p>
        </div>

        {/* Age */}
        <div style={{ marginBottom: 20 }}>
          <label className="label">Age</label>
          <input
            type="number"
            className="input"
            placeholder="Enter your age"
            min={10} max={100}
            value={localAge}
            onChange={e => setLocalAge(e.target.value)}
          />
        </div>

        {/* Gender */}
        <div style={{ marginBottom: 28 }}>
          <label className="label">Body type (for avatar)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { value: 'male',   label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other',  label: 'Other' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLocalGender(opt.value)}
                style={{
                  padding: '14px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: localGender === opt.value ? '1.5px solid var(--text)' : '1px solid var(--border-strong)',
                  background: localGender === opt.value ? 'var(--bg-active)' : 'var(--bg-elev)',
                  color: localGender === opt.value ? 'var(--text)' : 'var(--text-soft)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'all 0.1s',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500 }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
            Save
          </button>
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button
            className="btn"
            style={{ width: '100%', justifyContent: 'center', color: 'var(--risk-crit, #C4564F)' }}
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
