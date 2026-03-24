import { Fragment } from 'react'
import { Badge, Button, Card, HeroPanel, MicroStat, ScoreDial, SectionHeader, StatStrip } from '../../components/ui'
import { formatLongDate, formatShortDate } from '../../lib/date'
import { buildHeatmapWeeks, getDayLevel, getEntryTone, getMissedDays } from '../../lib/stats'
import type { DailyEntry } from '../../lib/schema'

type HeatmapScreenProps = {
  entries: DailyEntry[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  onEditDate: (date: string) => void
}

const weekdayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

export function HeatmapScreen({ entries, selectedDate, onSelectDate, onEditDate }: HeatmapScreenProps) {
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]))
  const weeks = buildHeatmapWeeks(entryMap, 12)
  const days = weeks.flat()
  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : undefined
  const cleanCount = days.filter((day) => day.tone === 'green').length
  const warnCount = days.filter((day) => day.tone === 'yellow').length
  const redCount = days.filter((day) => day.tone === 'red').length
  const missedDays = getMissedDays(entries, 30)

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Reset" title="Теплокарта" />

      <HeroPanel
        eyebrow="12 тижнів"
        title={`${cleanCount}`}
        subtitle="Зелений = чисто. Жовтий = MJ або алкоголь. Червоний = вебкам. Тап по дню відкриває деталі."
      >
        <StatStrip
          items={[
            { label: 'Чисто', value: String(cleanCount), tone: 'green' },
            { label: 'Увага', value: String(warnCount), tone: 'amber' },
            { label: 'Червоні', value: String(redCount), tone: 'rose' },
          ]}
        />
      </HeroPanel>

      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Сітка 12 тижнів</div>
          <div className="text-xs text-slate-500">тапни день, щоб перейти в деталі</div>
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: `40px repeat(${weeks.length}, minmax(0, 1fr))` }}>
          <div />
          {weeks.map((week) => (
            <div key={week[0].date} className="text-center text-[10px] uppercase tracking-[0.16em] text-slate-600">
              {formatShortDate(week[0].date)}
            </div>
          ))}

          {weekdayLabels.map((label, rowIndex) => (
            <Fragment key={label}>
              <div className="flex items-center text-[11px] uppercase tracking-[0.16em] text-slate-600">{label}</div>
              {weeks.map((week) => {
                const day = week[rowIndex]
                const isSelected = selectedDate === day.date

                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={day.isFuture}
                    onClick={() => onSelectDate(day.date)}
                    title={day.date}
                    className={`aspect-square rounded-[14px] border transition ${
                      day.isFuture
                        ? 'cursor-default border-white/4 bg-white/[0.02] opacity-35'
                        : getDayClassName(day.tone)
                    } ${isSelected ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-[#0b1020]' : ''}`}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <LegendSwatch tone="empty" label="порожньо" />
          <LegendSwatch tone="green" label="чисто" />
          <LegendSwatch tone="yellow" label="MJ або алкоголь" />
          <LegendSwatch tone="red" label="вебкам" />
        </div>
      </Card>

      {missedDays.length > 0 ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-100">Пропущені дні</div>
              <div className="text-xs text-slate-500">{missedDays.length} без запису за останні 30 днів</div>
            </div>
          </div>
          <div className="space-y-1.5">
            {missedDays.slice(0, 10).map((date) => (
              <div key={date} className="flex items-center justify-between rounded-[16px] border border-white/6 bg-white/[0.02] px-3 py-2">
                <span className="text-sm text-slate-400">{formatLongDate(date)}</span>
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => onEditDate(date)}>
                  Заповнити
                </Button>
              </div>
            ))}
            {missedDays.length > 10 ? (
              <div className="px-3 py-2 text-xs text-slate-600">
                ...ще {missedDays.length - 10} пропущених
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {selectedDate ? (
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-100">{formatLongDate(selectedDate)}</div>
              <div className="text-xs text-slate-500">деталі обраного дня</div>
            </div>
            <Badge tone={mapTone(getEntryTone(selectedEntry))}>{selectedEntry ? 'є запис' : 'порожньо'}</Badge>
          </div>

          {selectedEntry ? (
            <>
              <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3">
                <ScoreDial value={getDayLevel(selectedEntry)} label="level" tone={mapScoreTone(getEntryTone(selectedEntry))} size={112} />
                <div className="grid grid-cols-2 gap-3">
                  <MicroStat label="Енергія" value={String(selectedEntry.energy)} tone="blue" />
                  <MicroStat label="Настрій" value={String(selectedEntry.mood)} tone="green" />
                  <MicroStat label="Фокус" value={String(selectedEntry.focus)} tone="amber" />
                  <MicroStat label="Deep work" value={`${selectedEntry.deepWork} хв`} tone="neutral" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <ReadOnlyStat label="Потяг" value={selectedEntry.craving} />
                <ReadOnlyStat label="Рух" value={selectedEntry.workout ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="Вебкам" value={selectedEntry.webcam ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="MJ" value={selectedEntry.mj ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="Алкоголь" value={selectedEntry.alcohol ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="Нікотин до 12" value={selectedEntry.nicotineBefore12 ? 'Так' : 'Ні'} />
              </div>

              {selectedEntry.notes ? <div className="text-sm leading-6 text-slate-400">{selectedEntry.notes}</div> : null}

              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => onSelectDate(null)}>
                  Закрити
                </Button>
                <Button onClick={() => onEditDate(selectedDate)}>Редагувати день</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-slate-400">Для цієї дати ще немає запису.</div>
              <div className="flex justify-between gap-2">
                <Button variant="secondary" onClick={() => onSelectDate(null)}>
                  Закрити
                </Button>
                <Button onClick={() => onEditDate(selectedDate)}>Створити запис</Button>
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}

function ReadOnlyStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}

function LegendSwatch({ tone, label }: { tone: 'empty' | 'green' | 'yellow' | 'red'; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
      <span className={`h-3 w-3 rounded-full ${getLegendClassName(tone)}`} />
      <span>{label}</span>
    </div>
  )
}

function getDayClassName(tone: 'empty' | 'green' | 'yellow' | 'red') {
  if (tone === 'green') return 'border-emerald-300/10 bg-emerald-500/85'
  if (tone === 'yellow') return 'border-amber-300/10 bg-amber-400/85'
  if (tone === 'red') return 'border-rose-300/10 bg-rose-500/85'
  return 'border-white/6 bg-white/[0.05]'
}

function getLegendClassName(tone: 'empty' | 'green' | 'yellow' | 'red') {
  if (tone === 'green') return 'bg-emerald-500'
  if (tone === 'yellow') return 'bg-amber-400'
  if (tone === 'red') return 'bg-rose-500'
  return 'bg-white/25'
}

function mapTone(tone: 'empty' | 'green' | 'yellow' | 'red'): 'neutral' | 'green' | 'orange' | 'red' {
  if (tone === 'green') return 'green'
  if (tone === 'yellow') return 'orange'
  if (tone === 'red') return 'red'
  return 'neutral'
}

function mapScoreTone(tone: 'empty' | 'green' | 'yellow' | 'red'): 'blue' | 'green' | 'amber' | 'rose' {
  if (tone === 'green') return 'green'
  if (tone === 'yellow') return 'amber'
  if (tone === 'red') return 'rose'
  return 'blue'
}
