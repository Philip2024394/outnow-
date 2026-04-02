import { useState } from 'react'
import { signInWithGoogle, signInWithEmail } from '@/services/authService'
import styles from './AuthScreen.module.css'

const HERO_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDF.png'

export default function AuthScreen({ onAdminPass, onGuest }) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPass, setShowPass]         = useState(false)
  const [error, setError]               = useState(null)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign-in failed. Try again.')
      setGoogleLoading(false)
    }
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setEmailLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch {
      setError('Incorrect email or password.')
      setEmailLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* Hero image */}
      <img src={HERO_URL} alt="" className={styles.hero} />
      <div className={styles.overlay} />

      {/* Tagline only — no logo image over hero */}
      <div className={styles.logoWrap}>
        <p className={styles.tagline}>Meet people who are out right now</p>
      </div>

      {/* Bottom sign-in panel */}
      <div className={styles.panel}>
        {error && <div className={styles.error}>{error}</div>}

        {/* Email / password form */}
        <form className={styles.form} onSubmit={handleEmail}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
          />
          <div className={styles.passwordWrap}>
            <input
              className={styles.input}
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
          <button
            type="submit"
            className={styles.signInBtn}
            disabled={emailLoading || !email || !password}
          >
            {emailLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <span className={styles.dividerLine} />
        </div>

        {/* Social buttons */}
        <button
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.68-.06-1.34-.16-1.98H10v3.74h5.39a4.6 4.6 0 01-2 3.02v2.51h3.24C18.34 15.88 19.6 13.27 19.6 10.23z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.13H1.09v2.6A10 10 0 0010 20z" fill="#34A853"/>
            <path d="M4.41 11.89A6.03 6.03 0 014.1 10c0-.66.11-1.3.31-1.89V5.51H1.09A10 10 0 000 10c0 1.62.39 3.14 1.09 4.49l3.32-2.6z" fill="#FBBC05"/>
            <path d="M10 3.98c1.46 0 2.78.5 3.81 1.49l2.86-2.86A9.97 9.97 0 0010 0 10 10 0 001.09 5.51l3.32 2.6C5.2 5.73 7.4 3.98 10 3.98z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        <button className={styles.phoneBtn} onClick={onAdminPass}>
          📱 Continue with Phone
        </button>

        <p className={styles.terms}>
          By continuing you agree to our Terms & Privacy Policy. Must be 18+.
        </p>

        <button className={styles.browseBtn} onClick={onGuest}>
          Browse the map first →
        </button>
      </div>
    </div>
  )
}
