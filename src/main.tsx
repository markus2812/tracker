import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { supportsServiceWorker } from './lib/runtime'

if (import.meta.env.PROD && supportsServiceWorker()) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}

if (import.meta.env.DEV && supportsServiceWorker()) {
  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister()
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
