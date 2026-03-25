import { getLastNDates, getWeekStart, shiftDate, todayKey } from './date'
import { DEFAULT_FORMULA_WEIGHTS, type DailyEntry, type FormulaWeights } from './schema'

export type DayTone = 'empty' | 'green' | 'yellow' | 'red'

export type LevelAdjustment = {
  label: string
  value: number
  tone: 'positive' | 'negative' | 'neutral'
}

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
    sleep: 0,
    stress: 0,
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

export function getDayLevelBreakdown(entry: DailyEntry, weights: FormulaWeights = DEFAULT_FORMULA_WEIGHTS) {
  const deepWorkBonus = roundToTenth(Math.min(weights.deepWorkCap, (entry.deepWork / 60) * weights.deepWorkRate))

  const adjustments: LevelAdjustment[] = [
    { label: 'Старт', value: weights.start, tone: 'neutral' },
    { label: 'Вебкам', value: entry.webcam ? weights.webcam : 0, tone: 'negative' },
    { label: 'MJ', value: entry.mj ? weights.mj : 0, tone: 'negative' },
    { label: 'Алкоголь', value: entry.alcohol ? weights.alcohol : 0, tone: 'negative' },
    { label: 'Рух', value: entry.workout ? weights.workout : 0, tone: 'positive' },
    { label: 'Deep work', value: deepWorkBonus, tone: 'positive' },
  ]

  const rawScore = adjustments.reduce((sum, item) => sum + item.value, 0)

  return {
    score: clampToLevel(rawScore),
    rawScore: roundToTenth(rawScore),
    deepWorkBonus,
    adjustments,
  }
}

export function getDayLevel(entry: DailyEntry, weights?: FormulaWeights) {
  return getDayLevelBreakdown(entry, weights).score
}

export function getDayState(entry: DailyEntry) {
  if (entry.webcam) {
    return {
      label: 'Критичний',
      hint: 'потрібен мʼякий відкат на завтра',
      tone: 'rose' as const,
    }
  }

  if (entry.mj || entry.alcohol) {
    return {
      label: 'Ризик',
      hint: 'є тригери, потрібен контроль',
      tone: 'amber' as const,
    }
  }

  if (entry.workout || entry.deepWork >= 60) {
    return {
      label: 'Стабільний',
      hint: 'є опора на тіло або фокус',
      tone: 'green' as const,
    }
  }

  return {
    label: 'Рівний',
    hint: 'без критичних сигналів',
    tone: 'blue' as const,
  }
}

export function buildDashboardMetrics(entries: DailyEntry[], weights: FormulaWeights = DEFAULT_FORMULA_WEIGHTS) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]))
  const last7Dates = [...getLastNDates(7)].reverse()
  const last30Dates = [...getLastNDates(30)].reverse()
  const last7Entries = last7Dates.map((date) => entryMap.get(date)).filter(Boolean) as DailyEntry[]
  const noWebcamStreak = computeStreak(sorted, (entry) => !entry.webcam)
  const cleanStreak = computeStreak(sorted, (entry) => !entry.mj && !entry.alcohol)

  const sleepEntries = last7Entries.filter((e) => e.sleep > 0)
  const stressEntries = last7Entries.filter((e) => e.stress > 0)

  const avgLevel = average(last7Entries.map((entry) => getDayLevel(entry, weights)))
  const redDaysLast7 = last7Entries.filter((e) => e.webcam).length
  const hasCleanWeek = redDaysLast7 === 0 && last7Entries.filter((e) => e.mj || e.alcohol).length === 0

  const weekInsight = redDaysLast7 > 0
    ? { text: `${redDaysLast7} критичн${redDaysLast7 === 1 ? 'ий' : 'их'} ${redDaysLast7 === 1 ? 'день' : 'дні'}. Тримаємо фокус.`, tone: 'rose' as const }
    : hasCleanWeek && last7Entries.length >= 5
      ? { text: 'Тиждень чистий. Серія тримається.', tone: 'green' as const }
      : avgLevel >= 8
        ? { text: 'Сильний тиждень. Формула говорить — в зоні.', tone: 'green' as const }
        : avgLevel >= 6
          ? { text: 'Стабільно. Є куди рости.', tone: 'blue' as const }
          : { text: 'Важкий тиждень. Але ти трекаєш — це вже крок.', tone: 'amber' as const }

  return {
    noWebcamStreak,
    cleanStreak,
    avgEnergy: average(last7Entries.map((entry) => entry.energy)),
    avgMood: average(last7Entries.map((entry) => entry.mood)),
    avgFocus: average(last7Entries.map((entry) => entry.focus)),
    avgLevel,
    avgDeepWork: average(last7Entries.map((entry) => entry.deepWork)),
    avgCraving: average(last7Entries.map((entry) => entry.craving)),
    avgSleep: sleepEntries.length ? average(sleepEntries.map((e) => e.sleep)) : null,
    avgStress: stressEntries.length ? average(stressEntries.map((e) => e.stress)) : null,
    workoutsLast7: last7Entries.filter((entry) => entry.workout).length,
    webcamLast30: last30Dates.filter((date) => entryMap.get(date)?.webcam).length,
    mjLast30: last30Dates.filter((date) => entryMap.get(date)?.mj).length,
    alcoholLast30: last30Dates.filter((date) => entryMap.get(date)?.alcohol).length,
    cleanDaysLast30: last30Dates.filter((date) => {
      const entry = entryMap.get(date)
      return Boolean(entry && !entry.webcam && !entry.mj && !entry.alcohol)
    }).length,
    trackedDaysLast7: last7Entries.length,
    last7Dates,
    weekInsight,
    trendEnergy: last7Dates.map((date) => entryMap.get(date)?.energy ?? 0),
    trendMood: last7Dates.map((date) => entryMap.get(date)?.mood ?? 0),
    trendFocus: last7Dates.map((date) => entryMap.get(date)?.focus ?? 0),
    trendLevel: last7Dates.map((date) => {
      const entry = entryMap.get(date)
      return entry ? getDayLevel(entry, weights) : 0
    }),
    toneLevel: last7Dates.map((date) => {
      const entry = entryMap.get(date)
      return entry ? getEntryTone(entry) : 'empty'
    }),
  }
}

