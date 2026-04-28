import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'indoo_pwa_dismissed'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY))
  const [isIOS, setIsIOS] = useState(false)
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false)

  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    // Register service worker + detect updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60000)

        // Detect when a new service worker is waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — prompt user
              setUpdateAvailable(true)
            }
          })
        })
      }).catch(() => {})

      // When the new SW takes over, reload the page
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    }

    // Detect iOS Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Detect standalone (already installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsInStandaloneMode(standalone)
    if (standalone) setIsInstalled(true)

    // Chrome / Android install prompt
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setIsDismissed(true)
  }

  const canShowBanner = !isInstalled && !isDismissed && !isInStandaloneMode
    && (!!installPrompt || isIOS)

  const applyUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
      })
    }
  }

  return { install, dismiss, canShowBanner, isIOS, isInstalled, updateAvailable, applyUpdate }
}
