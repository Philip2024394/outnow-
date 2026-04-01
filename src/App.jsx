import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/screens/AuthScreen'
import AppShell from '@/router/AppShell'
import Spinner from '@/components/ui/Spinner'
import WelcomePopup from '@/screens/onboarding/WelcomePopup'
import ProfileSetup from '@/screens/onboarding/ProfileSetup'
import styles from './App.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

const ONBOARDING_KEY = 'imoutnow_onboarded_v1'

export default function App() {
  const { user, loading } = useAuth()
  const [returnParams, setReturnParams] = useState(null)

  // Onboarding state
  const [onboardStep, setOnboardStep] = useState(() => {
    // If already completed, skip straight to app
    if (localStorage.getItem(ONBOARDING_KEY)) return 'done'
    return 'welcome' // 'welcome' → 'setup' → 'done'
  })

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

  if (!user) return <AuthScreen />

  return (
    <>
      <AppShell returnParams={returnParams} />

      {/* Onboarding overlays — shown once on first visit */}
      {onboardStep === 'welcome' && (
        <WelcomePopup onDone={() => setOnboardStep('setup')} />
      )}
      {onboardStep === 'setup' && (
        <ProfileSetup
          onDone={(profile) => {
            // In a real app: save profile to Firestore here
            localStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile))
            setOnboardStep('done')
          }}
        />
      )}
    </>
  )
}
