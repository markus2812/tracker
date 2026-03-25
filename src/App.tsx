import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { AppShell, BottomNav, Skeleton, Toast } from './components/ui'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { HeatmapScreen } from './features/heatmap/HeatmapScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { TodayScreen } from './features/today/TodayScreen'
import { getRemoteSettings, listRemoteEntries, upsertRemoteEntry, upsertRemoteSettings } from './lib/api'
import {
  deleteDraft,
  ensureAppSession,
  ensureSettings,
  listDrafts,
  listEntries,
  saveAppSession,
  saveDraft,
  saveEntries,
  saveEntry,
  saveSettings,
} from './lib/db'
import { todayKey } from './lib/date'
import { DailyEntrySchema, SettingsSchema, type DailyEntry, type Settings } from './lib/schema'
import { createDefaultEntry, getPreviousDate } from './lib/stats'
import { createEntrySyncPlan } from './lib/sync'
import { getStoredApiBaseUrl, setStoredApiBaseUrl } from './lib/api-config'
import { supportsWebNotifications } from './lib/runtime'

type Tab = 'today' | 'dashboard' | 'heatmap' | 'settings'
type SyncState = 'offline' | 'syncing' | 'online'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [settings, setSettings] = useState<Settings>(() => SettingsSchema.parse({}))
  const [activeDate, setActiveDate] = useState(todayKey())
  const [drafts, setDrafts] = useState<Record<string, DailyEntry>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('offline')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [apiBaseUrl, setApiBaseUrl] = useState(() => getStoredApiBaseUrl() ?? '')
  const saveInFlightRef = useRef(false)
  const draftsRef = useRef<Record<string, DailyEntry>>({})
  const lastSavedSignatureRef = useRef('')
  const notificationTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    let isMounted = true

    const hydrate = async () => {
      const [loadedSettings, allEntries, allDrafts, session] = await Promise.all([
        ensureSettings(),
        listEntries(),
        listDrafts(),
        ensureAppSession(),
      ])

      if (!isMounted) {
        return
      }

      setSettings(loadedSettings)
      setEntries(allEntries)
      setDrafts(Object.fromEntries(allDrafts.map((entry) => [entry.date, entry])))
      setTab(session.activeTab)
      // Always open on today if the stored date is from a previous day
      setActiveDate(session.activeDate < todayKey() ? todayKey() : session.activeDate)
      setSelectedHeatmapDate(session.selectedHeatmapDate)
      setIsHydrated(true)

      void syncWithServer(allEntries, loadedSettings)
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

  // Schedule check-in notification
  useEffect(() => {
    if (!isHydrated) return
    if (!supportsWebNotifications() || Notification.permission !== 'granted') return

    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current)
    }

    const todayEntry = entries.find((e) => e.date === todayKey())
    if (todayEntry) return

    const now = new Date()
    const checkinTime = new Date()
    checkinTime.setHours(settings.checkinHour, 0, 0, 0)

    if (checkinTime <= now) return

    const delay = checkinTime.getTime() - now.getTime()
    notificationTimeoutRef.current = window.setTimeout(() => {
      new Notification('Reset', {
        body: 'Час для вечірнього check-in. Як пройшов день?',
        icon: '/pwa-192.png',
      })
    }, delay)

    return () => {
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [isHydrated, entries, settings.checkinHour])

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
    if (!isHydrated || !pendingDraft || !settings.autosave) {
      return
    }

    const signature = getEntrySignature(pendingDraft)
    if (signature === lastSavedSignatureRef.current) {
      return
    }

    const timeout = window.setTimeout(() => {
      handleAutoPersist(pendingDraft)
    }, 850)

    return () => window.clearTimeout(timeout)
  }, [isHydrated, pendingDraft, settings.autosave])

  async function syncWithServer(localEntries: DailyEntry[], currentSettings?: Settings) {
    setSyncState('syncing')
    setSyncError(null)

    try {
      const [remoteEntries, remoteSettings] = await Promise.all([
        listRemoteEntries(),
        getRemoteSettings().catch(() => null),
      ])

      const plan = createEntrySyncPlan(localEntries, remoteEntries)

      const uploadedEntries = await Promise.all(plan.entriesToUpload.map((entry) => upsertRemoteEntry(entry)))
      const uploadedMap = new Map(uploadedEntries.map((entry) => [entry.date, entry]))
      const finalEntries = plan.mergedEntries
        .map((entry) => uploadedMap.get(entry.date) ?? entry)
        .sort((left, right) => right.date.localeCompare(left.date))

      await saveEntries(finalEntries)
      setEntries(finalEntries)

      // Merge settings: local wins if remote is older or same
      if (remoteSettings && currentSettings) {
        const mergedSettings = SettingsSchema.parse({ ...remoteSettings, ...currentSettings })
        await saveSettings(mergedSettings)
        await upsertRemoteSettings(mergedSettings).catch(() => null)
        setSettings(mergedSettings)
      }

      setSyncState('online')
      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      setSyncState('offline')
      setSyncError(err instanceof Error ? err.message : 'Помилка синку')
    }
  }

  // Scroll to top when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [tab])

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
        setLastSyncedAt(new Date().toISOString())
        setSyncError(null)
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

  const handleAutoPersist = useEffectEvent((entryToPersist: DailyEntry) => {
    void persistEntry(entryToPersist, 'auto')
  })

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

  const handleSave = useCallback(async () => {
    await persistEntry(draft, 'manual')
  }, [draft])

  const handleChange = useCallback((entry: DailyEntry) => {
    setSaveState('idle')
    setDrafts((current) => ({ ...current, [entry.date]: entry }))
    void saveDraft(entry)
  }, [])

  const handleSettingsChange = useCallback(async (next: Settings) => {
    setSettings(next)
    await saveSettings(next)
    await upsertRemoteSettings(next).catch(() => null)
  }, [])

  const handleApiBaseUrlSave = useCallback((nextValue: string) => {
    const normalized = setStoredApiBaseUrl(nextValue) ?? ''
    setApiBaseUrl(normalized)
  }, [])

  const jumpToDate = useCallback((date: string) => {
    setActiveDate(date)
    setTab('today')
    setSelectedHeatmapDate(null)
  }, [])

  return (
    <>
      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
      <AppShell>
        {!isHydrated ? (
          <div className="space-y-4 pt-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-48" />
            <Skeleton className="h-36" />
            <Skeleton className="h-56" />
          </div>
        ) : null}
        {isHydrated ? (
          <div key={tab} className="screen-enter">
            {tab === 'today' ? (
              <TodayScreen
                date={activeDate}
                entry={draft}
                previousEntry={previousEntry}
                settings={settings}
                syncState={syncState}
                saveState={saveState}
                onChange={handleChange}
                onSave={handleSave}
                onJumpToToday={() => setActiveDate(todayKey())}
              />
            ) : tab === 'dashboard' ? (
              <DashboardScreen entries={entries} settings={settings} />
            ) : tab === 'heatmap' ? (
              <HeatmapScreen
                entries={entries}
                selectedDate={selectedHeatmapDate}
                onSelectDate={setSelectedHeatmapDate}
                onEditDate={jumpToDate}
              />
            ) : (
              <SettingsScreen
                settings={settings}
                apiBaseUrl={apiBaseUrl}
                syncState={syncState}
                lastSyncedAt={lastSyncedAt}
                syncError={syncError}
                onChange={handleSettingsChange}
                onApiBaseUrlChange={handleApiBaseUrlSave}
                onSyncNow={() => void syncWithServer(entries, settings)}
              />
            )}
          </div>
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
    sleep: entry.sleep,
    stress: entry.stress,
    notes: entry.notes.trim(),
  })
}
