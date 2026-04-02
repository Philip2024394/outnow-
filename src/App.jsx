import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/screens/AuthScreen'
import AppShell from '@/router/AppShell'
import Spinner from '@/components/ui/Spinner'
import WelcomePopup from '@/screens/onboarding/WelcomePopup'
import ProfileSetup from '@/screens/onboarding/ProfileSetup'
import GoLivePrompt from '@/screens/onboarding/GoLivePrompt'
import AdminApp from '@/admin/AdminApp'
import { GuestGateProvider } from '@/contexts/GuestGateContext'
import styles from './App.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const ONBOARDING_BASE_KEY = 'imoutnow_onboarded_v1'

// Route /admin path to the admin dashboard
if (window.location.pathname.startsWith('/admin')) {
  document.title = 'IMOUTNOW Admin'
}

export default function App() {
  // Render admin dashboard for /admin route
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />
  }
  const { user, loading } = useAuth()
  const [adminPass, setAdminPass] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [returnParams, setReturnParams] = useState(null)

  // Onboarding step — starts 'checking' until we know the user's id,
  // then resolves to 'setup' (new user) or 'done' (returning user).
  const [onboardStep, setOnboardStep] = useState('checking')
  const [triggerGoLive, setTriggerGoLive] = useState(false)

  // Resolve onboarding state per-user so each new account sees onboarding
  const resolvedRef = useRef(null)
  useEffect(() => {
    if (!user) { setOnboardStep('checking'); resolvedRef.current = null; return }
    if (resolvedRef.current === user.id) return  // already resolved for this user
    resolvedRef.current = user.id
    const key = `${ONBOARDING_BASE_KEY}_${user.id}`
    setOnboardStep(localStorage.getItem(key) ? 'done' : 'setup')
  }, [user])

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
      <div className={styles.splash}>
        <img src={LOGO_URL} alt="IMOUTNOW" className={styles.splashLogo} />
        <Spinner size={28} color="var(--color-live)" />
      </div>
    )
  }

  // Show auth screen until they sign in OR choose to browse as guest
  if (!user && !adminPass && !guestMode) {
    return (
      <AuthScreen
        onAdminPass={() => setAdminPass(true)}
        onGuest={() => setGuestMode(true)}
      />
    )
  }

  return (
    <GuestGateProvider>
      <AppShell returnParams={returnParams} triggerGoLive={triggerGoLive} />

      {/* Onboarding overlays — only shown to signed-in users, once on first visit */}
      {user && onboardStep === 'welcome' && (
        <WelcomePopup onDone={() => setOnboardStep('setup')} />
      )}
      {user && onboardStep === 'setup' && (
        <ProfileSetup
          onDone={(profile) => {
            localStorage.setItem(`${ONBOARDING_BASE_KEY}_${user.id}`, JSON.stringify(profile))
            setOnboardStep('golive')
          }}
        />
      )}
      {user && onboardStep === 'golive' && (
        <GoLivePrompt
          onGoLive={() => { setTriggerGoLive(true); setOnboardStep('done') }}
          onSkip={() => setOnboardStep('done')}
        />
      )}
    </GuestGateProvider>
  )
}
