import { useMemo } from 'react'
import { Card, MicroStat, ScoreDial, SectionHeader, SparkLine } from '../../components/ui'
import { buildCorrelationInsights, buildDashboardMetrics, buildWeeklyGoalsProgress, buildWeeklyReview } from '../../lib/stats'
import type { CorrelationInsight, DayTone } from '../../lib/stats'
import type { DailyEntry, Settings } from '../../lib/schema'

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export function DashboardScreen({ entries, settings }: { entries: DailyEntry[]; settings: Settings }) {
  const metrics = useMemo(() => buildDashboardMetrics(entries, settings.formulaWeights), [entries, settings.formulaWeights])
  const weeklyReview = useMemo(() => buildWeeklyReview(entries, settings.formulaWeights), [entries, settings.formulaWeights])
  const goalsProgress = useMemo(() => buildWeeklyGoalsProgress(entries, settings.weeklyGoals), [entries, settings.weeklyGoals])
  const correlations = useMemo(() => buildCorrelationInsights(entries), [entries])

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <SectionHeader eyebrow="Reset" title="Огляд" />
        <div className="rounded-[28px] border border-white/8 bg-white/[0.02] px-6 py-14 text-center">
          <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-400">Ще немає даних</div>
          <div className="mt-2 text-sm text-slate-600">Заповни перший день у вкладці «Сьогодні».</div>
        </div>
      </div>
    )
  }

  const insightBg =
    metrics.weekInsight.tone === 'rose'
      ? 'border-rose-500/20 bg-[linear-gradient(180deg,rgba(80,20,35,0.7),rgba(18,22,33,0.88))]'
      : metrics.weekInsight.tone === 'green'
        ? 'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(10,60,40,0.7),rgba(18,22,33,0.88))]'
        : metrics.weekInsight.tone === 'amber'
          ? 'border-amber-400/20 bg-[linear-gradient(180deg,rgba(70,50,10,0.7),rgba(18,22,33,0.88))]'
          : 'border-blue-500/20 bg-[linear-gradient(180deg,rgba(20,34,75,0.7),rgba(18,22,33,0.88))]'

  const insightText =
    metrics.weekInsight.tone === 'rose' ? 'text-rose-200'
    : metrics.weekInsight.tone === 'green' ? 'text-emerald-200'
    : metrics.weekInsight.tone === 'amber' ? 'text-amber-200'
    : 'text-blue-200'

  return (
    <div className="stagger space-y-4">
      <SectionHeader eyebrow="Reset" title="Огляд" />

      {/* Insight banner */}
      <div className={`card-enter rounded-[28px] border px-5 py-4 ${insightBg}`}>
        <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Тиждень</div>
        <div className={`mt-1 text-[15px] font-medium leading-6 ${insightText}`}>{metrics.weekInsight.text}</div>
      </div>

      {/* Level + key stats */}
      <Card className="card-enter overflow-hidden p-4">
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
          <ScoreDial value={metrics.avgLevel} label="7 днів" tone={
            metrics.avgLevel >= 8 ? 'green' : metrics.avgLevel >= 6 ? 'blue' : metrics.avgLevel >= 4 ? 'amber' : 'rose'
          } />
          <div className="grid grid-cols-2 gap-2">
            <MicroStat
              label="Deep work"
              value={`${Math.round(metrics.avgDeepWork)} хв`}
              hint="середнє/день"
              tone={metrics.avgDeepWork >= 60 ? 'green' : 'neutral'}
            />
            <MicroStat
              label="Potяг"
              value={metrics.avgCraving.toFixed(1)}
              hint="тиск тижня"
              tone={metrics.avgCraving >= 7 ? 'rose' : metrics.avgCraving >= 4 ? 'amber' : 'neutral'}
            />
            <MicroStat
              label="Рух"
              value={`${metrics.workoutsLast7}/7`}
              hint="днів активних"
              tone={metrics.workoutsLast7 >= 4 ? 'green' : 'neutral'}
            />
            <MicroStat
              label="Записів"
              value={`${metrics.trackedDaysLast7}/7`}
              hint="трекінг тижня"
              tone={metrics.trackedDaysLast7 >= 5 ? 'green' : 'amber'}
            />
          </div>
        </div>
      </Card>

      {/* 7-day pulse */}
      <Card className="card-enter space-y-3 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">7-денний пульс</div>
        <div className="grid grid-cols-7 gap-1.5">
          {metrics.last7Dates.map((date, i) => {
            const level = metrics.trendLevel[i]
            const tone = metrics.toneLevel[i] as DayTone
            const hasEntry = level > 0
            return (
              <PulseDay
                key={date}
                label={DAY_LABELS[new Date(date + 'T12:00:00').getDay() === 0 ? 6 : new Date(date + 'T12:00:00').getDay() - 1]}
                level={level}
                tone={tone}
                hasEntry={hasEntry}
                isToday={i === 6}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />чисто</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />тригер</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />критичний</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white/15" />немає</span>
        </div>
      </Card>

      {/* Streaks */}
      <div className="card-enter grid grid-cols-2 gap-3">
        <StreakCard
          label="Без вебки"
          value={metrics.noWebcamStreak}
          unit="днів"
          tone={metrics.noWebcamStreak >= 7 ? 'green' : metrics.noWebcamStreak >= 3 ? 'blue' : 'neutral'}
        />
        <StreakCard
          label="Чиста серія"
          value={metrics.cleanStreak}
          unit="без MJ/алко"
          tone={metrics.cleanStreak >= 7 ? 'green' : metrics.cleanStreak >= 3 ? 'blue' : 'neutral'}
        />
      </div>

      {/* Trend charts */}
      <Card className="card-enter space-y-4 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Тренди 7 днів</div>
        <TrendRow label="Рівень" values={metrics.trendLevel} max={10} tone="blue" />
        <TrendRow label="Енергія" values={metrics.trendEnergy} max={10} tone="green" />
        <TrendRow label="Фокус" values={metrics.trendFocus} max={10} tone="amber" />
      </Card>

      {/* Weekly Goals */}
      <WeeklyGoalsSection goalsProgress={goalsProgress} />

      {/* Weekly review */}
      {weeklyReview ? <WeeklyReview review={weeklyReview} /> : null}

      {/* Correlations */}
      {correlations.length > 0 ? <CorrelationsSection insights={correlations} /> : null}

      {/* 30-day */}
      <Card className="card-enter space-y-3 p-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">За 30 днів</div>
        <div className="grid grid-cols-2 gap-2">
          <Stat30 label="Чистих" value={metrics.cleanDaysLast30} of={30} tone="green" />
          <Stat30 label="Вебкам" value={metrics.webcamLast30} of={30} tone="rose" invert />
          <Stat30 label="MJ" value={metrics.mjLast30} of={30} tone="amber" invert />
          <Stat30 label="Алкоголь" value={metrics.alcoholLast30} of={30} tone="amber" invert />
        </div>
      </Card>

      {/* Sleep / stress if tracked */}
      {(metrics.avgSleep !== null || metrics.avgStress !== null) ? (
        <div className="card-enter grid grid-cols-2 gap-3">
          {metrics.avgSleep !== null ? (
            <MicroStat
              label="Середній сон"
              value={`${metrics.avgSleep.toFixed(1)}г`}
              hint="за 7 днів"
              tone={metrics.avgSleep < 6 ? 'amber' : 'green'}
            />
          ) : null}
          {metrics.avgStress !== null ? (
            <MicroStat
              label="Середній стрес"
              value={metrics.avgStress.toFixed(1)}
              hint="за 7 днів"
              tone={metrics.avgStress >= 7 ? 'rose' : 'neutral'}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PulseDay({
  label,
  level,
  tone,
  hasEntry,
  isToday,
}: {
  label: string
  level: number
  tone: DayTone
  hasEntry: boolean
  isToday: boolean
}) {
  const bg = tone === 'red'
    ? 'bg-rose-500/80 border-rose-400/30'
    : tone === 'yellow'
      ? 'bg-amber-400/80 border-amber-300/30'
      : tone === 'green'
        ? 'bg-emerald-500/80 border-emerald-400/30'
        : 'bg-white/[0.06] border-white/8'

  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-[18px] border py-3 transition ${bg} ${isToday ? 'ring-1 ring-white/25' : ''}`}>
      <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">{label}</span>
      <span className={`text-[15px] font-semibold leading-none tracking-[-0.03em] ${hasEntry ? 'text-white' : 'text-white/20'}`}>
        {hasEntry ? level.toFixed(1) : '·'}
      </span>
    </div>
  )
}

function StreakCard({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: number
  unit: string
  tone: 'neutral' | 'blue' | 'green'
}) {
  const bg =
    tone === 'green' ? 'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(10,60,40,0.6),rgba(18,22,33,0.85))]'
    : tone === 'blue' ? 'border-blue-500/15 bg-[linear-gradient(180deg,rgba(20,34,75,0.55),rgba(18,22,33,0.85))]'
    : 'border-white/8 bg-[linear-gradient(180deg,rgba(26,31,43,0.9),rgba(18,22,33,0.88))]'

  const numColor = tone === 'green' ? 'text-emerald-300' : tone === 'blue' ? 'text-blue-300' : 'text-slate-100'

  return (
    <div className={`rounded-[28px] border p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl ${bg}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-2 text-[38px] font-semibold leading-none tracking-[-0.06em] ${numColor}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{unit}</div>
    </div>
  )
}

function TrendRow({
  label,
  values,
  max,
  tone,
}: {
  label: string
  values: number[]
  max: number
  tone: 'blue' | 'green' | 'amber'
}) {
  const filled = values.filter((v) => v > 0)
  const avg = filled.length ? filled.reduce((s, v) => s + v, 0) / filled.length : 0
  const textColor = tone === 'green' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : 'text-blue-300'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-sm font-semibold ${textColor}`}>{avg.toFixed(1)}<span className="text-[11px] font-normal text-slate-600">/{max}</span></span>
      </div>
      <SparkLine values={values} max={max} tone={tone} />
    </div>
  )
}

function Stat30({
  label,
  value,
  of,
  tone,
  invert,
}: {
  label: string
  value: number
  of: number
  tone: 'green' | 'rose' | 'amber'
  invert?: boolean
}) {
  const pct = Math.round((value / of) * 100)
  const isGood = invert ? value === 0 : pct >= 60
  const isBad = invert ? value >= 5 : pct < 30
  const numColor = isGood ? 'text-emerald-300' : isBad ? 'text-rose-300' : 'text-amber-300'
  const barColor = tone === 'green' ? 'bg-emerald-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-amber-400'

  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <span className={`text-sm font-semibold ${numColor}`}>{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%`, opacity: 0.8 }}
        />
      </div>
    </div>
  )
}

type WeeklyReviewData = ReturnType<typeof buildWeeklyReview>

function WeeklyReview({ review }: { review: NonNullable<WeeklyReviewData> }) {
  const arrow = (v: number) => v > 0.5 ? '↑' : v < -0.5 ? '↓' : '→'
  const tone = (v: number, good: boolean) => {
    if (Math.abs(v) < 0.5) return 'text-slate-400'
    return (v > 0) === good ? 'text-emerald-300' : 'text-rose-300'
  }

  return (
    <Card className="card-enter overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.08),transparent_40%)]" />
      <div className="relative space-y-3">
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Автосумарій</div>
        <div className="space-y-1.5">
          <ReviewRow label="Записів" value={`${review.trackedDays}/7`} color={review.trackedDays >= 5 ? 'text-emerald-300' : 'text-amber-300'} />
          {review.redDays > 0 && <ReviewRow label="Критичних" value={String(review.redDays)} color="text-rose-300" />}
          {review.yellowDays > 0 && <ReviewRow label="Тригерів" value={String(review.yellowDays)} color="text-amber-300" />}
          <ReviewRow label={`Рівень ${arrow(review.levelTrend)}`} value={review.avgLevel.toFixed(1)} color={tone(review.levelTrend, true)} />
          <ReviewRow label={`Deep work ${arrow(review.deepWorkTrend)}`} value={`${Math.round(review.avgDeepWork)} хв`} color={tone(review.deepWorkTrend, true)} />
          <ReviewRow label={`Потяг ${arrow(review.cravingTrend)}`} value={review.avgCraving.toFixed(1)} color={tone(review.cravingTrend, false)} />
          {review.avgSleep !== null && (
            <ReviewRow label="Сон" value={`${review.avgSleep.toFixed(1)}г`} color={review.avgSleep < 6 ? 'text-amber-300' : 'text-emerald-300'} />
          )}
        </div>
      </div>
    </Card>
  )
}

function ReviewRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-white/6 bg-white/[0.02] px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}

type GoalsProgress = ReturnType<typeof buildWeeklyGoalsProgress>

function WeeklyGoalsSection({ goalsProgress }: { goalsProgress: GoalsProgress }) {
  const { workoutDays, deepWorkMinutes, cleanDays } = goalsProgress
  const hasAnyGoal = workoutDays.goal > 0 || deepWorkMinutes.goal > 0 || cleanDays.goal > 0
  if (!hasAnyGoal) return null

  return (
    <Card className="card-enter space-y-3 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Цілі тижня</div>
      {workoutDays.goal > 0 && (
        <GoalRow label="Тренування" current={workoutDays.current} goal={workoutDays.goal} unit="днів" barColor="bg-emerald-500" />
      )}
      {deepWorkMinutes.goal > 0 && (
        <GoalRow label="Deep work" current={deepWorkMinutes.current} goal={deepWorkMinutes.goal} unit="хв/день" barColor="bg-blue-400" />
      )}
      {cleanDays.goal > 0 && (
        <GoalRow label="Чистих" current={cleanDays.current} goal={cleanDays.goal} unit="днів" barColor="bg-violet-400" />
      )}
    </Card>
  )
}

function GoalRow({
  label,
  current,
  goal,
  unit,
  barColor,
}: {
  label: string
  current: number
  goal: number
  unit: string
  barColor: string
}) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0)
  const done = current >= goal

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className={`text-sm font-semibold ${done ? 'text-emerald-300' : 'text-slate-300'}`}>
          {current}
          <span className="font-normal text-slate-600">/{goal} {unit}</span>
          {done ? <span className="ml-1 text-emerald-400">✓</span> : null}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%`, opacity: 0.85 }} />
      </div>
    </div>
  )
}

function CorrelationsSection({ insights }: { insights: CorrelationInsight[] }) {
  return (
    <Card className="card-enter space-y-2.5 p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Кореляції</div>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-[16px] border px-3 py-2.5 ${
            insight.tone === 'green'
              ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
              : insight.tone === 'amber'
                ? 'border-amber-400/20 bg-amber-400/[0.06]'
                : 'border-white/8 bg-white/[0.02]'
          }`}
        >
          <div
            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
              insight.tone === 'green' ? 'bg-emerald-400' : insight.tone === 'amber' ? 'bg-amber-400' : 'bg-slate-500'
            }`}
          />
          <span className="text-sm text-slate-300">{insight.text}</span>
        </div>
      ))}
      <div className="text-[11px] text-slate-600">На основі всіх записів</div>
    </Card>
  )
}
