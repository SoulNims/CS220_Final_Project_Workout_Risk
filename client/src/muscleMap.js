import { MUSCLE_LABEL } from './data'

export const FRONTEND_TO_API_MUSCLE = {
  chest: 'chest',
  abs: 'core',
  obliques: 'core',
  upper_back: 'back',
  lower_back: 'back',
  glutes: 'glutes',
  shoulders_front: 'shoulders',
  shoulders_rear: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms_l: 'biceps',
  forearms_r: 'biceps',
  quads: 'quads',
  hamstrings: 'hamstrings',
  calves: 'calves',
}

export const API_TO_FRONTEND_MUSCLES = {
  chest: ['chest'],
  back: ['upper_back', 'lower_back'],
  shoulders: ['shoulders_front', 'shoulders_rear'],
  biceps: ['biceps', 'forearms_l', 'forearms_r'],
  triceps: ['triceps'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  core: ['abs', 'obliques'],
}

export function apiScoreToLoad(score) {
  return Math.max(0, Math.min(4, Number(score || 0) / 25))
}

export function riskScoresToLoad(scores) {
  const load = Object.fromEntries(Object.keys(MUSCLE_LABEL).map((key) => [key, 0]))
  scores.forEach((score) => {
    if (score.group in load) {
      load[score.group] = apiScoreToLoad(score.score)
    }
  })
  return load
}

export function frontendToApiMuscle(group) {
  return FRONTEND_TO_API_MUSCLE[group] || 'core'
}

export function apiWorkoutToSession(session) {
  return {
    id: session.id,
    backendIds: [session.id],
    date: session.date,
    name: session.name,
    groups: session.groups,
    rpe: session.rpe,
    duration: session.duration,
    soreness: session.soreness ?? 4,
    entries: session.entries || [],
  }
}

export function sessionEntryToWorkoutPayload(entry, session) {
  const setRows = Array.isArray(entry.setRows) && entry.setRows.length
    ? entry.setRows
    : [{ rpe: session.rpe }]
  const reps = setRows
    .map((row) => Number.parseInt(row.reps, 10))
    .find((value) => Number.isFinite(value) && value > 0) || 10
  const avgRpe = setRows.reduce((sum, row) => sum + Number(row.rpe || session.rpe || 7), 0) / setRows.length
  return {
    muscle_group: frontendToApiMuscle(entry.group),
    sets: setRows.length,
    reps,
    intensity: Math.max(0, Math.min(100, Math.round(avgRpe * 10))),
  }
}
