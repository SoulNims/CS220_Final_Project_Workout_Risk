import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import WorkoutsLog from './components/WorkoutsLog'
import History from './components/History'
import Insights from './components/Insights'
import AddWorkoutModal from './components/AddWorkoutModal'
import SettingsModal from './components/SettingsModal'
import { INITIAL_LOAD, SAMPLE_SESSIONS, TREND } from './data'

export default function App() {
  const [username, setUsername] = useState(() => localStorage.getItem('irp_username') || '')
  const [gender, setGender] = useState(() => localStorage.getItem('irp_gender') || '')
  const [age, setAge] = useState(() => localStorage.getItem('irp_age') ? parseInt(localStorage.getItem('irp_age'), 10) : null)
  const [theme, setTheme] = useState(() => localStorage.getItem('irp_theme') || 'light')
  const [showSettings, setShowSettings] = useState(false)
  const [page, setPage] = useState('dashboard')
  const [load, setLoad] = useState(INITIAL_LOAD)
  const [sessions, setSessions] = useState(SAMPLE_SESSIONS)
  const [selectedMuscle, setSelectedMuscle] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('irp_theme', theme)
  }, [theme])

  function handleLogin(name) {
    localStorage.setItem('irp_username', name)
    setUsername(name)
  }

  function handleSaveSettings(g, a) {
    if (g) { localStorage.setItem('irp_gender', g); setGender(g) }
    if (a != null) { localStorage.setItem('irp_age', a); setAge(a) }
  }

  function handleLogout() {
    localStorage.removeItem('irp_username')
    localStorage.removeItem('irp_gender')
    localStorage.removeItem('irp_age')
    setUsername('')
    setGender('')
    setAge(null)
    setPage('dashboard')
    setShowSettings(false)
  }

  function toggleTheme() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const onAddWorkout = () => { setEditing(null); setShowAdd(true) }
  const onEditWorkout = (s) => { setEditing(s); setShowAdd(true) }
  const closeModal = () => { setShowAdd(false); setEditing(null) }

  function applyLoad(s, delta) {
    setLoad(prev => {
      const next = { ...prev }
      const bump = 0.3 + (s.rpe / 10) * 0.6
      s.groups.forEach(g => {
        next[g] = Math.max(0, Math.min(4, (next[g] || 0) + delta * bump))
      })
      return next
    })
  }

  function onSaveWorkout(s, isEdit) {
    if (isEdit) {
      const old = sessions.find(x => x.id === s.id)
      setSessions(prev => prev.map(x => x.id === s.id ? s : x))
      if (old) applyLoad(old, -1)
      applyLoad(s, +1)
    } else {
      setSessions(prev => [s, ...prev])
      applyLoad(s, +1)
    }
    closeModal()
  }

  function onDelete(id) {
    const old = sessions.find(x => x.id === id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (old) applyLoad(old, -1)
  }

  if (!username) {
    return <LoginPage onLogin={handleLogin} />
  }


  return (
    <div className="app">
      <Sidebar
        page={page}
        setPage={setPage}
        sessions={sessions}
        onAddWorkout={onAddWorkout}
        username={username}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="main">
        <div className="main-inner">
          {page === 'dashboard' && (
            <Dashboard
              load={load}
              sessions={sessions}
              trend={TREND}
              selectedMuscle={selectedMuscle}
              setSelectedMuscle={setSelectedMuscle}
              onAddWorkout={onAddWorkout}
              onEditWorkout={onEditWorkout}
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
          {page === 'insights' && <Insights load={load} sessions={sessions} trend={TREND} />}
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
        gender={gender}
        age={age}
        onSave={handleSaveSettings}
        onClose={() => setShowSettings(false)}
        onLogout={handleLogout}
      />
    </div>
  )
}
