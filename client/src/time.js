export const DEFAULT_TIME_ZONE = 'America/Chicago'

export const TIME_ZONE_OPTIONS = [
  { value: 'America/Chicago', label: 'US Central Time' },
  { value: 'America/New_York', label: 'US Eastern Time' },
  { value: 'America/Denver', label: 'US Mountain Time' },
  { value: 'America/Los_Angeles', label: 'US Pacific Time' },
  { value: 'America/Anchorage', label: 'US Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'US Hawaii Time' },
  { value: 'UTC', label: 'UTC' },
]

export function getSavedTimeZone() {
  return localStorage.getItem('irp_time_zone') || DEFAULT_TIME_ZONE
}

export function zonedDateParts(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(parts.map(part => [part.type, part.value]))
}

export function zonedDateInputValue(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const parts = zonedDateParts(date, timeZone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function zonedHour(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  return Number(zonedDateParts(date, timeZone).hour)
}
