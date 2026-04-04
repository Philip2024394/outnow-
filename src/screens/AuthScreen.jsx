import { useState, useEffect } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/services/authService'
import styles from './AuthScreen.module.css'

const HERO_URL  = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDF.png'
const INTRO_VIDEO = 'https://ik.imagekit.io/nepgaxllc/good.mp4?updatedAt=1775120536152'

// Step 1: email entry → Step 2: password (sign-in or create account)
export default function AuthScreen({ onAdminPass, onGuest, onDevPreview, onAdminDev }) {
  // Preload the intro video while the user is on this screen
  useEffect(() => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.src     = INTRO_VIDEO
    video.muted   = true
    video.style.cssText = 'position:absolute;width:0;height:0;opacity:0;pointer-events:none'
    document.body.appendChild(video)
    return () => { video.src = ''; document.body.removeChild(video) }
  }, [])
  const [step, setStep]         = useState('email') // 'email' | 'signin' | 'signup'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  // Try signing in with a dummy password — if error is "Invalid login credentials"
  // the account exists but password is wrong; if "Email not confirmed" it exists too.
  // Any other error (e.g. network) we surface. No match = new user.
  const handleEmailContinue = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)
    try {
      // Attempt sign-in with a sentinel password to detect if account exists
      await signInWithEmail(email, '__probe__')
    } catch (err) {
      const msg = err.message ?? ''
      if (
        msg.includes('Invalid login credentials') ||
        msg.includes('Email not confirmed') ||
        msg.includes('invalid_credentials')
      ) {
        // Account exists — go to sign-in
        setStep('signin')
      } else {
        // Account not found — go to create account
        setStep('signup')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch {
      setError('Incorrect password. Please try again.')
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!password || !confirm) return
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError(null)
    try {
      await signUpWithEmail(email, password)
    } catch (err) {
      setError(err.message ?? 'Could not create account. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <img src={HERO_URL} alt="" className={styles.hero} />
      <div className={styles.overlay} />

      <div className={styles.logoWrap}>
        <p className={styles.tagline}>Meet people who are out right now</p>
      </div>

      <div className={styles.panel}>
        {error && <div className={styles.error}>{error}</div>}

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <form className={styles.form} onSubmit={handleEmailContinue}>
            <input
              className={styles.input}
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoFocus
            />
            <button
              type="submit"
              className={styles.signInBtn}
              disabled={loading || !email}
            >
              {loading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        )}

        {/* ── Step 2a: Sign In ── */}
        {step === 'signin' && (
          <form className={styles.form} onSubmit={handleSignIn}>
            <div className={styles.emailRow}>
              <span className={styles.emailDisplay}>{email}</span>
              <button type="button" className={styles.changeBtn} onClick={() => { setStep('email'); setError(null) }}>
                Change
              </button>
            </div>
            <p className={styles.stepLabel}>Welcome back — enter your password</p>
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            <button type="submit" className={styles.signInBtn} disabled={loading || !password}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button type="button" className={styles.switchBtn} onClick={() => { setStep('signup'); setError(null) }}>
              No account? Create one instead
            </button>
          </form>
        )}

        {/* ── Step 2b: Create Account ── */}
        {step === 'signup' && (
          <form className={styles.form} onSubmit={handleSignUp}>
            <div className={styles.emailRow}>
              <span className={styles.emailDisplay}>{email}</span>
              <button type="button" className={styles.changeBtn} onClick={() => { setStep('email'); setError(null) }}>
                Change
              </button>
            </div>
            <p className={styles.stepLabel}>Create your account</p>
            <div className={styles.passwordWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="Choose a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                autoFocus
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            <input
              className={styles.input}
              type={showPass ? 'text' : 'password'}
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <button type="submit" className={styles.signInBtn} disabled={loading || !password || !confirm}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <button type="button" className={styles.switchBtn} onClick={() => { setStep('signin'); setError(null) }}>
              Already have an account? Sign in
            </button>
          </form>
        )}

        <button className={styles.phoneBtn} onClick={onAdminPass}>
          📱 Continue with Phone
        </button>

        <p className={styles.terms}>
          By continuing you agree to our Terms & Privacy Policy. Must be 18+.
        </p>

        <button className={styles.browseBtn} onClick={onGuest}>
          Browse the map first →
        </button>

        <button className={styles.devBtn} onClick={onDevPreview}>
          🛠 Dev: preview new user flow
        </button>
        <button className={styles.devBtn} onClick={onAdminDev}>
          ⚡ Admin Dev — Skip to App
        </button>
      </div>
    </div>
  )
}
