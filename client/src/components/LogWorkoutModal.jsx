import { useState } from 'react'
import { MUSCLE_GROUPS, WORKOUT_TYPES } from '../mockData'

export default function LogWorkoutModal({ onClose, onSubmit }) {
  const [muscle, setMuscle] = useState('')
  const [workoutType, setWorkoutType] = useState('')
  const [sets, setSets] = useState(3)
  const [reps, setReps] = useState(10)
  const [minutes, setMinutes] = useState(30)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!muscle) { setError('Select a muscle group'); return }
    if (!workoutType) { setError('Select a workout type'); return }
    setLoading(true)
    const typeObj = WORKOUT_TYPES.find(t => t.label === workoutType)
    await onSubmit({
      muscle_group: muscle,
      sets: parseInt(sets),
      reps: parseInt(reps),
      intensity: typeObj.intensity,
      workout_type: workoutType,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Log Workout</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Muscle Group</label>
            <select
              value={muscle}
              onChange={e => setMuscle(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-blue-500 capitalize"
            >
              <option value="">— Select —</option>
              {MUSCLE_GROUPS.map(m => (
                <option key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Workout Type</label>
            <div className="grid grid-cols-2 gap-2">
              {WORKOUT_TYPES.map(t => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setWorkoutType(t.label)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    workoutType === t.label
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {t.label}
                  <span className="block text-xs opacity-60">{t.intensity}% intensity</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Sets</label>
              <input
                type="number" min="1" max="20" value={sets}
                onChange={e => setSets(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Reps</label>
              <input
                type="number" min="1" max="50" value={reps}
                onChange={e => setReps(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Minutes</label>
              <input
                type="number" min="1" value={minutes}
                onChange={e => setMinutes(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 border border-slate-600 focus:outline-none focus:border-blue-500 text-center"
              />
            </div>
          </div>

          <p className="text-slate-500 text-xs">* Total time is for reference only and is not sent to the server in v1.</p>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? 'Logging...' : 'Log Workout'}
          </button>
        </form>
      </div>
    </div>
  )
}
