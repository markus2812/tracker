import { Capacitor } from '@capacitor/core'

export type AppPlatform = 'android' | 'ios' | 'web'

export function getPlatform(): AppPlatform {
  const platform = Capacitor.getPlatform()
  return platform === 'android' || platform === 'ios' ? platform : 'web'
}

export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

export function supportsServiceWorker() {
  return !isNativeApp() && typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export function supportsWebNotifications() {
  return !isNativeApp() && typeof window !== 'undefined' && 'Notification' in window
}
