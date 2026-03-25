import { BellIcon, Button, Card, SectionHeader, SettingsIcon, SyncIcon, ToggleField } from '../../components/ui'
import { DEFAULT_FORMULA_WEIGHTS, type FormulaWeights, type Settings } from '../../lib/schema'
import { supportsWebNotifications } from '../../lib/runtime'

type SettingsScreenProps = {
  settings: Settings
  apiBaseUrl: string
  isNativeApp: boolean
  platform: 'android' | 'ios' | 'web'
  syncState: 'offline' | 'syncing' | 'online'
  lastSyncedAt: string | null
  syncError: string | null
  onChange: (settings: Settings) => void
  onApiBaseUrlChange: (value: string) => void
  onSyncNow: () => void
}

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

function formatSyncTime(iso: string | null) {
  if (!iso) return 'ніколи'
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  return new Date(iso).toLocaleDateString()
}

async function requestNotificationPermission() {
  if (!supportsWebNotifications()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function SettingsScreen({
  settings,
  apiBaseUrl,
  isNativeApp,
  platform,
  syncState,
  lastSyncedAt,
  syncError,
  onChange,
  onApiBaseUrlChange,
  onSyncNow,
}: SettingsScreenProps) {
  const w = settings.formulaWeights

  function setWeights(patch: Partial<FormulaWeights>) {
    onChange({ ...settings, formulaWeights: { ...w, ...patch } })
  }

  function resetFormula() {
    onChange({ ...settings, formulaWeights: { ...DEFAULT_FORMULA_WEIGHTS } })
  }

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Reset" title="Налаштування" />

      {/* Check-in reminder */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <BellIcon />
          <div className="text-[15px] font-medium text-slate-100">Нагадування</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Час check-in</div>
          <div className="flex flex-wrap gap-2 pt-1">
            {[18, 19, 20, 21, 22, 23].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => onChange({ ...settings, checkinHour: h })}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  settings.checkinHour === h
                    ? 'bg-blue-500/20 text-blue-200 ring-1 ring-blue-400/30'
                    : 'border border-white/10 bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]'
                }`}
              >
                {formatHour(h)}
              </button>
            ))}
          </div>
          <div className="pt-1 text-xs text-slate-500">
            Нагадування спрацює в {formatHour(settings.checkinHour)}, якщо за сьогодні ще немає запису.
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Push-сповіщення</div>
          {supportsWebNotifications() ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">
                {Notification.permission === 'granted'
                  ? 'Дозволено'
                  : Notification.permission === 'denied'
                    ? 'Заблоковано у браузері'
                    : 'Не запитано'}
              </span>
              {Notification.permission !== 'granted' && Notification.permission !== 'denied' && (
                <Button
                  variant="secondary"
                  className="px-4 py-2.5 text-sm"
                  onClick={() => requestNotificationPermission()}
                >
                  Дозволити
                </Button>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              {isNativeApp
                ? 'У native-збірці локальні нагадування підключимо окремо через Capacitor plugin.'
                : 'Push-сповіщення не підтримуються у цьому браузері.'}
            </div>
          )}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <SyncIcon />
          <div className="text-[15px] font-medium text-slate-100">Сервер</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">API base URL</div>
          <input
            type="url"
            inputMode="url"
            placeholder={isNativeApp ? 'https://your-server.example.com/api' : 'Порожньо = /api'}
            value={apiBaseUrl}
            onChange={(event) => onApiBaseUrlChange(event.target.value)}
            className="w-full rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(34,39,55,0.72),rgba(27,31,45,0.66))] px-4 py-3.5 text-base text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.05]"
          />
          <div className="text-sm text-slate-500">
            {isNativeApp
              ? 'Для мобільної збірки вкажи повний URL до домашнього серверу. На iPhone краще використовувати HTTPS, бо plain HTTP часто блокується системою.'
              : 'У веб-версії можна лишити поле порожнім, тоді використається локальний /api proxy.'}
          </div>
          {platform === 'ios' && apiBaseUrl.startsWith('http://') ? (
            <div className="rounded-[18px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              Для iPhone цей `http://` URL може не пройти через App Transport Security. Надійніший варіант тут: `https://.../api`.
            </div>
          ) : null}
        </div>
      </Card>

      {/* Notes & autosave */}
      <Card className="space-y-4 p-5">
        <div className="text-[15px] font-medium text-slate-100">Записи</div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Ліміт нотаток: {settings.notesMaxLength} символів
          </div>
          <input
            type="range"
            min={50}
            max={2000}
            step={50}
            value={settings.notesMaxLength}
            onChange={(e) => onChange({ ...settings, notesMaxLength: Number(e.target.value) })}
            className="range-input w-full"
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              backgroundImage: `linear-gradient(90deg, rgba(96,165,250,0.9) 0%, rgba(167,243,208,0.95) 100%), linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08))`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${((settings.notesMaxLength - 50) / 1950) * 100}% 100%, 100% 100%`,
            }}
          />
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>50</span>
            <span>2000</span>
          </div>
        </div>

        <ToggleField
          checked={settings.autosave}
          onChange={(value) => onChange({ ...settings, autosave: value })}
          label="Автозбереження"
          hint="Зберігати запис автоматично через ~850 мс після змін"
          tone="good"
          icon={<SettingsIcon />}
        />
      </Card>

      {/* Level formula */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-medium text-slate-100">Формула рівня</div>
            <div className="mt-1 text-sm text-slate-500">Старт {w.start}. Штрафи та бонуси під ваш контекст.</div>
          </div>
          <Button variant="secondary" className="px-3.5 py-2 text-xs" onClick={resetFormula}>
            Скинути
          </Button>
        </div>

        <div className="space-y-3">
          <FormulaWeightRow
            label="Вебкам"
            value={w.webcam}
            min={-10}
            max={0}
            onChange={(v) => setWeights({ webcam: v })}
            tone="negative"
          />
          <FormulaWeightRow
            label="MJ"
            value={w.mj}
            min={-10}
            max={0}
            onChange={(v) => setWeights({ mj: v })}
            tone="negative"
          />
          <FormulaWeightRow
            label="Алкоголь"
            value={w.alcohol}
            min={-10}
            max={0}
            onChange={(v) => setWeights({ alcohol: v })}
            tone="negative"
          />
          <FormulaWeightRow
            label="Тренування"
            value={w.workout}
            min={0}
            max={5}
            onChange={(v) => setWeights({ workout: v })}
            tone="positive"
          />
          <FormulaWeightRow
            label="Deep work кап"
            value={w.deepWorkCap}
            min={0}
            max={5}
            onChange={(v) => setWeights({ deepWorkCap: v })}
            tone="positive"
          />
          <FormulaWeightRow
            label="Deep work / год"
            value={w.deepWorkRate}
            min={0.1}
            max={2}
            step={0.1}
            onChange={(v) => setWeights({ deepWorkRate: Math.round(v * 10) / 10 })}
            tone="positive"
          />
        </div>
      </Card>

      {/* Sync */}
      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <SyncIcon />
          <div className="text-[15px] font-medium text-slate-100">Синхронізація</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Статус</div>
            <div className="mt-1 text-sm font-medium text-slate-100">
              {syncState === 'online' ? 'Онлайн' : syncState === 'syncing' ? 'Синкую...' : 'Офлайн'}
            </div>
          </div>
          <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Останній синк</div>
            <div className="mt-1 text-sm font-medium text-slate-100">{formatSyncTime(lastSyncedAt)}</div>
          </div>
        </div>

        {syncError ? (
          <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {syncError}
          </div>
        ) : null}

        <Button
          variant="secondary"
          className="w-full py-3"
          disabled={syncState === 'syncing'}
          onClick={onSyncNow}
        >
          {syncState === 'syncing' ? 'Синхронізую...' : 'Синхронізувати зараз'}
        </Button>
      </Card>
    </div>
  )
}

function FormulaWeightRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  tone,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  tone: 'positive' | 'negative'
}) {
  const prefix = value > 0 ? '+' : ''
  const textClass = tone === 'positive' ? 'text-emerald-300' : 'text-rose-300'

  return (
    <div className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
          className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm text-slate-300 transition hover:bg-white/[0.1]"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, Math.round((value + step) * 10) / 10))}
          className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm text-slate-300 transition hover:bg-white/[0.1]"
        >
          +
        </button>
        <span className={`min-w-[3rem] text-right text-sm font-semibold ${textClass}`}>
          {`${prefix}${value.toFixed(step < 1 ? 1 : 0)}`}
        </span>
      </div>
    </div>
  )
}
