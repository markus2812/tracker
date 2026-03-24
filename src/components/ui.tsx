import clsx from 'clsx'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[72vh] bg-[radial-gradient(circle_at_50%_0%,rgba(77,104,255,0.26),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.16),transparent_26%),linear-gradient(180deg,rgba(14,22,44,0.92)_0%,rgba(9,14,28,0.55)_42%,rgba(5,8,22,0)_100%)]" />
      {children}
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{eyebrow}</div>
        <h1 className="mt-1 text-[32px] font-semibold tracking-[-0.04em] text-slate-50">{title}</h1>
      </div>
      {action}
    </div>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={clsx(
        'rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(26,31,43,0.9),rgba(18,22,33,0.88))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </section>
  )
}

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      className={clsx(
        'rounded-full px-4 py-3 text-sm font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-slate-50 text-slate-950 shadow-[0_8px_28px_rgba(255,255,255,0.1)] hover:bg-white',
        variant === 'secondary' && 'border border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function MetricCard({
  label,
  value,
  hint,
  accent = 'neutral',
  children,
}: {
  label: string
  value: string
  hint: string
  accent?: 'neutral' | 'blue' | 'green' | 'amber' | 'rose'
  children?: ReactNode
}) {
  return (
    <Card
      className={clsx(
        'space-y-1 overflow-hidden',
        accent === 'blue' && 'bg-[linear-gradient(180deg,rgba(20,34,75,0.96),rgba(9,14,28,0.92))]',
        accent === 'green' && 'bg-[linear-gradient(180deg,rgba(7,50,48,0.95),rgba(9,14,28,0.92))]',
        accent === 'amber' && 'bg-[linear-gradient(180deg,rgba(73,46,14,0.96),rgba(9,14,28,0.92))]',
        accent === 'rose' && 'bg-[linear-gradient(180deg,rgba(70,18,33,0.96),rgba(9,14,28,0.92))]'
      )}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="text-3xl font-semibold tracking-[-0.03em] text-slate-50">{value}</div>
      <div className="text-sm text-slate-400">{hint}</div>
      {children}
    </Card>
  )
}

export function HeroPanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children?: ReactNode
}) {
  return (
    <Card className="overflow-hidden px-4 py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0)_100%)]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">{eyebrow}</div>
            <div className="mt-2 text-[46px] font-semibold leading-none tracking-[-0.06em] text-slate-50">{title}</div>
            <div className="mt-2 max-w-[18rem] text-[15px] leading-6 text-slate-300">{subtitle}</div>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.06] text-xs uppercase tracking-[0.2em] text-slate-300">
            Reset
          </div>
        </div>
        {children}
      </div>
    </Card>
  )
}

