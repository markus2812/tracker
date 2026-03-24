import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DailyEntrySchema, SettingsSchema } from './schema.mjs'

const dbPath = resolve(process.cwd(), process.env.TRACKER_DB_PATH ?? 'data/tracker.sqlite')
mkdirSync(dirname(dbPath), { recursive: true })

const db = new DatabaseSync(dbPath)

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS entries (
    date TEXT PRIMARY KEY,
    updated_at TEXT NOT NULL,
    payload TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    updated_at TEXT NOT NULL,
    payload TEXT NOT NULL
  );
`)

function parsePayloadRows(rows) {
  return rows.map((row) => JSON.parse(row.payload))
}

export function getDbPath() {
  return dbPath
}

export function listEntries({ from, to } = {}) {
  const filters = []
  const values = {}

  if (from) {
    filters.push('date >= $from')
    values.$from = from
  }

  if (to) {
    filters.push('date <= $to')
    values.$to = to
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const statement = db.prepare(`
    SELECT payload
    FROM entries
    ${whereClause}
    ORDER BY date DESC
  `)

  return parsePayloadRows(statement.all(values)).map((entry) => DailyEntrySchema.parse(entry))
}

export function getEntry(date) {
  const row = db.prepare('SELECT payload FROM entries WHERE date = ?').get(date)
  if (!row) {
    return null
  }

  return DailyEntrySchema.parse(JSON.parse(row.payload))
}

export function saveEntry(entry) {
  const parsed = DailyEntrySchema.parse(entry)

  db.prepare(`
    INSERT INTO entries (date, updated_at, payload)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      updated_at = excluded.updated_at,
      payload = excluded.payload
  `).run(parsed.date, parsed.updatedAt, JSON.stringify(parsed))

  return parsed
}

export function getSettings() {
  const row = db.prepare('SELECT payload FROM settings WHERE id = ?').get('singleton')
  if (!row) {
    const defaults = SettingsSchema.parse({})
    return saveSettings(defaults)
  }

  return SettingsSchema.parse(JSON.parse(row.payload))
}

export function saveSettings(settings) {
  const now = new Date().toISOString()
  const parsed = SettingsSchema.parse(settings)

  db.prepare(`
    INSERT INTO settings (id, updated_at, payload)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      updated_at = excluded.updated_at,
      payload = excluded.payload
  `).run(parsed.id, now, JSON.stringify(parsed))

  return parsed
}
