import { db } from './db'

export async function exportEntriesAsJson() {
  const entries = await db.entries.orderBy('date').toArray()
  const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reset-export-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}
