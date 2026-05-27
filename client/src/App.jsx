import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import WorkoutsLog from './components/WorkoutsLog'
import History from './components/History'
import Insights from './components/Insights'
import AddWorkoutModal from './components/AddWorkoutModal'
import SettingsModal from './components/SettingsModal'
import { TREND } from './data'
import { api } from './services/api'
import { apiWorkoutToSession, riskScoresToLoad } from './muscleMap'

export default function App() {
  const [username, setUsername] = useState(() =>
    localStorage.getItem('irp_token') ? localStorage.getItem('irp_username') || '' : ''
  )
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('irp_display_name') || '')
  const [gender, setGender] = useState(() => localStorage.getItem('irp_gender') || '')
  const [age, setAge] = useState(() => localStorage.getItem('irp_age') ? parseInt(localStorage.getItem('irp_age'), 10) : null)
  const [theme, setTheme] = useState(() => localStorage.getItem('irp_theme') || 'light')
  const [showSettings, setShowSettings] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [load, setLoad] = useState({})
  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState({ loading: false, error: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('irp_theme', theme)
  }, [theme])

  useEffect(() => {
    if (!username || !localStorage.getItem('irp_token')) return
    refreshServerState(username)
  }, [username])

  async function refreshServerState(name = username) {
    if (!name) return
    setStatus({ loading: true, error: '' })
    try {
      const [workouts, riskScores] = await Promise.all([
        api.getWorkouts(name),
        api.getRiskScores(name),
      ])
      setSessions(workouts.map(apiWorkoutToSession))
      setLoad(riskScoresToLoad(riskScores))
      setStatus({ loading: false, error: '' })
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Unable to reach the API server' })
    }
  }

  function fullName(user) {
    return [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
  }

  async function handleLogin({ email, firstName, lastName, password, mode }) {
    const cleanEmail = email.trim()
    if (!cleanEmail) return
    setStatus({ loading: true, error: '' })
    try {
      const response = mode === 'register'
        ? await api.register({ email: cleanEmail, first_name: firstName, last_name: lastName, password })
        : await api.login({ email: cleanEmail, password })
      const accountName = response.user.username
      const accountDisplayName = fullName(response.user) || accountName
      localStorage.setItem('irp_token', response.token)
      localStorage.setItem('irp_username', accountName)
      localStorage.setItem('irp_display_name', accountDisplayName)
      if (response.user?.email) localStorage.setItem('irp_email', response.user.email)
      if (response.user?.gender) localStorage.setItem('irp_gender', response.user.gender)
      if (response.user?.age != null) localStorage.setItem('irp_age', response.user.age)
      setUsername(accountName)
      setDisplayName(accountDisplayName)
      setGender(response.user?.gender || '')
      setAge(response.user?.age ?? null)
      setStatus({ loading: false, error: '' })
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Unable to reach the API server' })
    }
  }

  function handleSaveSettings(g, a) {
    if (g) { localStorage.setItem('irp_gender', g); setGender(g) }
    if (a != null) { localStorage.setItem('irp_age', a); setAge(a) }
  }

  function handleLogout() {
    localStorage.removeItem('irp_token')
    localStorage.removeItem('irp_username')
    localStorage.removeItem('irp_display_name')
    localStorage.removeItem('irp_email')
    localStorage.removeItem('irp_gender')
    localStorage.removeItem('irp_age')
    setUsername('')
    setDisplayName('')
    setGender('')
    setAge(null)
    setLoad({})
    setSessions([])
    setStatus({ loading: false, error: '' })
    setPage('dashboard')
    setShowSettings(false)
  }

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const onAddWorkout = () => { setEditing(null); setShowAdd(true) }
  const onEditWorkout = (s) => { setEditing(s); setShowAdd(true) }
  const closeModal = () => { setShowAdd(false); setEditing(null) }

  function onLogMuscle(muscleId) {
    const todayIso = new Date().toISOString().slice(0, 10)
    const todaySession = sessions.find(s => s.date === todayIso)
    if (todaySession) {
      const groups = todaySession.groups.includes(muscleId)
        ? todaySession.groups
        : [...todaySession.groups, muscleId]
      const existingEntries = todaySession.entries || []
      const entries = existingEntries.find(e => e.group === muscleId)
        ? existingEntries
        : [...existingEntries, {
            group: muscleId,
            setRows: Array.from({ length: 3 }, () => ({ rpe: todaySession.rpe || 7 })),
            fields: [],
          }]
      setEditing({ ...todaySession, groups, entries })
      setShowAdd(true)
    } else {
      const h = new Date().getHours()
      const name = h < 5 ? 'Late-night workout' : h < 12 ? 'Morning workout'
        : h < 17 ? 'Afternoon workout' : h < 21 ? 'Evening workout' : 'Night workout'
      setEditing({
        name,
        groups: [muscleId],
        entries: [{ group: muscleId, setRows: Array.from({ length: 3 }, () => ({ rpe: 7 })), fields: [] }],
        rpe: 7, duration: 60, soreness: 4,
        date: todayIso,
      })
      setShowAdd(true)
    }
  }

  async function onSaveWorkout(s, isEdit) {
    if (!username) return
    setStatus({ loading: true, error: '' })
    try {
      const payload = {
        date: s.date,
        name: s.name,
        groups: s.groups,
        rpe: s.rpe,
        duration: s.duration,
        soreness: s.soreness ?? 4,
        entries: s.entries?.length ? s.entries : undefined,
      }
      if (isEdit && editing?.id) {
        await api.updateWorkout(username, editing.id, payload)
      } else {
        await api.createWorkout(username, payload)
      }
      closeModal()
      await refreshServerState(username)
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Unable to save workout' })
    }
  }

  async function onDelete(id) {
    if (!username) return
    const session = sessions.find(x => x.id === id)
    const ids = session?.backendIds?.length ? session.backendIds : [id]
    setStatus({ loading: true, error: '' })
    try {
      await Promise.all(ids.map((backendId) => api.deleteWorkout(username, backendId)))
      await refreshServerState(username)
    } catch (error) {
      setStatus({ loading: false, error: error.message || 'Unable to delete workout' })
    }
  }

  if (!username) {
    return <LoginPage onLogin={handleLogin} error={status.error} loading={status.loading} />
  }


  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        sessions={sessions}
        onAddWorkout={onAddWorkout}
        username={username}
        displayName={displayName}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="main">
        <div className="main-inner">
          {status.error && (
            <div className="card" style={{ marginBottom: 16, borderColor: 'var(--risk-crit)', color: 'var(--risk-crit)' }}>
              {status.error}
            </div>
          )}
          {page === 'dashboard' && (
            <Dashboard
              load={load}
              sessions={sessions}
              trend={TREND}
              onAddWorkout={onAddWorkout}
              onEditWorkout={onEditWorkout}
              onLogMuscle={onLogMuscle}
              setPage={setPage}
            />
          )}
          {page === 'log' && (
            <WorkoutsLog
              sessions={sessions}
              onAddWorkout={onAddWorkout}
              onEditWorkout={onEditWorkout}
              onDelete={onDelete}
            />
          )}
          {page === 'history' && <History sessions={sessions} trend={TREND} />}
          {page === 'insights' && (
            <Insights
              load={load}
              sessions={sessions}
              trend={TREND}
              username={username}
              displayName={displayName}
            />
          )}
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav className="mob-tab-bar" style={{ justifyContent: 'space-around' }}>
        {[
          { id: 'dashboard', label: 'Home' },
          { id: 'log', label: 'Workouts' },
          { id: 'history', label: 'History' },
          { id: 'insights', label: 'Insights' },
        ].map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 12px',
            color: page === t.id ? 'var(--text)' : 'var(--text-muted)',
            fontSize: 10.5, fontWeight: page === t.id ? 600 : 400,
            fontFamily: 'inherit',
          }}>
            <span style={{
              width: 4, height: 4, borderRadius: '50%',
              background: page === t.id ? 'var(--text)' : 'transparent',
              marginBottom: 2,
            }} />
            {t.label}
          </button>
        ))}
        <button onClick={onAddWorkout} style={{
          background: 'var(--text)', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '4px 12px', borderRadius: 8,
          color: 'var(--bg)',
          fontSize: 10.5, fontWeight: 600, fontFamily: 'inherit',
        }}>
          + Log
        </button>
      </nav>

      <AddWorkoutModal
        open={showAdd}
        editing={editing}
        onClose={closeModal}
        onSubmit={onSaveWorkout}
      />

      <SettingsModal
        open={showSettings}
        username={username}
        displayName={displayName}
        gender={gender}
        age={age}
        onSave={handleSaveSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />
    </div>
  )
}
