import { Card, HeroPanel, MetricCard, MicroStat, RingMetric, ScoreDial, SectionHeader, SparkBars, StatStrip } from '../../components/ui'
import { buildDashboardMetrics } from '../../lib/stats'
import type { DailyEntry } from '../../lib/schema'

export function DashboardScreen({ entries }: { entries: DailyEntry[] }) {
  const metrics = buildDashboardMetrics(entries)

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Reset" title="Огляд" />
      <HeroPanel eyebrow="Стан за тиждень" title={`${metrics.avgRecovery.toFixed(1)}/10`} subtitle="Середній сигнал відновлення за 7 днів: настрій, енергія, фокус, чисті входи та хвилини глибокої роботи.">
        <StatStrip
          items={[
            { label: 'Без вебки', value: `${metrics.noWebcamStreak}д`, tone: 'green' },
            { label: 'Чисто', value: `${metrics.cleanStreak}д`, tone: 'blue' },
            { label: 'Рух 7д', value: String(metrics.workoutsLast7), tone: 'amber' },
          ]}
        />
      </HeroPanel>

      <Card className="overflow-hidden p-4">
        <div className="grid grid-cols-[136px_minmax(0,1fr)] gap-3">
          <ScoreDial value={metrics.avgRecovery} label="тиждень" tone="blue" />
          <div className="grid grid-cols-2 gap-3">
            <MicroStat label="Енергія" value={metrics.avgEnergy.toFixed(1)} hint="середнє 7д" tone="blue" />
            <MicroStat label="Настрій" value={metrics.avgMood.toFixed(1)} hint="середнє 7д" tone="green" />
            <MicroStat label="Фокус" value={metrics.avgFocus.toFixed(1)} hint="середнє 7д" tone="amber" />
            <MicroStat label="Рух 7д" value={String(metrics.workoutsLast7)} hint="кількість" tone="neutral" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        <RingMetric label="Енергія" value={metrics.avgEnergy} max={10} hint="Середня енергія за останні 7 днів." tone="blue" size={96} />
        <RingMetric label="Настрій" value={metrics.avgMood} max={10} hint="Середній настрій за останні 7 днів." tone="green" size={96} />
        <RingMetric label="Фокус" value={metrics.avgFocus} max={10} hint="Середній фокус за останні 7 днів." tone="amber" size={96} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Серія без вебки" value={String(metrics.noWebcamStreak)} hint="днів" accent="green" />
        <MetricCard label="Чиста серія" value={String(metrics.cleanStreak)} hint="без MJ + без алкоголю" accent="blue" />
        <MetricCard label="Тренування / прогулянки" value={String(metrics.workoutsLast7)} hint="останні 7 днів" accent="amber" />
        <MetricCard label="Дні з вебкою" value={String(metrics.webcamLast30)} hint="останні 30 днів" accent="rose" />
        <MetricCard label="Дні з MJ" value={String(metrics.mjLast30)} hint="останні 30 днів" accent="amber" />
        <MetricCard label="Сер. відновлення" value={metrics.avgRecovery.toFixed(1)} hint="останні 7 днів" accent="blue" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <MetricTrend title="Тренд енергії" values={metrics.trendEnergy} tone="blue" />
        <MetricTrend title="Тренд настрою" values={metrics.trendMood} tone="green" />
        <MetricTrend title="Тренд фокусу" values={metrics.trendFocus} tone="amber" />
      </div>
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
  return (
    <MetricCard
      label={title}
      value={values.filter(Boolean).length ? `${(values.reduce((sum, value) => sum + value, 0) / values.filter(Boolean).length).toFixed(1)}` : '0.0'}
      hint="останні 7 днів"
      accent={tone === 'blue' ? 'blue' : tone === 'green' ? 'green' : 'amber'}
    >
      <SparkBars values={values.map((value) => (value === 0 ? 1 : value))} tone={tone} />
    </MetricCard>
  )
}
