import Dexie, { type Table } from 'dexie'
import { todayKey } from './date'
import { AppSessionSchema, DailyEntrySchema, SettingsSchema, type AppSession, type DailyEntry, type Settings } from './schema'

class ResetDB extends Dexie {
  entries!: Table<DailyEntry, string>
  settings!: Table<Settings, string>
  drafts!: Table<DailyEntry, string>
  uiState!: Table<AppSession, string>

  constructor() {
    super('reset-db')

    this.version(1).stores({
      entries: 'date, updatedAt',
      settings: 'id',
    })

    this.version(2).stores({
      entries: 'date, updatedAt',
      settings: 'id',
      drafts: 'date, updatedAt',
      uiState: 'id',
    })
  }
}

export const db = new ResetDB()

export async function saveEntry(entry: DailyEntry) {
  const parsed = DailyEntrySchema.parse(entry)
  await db.entries.put(parsed)
  return parsed
}

export async function ensureSettings() {
  const existing = await db.settings.get('singleton')
  if (existing) {
    return SettingsSchema.parse(existing)
  }

  const defaults = SettingsSchema.parse({})
  await db.settings.put(defaults)
  return defaults
}

export async function listEntries() {
  return db.entries.orderBy('date').reverse().toArray()
}

export async function listDrafts() {
  return db.drafts.orderBy('date').reverse().toArray()
}

export async function saveDraft(entry: DailyEntry) {
  const now = new Date().toISOString()
  const parsed = DailyEntrySchema.parse({
    ...entry,
    createdAt: entry.createdAt || now,
    updatedAt: now,
  })

  await db.drafts.put(parsed)
  return parsed
}

export async function deleteDraft(date: string) {
  await db.drafts.delete(date)
}

export async function ensureAppSession() {
  const existing = await db.uiState.get('singleton')
  if (existing) {
    return AppSessionSchema.parse(existing)
  }

  const defaults = AppSessionSchema.parse({
    activeDate: todayKey(),
  })
  await db.uiState.put(defaults)
  return defaults
}

export async function saveAppSession(session: AppSession) {
  const parsed = AppSessionSchema.parse(session)
  await db.uiState.put(parsed)
  return parsed
}
