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
    const frontendMuscles = API_TO_FRONTEND_MUSCLES[score.muscle_group] || []
    frontendMuscles.forEach((muscle) => {
      load[muscle] = apiScoreToLoad(score.score)
    })
  })
  return load
}

export function frontendToApiMuscle(group) {
  return FRONTEND_TO_API_MUSCLE[group] || 'core'
}

export function apiWorkoutToSession(workout) {
  const frontendGroups = API_TO_FRONTEND_MUSCLES[workout.muscle_group] || [workout.muscle_group]
  const primaryGroup = frontendGroups[0]
  const rpe = Math.max(1, Math.min(10, Math.round(Number(workout.intensity || 0) / 10)))
  const sets = Math.max(1, Number(workout.sets || 1))
  return {
    id: workout.id,
    backendIds: [workout.id],
    date: new Date(workout.logged_at).toISOString().slice(0, 10),
    name: `${MUSCLE_LABEL[primaryGroup] || workout.muscle_group} workout`,
    groups: frontendGroups,
    rpe,
    duration: 45,
    soreness: Math.max(1, Math.min(10, rpe - 2)),
    entries: [
      {
        group: primaryGroup,
        fields: ['reps'],
        setRows: Array.from({ length: sets }, () => ({
          rpe,
          reps: String(workout.reps),
        })),
      },
    ],
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
