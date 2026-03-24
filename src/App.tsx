import { useEffect, useMemo, useState } from 'react'
import { AppShell, BottomNav, Toast } from './components/ui'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { HeatmapScreen } from './features/heatmap/HeatmapScreen'
import { TodayScreen } from './features/today/TodayScreen'
import { db, ensureSettings, saveEntry } from './lib/db'
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

  useEffect(() => {
    void ensureSettings()

    const syncEntries = async () => {
      const allEntries = await db.entries.orderBy('date').reverse().toArray()
      setEntries(allEntries)
    }

    void syncEntries()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timeout)
  }, [toast])

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
    setEntries((current) => {
      const next = current.filter((entry) => entry.date !== parsed.data.date)
      return [parsed.data, ...next].sort((a, b) => b.date.localeCompare(a.date))
    })
    setDrafts((current) => ({ ...current, [parsed.data.date]: parsed.data }))
    setToast('Збережено')
  }

  function handleChange(entry: DailyEntry) {
    setDrafts((current) => ({ ...current, [entry.date]: entry }))
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
        {tab === 'today' ? (
          <TodayScreen
            date={activeDate}
            entry={draft}
            previousEntry={previousEntry}
            onChange={handleChange}
            onSave={handleSave}
            onJumpToToday={() => setActiveDate(todayKey())}
          />
        ) : null}

        {tab === 'dashboard' ? <DashboardScreen entries={entries} /> : null}

        {tab === 'heatmap' ? (
          <HeatmapScreen
            entries={entries}
            selectedDate={selectedHeatmapDate}
            onSelectDate={setSelectedHeatmapDate}
            onEditDate={jumpToDate}
          />
        ) : null}
      </AppShell>
      <BottomNav tab={tab} onChange={setTab} />
    </>
  )
}
