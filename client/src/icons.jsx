const Icon = ({ d, size = 16, fill = 'none', strokeWidth = 1.5, viewBox = '0 0 24 24', children, style, className }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={style} className={className}>
    {d ? <path d={d} /> : children}
  </svg>
)

export const IconHome     = (p) => <Icon {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></Icon>
export const IconActivity = (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />
export const IconHistory  = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>
export const IconChart    = (p) => <Icon {...p}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-7" /></Icon>
export const IconPlus     = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const IconSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></Icon>
export const IconSearch   = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Icon>
export const IconChev     = (p) => <Icon {...p} d="M9 6l6 6-6 6" />
export const IconChevDown = (p) => <Icon {...p} d="M6 9l6 6 6-6" />
export const IconClose    = (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />
export const IconCalendar = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>
export const IconUser     = (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icon>
export const IconFlame    = (p) => <Icon {...p} d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1-3s-1 5 2 5 2-4 2-5c0-3-2-5-2-5s2 0 2-2z" />
export const IconHeart    = (p) => <Icon {...p} d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />
export const IconCircle   = (p) => <Icon {...p}><circle cx="12" cy="12" r="3" /></Icon>
export const IconMore     = (p) => <Icon {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Icon>
export const IconTrash    = (p) => <Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" /></Icon>
export const IconCheck    = (p) => <Icon {...p} d="M5 12l4 4 10-10" />
export const IconArrowUp  = (p) => <Icon {...p} d="M12 19V5M5 12l7-7 7 7" />
export const IconArrowDown= (p) => <Icon {...p} d="M12 5v14M5 12l7 7 7-7" />
export const IconSparkle  = (p) => <Icon {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
export const IconStretch  = (p) => <Icon {...p}><circle cx="12" cy="4" r="2" /><path d="M12 6v7M8 9l4 2 4-2M9 22l3-9 3 9" /></Icon>
export const IconMoon     = (p) => <Icon {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
export const IconSun      = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></Icon>