export function buildWeeklyReview(entries: DailyEntry[], weights: FormulaWeights = DEFAULT_FORMULA_WEIGHTS) {
  const entryMap = new Map(entries.map((e) => [e.date, e]))
  const last7Dates = [...getLastNDates(7)].reverse()
  const last7Entries = last7Dates.map((d) => entryMap.get(d)).filter(Boolean) as DailyEntry[]

  if (last7Entries.length < 3) return null

  const redDays = last7Entries.filter((e) => e.webcam).length
  const yellowDays = last7Entries.filter((e) => !e.webcam && (e.mj || e.alcohol)).length
  const avgDeepWork = average(last7Entries.map((e) => e.deepWork))
  const avgCraving = average(last7Entries.map((e) => e.craving))
  const avgLevel = average(last7Entries.map((e) => getDayLevel(e, weights)))

  const sleepEntries = last7Entries.filter((e) => e.sleep > 0)
  const avgSleep = sleepEntries.length ? average(sleepEntries.map((e) => e.sleep)) : null

  const half = Math.floor(last7Entries.length / 2)
  const firstHalf = last7Entries.slice(0, half)
  const secondHalf = last7Entries.slice(half)

  const deepWorkTrend =
    firstHalf.length && secondHalf.length
      ? average(secondHalf.map((e) => e.deepWork)) - average(firstHalf.map((e) => e.deepWork))
      : 0

  const cravingTrend =
    firstHalf.length && secondHalf.length
      ? average(secondHalf.map((e) => e.craving)) - average(firstHalf.map((e) => e.craving))
      : 0

  const levelTrend =
    firstHalf.length && secondHalf.length
      ? average(secondHalf.map((e) => getDayLevel(e, weights))) -
        average(firstHalf.map((e) => getDayLevel(e, weights)))
      : 0

  return {
    redDays,
    yellowDays,
    avgDeepWork,
    avgCraving,
    avgLevel,
    avgSleep,
    deepWorkTrend,
    cravingTrend,
    levelTrend,
    trackedDays: last7Entries.length,
  }
}

export function getMissedDays(entries: DailyEntry[], lookbackDays = 30) {
  const entryMap = new Map(entries.map((e) => [e.date, e]))
  const today = todayKey()
  return getLastNDates(lookbackDays)
    .filter((date) => date < today)
    .filter((date) => !entryMap.has(date))
    .reverse()
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

export function buildHeatmapWeeks(entryMap: Map<string, DailyEntry>, totalWeeks = 12) {
  const today = todayKey()
  const currentWeekStart = getWeekStart(today)
  const firstWeekStart = shiftDate(currentWeekStart, -(totalWeeks - 1) * 7)

  return Array.from({ length: totalWeeks }, (_, weekIndex) => {
    const weekStart = shiftDate(firstWeekStart, weekIndex * 7)

    return Array.from({ length: 7 }, (_, dayIndex) => {
      const date = shiftDate(weekStart, dayIndex)
      const isFuture = date > today
      const entry = isFuture ? undefined : entryMap.get(date)

      return {
        date,
        entry,
        isFuture,
        tone: isFuture ? 'empty' : getEntryTone(entry),
      }
    })
  })
}

export function getPreviousDate(date: string) {
  return shiftDate(date, -1)
}

function clampToLevel(value: number) {
  return roundToTenth(Math.max(0, Math.min(10, value)))
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10
}
