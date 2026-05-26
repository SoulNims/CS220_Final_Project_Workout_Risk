import { MUSCLE_LABEL } from './data'

export const FRONTEND_TO_API_MUSCLE = {
  head: 'head',
  chest: 'chest',
  abs: 'abs',
  obliques: 'obliques',
  upper_back: 'upper_back',
  lower_back: 'lower_back',
  glutes: 'glutes',
  shoulders_front: 'shoulders_front',
  shoulders_rear: 'shoulders_rear',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms_l: 'forearms_l',
  forearms_r: 'forearms_r',
  quads: 'quads',
  hamstrings: 'hamstrings',
  calves: 'calves',
}

export const API_TO_FRONTEND_MUSCLES = {
  head: ['head'],
  chest: ['chest'],
  abs: ['abs'],
  obliques: ['obliques'],
  upper_back: ['upper_back'],
  lower_back: ['lower_back'],
  shoulders_front: ['shoulders_front'],
  shoulders_rear: ['shoulders_rear'],
  biceps: ['biceps'],
  forearms_l: ['forearms_l'],
  forearms_r: ['forearms_r'],
  triceps: ['triceps'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
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
  return FRONTEND_TO_API_MUSCLE[group] || 'abs'
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

export function sessionToWorkoutPayload(session) {
  return {
    date: session.date,
    name: session.name || 'Workout',
    groups: [...new Set((session.groups || []).map(frontendToApiMuscle))],
    rpe: Math.max(1, Math.min(10, Number(session.rpe || 7))),
    duration: Math.max(1, Number(session.duration || 45)),
    soreness: Math.max(1, Math.min(10, Number(session.soreness || 5))),
    entries: (session.entries || []).map((entry) => ({
      group: frontendToApiMuscle(entry.group),
      fields: entry.fields || [],
      setRows: entry.setRows || [],
    })),
  }
}
