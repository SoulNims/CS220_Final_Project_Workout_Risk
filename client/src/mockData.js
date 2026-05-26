export const RISK_COLORS = {
  low: '#3b82f6',
  moderate: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
  none: '#4b5563',
}

export const RISK_LABELS = {
  low: 'Low Risk',
  moderate: 'Moderate',
  high: 'High Risk',
  critical: 'Critical',
  none: 'No Data',
}

export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'core', 'calves',
]

export const WORKOUT_TYPES = [
  { label: 'Strength', intensity: 85 },
  { label: 'Hypertrophy', intensity: 70 },
  { label: 'Endurance', intensity: 55 },
  { label: 'Cardio', intensity: 40 },
  { label: 'Mobility', intensity: 20 },
]

// Mock initial risk data — simulates GET /api/risk/:username
export function getMockRisk() {
  return {
    chest: { score: 72, level: 'high' },
    back: { score: 45, level: 'moderate' },
    shoulders: { score: 20, level: 'low' },
    biceps: { score: 88, level: 'critical' },
    triceps: { score: 30, level: 'low' },
    quads: { score: 55, level: 'moderate' },
    hamstrings: { score: 0, level: 'none' },
    glutes: { score: 0, level: 'none' },
    core: { score: 60, level: 'moderate' },
    calves: { score: 0, level: 'none' },
  }
}

export function getMockRecommendations() {
  return {
    chest: 'Your chest is showing high fatigue. Consider waiting 48 hours before training chest again.',
    back: 'Moderate fatigue detected. Light training is okay but avoid max effort lifts.',
    shoulders: 'Shoulders are fresh and ready. Good day for overhead pressing.',
    biceps: 'Critical fatigue! Rest biceps for at least 72 hours to prevent injury.',
    triceps: 'Triceps are recovered. You can train them today.',
    quads: 'Moderate quad fatigue. Avoid heavy squats today; light cardio is fine.',
    hamstrings: 'No recent data for hamstrings. Log a workout to start tracking.',
    glutes: 'No recent data for glutes. Log a workout to start tracking.',
    core: 'Core is moderately fatigued. Light core work is fine.',
    calves: 'No recent data for calves. Log a workout to start tracking.',
  }
}

let mockWorkouts = [
  { id: 1, muscle_group: 'chest', sets: 4, reps: 8, intensity: 85, workout_type: 'Strength', date: '2026-05-20' },
  { id: 2, muscle_group: 'biceps', sets: 3, reps: 12, intensity: 70, workout_type: 'Hypertrophy', date: '2026-05-20' },
  { id: 3, muscle_group: 'back', sets: 4, reps: 10, intensity: 70, workout_type: 'Hypertrophy', date: '2026-05-19' },
  { id: 4, muscle_group: 'quads', sets: 5, reps: 6, intensity: 85, workout_type: 'Strength', date: '2026-05-18' },
  { id: 5, muscle_group: 'core', sets: 3, reps: 20, intensity: 55, workout_type: 'Endurance', date: '2026-05-17' },
]

export function getMockWorkouts() {
  return [...mockWorkouts]
}

export function addMockWorkout(workout) {
  const newW = { ...workout, id: Date.now(), date: new Date().toISOString().slice(0, 10) }
  mockWorkouts = [newW, ...mockWorkouts]
  return newW
}