export function ScoreDial({
  value,
  max = 10,
  label,
  tone = 'blue',
  size = 136,
}: {
  value: number
  max?: number
  label: string
  tone?: 'blue' | 'green' | 'amber' | 'rose'
  size?: number
}) {
  const progress = Math.max(0, Math.min(1, value / max))
  const stroke =
    tone === 'green'
      ? '#34d399'
      : tone === 'amber'
        ? '#fbbf24'
        : tone === 'rose'
          ? '#fb7185'
          : '#60a5fa'

  return (
    <div className="relative shrink-0 rounded-full p-[10px]" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 210deg, rgba(131,245,255,0.95) 0deg, rgba(129,140,248,0.95) 110deg, rgba(244,114,182,0.95) 220deg, rgba(251,191,36,0.95) 310deg, rgba(131,245,255,0.95) 360deg)`,
          opacity: Math.max(0.3, progress),
          boxShadow: `0 0 36px ${stroke}33`,
        }}
      />
      <div className="absolute inset-[10px] rounded-full bg-[radial-gradient(circle_at_top,rgba(44,51,73,0.95),rgba(17,21,32,0.98))] ring-1 ring-white/8" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[34px] font-semibold leading-none tracking-[-0.06em] text-slate-50">{value.toFixed(1)}</div>
        <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      </div>
    </div>
  )
}

export function RingMetric({
  label,
  value,
  max,
  hint,
  tone = 'blue',
  size = 112,
}: {
  label: string
  value: number
  max: number
  hint: string
  tone?: 'blue' | 'green' | 'amber' | 'rose'
  size?: number
}) {
  const progress = Math.max(0, Math.min(1, value / max))
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - progress)
  const stroke =
    tone === 'green'
      ? '#34d399'
      : tone === 'amber'
        ? '#fbbf24'
        : tone === 'rose'
          ? '#fb7185'
          : '#60a5fa'

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 108 108" className="h-full w-full -rotate-90">
          <circle cx="54" cy="54" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle
            cx="54"
            cy="54"
            r="44"
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-semibold tracking-[-0.03em] text-slate-50">{value.toFixed(1)}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">з {max}</div>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
        <div className="text-sm leading-6 text-slate-200">{hint}</div>
      </div>
    </Card>
  )
}

export function MicroStat({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'neutral' | 'green' | 'amber' | 'rose' | 'blue'
  icon?: ReactNode
}) {
  return (
    <div
      className={clsx(
        'rounded-[22px] border border-white/8 p-4',
        tone === 'green' && 'bg-emerald-500/8',
        tone === 'amber' && 'bg-amber-400/8',
        tone === 'rose' && 'bg-rose-500/8',
        tone === 'blue' && 'bg-blue-400/8',
        tone === 'neutral' && 'bg-white/[0.03]'
      )}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-50">{value}</div>
      {hint ? <div className="mt-1 text-sm text-slate-400">{hint}</div> : null}
    </div>
  )
}

export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: string; tone?: 'neutral' | 'green' | 'amber' | 'rose' | 'blue' }>
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={clsx(
            'rounded-[20px] border border-white/8 p-3.5',
            item.tone === 'green' && 'bg-emerald-500/8',
            item.tone === 'amber' && 'bg-amber-400/8',
            item.tone === 'rose' && 'bg-rose-500/8',
            item.tone === 'blue' && 'bg-blue-400/8',
            (!item.tone || item.tone === 'neutral') && 'bg-white/[0.03]'
          )}
        >
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
          <div className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-slate-50">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

export function SparkBars({
  values,
  tone = 'blue',
}: {
  values: number[]
  tone?: 'blue' | 'green' | 'amber'
}) {
  const color = tone === 'green' ? 'bg-emerald-400' : tone === 'amber' ? 'bg-amber-400' : 'bg-blue-400'
  return (
    <div className="flex h-16 items-end gap-1.5">
      {values.map((value, index) => (
        <div
          key={`${index}-${value}`}
          className={clsx('min-h-2 flex-1 rounded-full opacity-90', color)}
          style={{ height: `${Math.max(16, (value / 10) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export function RangeField({
  label,
  value,
  min,
  max,
  onChange,
  tone = 'blue',
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  tone?: 'blue' | 'violet' | 'cyan'
}) {
  const gradient =
    tone === 'violet'
      ? 'linear-gradient(90deg, rgba(236,72,153,0.9) 0%, rgba(168,85,247,0.95) 50%, rgba(196,181,253,0.95) 100%)'
      : tone === 'cyan'
        ? 'linear-gradient(90deg, rgba(56,189,248,0.92) 0%, rgba(34,211,238,0.95) 55%, rgba(167,243,208,0.95) 100%)'
        : 'linear-gradient(90deg, rgba(244,114,182,0.92) 0%, rgba(96,165,250,0.95) 50%, rgba(167,243,208,0.95) 100%)'

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-medium text-slate-200">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-sm text-slate-300"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-sm text-slate-300"
          >
            +
          </button>
          <span className="w-5 text-right text-[15px] text-slate-300">{value}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-input w-full"
        style={{ background: gradient }}
      />
    </div>
  )
}

export function ToggleField({
  label,
  hint,
  checked,
  tone = 'neutral',
  onChange,
  icon,
}: {
  label: string
  hint: string
  checked: boolean
  tone?: 'neutral' | 'good' | 'warn' | 'danger'
  onChange: (value: boolean) => void
  icon?: ReactNode
}) {
  const toneClass =
    tone === 'danger'
      ? 'data-[checked=true]:bg-rose-500'
      : tone === 'warn'
        ? 'data-[checked=true]:bg-amber-400'
        : tone === 'good'
          ? 'data-[checked=true]:bg-emerald-500'
          : 'data-[checked=true]:bg-slate-200'

  return (
    <button
      type="button"
      data-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-18 w-full items-center justify-between gap-3 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(34,39,55,0.72),rgba(27,31,45,0.66))] px-4 py-3.5 text-left transition hover:bg-white/[0.05]"
    >
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300">
            {icon}
          </span>
        ) : null}
        <div>
        <div className="text-[15px] font-medium text-slate-100">{label}</div>
        <div className="mt-0.5 text-xs text-slate-500">{hint}</div>
        </div>
      </div>
      <span
        className={clsx(
          'relative h-9 w-15 rounded-full border border-white/10 bg-white/10 transition shadow-inner',
          toneClass
        )}
      >
        <span
          className={clsx(
            'absolute left-1 top-1 h-7 w-7 rounded-full bg-white transition',
            checked && 'translate-x-5.5'
          )}
        />
      </span>
    </button>
  )
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(34,39,55,0.72),rgba(27,31,45,0.66))] px-4 py-3.5 text-base text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.05]',
        props.className
      )}
    />
  )
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(34,39,55,0.72),rgba(27,31,45,0.66))] px-4 py-3.5 text-base text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-white/20 focus:bg-white/[0.05]',
        props.className
      )}
    />
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'red' | 'orange' | 'green'
}) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'neutral' && 'bg-white/6 text-slate-300',
        tone === 'red' && 'bg-rose-500/15 text-rose-300',
        tone === 'orange' && 'bg-amber-400/15 text-amber-200',
        tone === 'green' && 'bg-emerald-500/15 text-emerald-300'
      )}
    >
      {children}
    </span>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-lg backdrop-blur">
      {message}
    </div>
  )
}

