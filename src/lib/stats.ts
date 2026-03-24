import { getLastNDates, shiftDate } from './date'
import type { DailyEntry } from './schema'

export type DayTone = 'empty' | 'green' | 'yellow' | 'red'

export function createDefaultEntry(date: string): DailyEntry {
  const now = new Date().toISOString()
  return {
    version: 1,
    date,
    energy: 5,
    mood: 5,
    focus: 5,
    deepWork: 0,
    workout: false,
    webcam: false,
    mj: false,
    alcohol: false,
    nicotineBefore12: false,
    craving: 0,
    notes: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function getEntryTone(entry?: DailyEntry): DayTone {
  if (!entry) return 'empty'
  if (entry.webcam) return 'red'
  if (entry.mj || entry.alcohol) return 'yellow'
  return 'green'
}

export function isCleanDay(entry?: DailyEntry) {
  return Boolean(entry && !entry.mj && !entry.alcohol)
}

export function getTodayFlags(entry: DailyEntry, previousEntry?: DailyEntry) {
  const flags: Array<{ tone: 'red' | 'orange'; text: string }> = []

  if (entry.webcam) {
    flags.push({ tone: 'red', text: 'Вебкам зафіксовано. День критичний.' })
  }

  if (entry.mj && previousEntry?.mj) {
    flags.push({ tone: 'orange', text: 'Не 2 дні поспіль.' })
  }

  return flags
}

export function getRecoveryScore(entry: DailyEntry) {
  const base = entry.energy + entry.mood + entry.focus
  const positives = (entry.workout ? 2 : 0) + Math.min(2, entry.deepWork >= 60 ? 2 : entry.deepWork >= 25 ? 1 : 0)
  const penalties =
    (entry.webcam ? 4 : 0) +
    (entry.mj ? 2 : 0) +
    (entry.alcohol ? 2 : 0) +
    (entry.nicotineBefore12 ? 1 : 0) +
    Math.round(entry.craving / 4)

  return Math.max(0, Math.min(10, Math.round(((base + positives - penalties) / 3.2) * 10) / 10))
}

export function buildDashboardMetrics(entries: DailyEntry[]) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]))
  const last7Dates = [...getLastNDates(7)].reverse()
  const last30Dates = [...getLastNDates(30)].reverse()
  const last7Entries = last7Dates.map((date) => entryMap.get(date)).filter(Boolean) as DailyEntry[]
  const noWebcamStreak = computeStreak(sorted, (entry) => !entry.webcam)
  const cleanStreak = computeStreak(sorted, (entry) => !entry.mj && !entry.alcohol)

  return {
    noWebcamStreak,
    cleanStreak,
    avgEnergy: average(last7Entries.map((entry) => entry.energy)),
    avgMood: average(last7Entries.map((entry) => entry.mood)),
    avgFocus: average(last7Entries.map((entry) => entry.focus)),
    avgRecovery: average(last7Entries.map((entry) => getRecoveryScore(entry))),
    workoutsLast7: last7Entries.filter((entry) => entry.workout).length,
    webcamLast30: last30Dates.filter((date) => entryMap.get(date)?.webcam).length,
    mjLast30: last30Dates.filter((date) => entryMap.get(date)?.mj).length,
    trendEnergy: last7Dates.map((date) => entryMap.get(date)?.energy ?? 0),
    trendMood: last7Dates.map((date) => entryMap.get(date)?.mood ?? 0),
    trendFocus: last7Dates.map((date) => entryMap.get(date)?.focus ?? 0),
  }
}

function computeStreak(entries: DailyEntry[], predicate: (entry: DailyEntry) => boolean) {
  let streak = 0
  for (const entry of entries) {
    if (!predicate(entry)) break
    streak += 1
  }
  return streak
}

export function buildHeatmapDays(entryMap: Map<string, DailyEntry>, total = 84) {
  return getLastNDates(total).map((date) => {
    const entry = entryMap.get(date)
    return {
      date,
      entry,
      tone: getEntryTone(entry),
    }
  })
}

export function getPreviousDate(date: string) {
  return shiftDate(date, -1)
}
