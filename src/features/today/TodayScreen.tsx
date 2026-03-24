import { useMemo } from 'react'
import {
  Badge,
  Button,
  CameraIcon,
  Card,
  GlassIcon,
  LeafIcon,
  MicroStat,
  RangeField,
  ScoreDial,
  SectionHeader,
  SmokeIcon,
  TextArea,
  ToggleField,
  WalkIcon,
} from '../../components/ui'
import { formatLongDate, formatShortDate, isToday } from '../../lib/date'
import { exportEntriesAsJson } from '../../lib/export'
import {
  createDefaultEntry,
  getDayLevel,
  getDayLevelBreakdown,
  getDayState,
  getPreviousDate,
  getTodayFlags,
} from '../../lib/stats'
import type { DailyEntry } from '../../lib/schema'

type TodayScreenProps = {
  date: string
  entry?: DailyEntry
  previousEntry?: DailyEntry
  syncState: 'offline' | 'syncing' | 'online'
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onChange: (entry: DailyEntry) => void
  onSave: () => void
  onJumpToToday: () => void
}

export function TodayScreen({
  date,
  entry,
  previousEntry,
  syncState,
  saveState,
  onChange,
  onSave,
  onJumpToToday,
}: TodayScreenProps) {
  const currentEntry = useMemo(() => entry ?? createDefaultEntry(date), [date, entry])
  const flags = getTodayFlags(currentEntry, previousEntry)
  const dayState = getDayState(currentEntry)
  const level = getDayLevel(currentEntry)
  const levelBreakdown = getDayLevelBreakdown(currentEntry)

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow="Reset"
        title={isToday(date) ? 'Сьогодні' : formatShortDate(date)}
        action={
          <div className="flex items-center gap-2">
            {!isToday(date) ? (
              <Button variant="secondary" className="px-3.5 py-2.5" onClick={onJumpToToday}>
                Сьогодні
              </Button>
            ) : null}
            <Badge tone={mapSaveTone(saveState)}>{mapSaveLabel(saveState)}</Badge>
            <Button
              variant="secondary"
              className="px-4 py-2.5"
              disabled={saveState === 'saving'}
              onClick={onSave}
            >
              Save
            </Button>
          </div>
        }
      />

      {currentEntry.webcam ? (
        <Card className="overflow-hidden border-rose-400/20 bg-[linear-gradient(180deg,rgba(92,19,37,0.94),rgba(44,10,22,0.9))] px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-300/15 bg-rose-400/10 text-rose-200">
              <CameraIcon />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-rose-100">День критичний. Завтра - NO MJ.</div>
              <div className="mt-1 text-sm leading-6 text-rose-100/75">
                Не героїзм, а мʼякий план відкату: сон, вода, прогулянка, без зайвих тригерів.
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden px-4 py-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.16),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)]" />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{formatLongDate(date)}</div>
              <div className="mt-2 text-[15px] leading-6 text-slate-300">
                Summary дня: стан, рівень, deep work і потяг без зайвої магії.
              </div>
            </div>
            <Badge tone={syncState === 'online' ? 'green' : syncState === 'syncing' ? 'orange' : 'neutral'}>
              {syncState === 'online' ? 'sync' : syncState === 'syncing' ? 'syncing' : 'local'}
            </Badge>
          </div>

          <div className="grid grid-cols-[136px_minmax(0,1fr)] gap-3">
            <ScoreDial value={level} label="level" tone={dayState.tone} />
            <div className="grid grid-cols-1 gap-3">
              <MicroStat
                label="Стан дня"
                value={dayState.label}
                hint={dayState.hint}
                tone={dayState.tone}
                icon={currentEntry.webcam ? <CameraIcon /> : currentEntry.workout ? <WalkIcon /> : <LeafIcon />}
              />
              <div className="grid grid-cols-2 gap-3">
                <MicroStat
                  label="Deep work"
                  value={`${currentEntry.deepWork} хв`}
                  hint={levelBreakdown.deepWorkBonus ? `+${levelBreakdown.deepWorkBonus} до рівня` : 'без бонусу'}
                  tone={currentEntry.deepWork >= 60 ? 'green' : 'neutral'}
                />
                <MicroStat
                  label="Craving"
                  value={`${currentEntry.craving}/10`}
                  hint={currentEntry.craving >= 7 ? 'потрібен буфер' : 'контрольований'}
                  tone={currentEntry.craving >= 7 ? 'amber' : 'blue'}
                />
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
        <RangeField
          label="Енергія"
          value={currentEntry.energy}
          min={1}
          max={10}
          tone="blue"
          onChange={(value) => onChange({ ...currentEntry, energy: value })}
        />
        <RangeField
          label="Настрій"
          value={currentEntry.mood}
          min={1}
          max={10}
          tone="violet"
          onChange={(value) => onChange({ ...currentEntry, mood: value })}
        />
        <RangeField
          label="Фокус"
          value={currentEntry.focus}
          min={1}
          max={10}
          tone="cyan"
          onChange={(value) => onChange({ ...currentEntry, focus: value })}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-medium text-slate-100">Deep work</div>
            <div className="mt-1 text-sm text-slate-500">Швидкі кроки без ручного тертя.</div>
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Хвилини</div>
            <div className="mt-1 text-3xl font-semibold tracking-[-0.05em] text-slate-50">{currentEntry.deepWork}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <QuickChip label="0" onClick={() => onChange({ ...currentEntry, deepWork: 0 })} />
          <QuickChip label="90" onClick={() => onChange({ ...currentEntry, deepWork: 90 })} />
          <QuickChip label="+10" onClick={() => onChange({ ...currentEntry, deepWork: currentEntry.deepWork + 10 })} />
          <QuickChip label="+30" onClick={() => onChange({ ...currentEntry, deepWork: currentEntry.deepWork + 30 })} />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Тригери та опори</div>
        <ToggleField
          checked={currentEntry.workout}
          onChange={(value) => onChange({ ...currentEntry, workout: value })}
          label="Тренування або прогулянка"
          hint="+1 до рівня"
          tone="good"
          icon={<WalkIcon />}
        />
        <ToggleField
          checked={currentEntry.webcam}
          onChange={(value) => onChange({ ...currentEntry, webcam: value })}
          label="Вебкам"
          hint="-6 до рівня, критичний день"
          tone="danger"
          icon={<CameraIcon />}
        />
        <ToggleField
          checked={currentEntry.mj}
          onChange={(value) => onChange({ ...currentEntry, mj: value })}
          label="MJ"
          hint="-2 до рівня"
          tone="warn"
          icon={<LeafIcon />}
        />
        <ToggleField
          checked={currentEntry.alcohol}
          onChange={(value) => onChange({ ...currentEntry, alcohol: value })}
          label="Алкоголь"
          hint="-2 до рівня"
          tone="warn"
          icon={<GlassIcon />}
        />
        <ToggleField
          checked={currentEntry.nicotineBefore12}
          onChange={(value) => onChange({ ...currentEntry, nicotineBefore12: value })}
          label="Нікотин до 12"
          hint="поки лише трекаємо, без штрафу у формулі"
          tone="warn"
          icon={<SmokeIcon />}
        />
        <RangeField
          label="Потяг"
          value={currentEntry.craving}
          min={0}
          max={10}
          tone="violet"
          onChange={(value) => onChange({ ...currentEntry, craving: value })}
        />
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-medium text-slate-100">Формула рівня</div>
            <div className="mt-1 text-sm text-slate-500">
              Старт 10. Далі тільки явні бонуси та штрафи, без прихованих коефіцієнтів.
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Підсумок</div>
            <div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-50">{level.toFixed(1)}</div>
          </div>
        </div>
        <div className="space-y-2">
          {levelBreakdown.adjustments.map((item) => (
            <FormulaRow key={item.label} label={item.label} value={item.value} tone={item.tone} />
          ))}
        </div>
        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
          Deep work рахується як <span className="text-slate-200">(хв / 60) x 0.5</span> з капом <span className="text-slate-200">+2</span>.
        </div>
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
        <div className="text-sm font-medium text-slate-200">Контекст</div>
        <div className="text-sm text-slate-400">Вебкам = червоний день і автоматичний план відкату на завтра.</div>
        <div className="text-sm text-slate-400">MJ 2 дні поспіль = окремий прапорець уваги.</div>
        <div className="text-sm text-slate-500">Попередній день: {formatShortDate(getPreviousDate(date))}</div>
      </Card>
    </div>
  )
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-white/10 bg-white/[0.06] px-3 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/[0.1]"
    >
      {label}
    </button>
  )
}

function FormulaRow({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'positive' | 'negative' | 'neutral'
}) {
  const prefix = value > 0 ? '+' : ''
  const textTone =
    tone === 'positive' ? 'text-emerald-300' : tone === 'negative' ? 'text-rose-300' : 'text-slate-200'

  return (
    <div className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold ${textTone}`}>{`${prefix}${value.toFixed(1)}`}</span>
    </div>
  )
}

function mapSaveLabel(saveState: 'idle' | 'saving' | 'saved' | 'error') {
  if (saveState === 'saving') return 'saving'
  if (saveState === 'saved') return 'autosaved'
  if (saveState === 'error') return 'save issue'
  return 'autosave'
}

function mapSaveTone(saveState: 'idle' | 'saving' | 'saved' | 'error'): 'neutral' | 'green' | 'orange' | 'red' {
  if (saveState === 'saving') return 'orange'
  if (saveState === 'saved') return 'green'
  if (saveState === 'error') return 'red'
  return 'neutral'
}
