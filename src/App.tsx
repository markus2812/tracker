import { useEffect, useMemo, useState } from 'react'
import { AppShell, BottomNav, Toast } from './components/ui'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { HeatmapScreen } from './features/heatmap/HeatmapScreen'
import { TodayScreen } from './features/today/TodayScreen'
import { deleteDraft, ensureAppSession, ensureSettings, listDrafts, listEntries, saveAppSession, saveDraft, saveEntry } from './lib/db'
import { todayKey } from './lib/date'
import { DailyEntrySchema, type DailyEntry } from './lib/schema'
import { createDefaultEntry, getPreviousDate } from './lib/stats'

type Tab = 'today' | 'dashboard' | 'heatmap'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [activeDate, setActiveDate] = useState(todayKey())
  const [drafts, setDrafts] = useState<Record<string, DailyEntry>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let isMounted = true

    const hydrate = async () => {
      const [, allEntries, allDrafts, session] = await Promise.all([
        ensureSettings(),
        listEntries(),
        listDrafts(),
        ensureAppSession(),
      ])

      if (!isMounted) {
        return
      }

      setEntries(allEntries)
      setDrafts(Object.fromEntries(allDrafts.map((entry) => [entry.date, entry])))
      setTab(session.activeTab)
      setActiveDate(session.activeDate)
      setSelectedHeatmapDate(session.selectedHeatmapDate)
      setIsHydrated(true)
    }

    void hydrate()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    void saveAppSession({
      id: 'singleton',
      activeTab: tab,
      activeDate,
      selectedHeatmapDate,
    })
  }, [activeDate, isHydrated, selectedHeatmapDate, tab])

  const storedEntry = useMemo(() => entries.find((entry) => entry.date === activeDate), [activeDate, entries])
  const draft = drafts[activeDate] ?? storedEntry ?? createDefaultEntry(activeDate)
  const previousEntry = useMemo(() => entries.find((entry) => entry.date === getPreviousDate(activeDate)), [activeDate, entries])

  async function handleSave() {
    const now = new Date().toISOString()
    const nextEntry = {
      ...draft,
      version: 1,
      date: activeDate,
      createdAt: draft.createdAt || now,
      updatedAt: now,
      notes: draft.notes.trim(),
    }

    const parsed = DailyEntrySchema.safeParse(nextEntry)
    if (!parsed.success) {
      setToast('Помилка валідації')
      return
    }

    await saveEntry(parsed.data)
    await deleteDraft(parsed.data.date)
    setEntries((current) => {
      const next = current.filter((entry) => entry.date !== parsed.data.date)
      return [parsed.data, ...next].sort((a, b) => b.date.localeCompare(a.date))
    })
    setDrafts((current) => {
      const next = { ...current }
      delete next[parsed.data.date]
      return next
    })
    setToast('Збережено')
  }

  function handleChange(entry: DailyEntry) {
    setDrafts((current) => ({ ...current, [entry.date]: entry }))
    void saveDraft(entry)
  }

  function jumpToDate(date: string) {
    setActiveDate(date)
    setTab('today')
    setSelectedHeatmapDate(null)
  }

  return (
    <>
      {toast ? <Toast message={toast} /> : null}
      <AppShell>
        {!isHydrated ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-12 text-center text-sm text-slate-400">
            Відновлюю локальні дані...
          </div>
        ) : null}
        {isHydrated && tab === 'today' ? (
          <TodayScreen
            date={activeDate}
            entry={draft}
            previousEntry={previousEntry}
            onChange={handleChange}
            onSave={handleSave}
            onJumpToToday={() => setActiveDate(todayKey())}
          />
        ) : null}

        {isHydrated && tab === 'dashboard' ? <DashboardScreen entries={entries} /> : null}

        {isHydrated && tab === 'heatmap' ? (
          <HeatmapScreen
            entries={entries}
            selectedDate={selectedHeatmapDate}
            onSelectDate={setSelectedHeatmapDate}
            onEditDate={jumpToDate}
          />
        ) : null}
      </AppShell>
      {isHydrated ? <BottomNav tab={tab} onChange={setTab} /> : null}
    </>
  )
}
