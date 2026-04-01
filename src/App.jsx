import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import AuthScreen from '@/screens/AuthScreen'
import AppShell from '@/router/AppShell'
import Spinner from '@/components/ui/Spinner'
import styles from './App.module.css'

export default function App() {
  const { user, loading } = useAuth()
  const [returnParams, setReturnParams] = useState(null)

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('unlock')) {
      setReturnParams({
        unlockStatus: params.get('unlock'),
        sessionId: params.get('session'),
      })
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (loading) {
    return (
      <div className={styles.splash}>
        <div className={styles.logo}>IMOUTNOW</div>
        <Spinner size={28} color="var(--color-live)" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <AppShell returnParams={returnParams} />
}
