const API_BASE_URL_STORAGE_KEY = 'reset.apiBaseUrl'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function normalizeApiBaseUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimTrailingSlash(trimmed)
}

export function getStoredApiBaseUrl() {
  if (typeof window === 'undefined') {
    return null
  }

  return normalizeApiBaseUrl(window.localStorage.getItem(API_BASE_URL_STORAGE_KEY))
}

export function setStoredApiBaseUrl(value: string) {
  if (typeof window === 'undefined') {
    return null
  }

  const normalized = normalizeApiBaseUrl(value)

  if (!normalized) {
    window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY)
    return null
  }

  window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized)
  return normalized
}
