import { RISK_COLORS, RISK_LABELS } from '../mockData'

const items = [
  { level: 'none', label: 'No Data' },
  { level: 'low', label: 'Low' },
  { level: 'moderate', label: 'Moderate' },
  { level: 'high', label: 'High' },
  { level: 'critical', label: 'Critical' },
]

export default function RiskLegend() {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {items.map(({ level, label }) => (
        <div key={level} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RISK_COLORS[level] }} />
          <span className="text-slate-400 text-xs">{label}</span>
        </div>
      ))}
    </div>
  )
}
