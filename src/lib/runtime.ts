export type AppPlatform = 'android' | 'ios' | 'web'

export function getPlatform(): AppPlatform {
  if (typeof navigator === 'undefined') return 'web'
  const ua = navigator.userAgent
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'web'
}

export function isNativeApp() {
  return false
}

export function supportsServiceWorker() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export function supportsWebNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}
