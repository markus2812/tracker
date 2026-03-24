import { Badge, Button, Card, HeroPanel, SectionHeader, StatStrip } from '../../components/ui'
import { buildHeatmapDays, getEntryTone } from '../../lib/stats'
import { formatLongDate } from '../../lib/date'
import type { DailyEntry } from '../../lib/schema'

type HeatmapScreenProps = {
  entries: DailyEntry[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  onEditDate: (date: string) => void
}

export function HeatmapScreen({ entries, selectedDate, onSelectDate, onEditDate }: HeatmapScreenProps) {
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]))
  const days = buildHeatmapDays(entryMap, 84)
  const selectedEntry = selectedDate ? entryMap.get(selectedDate) : undefined
  const cleanCount = days.filter((day) => day.tone === 'green').length
  const warnCount = days.filter((day) => day.tone === 'yellow').length
  const redCount = days.filter((day) => day.tone === 'red').length

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Reset" title="Теплокарта" />
      <HeroPanel eyebrow="Останні 84 дні" title={`${cleanCount}`} subtitle="Зелені дні були чисті й без вебки. Жовті означають MJ або алкоголь. Червоні означають вебкам.">
        <StatStrip
          items={[
            { label: 'Чисто', value: String(cleanCount), tone: 'green' },
            { label: 'Увага', value: String(warnCount), tone: 'amber' },
            { label: 'Червоні', value: String(redCount), tone: 'rose' },
          ]}
        />
      </HeroPanel>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">12 тижнів</div>
          <div className="text-xs text-slate-500">натисни на будь-який день</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              title={day.date}
              className={`aspect-square rounded-xl border border-white/6 transition ${
                day.tone === 'green'
                  ? 'bg-emerald-500/85'
                  : day.tone === 'yellow'
                    ? 'bg-amber-400/85'
                    : day.tone === 'red'
                      ? 'bg-rose-500/85'
                      : 'bg-white/[0.05]'
              } ${selectedDate === day.date ? 'ring-2 ring-white/70' : ''}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          <Badge tone="green">чисто</Badge>
          <Badge tone="orange">MJ або алкоголь</Badge>
          <Badge tone="red">вебкам</Badge>
        </div>
      </Card>

      {selectedDate && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-100">{formatLongDate(selectedDate)}</div>
              <div className="text-xs text-slate-500">деталі дня</div>
            </div>
            <Badge tone={mapTone(getEntryTone(selectedEntry))}>{selectedEntry ? 'збережено' : 'порожньо'}</Badge>
          </div>

          {selectedEntry ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <ReadOnlyStat label="Енергія" value={selectedEntry.energy} />
                <ReadOnlyStat label="Настрій" value={selectedEntry.mood} />
                <ReadOnlyStat label="Фокус" value={selectedEntry.focus} />
                <ReadOnlyStat label="Потяг" value={selectedEntry.craving} />
                <ReadOnlyStat label="Глибока робота" value={selectedEntry.deepWork} />
                <ReadOnlyStat label="Рух" value={selectedEntry.workout ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="Вебкам" value={selectedEntry.webcam ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="MJ" value={selectedEntry.mj ? 'Так' : 'Ні'} />
                <ReadOnlyStat label="Алкоголь" value={selectedEntry.alcohol ? 'Так' : 'Ні'} />
              </div>
              {selectedEntry.notes ? <div className="text-sm text-slate-400">{selectedEntry.notes}</div> : null}
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
      )}
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

function mapTone(tone: 'empty' | 'green' | 'yellow' | 'red'): 'neutral' | 'green' | 'orange' | 'red' {
  if (tone === 'green') return 'green'
  if (tone === 'yellow') return 'orange'
  if (tone === 'red') return 'red'
  return 'neutral'
}
