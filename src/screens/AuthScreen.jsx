import { useState } from 'react'
import { signInWithGoogle } from '@/services/authService'
import Button from '@/components/ui/Button'
import PhoneAuthScreen from './PhoneAuthScreen'
import styles from './AuthScreen.module.css'

export default function AuthScreen() {
  const [showPhone, setShowPhone] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Sign-in failed. Try again.')
      setGoogleLoading(false)
    }
  }

  if (showPhone) {
    return <PhoneAuthScreen onBack={() => setShowPhone(false)} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.logo}>IMOUTNOW</div>
        <p className={styles.tagline}>See who's out right now.<br />Pay to join them.</p>
      </div>

      <div className={styles.actions}>
        {error && <div className={styles.error}>{error}</div>}

        <Button
          size="lg"
          fullWidth
          loading={googleLoading}
          onClick={handleGoogle}
          className={styles.googleBtn}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.68-.06-1.34-.16-1.98H10v3.74h5.39a4.6 4.6 0 01-2 3.02v2.51h3.24C18.34 15.88 19.6 13.27 19.6 10.23z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.13H1.09v2.6A10 10 0 0010 20z" fill="#34A853"/>
            <path d="M4.41 11.89A6.03 6.03 0 014.1 10c0-.66.11-1.3.31-1.89V5.51H1.09A10 10 0 000 10c0 1.62.39 3.14 1.09 4.49l3.32-2.6z" fill="#FBBC05"/>
            <path d="M10 3.98c1.46 0 2.78.5 3.81 1.49l2.86-2.86A9.97 9.97 0 0010 0 10 10 0 001.09 5.51l3.32 2.6C5.2 5.73 7.4 3.98 10 3.98z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={() => setShowPhone(true)}
        >
          📱 Continue with Phone
        </Button>

        <p className={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Must be 18+ to use this app.
        </p>
      </div>
    </div>
  )
}
