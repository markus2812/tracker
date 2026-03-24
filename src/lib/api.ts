import type { DailyEntry } from './schema'

const fallbackBaseUrl = '/api'

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL
  if (!configuredUrl) {
    return fallbackBaseUrl
  }

  return configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl
}

async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(typeof payload?.error === 'string' ? payload.error : `API request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function listRemoteEntries() {
  return apiRequest<DailyEntry[]>('/entries')
}

export async function upsertRemoteEntry(entry: DailyEntry) {
  return apiRequest<DailyEntry>(`/entries/${entry.date}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  })
}
