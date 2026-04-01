import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/screens/AuthScreen'
import AppShell from '@/router/AppShell'
import Spinner from '@/components/ui/Spinner'
import WelcomePopup from '@/screens/onboarding/WelcomePopup'
import ProfileSetup from '@/screens/onboarding/ProfileSetup'
import GoLivePrompt from '@/screens/onboarding/GoLivePrompt'
import AdminApp from '@/admin/AdminApp'
import styles from './App.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const ONBOARDING_KEY = 'imoutnow_onboarded_v1'

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
  const [returnParams, setReturnParams] = useState(null)

  // Onboarding state: 'welcome' → 'setup' → 'golive' → 'done'
  const [onboardStep, setOnboardStep] = useState(() => {
    if (localStorage.getItem(ONBOARDING_KEY)) return 'done'
    return 'welcome'
  })
  const [triggerGoLive, setTriggerGoLive] = useState(false)

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

  if (!user && !adminPass) return <AuthScreen onAdminPass={() => setAdminPass(true)} />

  return (
    <>
      <AppShell returnParams={returnParams} triggerGoLive={triggerGoLive} />

      {/* Onboarding overlays — shown once on first visit */}
      {onboardStep === 'welcome' && (
        <WelcomePopup onDone={() => setOnboardStep('setup')} />
      )}
      {onboardStep === 'setup' && (
        <ProfileSetup
          onDone={(profile) => {
            localStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile))
            setOnboardStep('golive')
          }}
        />
      )}
      {onboardStep === 'golive' && (
        <GoLivePrompt
          onGoLive={() => { setTriggerGoLive(true); setOnboardStep('done') }}
          onSkip={() => setOnboardStep('done')}
        />
      )}
    </>
  )
}
