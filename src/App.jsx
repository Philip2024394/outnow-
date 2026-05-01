import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LandingScreen from '@/screens/LandingScreen'
import JoinSheet from '@/screens/onboarding/JoinSheet'
import WelcomeScreen from '@/screens/WelcomeScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import LocationGateScreen from '@/screens/LocationGateScreen'
import Spinner from '@/components/ui/Spinner'
import { GuestGateProvider } from '@/contexts/GuestGateContext'
import { LanguageProvider } from '@/i18n'
import LanguageToast from '@/components/ui/LanguageToast'
import DesktopNav from '@/components/desktop/DesktopNav'
import WebsiteLanding from '@/components/desktop/WebsiteLanding'
import PropertyLanding from '@/components/desktop/PropertyLanding'
import WebsitePropertyModule from '@/components/desktop/WebsitePropertyModule'
import styles from './App.module.css'

// Lazy-loaded: AppShell is the heaviest module — only needed after onboarding
const AppShell = lazy(() => import('@/router/AppShell'))
// DevPanel only used in dev mode
const DevPanel = lazy(() => import('@/dev/DevPanel'))

// ── Error Boundary — catches any render crash and shows a recovery screen ──
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { crashed: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console in dev; wire to Sentry / Supabase log in prod
    if (import.meta.env.DEV) {
      console.error('[Indoo] Uncaught render error:', error, info)
    }
  }

  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#07070f',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 32, textAlign: 'center',
        }}>
          <span style={{ fontSize: 48 }}>⚡</span>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
            Something went wrong
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.6 }}>
            {import.meta.env.DEV ? this.state.error?.message : 'Indoo hit an unexpected error.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: '12px 28px', borderRadius: 12,
              background: '#F472B6', color: '#fff',
              border: 'none', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// import CategorySelector from '@/components/ui/CategorySelector'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

// ── Keyboard viewport fix — scrolls focused input into view ──
if (typeof window !== 'undefined' && window.visualViewport) {
  let pendingScroll = null
  window.visualViewport.addEventListener('resize', () => {
    clearTimeout(pendingScroll)
    pendingScroll = setTimeout(() => {
      const el = document.activeElement
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  })
}

export default function App() {
  const { user, userProfile, loading } = useAuth()
  const [guestMode, setGuestMode] = useState(() => localStorage.getItem('indoo_registered') === 'true')

  // Desktop website mode — remove phone frame
  useEffect(() => {
    const isDesktop = window.innerWidth >= 768
    const isWebRoute = ['/', '/property', '/rentals', '/places', '/agents'].includes(window.location.pathname)
    if (isDesktop && isWebRoute) {
      document.documentElement.classList.add('desktop-website')
      document.getElementById('root')?.classList.add('desktop-website')
    } else {
      document.documentElement.classList.remove('desktop-website')
      document.getElementById('root')?.classList.remove('desktop-website')
    }
  }, [])

  // Auto-update detection
  const [updateReady, setUpdateReady] = useState(false)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // In dev mode, unregister ALL service workers and clear caches
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
      return
    }
    navigator.serviceWorker.register('/sw.js').then(reg => {
      setInterval(() => reg.update(), 60000)
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true)
        })
      })
    }).catch(() => {})
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return; refreshing = true; window.location.reload()
    })
  }, [])
  const [returnParams, setReturnParams] = useState(null)
  const [joinOpen, setJoinOpen] = useState(false)

  // Onboarding step:
  //  'checking'  — waiting for auth + profile to load
  //  'welcome'   — brand new user, show intro slides
  //  'profile'   — new user must complete their profile
  //  'done'      — returning user, go straight to map
  const [onboardStep, setOnboardStep] = useState('checking')

  // Resolve onboarding state per-user so each new account sees onboarding
  const resolvedRef = useRef(null)
  useEffect(() => {
    if (!user) {
      setOnboardStep('checking'); resolvedRef.current = null
      return
    }
    if (resolvedRef.current === user.uid) return  // already resolved for this user
    resolvedRef.current = user.uid
    // Demo / preview mode — skip all onboarding gates
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      setOnboardStep('done')
      return
    }
    // New user = no lookingFor set yet → show welcome → profile setup
    // Returning user → always confirm location each session
    if (!userProfile?.lookingFor) {
      setOnboardStep('welcome')
    } else {
      setOnboardStep('location')
    }
  }, [user, userProfile])


  // New-user onboarding handlers
  const handleWelcomeDone = () => setOnboardStep('profile')
  const handleProfileDone = () => {
    setOnboardStep('location')
  }
  const handleLocationConfirmed = () => setOnboardStep('done')

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('unlock')) {
      setReturnParams({
        unlockStatus: params.get('unlock'),
        sessionId: params.get('session'),
      })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <ErrorBoundary>
        <LanguageProvider>
          <div className={styles.splash}>
            <img src={LOGO_URL} alt="Indoo" className={styles.splashLogo} />
            <Spinner size={28} color="var(--color-live)" />
          </div>
        </LanguageProvider>
      </ErrorBoundary>
    )
  }

  // Show landing page until they sign in OR choose to browse as guest
  if (!user && !guestMode) {
    return (
      <ErrorBoundary>
        <LanguageProvider>
          <LandingScreen
            onGetStarted={() => setJoinOpen(true)}
            onBrowse={() => setGuestMode(true)}
          />
          <JoinSheet open={joinOpen} onClose={() => { setJoinOpen(false); localStorage.setItem('indoo_registered', 'true'); setGuestMode(true) }} />
          <LanguageToast />
        </LanguageProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GuestGateProvider>
          {/* App update banner */}
          {updateReady && (
            <div style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: 16, right: 16, zIndex: 999999, padding: '12px 16px', background: 'rgba(141,198,63,0.95)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#000', flex: 1 }}>New update available</span>
              <button onClick={() => { navigator.serviceWorker.ready.then(r => { if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' }) }) }} style={{ padding: '8px 16px', borderRadius: 10, background: '#000', border: 'none', color: '#8DC63F', fontSize: 13, fontWeight: 900, cursor: 'pointer' }}>Update Now</button>
            </div>
          )}
          <LanguageToast />

          {/* ── Desktop website view (768px+) — separate from mobile app ── */}
          {(() => {
            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
            const isWebRoute = ['/', '/property', '/rentals', '/places', '/agents'].includes(window.location.pathname)
            if (isDesktop && isWebRoute) {
              return (
                <>
                  {window.location.pathname === '/property' ? (
                    <WebsitePropertyModule />
                  ) : (
                    <>
                    <DesktopNav onNavigate={(section) => { /* future: route to section */ }} />
                    <WebsiteLanding
                      onBrowse={() => { setGuestMode(true) }}
                      onSearch={() => { setGuestMode(true) }}
                    />
                    </>
                  )}
                </>
              )
            }
            return null
          })()}

          {/* ── Mobile app flow (or desktop when not on web routes) ── */}
          {(() => {
            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768
            const isWebRoute = ['/', '/property', '/rentals', '/places', '/agents'].includes(window.location.pathname)
            if (isDesktop && isWebRoute) return null // website handles these routes on desktop
            return (
              <>
                {/* ── New user: welcome slides ── */}
                {onboardStep === 'welcome' && (
                  <WelcomeScreen onDone={handleWelcomeDone} />
                )}

                {/* ── New user: profile setup (required before map) ── */}
                {onboardStep === 'profile' && (
                  <ProfileScreen onClose={handleProfileDone} onboarding />
                )}

                {/* ── Location confirmation gate ── */}
                {onboardStep === 'location' && (
                  <LocationGateScreen onConfirmed={handleLocationConfirmed} />
                )}

                {/* ── Returning user or after onboarding complete ── */}
                {(guestMode || onboardStep === 'done') && (
                  <Suspense fallback={
                    <div className={styles.splash}>
                      <img src={LOGO_URL} alt="Indoo" className={styles.splashLogo} />
                      <Spinner size={28} color="var(--color-live)" />
                    </div>
                  }>
                    <AppShell returnParams={returnParams} />
                  </Suspense>
                )}
              </>
            )
          })()}

        </GuestGateProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
