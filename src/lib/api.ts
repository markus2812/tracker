import type { DailyEntry, Settings } from './schema'
import { getStoredApiBaseUrl } from './api-config'
import { isNativeApp } from './runtime'

const fallbackBaseUrl = '/api'

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL
  const storedUrl = getStoredApiBaseUrl()

  const resolvedUrl = configuredUrl || storedUrl
  if (resolvedUrl) {
    return resolvedUrl.endsWith('/') ? resolvedUrl.slice(0, -1) : resolvedUrl
  }

  if (isNativeApp()) {
    throw new Error('Set the server URL in Settings to enable sync in the mobile app.')
  }

  return fallbackBaseUrl
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

export async function getRemoteSettings() {
  return apiRequest<Settings>('/settings')
}

export async function upsertRemoteSettings(settings: Settings) {
  return apiRequest<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
