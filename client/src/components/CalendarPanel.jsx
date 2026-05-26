import { useState } from 'react'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPanel({ workouts }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const workoutsByDate = {}
  workouts.forEach(w => {
    if (!workoutsByDate[w.date]) workoutsByDate[w.date] = []
    workoutsByDate[w.date].push(w)
  })

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  function formatDate(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const selectedDate = selectedDay ? formatDate(selectedDay) : null
  const selectedWorkouts = selectedDate ? (workoutsByDate[selectedDate] || []) : []

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="text-slate-400 hover:text-white px-2 py-1 rounded">‹</button>
        <span className="text-white font-semibold">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="text-slate-400 hover:text-white px-2 py-1 rounded">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-slate-500 text-xs py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = formatDate(day)
          const hasWorkout = !!workoutsByDate[dateStr]
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const isSelected = selectedDay === day

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative text-center py-1.5 rounded-lg text-sm transition-all ${
                isSelected ? 'bg-blue-600 text-white' :
                isToday ? 'bg-slate-600 text-white' :
                'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {day}
              {hasWorkout && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                  isSelected ? 'bg-white' : 'bg-blue-400'
                }`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day workout popup */}
      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <h3 className="text-slate-300 text-sm font-medium mb-2">
            {MONTH_NAMES[month]} {selectedDay} — {selectedWorkouts.length} workout{selectedWorkouts.length !== 1 ? 's' : ''}
          </h3>
          {selectedWorkouts.length === 0 ? (
            <p className="text-slate-500 text-sm">No workouts logged this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedWorkouts.map(w => (
                <div key={w.id} className="flex justify-between bg-slate-700/40 rounded-lg px-3 py-2">
                  <span className="text-white text-sm capitalize">{w.muscle_group}</span>
                  <span className="text-slate-400 text-sm">{w.workout_type} · {w.sets}×{w.reps}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
