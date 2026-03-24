import type { DailyEntry } from './schema'

type SyncPlan = {
  mergedEntries: DailyEntry[]
  entriesToUpload: DailyEntry[]
}

function isLocalEntryNewer(localEntry: DailyEntry, remoteEntry: DailyEntry) {
  return localEntry.updatedAt >= remoteEntry.updatedAt
}

export function createEntrySyncPlan(localEntries: DailyEntry[], remoteEntries: DailyEntry[]): SyncPlan {
  const localMap = new Map(localEntries.map((entry) => [entry.date, entry]))
  const remoteMap = new Map(remoteEntries.map((entry) => [entry.date, entry]))
  const dates = new Set([...localMap.keys(), ...remoteMap.keys()])
  const mergedEntries: DailyEntry[] = []
  const entriesToUpload: DailyEntry[] = []

  for (const date of dates) {
    const localEntry = localMap.get(date)
    const remoteEntry = remoteMap.get(date)

    if (localEntry && !remoteEntry) {
      mergedEntries.push(localEntry)
      entriesToUpload.push(localEntry)
      continue
    }

    if (!localEntry && remoteEntry) {
      mergedEntries.push(remoteEntry)
      continue
    }

    if (!localEntry || !remoteEntry) {
      continue
    }

    if (isLocalEntryNewer(localEntry, remoteEntry)) {
      mergedEntries.push(localEntry)
      if (localEntry.updatedAt !== remoteEntry.updatedAt) {
        entriesToUpload.push(localEntry)
      }
      continue
    }

    mergedEntries.push(remoteEntry)
  }

  mergedEntries.sort((left, right) => right.date.localeCompare(left.date))

  return {
    mergedEntries,
    entriesToUpload,
  }
}
