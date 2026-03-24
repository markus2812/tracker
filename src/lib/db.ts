import Dexie, { type Table } from 'dexie'
import { DailyEntrySchema, SettingsSchema, type DailyEntry, type Settings } from './schema'

class ResetDB extends Dexie {
  entries!: Table<DailyEntry, string>
  settings!: Table<Settings, string>

  constructor() {
    super('reset-db')

    this.version(1).stores({
      entries: 'date, updatedAt',
      settings: 'id',
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
