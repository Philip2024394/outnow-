import { useRef, useState } from 'react'
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '@/services/authService'
import { saveProfile, uploadAvatar } from '@/services/profileService'
import { useAuth } from '@/hooks/useAuth'
import { COUNTRIES } from '@/screens/PhoneAuthScreen'
import { sendPhoneOTP, verifyOTP } from '@/services/authService'
import styles from './JoinSheet.module.css'

const STEPS = ['account', 'profile', 'phone']

export default function JoinSheet({ open, onClose }) {
  const { user } = useAuth()
  const [step, setStep] = useState('account')
  const [mode, setMode] = useState('signup') // 'signup' | 'signin'

  // account fields
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading]   = useState(false)

  // profile fields
  const [name, setName]           = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const fileRef = useRef()

  // phone fields
  const [dialCode, setDialCode] = useState('+44')
  const [localNum, setLocalNum] = useState('')
  const [otpStep, setOtpStep]   = useState('number') // 'number' | 'otp'
  const [otp, setOtp]           = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [phoneLoading, setPhoneLoading] = useState(false)

  const [error, setError] = useState(null)

  const selectedCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0]
  const fullPhone = dialCode + localNum.replace(/^\s*0+/, '').replace(/\D/g, '')

  // After auth succeeds, advance to profile step
  const afterAuth = () => {
    setError(null)
    setStep('profile')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // onAuthStateChange in AuthContext will update user;
      // move to profile step optimistically
      afterAuth()
    } catch {
      setError('Google sign-in failed. Try again.')
      setGoogleLoading(false)
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setEmailLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
      afterAuth()
    } catch (err) {
      setError(err.message ?? (mode === 'signup' ? 'Could not create account.' : 'Incorrect email or password.'))
      setEmailLoading(false)
    }
  }

  const handleProfileSave = async () => {
    if (!name.trim()) return
    setProfileLoading(true)
    setError(null)
    try {
      const uid = user?.id ?? user?.uid
      if (uid) {
        if (photoFile) await uploadAvatar(uid, photoFile)
        await saveProfile({ userId: uid, displayName: name.trim() })
      }
      setStep('phone')
    } catch (err) {
      setError(err.message ?? 'Could not save profile.')
    }
    setProfileLoading(false)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setPhoneLoading(true)
    try {
      const result = await sendPhoneOTP(fullPhone)
      setConfirmation(result)
      setOtpStep('otp')
    } catch (err) {
      setError(err.message ?? 'Could not send code. Check the number.')
    }
    setPhoneLoading(false)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setPhoneLoading(true)
    try {
      await verifyOTP(confirmation, otp)
      handleDone()
    } catch {
      setError('Invalid code. Please try again.')
      setPhoneLoading(false)
    }
  }

  const handleDone = () => {
    // Reset all state for next use
    setStep('account')
    setMode('signup')
    setEmail(''); setPassword(''); setName('')
    setPhotoFile(null); setPhotoPreview(null)
    setDialCode('+44'); setLocalNum(''); setOtp('')
    setOtpStep('number'); setError(null)
    onClose()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleDone()}>
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={handleDone} />

        {/* ── STEP: account ── */}
        {step === 'account' && (
          <div className={styles.content}>
            <div className={styles.emoji}>👋</div>
            <h2 className={styles.title}>
              {mode === 'signup' ? 'Join to connect' : 'Welcome back'}
            </h2>
            <p className={styles.sub}>
              {mode === 'signup'
                ? 'Free forever. Takes 30 seconds.'
                : 'Sign in to your account'}
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.googleBtn} onClick={handleGoogle} disabled={googleLoading}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M19.6 10.23c0-.68-.06-1.34-.16-1.98H10v3.74h5.39a4.6 4.6 0 01-2 3.02v2.51h3.24C18.34 15.88 19.6 13.27 19.6 10.23z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.13H1.09v2.6A10 10 0 0010 20z" fill="#34A853"/>
                <path d="M4.41 11.89A6.03 6.03 0 014.1 10c0-.66.11-1.3.31-1.89V5.51H1.09A10 10 0 000 10c0 1.62.39 3.14 1.09 4.49l3.32-2.6z" fill="#FBBC05"/>
                <path d="M10 3.98c1.46 0 2.78.5 3.81 1.49l2.86-2.86A9.97 9.97 0 0010 0 10 10 0 001.09 5.51l3.32 2.6C5.2 5.73 7.4 3.98 10 3.98z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <span className={styles.dividerLine} />
            </div>

            <form className={styles.form} onSubmit={handleEmailSubmit}>
              <input
                className={styles.input}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                required
              />
              <div className={styles.passWrap}>
                <input
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={emailLoading || !email || !password}
              >
                {emailLoading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <button className={styles.toggleMode} onClick={() => { setMode(m => m === 'signup' ? 'signin' : 'signup'); setError(null) }}>
              {mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Join free"}
            </button>
          </div>
        )}

        {/* ── STEP: profile ── */}
        {step === 'profile' && (
          <div className={styles.content}>
            <div className={styles.emoji}>📸</div>
            <h2 className={styles.title}>Add your photo & name</h2>
            <p className={styles.sub}>Profiles with a photo get 3× more matches</p>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.photoRow}>
              <button
                className={styles.photoCircle}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" className={styles.photoImg} />
                  : <span className={styles.photoPlus}>+</span>
                }
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.hidden}
                onChange={handlePhotoChange}
              />
              <button
                className={styles.photoLabel}
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                {photoPreview ? 'Change photo' : '📷 Add photo'}
              </button>
            </div>

            <input
              className={styles.input}
              type="text"
              placeholder="First name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoFocus
            />

            <button
              className={styles.primaryBtn}
              onClick={handleProfileSave}
              disabled={!name.trim() || profileLoading}
            >
              {profileLoading ? 'Saving…' : 'Continue →'}
            </button>

            <button className={styles.skipBtn} onClick={() => setStep('phone')}>
              Skip for now
            </button>
          </div>
        )}

        {/* ── STEP: phone ── */}
        {step === 'phone' && (
          <div className={styles.content}>
            <div className={styles.emoji}>📱</div>
            <h2 className={styles.title}>Verify your number</h2>
            <p className={styles.sub}>Helps keep the community real & safe</p>

            {error && <p className={styles.error}>{error}</p>}

            {otpStep === 'number' ? (
              <form className={styles.form} onSubmit={handleSendOTP}>
                <div className={styles.phoneRow}>
                  <div className={styles.dialWrapper}>
                    <span className={styles.dialFlag}>{selectedCountry.flag}</span>
                    <select
                      className={styles.dialSelect}
                      value={dialCode}
                      onChange={e => setDialCode(e.target.value)}
                      aria-label="Country code"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.name} value={c.dial}>
                          {c.flag} {c.name} ({c.dial})
                        </option>
                      ))}
                    </select>
                    <span className={styles.dialCode}>{dialCode}</span>
                    <span className={styles.dialChevron}>▾</span>
                  </div>
                  <input
                    className={styles.phoneInput}
                    type="tel"
                    placeholder="7700 900000"
                    value={localNum}
                    onChange={e => setLocalNum(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={phoneLoading || !localNum.trim()}
                >
                  {phoneLoading ? 'Sending…' : 'Send code'}
                </button>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleVerifyOTP}>
                <p className={styles.sentTo}>Code sent to {fullPhone}</p>
                <input
                  className={`${styles.input} ${styles.otpInput}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={phoneLoading || otp.length < 4}
                >
                  {phoneLoading ? 'Verifying…' : 'Verify'}
                </button>
                <button type="button" className={styles.skipBtn} onClick={() => setOtpStep('number')}>
                  ← Change number
                </button>
              </form>
            )}

            <button className={styles.skipBtn} onClick={handleDone}>
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
