import {
  Card,
  HeroPanel,
  MetricCard,
  MicroStat,
  RingMetric,
  ScoreDial,
  SectionHeader,
  SparkBars,
  StatStrip,
} from '../../components/ui'
import { buildDashboardMetrics, buildWeeklyReview } from '../../lib/stats'
import type { DailyEntry, Settings } from '../../lib/schema'

export function DashboardScreen({ entries, settings }: { entries: DailyEntry[]; settings: Settings }) {
  const metrics = buildDashboardMetrics(entries, settings.formulaWeights)
  const weeklyReview = buildWeeklyReview(entries, settings.formulaWeights)

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Reset" title="Огляд" />

      <HeroPanel
        eyebrow="Рівень за 7 днів"
        title={`${metrics.avgLevel.toFixed(1)}/10`}
        subtitle="Та сама формула, що й у Today: старт 10, штрафи за вебкам/MJ/алкоголь, бонус за рух і deep work."
      >
        <StatStrip
          items={[
            { label: 'Записів 7д', value: String(metrics.trackedDaysLast7), tone: 'blue' },
            { label: 'Без вебки', value: `${metrics.noWebcamStreak}д`, tone: 'green' },
            { label: 'Чисто', value: `${metrics.cleanStreak}д`, tone: 'amber' },
          ]}
        />
      </HeroPanel>

      <Card className="overflow-hidden p-4">
        <div className="grid grid-cols-[136px_minmax(0,1fr)] gap-3">
          <ScoreDial value={metrics.avgLevel} label="week" tone="blue" />
          <div className="grid grid-cols-2 gap-3">
            <MicroStat label="Deep work" value={`${Math.round(metrics.avgDeepWork)} хв`} hint="середнє 7д" tone="green" />
            <MicroStat label="Craving" value={metrics.avgCraving.toFixed(1)} hint="середнє 7д" tone="amber" />
            <MicroStat label="Рух 7д" value={String(metrics.workoutsLast7)} hint="днів з тілом" tone="blue" />
            <MicroStat label="Чисті 30д" value={String(metrics.cleanDaysLast30)} hint="без вебки/MJ/алко" tone="neutral" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <RingMetric
          label="Середній рівень"
          value={metrics.avgLevel}
          max={10}
          hint="Тижневий рівень за прозорою формулою."
          tone="blue"
          size={96}
        />
        <RingMetric
          label="Середній deep work"
          value={metrics.avgDeepWork}
          max={240}
          hint="Хвилини глибокої роботи за день. Кап у формулі: +2."
          tone="green"
          size={96}
        />
        <RingMetric
          label="Середній craving"
          value={metrics.avgCraving}
          max={10}
          hint="Потряг не входить у рівень, але окремо показує тиск."
          tone="rose"
          size={96}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Серія без вебки" value={String(metrics.noWebcamStreak)} hint="днів" accent="green" />
        <MetricCard label="Чиста серія" value={String(metrics.cleanStreak)} hint="без MJ + алкоголю" accent="blue" />
        <MetricCard label="Дні з рухом" value={String(metrics.workoutsLast7)} hint="останні 7 днів" accent="amber" />
        <MetricCard label="Вебкам 30д" value={String(metrics.webcamLast30)} hint="критичні дні" accent="rose" />
        <MetricCard label="MJ 30д" value={String(metrics.mjLast30)} hint="ризикові дні" accent="amber" />
        <MetricCard label="Алко 30д" value={String(metrics.alcoholLast30)} hint="ризикові дні" accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MetricTrend title="Тренд рівня" values={metrics.trendLevel} tone="blue" />
        <MetricTrend title="Тренд енергії" values={metrics.trendEnergy} tone="green" />
        <MetricTrend title="Тренд фокусу" values={metrics.trendFocus} tone="amber" />
      </div>

      {weeklyReview ? <WeeklyReview review={weeklyReview} /> : null}

      {metrics.avgSleep !== null || metrics.avgStress !== null ? (
        <div className="grid grid-cols-2 gap-3">
          {metrics.avgSleep !== null ? (
            <MetricCard
              label="Середній сон"
              value={`${metrics.avgSleep.toFixed(1)}г`}
              hint="за 7 днів з даними"
              accent={metrics.avgSleep < 6 ? 'amber' : 'green'}
            />
          ) : null}
          {metrics.avgStress !== null ? (
            <MetricCard
              label="Середній стрес"
              value={metrics.avgStress.toFixed(1)}
              hint="за 7 днів з даними"
              accent={metrics.avgStress >= 7 ? 'rose' : 'neutral'}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function MetricTrend({
  title,
  values,
  tone,
}: {
  title: string
  values: number[]
  tone: 'blue' | 'green' | 'amber'
}) {
  const filledValues = values.filter((value) => value > 0)
  const averageValue = filledValues.length ? filledValues.reduce((sum, value) => sum + value, 0) / filledValues.length : 0

  return (
    <MetricCard
      label={title}
      value={averageValue.toFixed(1)}
      hint="останні 7 днів"
      accent={tone === 'blue' ? 'blue' : tone === 'green' ? 'green' : 'amber'}
    >
      <SparkBars values={values.map((value) => (value === 0 ? 1 : value))} tone={tone} />
    </MetricCard>
  )
}

type WeeklyReviewData = ReturnType<typeof buildWeeklyReview>

function WeeklyReview({ review }: { review: NonNullable<WeeklyReviewData> }) {
  const trendArrow = (v: number) => (v > 0.5 ? '↑' : v < -0.5 ? '↓' : '→')
  const trendTone = (v: number, positiveIsGood: boolean) => {
    if (Math.abs(v) < 0.5) return 'text-slate-400'
    const isPositive = v > 0
    return (isPositive === positiveIsGood) ? 'text-emerald-300' : 'text-rose-300'
  }

  return (
    <Card className="overflow-hidden p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.1),transparent_40%)]" />
      <div className="relative space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Тижневий огляд</div>
          <div className="mt-1 text-[15px] font-medium text-slate-100">Автосумарій за 7 днів</div>
        </div>

        <div className="space-y-2 text-sm">
          <ReviewLine
            label="Записів"
            value={`${review.trackedDays}/7`}
            tone={review.trackedDays >= 5 ? 'text-emerald-300' : 'text-amber-300'}
          />
          {review.redDays > 0 ? (
            <ReviewLine
              label="Червоних днів"
              value={String(review.redDays)}
              tone="text-rose-300"
            />
          ) : null}
          {review.yellowDays > 0 ? (
            <ReviewLine
              label="Жовтих днів"
              value={String(review.yellowDays)}
              tone="text-amber-300"
            />
          ) : null}
          <ReviewLine
            label={`Рівень ${trendArrow(review.levelTrend)}`}
            value={review.avgLevel.toFixed(1)}
            tone={trendTone(review.levelTrend, true)}
          />
          <ReviewLine
            label={`Deep work ${trendArrow(review.deepWorkTrend)}`}
            value={`${Math.round(review.avgDeepWork)} хв/день`}
            tone={trendTone(review.deepWorkTrend, true)}
          />
          <ReviewLine
            label={`Потяг ${trendArrow(review.cravingTrend)}`}
            value={review.avgCraving.toFixed(1)}
            tone={trendTone(review.cravingTrend, false)}
          />
          {review.avgSleep !== null ? (
            <ReviewLine
              label="Сон середнє"
              value={`${review.avgSleep.toFixed(1)}г`}
              tone={review.avgSleep < 6 ? 'text-amber-300' : 'text-emerald-300'}
            />
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function ReviewLine({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between rounded-[16px] border border-white/6 bg-white/[0.02] px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${tone}`}>{value}</span>
    </div>
  )
}
