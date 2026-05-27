import {
  IconHome, IconActivity, IconHistory, IconChart,
  IconSearch, IconChevDown, IconPlus, IconSettings,
  IconHeart, IconMoon, IconSun,
} from '../icons'

function UserAvatarSvg() {
  return (
    <svg viewBox="0 0 32 32" width="100%" height="100%">
      <defs>
        <linearGradient id="ua-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A6691" />
          <stop offset="100%" stopColor="#14202E" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" fill="url(#ua-bg)" />
      <circle cx="16" cy="13" r="5.2" fill="#E8ECF1" />
      <path d="M3 32 C 5 23, 11 20, 16 20 C 21 20, 27 23, 29 32 Z" fill="#E8ECF1" />
    </svg>
  )
}

export default function Sidebar({ page, setPage, sessions, onAddWorkout, username, displayName, theme, toggleTheme, onOpenSettings }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard',  icon: IconHome },
    { id: 'log',       label: 'Workouts',   icon: IconActivity, count: sessions.length },
    { id: 'history',   label: 'History',    icon: IconHistory },
    { id: 'insights',  label: 'Insights',   icon: IconChart },
  ]

  const name = displayName || username
  const initial = name ? name[0].toUpperCase() : 'T'

  return (
    <aside className="sidebar">
      <div className="ws-header">
        <div className="ws-mark">{initial}</div>
        <div className="ws-name">{name ? `${name}'s Workspace` : 'Tendon'}</div>
        <IconChevDown size={12} />
      </div>

      <div style={{ padding: '0 6px 8px' }}>
        <button className="nav-item" style={{ width: '100%' }}>
          <span className="ico"><IconSearch /></span>
          <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>⌘K</span>
        </button>
      </div>

      <div className="nav-section">Tendon</div>
      <ul className="nav-list">
        {items.map((it) => {
          const Ico = it.icon
          const active = page === it.id
          return (
            <li key={it.id}
                className={'nav-item' + (active ? ' active' : '')}
                onClick={() => setPage(it.id)}
                style={{ listStyle: 'none' }}>
              <span className="ico"><Ico /></span>
              <span>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
            </li>
          )
        })}
      </ul>

      <div className="nav-divider" />

      <div className="nav-section">Private</div>
      <ul className="nav-list">
        <li
          className={'nav-item' + (page === 'notes' ? ' active' : '')}
          onClick={() => setPage('notes')}
          style={{ listStyle: 'none' }}
        >
          <span className="ico"><IconHeart /></span>
          <span>Notes</span>
        </li>
      </ul>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '4px 6px' }}>
        <button className="nav-item" onClick={onAddWorkout}
                style={{ color: 'var(--text)' }}>
          <span className="ico" style={{ color: 'var(--text)' }}><IconPlus /></span>
          <span>Log a workout</span>
        </button>
        <button className="nav-item" onClick={toggleTheme}>
          <span className="ico">{theme === 'dark' ? <IconSun /> : <IconMoon />}</span>
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button className="nav-item" onClick={onOpenSettings}>
          <span className="ico"><IconSettings /></span>
          <span>Settings</span>
        </button>
      </div>

      <div className="user-pill">
        <div className="user-avatar">
          <UserAvatarSvg />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{name || 'Athlete'}</div>
          <div className="user-sub">CS 220 · Spring 26</div>
        </div>
        <IconChevDown size={12} />
      </div>
    </aside>
  )
}
