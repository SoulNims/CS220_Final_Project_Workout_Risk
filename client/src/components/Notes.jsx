import { useEffect, useState } from 'react'
import { IconChev } from '../icons'
import { api } from '../services/api'

export default function Notes({ username }) {
  const [body, setBody] = useState('')
  const [savedBody, setSavedBody] = useState('')
  const [status, setStatus] = useState({ loading: true, saving: false, error: '', saved: '' })

  useEffect(() => {
    let active = true

    async function loadNotes() {
      if (!username) return
      setStatus({ loading: true, saving: false, error: '', saved: '' })
      try {
        const note = await api.getNotes(username)
        if (!active) return
        setBody(note.body || '')
        setSavedBody(note.body || '')
        setStatus({ loading: false, saving: false, error: '', saved: note.updated_at || '' })
      } catch (error) {
        if (!active) return
        setStatus({ loading: false, saving: false, error: error.message || 'Unable to load notes', saved: '' })
      }
    }

    loadNotes()
    return () => { active = false }
  }, [username])

  async function handleSave() {
    if (!username) return
    setStatus(s => ({ ...s, saving: true, error: '' }))
    try {
      const note = await api.saveNotes(username, body)
      setBody(note.body || '')
      setSavedBody(note.body || '')
      setStatus({ loading: false, saving: false, error: '', saved: note.updated_at || new Date().toISOString() })
    } catch (error) {
      setStatus(s => ({ ...s, saving: false, error: error.message || 'Unable to save notes' }))
    }
  }

  const dirty = body !== savedBody

  return (
    <div className="fade-up">
      <div className="page-breadcrumb">
        <span className="crumb">Tendon</span>
        <span className="sep"><IconChev size={11} /></span>
        <span className="crumb" style={{ color: 'var(--text)' }}>Notes</span>
      </div>
      <h1 className="page-title">Notes</h1>
      <p className="page-subtitle">Private recovery notes saved to your account.</p>

      <div className="card">
        <div className="card-title">
          <span>Personal notes</span>
          <span className="badge">{dirty ? 'Unsaved changes' : status.saved ? 'Saved' : 'Ready'}</span>
        </div>

        {status.error && (
          <p style={{ color: 'var(--risk-crit)', fontSize: 13, margin: '0 0 12px' }}>{status.error}</p>
        )}

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={status.loading}
          placeholder="Write recovery reminders, pain notes, workout observations, or questions for your next session."
          className="input"
          style={{
            width: '100%',
            minHeight: 260,
            padding: 14,
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={status.loading || status.saving || !dirty}
            style={{ opacity: status.loading || status.saving || !dirty ? 0.65 : 1 }}
          >
            {status.saving ? 'Saving...' : 'Save notes'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {status.loading ? 'Loading notes...' : status.saved ? `Last saved ${status.saved}` : 'Notes are private to this account.'}
          </span>
        </div>
      </div>
    </div>
  )
}
