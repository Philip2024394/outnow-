import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/screens/AuthScreen'
import AppShell from '@/router/AppShell'
import WelcomeScreen from '@/screens/WelcomeScreen'
import ProfileScreen from '@/screens/ProfileScreen'
import Spinner from '@/components/ui/Spinner'
import AdminApp from '@/admin/AdminApp'
import { GuestGateProvider } from '@/contexts/GuestGateContext'
import DevPanel from '@/dev/DevPanel'
import styles from './App.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

// Route /admin path to the admin dashboard
if (window.location.pathname.startsWith('/admin')) {
  document.title = 'IMOUTNOW Admin'
}

export default function App() {
  // Render admin dashboard for /admin route
  if (window.location.pathname.startsWith('/admin')) {
    return <AdminApp />
  }
  const { user, userProfile, loading } = useAuth()
  const [adminPass, setAdminPass] = useState(false)
  const [guestMode, setGuestMode] = useState(false)
  const [returnParams, setReturnParams] = useState(null)

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
      if (!adminPass) { setOnboardStep('checking'); resolvedRef.current = null }
      return
    }
    if (resolvedRef.current === user.uid) return  // already resolved for this user
    resolvedRef.current = user.uid
    // New user = no lookingFor set yet → show welcome → profile setup
    // Returning user → go straight to map
    if (!userProfile?.lookingFor) {
      setOnboardStep('welcome')
    } else {
      setOnboardStep('done')
    }
  }, [user, userProfile, adminPass])

  // Admin dev: bypass auth + skip onboarding → straight to app
  const handleAdminDev = () => {
    setAdminPass(true)
    setOnboardStep('done')
  }

  // New-user onboarding handlers
  const handleWelcomeDone = () => setOnboardStep('profile')
  const handleProfileDone = () => setOnboardStep('done')

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
        onGuest={() => setGuestMode(true)}
        onAdminDev={handleAdminDev}
      />
    )
  }

  return (
    <GuestGateProvider>
      <DevPanel />

      {/* ── New user: welcome slides ── */}
      {onboardStep === 'welcome' && (
        <WelcomeScreen onDone={handleWelcomeDone} />
      )}

      {/* ── New user: profile setup (required before map) ── */}
      {onboardStep === 'profile' && (
        <ProfileScreen onClose={handleProfileDone} onboarding />
      )}

      {/* ── Returning user or after onboarding complete ── */}
      {(guestMode || onboardStep === 'done') && (
        <AppShell returnParams={returnParams} triggerGoLive={triggerGoLive} />
      )}

    </GuestGateProvider>
  )
}
