import { RISK_COLORS, RISK_LABELS } from '../mockData'

export default function MuscleZoomPanel({ muscle, riskData, recommendations, workouts, onClose }) {
  const entry = riskData[muscle] || { score: 0, level: 'none' }
  const color = RISK_COLORS[entry.level] || RISK_COLORS.none
  const label = RISK_LABELS[entry.level] || 'No Data'
  const rec = recommendations[muscle] || 'No recommendation available.'
  const recent = workouts.filter(w => w.muscle_group === muscle).slice(0, 5)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white capitalize">{muscle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Risk meter */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Risk Score</span>
            <span className="text-sm font-bold" style={{ color }}>{label}</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${entry.score}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between text-slate-500 text-xs mt-1">
            <span>0</span>
            <span className="font-medium text-slate-300">{entry.score}/100</span>
            <span>100</span>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-slate-700/50 rounded-xl p-4 mb-5">
          <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
        </div>

        {/* Recent workouts */}
        <div>
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-3">Last 5 Workouts</h3>
          {recent.length === 0 ? (
            <p className="text-slate-500 text-sm">No workouts logged for this muscle yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map(w => (
                <div key={w.id} className="flex justify-between items-center bg-slate-700/40 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-white text-sm font-medium capitalize">{w.workout_type || 'Workout'}</span>
                    <span className="text-slate-400 text-xs ml-2">{w.date}</span>
                  </div>
                  <span className="text-slate-300 text-sm">{w.sets}×{w.reps}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
