import { Component, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LandingScreen from '@/screens/LandingScreen'
import JoinSheet from '@/screens/onboarding/JoinSheet'
import AppShell from '@/router/AppShell'
import WelcomeScreen from '@/screens/WelcomeScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import LocationGateScreen from '@/screens/LocationGateScreen'
import Spinner from '@/components/ui/Spinner'
import { GuestGateProvider } from '@/contexts/GuestGateContext'
import { LanguageProvider } from '@/i18n'
import LanguageToast from '@/components/ui/LanguageToast'
import DevPanel from '@/dev/DevPanel'
import styles from './App.module.css'

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
      console.error('[Hangger] Uncaught render error:', error, info)
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
            {import.meta.env.DEV ? this.state.error?.message : 'Hangger hit an unexpected error.'}
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

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

export default function App() {
  const { user, userProfile, loading } = useAuth()
  const [guestMode, setGuestMode] = useState(false)
  const [returnParams, setReturnParams] = useState(null)
  const [joinOpen, setJoinOpen] = useState(false)

  // Onboarding step:
  //  'checking'  — waiting for auth + profile to load
  //  'welcome'   — brand new user, show intro slides
  //  'profile'   — new user must complete their profile
  //  'done'      — returning user, go straight to map
  const [onboardStep, setOnboardStep] = useState('checking')
  const [triggerGoLive] = useState(false)

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
            <img src={LOGO_URL} alt="Hangger" className={styles.splashLogo} />
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
            onSignIn={() => setJoinOpen(true)}
            onBrowse={() => setGuestMode(true)}
          />
          <JoinSheet open={joinOpen} onClose={() => setJoinOpen(false)} />
          <LanguageToast />
        </LanguageProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <GuestGateProvider>
          <DevPanel />
          <LanguageToast />

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
            <AppShell returnParams={returnParams} triggerGoLive={triggerGoLive} />
          )}

        </GuestGateProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}
