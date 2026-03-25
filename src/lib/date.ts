const dayMs = 24 * 60 * 60 * 1000

export function todayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function shiftDate(dateKey: string, offset: number) {
  const base = new Date(`${dateKey}T12:00:00`)
  base.setTime(base.getTime() + offset * dayMs)
  return todayKey(base)
}

export function getLastNDates(count: number, endDate = todayKey()) {
  return Array.from({ length: count }, (_, index) => shiftDate(endDate, -(count - 1 - index)))
}

export function getWeekStart(dateKey: string) {
  const base = new Date(`${dateKey}T12:00:00`)
  const day = base.getDay()
  const offset = day === 0 ? -6 : 1 - day
  return shiftDate(dateKey, offset)
}

export function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`))
}

export function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`))
}

export function isToday(dateKey: string) {
  return dateKey === todayKey()
}
