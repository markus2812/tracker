import { useMemo } from 'react'
import { exportEntriesAsJson } from '../../lib/export'
import { formatLongDate, formatShortDate, isToday } from '../../lib/date'
import { createDefaultEntry, getPreviousDate, getRecoveryScore, getTodayFlags } from '../../lib/stats'
import type { DailyEntry } from '../../lib/schema'
import { Badge, Button, CameraIcon, Card, GlassIcon, LeafIcon, MicroStat, NumberInput, RangeField, ScoreDial, SectionHeader, SmokeIcon, TextArea, ToggleField, WalkIcon } from '../../components/ui'

type TodayScreenProps = {
  date: string
  entry?: DailyEntry
  previousEntry?: DailyEntry
  onChange: (entry: DailyEntry) => void
  onSave: () => void
  onJumpToToday: () => void
}

export function TodayScreen({ date, entry, previousEntry, onChange, onSave, onJumpToToday }: TodayScreenProps) {
  const currentEntry = useMemo(() => entry ?? createDefaultEntry(date), [date, entry])
  const flags = getTodayFlags(currentEntry, previousEntry)
  const recoveryScore = getRecoveryScore(currentEntry)

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Reset"
        title={isToday(date) ? 'Сьогодні' : formatShortDate(date)}
        action={
          <div className="flex gap-2">
            {!isToday(date) && (
              <Button variant="secondary" className="px-3.5 py-3" onClick={onJumpToToday}>
                Сьогодні
              </Button>
            )}
            <Button className="px-5 py-3" onClick={onSave}>
              Зберегти
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden px-4 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{formatLongDate(date)}</div>
              <div className="mt-2 text-[15px] leading-6 text-slate-300">Швидкий зріз: день був чистий, стабільний чи розхитаний.</div>
            </div>
            <Badge tone="neutral">офлайн</Badge>
          </div>

          <div className="grid grid-cols-[136px_minmax(0,1fr)] gap-3">
            <ScoreDial
              value={recoveryScore}
              label="рівень"
              tone={currentEntry.webcam ? 'rose' : currentEntry.mj || currentEntry.alcohol ? 'amber' : 'blue'}
            />
            <div className="grid grid-cols-1 gap-3">
              <MicroStat label="Стан" value={currentEntry.webcam ? 'Червоний' : currentEntry.mj || currentEntry.alcohol ? 'Увага' : 'Чисто'} hint={currentEntry.webcam ? 'критичний день' : currentEntry.mj || currentEntry.alcohol ? 'є ризики' : 'стабільно'} tone={currentEntry.webcam ? 'rose' : currentEntry.mj || currentEntry.alcohol ? 'amber' : 'green'} icon={currentEntry.webcam ? <CameraIcon /> : <WalkIcon />} />
              <div className="grid grid-cols-2 gap-3">
                <MicroStat label="Глибока робота" value={`${currentEntry.deepWork} хв`} tone={currentEntry.deepWork >= 60 ? 'green' : 'neutral'} />
                <MicroStat label="Потяг" value={`${currentEntry.craving}/10`} tone={currentEntry.craving >= 7 ? 'amber' : 'blue'} />
              </div>
            </div>
          </div>

          {flags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {flags.map((flag) => (
                <Badge key={flag.text} tone={flag.tone === 'red' ? 'red' : 'orange'}>
                  {flag.text}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge tone="green">Без критичних прапорців</Badge>
          )}
        </div>
      </Card>

      <Card className="space-y-5 p-5">
        <RangeField label="Енергія" value={currentEntry.energy} min={1} max={10} tone="blue" onChange={(value) => onChange({ ...currentEntry, energy: value })} />
        <RangeField label="Настрій" value={currentEntry.mood} min={1} max={10} tone="violet" onChange={(value) => onChange({ ...currentEntry, mood: value })} />
        <RangeField label="Фокус" value={currentEntry.focus} min={1} max={10} tone="cyan" onChange={(value) => onChange({ ...currentEntry, focus: value })} />
        <div className="space-y-2">
          <div className="text-[15px] font-medium text-slate-200">Хвилини глибокої роботи</div>
          <div className="grid grid-cols-[52px_52px_minmax(0,1fr)_52px_52px] gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...currentEntry, deepWork: Math.max(0, currentEntry.deepWork - 10) })}
              className="rounded-[18px] border border-blue-400/15 bg-blue-400/10 px-3 py-3 text-lg text-blue-300"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...currentEntry, deepWork: 0 })}
              className="rounded-[18px] border border-rose-400/15 bg-rose-400/10 px-3 py-3 text-sm text-rose-300"
            >
              0
            </button>
            <NumberInput
              type="number"
              min={0}
              inputMode="numeric"
              value={currentEntry.deepWork}
              onChange={(event) => onChange({ ...currentEntry, deepWork: Number(event.target.value) || 0 })}
            />
            <button
              type="button"
              onClick={() => onChange({ ...currentEntry, deepWork: currentEntry.deepWork + 10 })}
              className="rounded-[18px] border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-slate-100"
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...currentEntry, deepWork: currentEntry.deepWork + 30 })}
              className="rounded-[18px] border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-slate-100"
            >
              +30
            </button>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Вхідні дані</div>
        <ToggleField checked={currentEntry.workout} onChange={(value) => onChange({ ...currentEntry, workout: value })} label="Тренування або прогулянка" hint="добре" tone="good" icon={<WalkIcon />} />
        <ToggleField checked={currentEntry.webcam} onChange={(value) => onChange({ ...currentEntry, webcam: value })} label="Вебкам" hint="критично, ціль 0" tone="danger" icon={<CameraIcon />} />
        <ToggleField checked={currentEntry.mj} onChange={(value) => onChange({ ...currentEntry, mj: value })} label="MJ" hint="ризик" tone="warn" icon={<LeafIcon />} />
        <ToggleField checked={currentEntry.alcohol} onChange={(value) => onChange({ ...currentEntry, alcohol: value })} label="Алкоголь" hint="ризик" tone="warn" icon={<GlassIcon />} />
        <ToggleField
          checked={currentEntry.nicotineBefore12}
          onChange={(value) => onChange({ ...currentEntry, nicotineBefore12: value })}
          label="Нікотин до 12"
          hint="ризик"
          tone="warn"
          icon={<SmokeIcon />}
        />
        <RangeField label="Потяг" value={currentEntry.craving} min={0} max={10} tone="violet" onChange={(value) => onChange({ ...currentEntry, craving: value })} />
      </Card>

      <Card className="space-y-3 p-5">
        <div className="space-y-2">
          <div className="text-[15px] font-medium text-slate-200">Нотатки</div>
          <TextArea
            rows={3}
            maxLength={280}
            placeholder="Лише факти."
            value={currentEntry.notes}
            onChange={(event) => onChange({ ...currentEntry, notes: event.target.value })}
          />
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={exportEntriesAsJson}>
            Експорт JSON
          </Button>
        </div>
      </Card>

      <Card className="space-y-2 p-5">
        <div className="text-sm font-medium text-slate-200">Правила</div>
        <div className="text-sm text-slate-400">Вебкам = червоний день.</div>
        <div className="text-sm text-slate-400">MJ 2 дні поспіль = попередження.</div>
        <div className="text-sm text-slate-500">Попередній день: {formatShortDate(getPreviousDate(date))}</div>
      </Card>
    </div>
  )
}
