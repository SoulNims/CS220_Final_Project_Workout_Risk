export const RISK_LABELS = ['No data', 'Low', 'Moderate', 'High', 'Critical']
export const RISK_COLORS = ['#8B95A5', '#5A8FC7', '#C99845', '#C66D3F', '#C4564F']
export const RISK_KEY = ['none', 'low', 'mod', 'high', 'crit']

export const INITIAL_LOAD = {
  head: 0,
  chest: 3.2,
  abs: 2.0,
  obliques: 1.4,
  upper_back: 1.6,
  lower_back: 1.1,
  glutes: 0.6,
  shoulders_front: 1.8,
  shoulders_rear: 1.5,
  biceps: 1.4,
  triceps: 1.2,
  forearms_l: 3.9,
  forearms_r: 3.9,
  quads: 2.1,
  hamstrings: 0.4,
  calves: 0.0,
}

export function loadToRisk(load) {
  if (load === 0) return 0
  if (load < 1.0) return 1
  if (load < 2.0) return 2
  if (load < 3.5) return 3
  return 4
}

export const SAMPLE_SESSIONS = [
  {
    id: 's9', date: '2026-05-25', name: 'Morning workout',
    groups: ['chest', 'triceps', 'shoulders_front'], rpe: 7, duration: 45, soreness: 5,
    entries: [
      { group: 'chest', setRows: [{ rpe: 7, weight: '80kg', reps: '8' }, { rpe: 8, weight: '85kg', reps: '7' }, { rpe: 8, weight: '85kg', reps: '6' }], fields: ['weight', 'reps'] },
      { group: 'triceps', setRows: [{ rpe: 6 }, { rpe: 7 }, { rpe: 7 }], fields: [] },
      { group: 'shoulders_front', setRows: [{ rpe: 7 }, { rpe: 8 }, { rpe: 8 }], fields: [] },
    ],
  },
  { id: 's8', date: '2026-05-24', name: 'Push day', groups: ['chest', 'triceps', 'shoulders_front'], rpe: 8, duration: 62, soreness: 6 },
  { id: 's7', date: '2026-05-23', name: 'Climbing — bouldering', groups: ['forearms_l', 'forearms_r', 'biceps', 'upper_back'], rpe: 9, duration: 95, soreness: 8 },
  { id: 's6', date: '2026-05-21', name: 'Leg day', groups: ['quads', 'glutes', 'calves'], rpe: 7, duration: 55, soreness: 5 },
  { id: 's5', date: '2026-05-20', name: 'Pull day', groups: ['upper_back', 'biceps', 'shoulders_rear'], rpe: 7, duration: 58, soreness: 4 },
  { id: 's4', date: '2026-05-18', name: 'Climbing — lead', groups: ['forearms_l', 'forearms_r', 'biceps'], rpe: 9, duration: 110, soreness: 7 },
  { id: 's3', date: '2026-05-17', name: 'Mobility + core', groups: ['abs', 'obliques', 'lower_back'], rpe: 4, duration: 35, soreness: 2 },
  { id: 's2', date: '2026-05-15', name: 'Push day', groups: ['chest', 'triceps', 'shoulders_front'], rpe: 8, duration: 60, soreness: 6 },
  { id: 's1', date: '2026-05-14', name: 'Easy run', groups: ['quads', 'calves'], rpe: 5, duration: 42, soreness: 3 },
]

export const TREND = [
  { d: 'May 11', score: 38 },
  { d: 'May 12', score: 42 },
  { d: 'May 13', score: 40 },
  { d: 'May 14', score: 48 },
  { d: 'May 15', score: 54 },
  { d: 'May 16', score: 51 },
  { d: 'May 17', score: 49 },
  { d: 'May 18', score: 58 },
  { d: 'May 19', score: 60 },
  { d: 'May 20', score: 55 },
  { d: 'May 21', score: 59 },
  { d: 'May 22', score: 63 },
  { d: 'May 23', score: 71 },
  { d: 'May 24', score: 74 },
]

export const MUSCLE_LABEL = {
  head: 'Head & neck',
  chest: 'Chest',
  abs: 'Abdominals',
  obliques: 'Obliques',
  upper_back: 'Upper back',
  lower_back: 'Lower back',
  glutes: 'Glutes',
  shoulders_front: 'Front delts',
  shoulders_rear: 'Rear delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms_l: 'Forearm (L)',
  forearms_r: 'Forearm (R)',
  quads: 'Quadriceps',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

export function aggregateScore(load) {
  const vals = Object.values(load).filter(v => v > 0)
  if (!vals.length) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const max = Math.max(...vals)
  return Math.round(Math.min(100, avg * 12 + max * 14))
}

export function scoreLabel(s) {
  if (s < 25) return { key: 'low',  label: 'Low risk',      text: 'Cleared for hard sessions.' }
  if (s < 50) return { key: 'mod',  label: 'Moderate risk', text: 'Some load. Watch volume.' }
  if (s < 75) return { key: 'high', label: 'Elevated risk', text: 'Consider lighter intensity.' }
  return        { key: 'crit', label: 'High risk',      text: 'Recover before next hard day.' }
}

export function formatDate(s) {
  const d = new Date(s)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const today = new Date()
  const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return diff + ' days ago'
  return `${months[d.getMonth()]} ${d.getDate()}`
}
