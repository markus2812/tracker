import { useEffect, useMemo, useRef, useState } from 'react'
import { AppShell, BottomNav, Toast } from './components/ui'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { HeatmapScreen } from './features/heatmap/HeatmapScreen'
import { TodayScreen } from './features/today/TodayScreen'
import { listRemoteEntries, upsertRemoteEntry } from './lib/api'
import { deleteDraft, ensureAppSession, ensureSettings, listDrafts, listEntries, saveAppSession, saveDraft, saveEntries, saveEntry } from './lib/db'
import { todayKey } from './lib/date'
import { DailyEntrySchema, type DailyEntry } from './lib/schema'
import { createDefaultEntry, getPreviousDate } from './lib/stats'
import { createEntrySyncPlan } from './lib/sync'

type Tab = 'today' | 'dashboard' | 'heatmap'
type SyncState = 'offline' | 'syncing' | 'online'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [activeDate, setActiveDate] = useState(todayKey())
  const [drafts, setDrafts] = useState<Record<string, DailyEntry>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('offline')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const saveInFlightRef = useRef(false)
  const draftsRef = useRef<Record<string, DailyEntry>>({})
  const lastSavedSignatureRef = useRef('')

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

      void syncWithServer(allEntries)
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
    draftsRef.current = drafts
  }, [drafts])

  useEffect(() => {
    if (saveState !== 'saved' && saveState !== 'error') {
      return
    }

    const timeout = window.setTimeout(() => setSaveState('idle'), 1500)
    return () => window.clearTimeout(timeout)
  }, [saveState])

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
  const pendingDraft = drafts[activeDate]
  const draft = pendingDraft ?? storedEntry ?? createDefaultEntry(activeDate)
  const previousEntry = useMemo(() => entries.find((entry) => entry.date === getPreviousDate(activeDate)), [activeDate, entries])

  useEffect(() => {
    if (pendingDraft) {
      return
    }

    lastSavedSignatureRef.current = storedEntry ? getEntrySignature(storedEntry) : ''
  }, [activeDate, pendingDraft, storedEntry])

  useEffect(() => {
    if (!isHydrated || !pendingDraft) {
      return
    }

    const signature = getEntrySignature(pendingDraft)
    if (signature === lastSavedSignatureRef.current) {
      return
    }

    const timeout = window.setTimeout(() => {
      void persistEntry(pendingDraft, 'auto')
    }, 850)

    return () => window.clearTimeout(timeout)
  }, [isHydrated, pendingDraft])

  async function syncWithServer(localEntries: DailyEntry[]) {
    setSyncState('syncing')

    try {
      const remoteEntries = await listRemoteEntries()
      const plan = createEntrySyncPlan(localEntries, remoteEntries)

      const uploadedEntries = await Promise.all(plan.entriesToUpload.map((entry) => upsertRemoteEntry(entry)))
      const uploadedMap = new Map(uploadedEntries.map((entry) => [entry.date, entry]))
      const finalEntries = plan.mergedEntries
        .map((entry) => uploadedMap.get(entry.date) ?? entry)
        .sort((left, right) => right.date.localeCompare(left.date))

      await saveEntries(finalEntries)
      setEntries(finalEntries)
      setSyncState('online')
    } catch {
      setSyncState('offline')
    }
  }

  async function persistEntry(sourceEntry: DailyEntry, mode: 'auto' | 'manual') {
    const contentSignature = getEntrySignature(sourceEntry)
    if (contentSignature === lastSavedSignatureRef.current) {
      await clearMatchingDraft(sourceEntry, contentSignature)
      return
    }

    if (saveInFlightRef.current) {
      return
    }

    saveInFlightRef.current = true
    setSaveState('saving')

    const now = new Date().toISOString()
    const entryToSave = {
      ...sourceEntry,
      version: 1,
      date: sourceEntry.date,
      createdAt: sourceEntry.createdAt || now,
      updatedAt: now,
      notes: sourceEntry.notes.trim(),
    }

    const parsed = DailyEntrySchema.safeParse(entryToSave)
    if (!parsed.success) {
      saveInFlightRef.current = false
      setSaveState('error')
      setToast('Помилка валідації')
      return
    }

    try {
      await saveEntry(parsed.data)
      let persistedEntry = parsed.data
      let didSync = false

      try {
        persistedEntry = await upsertRemoteEntry(parsed.data)
        await saveEntry(persistedEntry)
        didSync = true
        setSyncState('online')
      } catch {
        setSyncState('offline')
      }

      lastSavedSignatureRef.current = contentSignature
      await clearMatchingDraft(persistedEntry, contentSignature)
      setEntries((current) => {
        const next = current.filter((entry) => entry.date !== persistedEntry.date)
        return [persistedEntry, ...next].sort((a, b) => b.date.localeCompare(a.date))
      })
      setSaveState('saved')
      setToast(didSync ? 'Збережено' : 'Збережено локально')
    } catch {
      setSaveState('error')
      setToast(mode === 'manual' ? 'Не вдалося зберегти' : 'Автозбереження не вдалося')
    } finally {
      saveInFlightRef.current = false
    }
  }

  async function clearMatchingDraft(sourceEntry: DailyEntry, contentSignature: string) {
    const latestDraft = draftsRef.current[sourceEntry.date]

    if (latestDraft && getEntrySignature(latestDraft) !== contentSignature) {
      return
    }

    await deleteDraft(sourceEntry.date)
    setDrafts((current) => {
      const currentDraft = current[sourceEntry.date]
      if (currentDraft && getEntrySignature(currentDraft) !== contentSignature) {
        return current
      }

      const next = { ...current }
      delete next[sourceEntry.date]
      return next
    })
  }

  async function handleSave() {
    await persistEntry(draft, 'manual')
  }

  function handleChange(entry: DailyEntry) {
    setSaveState('idle')
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
            syncState={syncState}
            saveState={saveState}
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

function getEntrySignature(entry: DailyEntry) {
  return JSON.stringify({
    date: entry.date,
    energy: entry.energy,
    mood: entry.mood,
    focus: entry.focus,
    deepWork: entry.deepWork,
    workout: entry.workout,
    webcam: entry.webcam,
    mj: entry.mj,
    alcohol: entry.alcohol,
    nicotineBefore12: entry.nicotineBefore12,
    craving: entry.craving,
    notes: entry.notes.trim(),
  })
}