export function BottomNav({
  tab,
  onChange,
}: {
  tab: 'today' | 'dashboard' | 'heatmap'
  onChange: (tab: 'today' | 'dashboard' | 'heatmap') => void
}) {
  const items = [
    { id: 'today', label: 'Сьогодні', icon: <TodayIcon /> },
    { id: 'dashboard', label: 'Огляд', icon: <GridIcon /> },
    { id: 'heatmap', label: 'Теплокарта', icon: <MapIcon /> },
  ] as const

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(5,8,22,0)_0%,rgba(5,8,22,0.74)_35%,rgba(5,8,22,0.96)_72%,rgba(5,8,22,1)_100%)]" />
      <div className="relative mx-auto max-w-md px-4 pb-[calc(1.1rem+env(safe-area-inset-bottom))]">
        <nav className="pointer-events-auto grid grid-cols-3 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,37,0.98),rgba(10,13,22,0.98))] p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.6)]">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-3 text-sm font-medium transition',
                tab === item.id ? 'bg-[linear-gradient(180deg,rgba(60,65,87,0.95),rgba(43,48,69,0.9))] text-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-slate-500'
              )}
            >
              <span className="opacity-90">{item.icon}</span>
              <span className="text-[12px]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

function TodayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M3 9h18" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l-5 2V6l5-2 6 2 5-2v14l-5 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  )
}

export function WalkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2" />
      <path d="m13 6-3 5 2 2-3 7M10 11l6 1 3 4M14 8l4 3" />
    </svg>
  )
}

export function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h4l2-2h4l2 2h4v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

export function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 20c8 0 12-6 12-14-8 0-14 4-14 12 0 1 0 1 2 2Z" />
      <path d="M8 16c2-2 5-4 9-5" />
    </svg>
  )
}

export function GlassIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h10l-1 8a4 4 0 0 1-4 3 4 4 0 0 1-4-3Z" />
      <path d="M12 14v6M8 20h8" />
    </svg>
  )
}

export function SmokeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h14a4 4 0 0 1 0 8H3z" />
      <path d="M18 6c1 1 2 2 2 4M15 4c1 1 2 2 2 4" />
    </svg>
  )
}
