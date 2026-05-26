import { RISK_COLORS, loadToRisk } from '../data'

function Region({ id, selected, onSelect, children }) {
  return (
    <g
      className={'avatar-zone' + (selected === id ? ' selected' : '')}
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(id) }}
    >
      {children}
    </g>
  )
}

function FigureFrame({ label, children }) {
  return (
    <div style={{ flex: '0 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export default function BodyAvatar({ load, onSelect, selected }) {
  function fill(key) {
    const v = load[key] || 0
    const risk = loadToRisk(v)
    return risk === 0 ? 'var(--body-blank)' : RISK_COLORS[risk]
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
      {/* FRONT */}
      <FigureFrame label="Front">
        <svg viewBox="0 0 200 420" width="100%" style={{ maxWidth: 220 }}>
          <defs>
            <filter id="bodyShadow" x="-20%" y="-10%" width="140%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dy="6" />
              <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g>
            <Region id="head" selected={selected} onSelect={onSelect}>
              <ellipse cx="100" cy="42" rx="26" ry="30" fill={fill('head')} />
              <rect x="91" y="68" width="18" height="16" rx="5" fill={fill('head')} opacity="0.85" />
            </Region>

            <Region id="shoulders_front" selected={selected} onSelect={onSelect}>
              <ellipse cx="58" cy="100" rx="18" ry="20" fill={fill('shoulders_front')} />
              <ellipse cx="142" cy="100" rx="18" ry="20" fill={fill('shoulders_front')} />
            </Region>

            <Region id="chest" selected={selected} onSelect={onSelect}>
              <path d="M68 88 Q100 82 132 88 L136 142 Q100 152 64 142 Z" fill={fill('chest')} />
            </Region>

            <Region id="abs" selected={selected} onSelect={onSelect}>
              <rect x="74" y="148" width="52" height="58" rx="10" fill={fill('abs')} />
            </Region>

            <Region id="obliques" selected={selected} onSelect={onSelect}>
              <path d="M64 142 Q60 168 70 200 L74 200 L74 148 Z" fill={fill('obliques')} />
              <path d="M136 142 Q140 168 130 200 L126 200 L126 148 Z" fill={fill('obliques')} />
            </Region>

            <rect x="70" y="208" width="60" height="28" rx="8" fill="var(--body-blank)" opacity="0.9" />

            <Region id="biceps" selected={selected} onSelect={onSelect}>
              <rect x="30" y="100" width="22" height="62" rx="11" fill={fill('biceps')} />
              <rect x="148" y="100" width="22" height="62" rx="11" fill={fill('biceps')} />
            </Region>

            <Region id="forearms_l" selected={selected} onSelect={onSelect}>
              <rect x="28" y="164" width="22" height="68" rx="11" fill={fill('forearms_l')} />
              <circle cx="39" cy="240" r="10" fill={fill('forearms_l')} opacity="0.9" />
            </Region>

            <Region id="forearms_r" selected={selected} onSelect={onSelect}>
              <rect x="150" y="164" width="22" height="68" rx="11" fill={fill('forearms_r')} />
              <circle cx="161" cy="240" r="10" fill={fill('forearms_r')} opacity="0.9" />
            </Region>

            <Region id="quads" selected={selected} onSelect={onSelect}>
              <rect x="70" y="238" width="26" height="86" rx="11" fill={fill('quads')} />
              <rect x="104" y="238" width="26" height="86" rx="11" fill={fill('quads')} />
            </Region>

            <Region id="calves" selected={selected} onSelect={onSelect}>
              <rect x="72" y="326" width="22" height="62" rx="10" fill={fill('calves')} />
              <rect x="106" y="326" width="22" height="62" rx="10" fill={fill('calves')} />
            </Region>

            <ellipse cx="83" cy="396" rx="14" ry="7" fill="var(--body-blank)" opacity="0.85" />
            <ellipse cx="117" cy="396" rx="14" ry="7" fill="var(--body-blank)" opacity="0.85" />
          </g>
        </svg>
      </FigureFrame>

      {/* BACK */}
      <FigureFrame label="Back">
        <svg viewBox="0 0 200 420" width="100%" style={{ maxWidth: 220 }}>
          <g>
            <Region id="head" selected={selected} onSelect={onSelect}>
              <ellipse cx="100" cy="42" rx="26" ry="30" fill={fill('head')} opacity="0.85" />
              <rect x="91" y="68" width="18" height="16" rx="5" fill={fill('head')} opacity="0.7" />
            </Region>

            <Region id="shoulders_rear" selected={selected} onSelect={onSelect}>
              <ellipse cx="58" cy="100" rx="18" ry="20" fill={fill('shoulders_rear')} />
              <ellipse cx="142" cy="100" rx="18" ry="20" fill={fill('shoulders_rear')} />
            </Region>

            <Region id="upper_back" selected={selected} onSelect={onSelect}>
              <path d="M68 86 Q100 80 132 86 L138 150 Q100 158 62 150 Z" fill={fill('upper_back')} />
            </Region>

            <Region id="lower_back" selected={selected} onSelect={onSelect}>
              <rect x="74" y="156" width="52" height="48" rx="10" fill={fill('lower_back')} />
            </Region>

            <Region id="glutes" selected={selected} onSelect={onSelect}>
              <path d="M70 206 Q100 198 130 206 L130 240 Q100 250 70 240 Z" fill={fill('glutes')} />
            </Region>

            <Region id="triceps" selected={selected} onSelect={onSelect}>
              <rect x="30" y="100" width="22" height="62" rx="11" fill={fill('triceps')} />
              <rect x="148" y="100" width="22" height="62" rx="11" fill={fill('triceps')} />
            </Region>

            <Region id="forearms_l" selected={selected} onSelect={onSelect}>
              <rect x="28" y="164" width="22" height="68" rx="11" fill={fill('forearms_l')} opacity="0.9" />
              <circle cx="39" cy="240" r="10" fill={fill('forearms_l')} opacity="0.85" />
            </Region>

            <Region id="forearms_r" selected={selected} onSelect={onSelect}>
              <rect x="150" y="164" width="22" height="68" rx="11" fill={fill('forearms_r')} opacity="0.9" />
              <circle cx="161" cy="240" r="10" fill={fill('forearms_r')} opacity="0.85" />
            </Region>

            <Region id="hamstrings" selected={selected} onSelect={onSelect}>
              <rect x="70" y="244" width="26" height="86" rx="11" fill={fill('hamstrings')} />
              <rect x="104" y="244" width="26" height="86" rx="11" fill={fill('hamstrings')} />
            </Region>

            <Region id="calves" selected={selected} onSelect={onSelect}>
              <rect x="72" y="332" width="22" height="56" rx="10" fill={fill('calves')} opacity="0.95" />
              <rect x="106" y="332" width="22" height="56" rx="10" fill={fill('calves')} opacity="0.95" />
            </Region>

            <ellipse cx="83" cy="396" rx="14" ry="7" fill="var(--body-blank)" opacity="0.85" />
            <ellipse cx="117" cy="396" rx="14" ry="7" fill="var(--body-blank)" opacity="0.85" />
          </g>
        </svg>
      </FigureFrame>
    </div>
  )
}
