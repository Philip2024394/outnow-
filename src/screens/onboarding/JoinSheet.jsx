import { useRef, useState } from 'react'
import { saveProfile, uploadAvatar } from '@/services/profileService'
import { useAuth } from '@/hooks/useAuth'
import { COUNTRIES } from '@/screens/PhoneAuthScreen'
import { sendPhoneOTP, verifyOTP, signInWithGoogle } from '@/services/authService'
import { useLanguage } from '@/i18n'
import styles from './JoinSheet.module.css'

// Steps: phone → otp → profile
export default function JoinSheet({ open, onClose, initialStep = 'phone' }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const fileRef = useRef()

  const [step, setStep]           = useState(initialStep) // 'phone' | 'otp' | 'profile' | 'signin'
  const [dialCode, setDialCode]   = useState('+62')       // Indonesia default
  const [localNum, setLocalNum]   = useState('')
  const [otp, setOtp]             = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [name, setName]           = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  // Sign-in mode (returning users)
  const [googleLoading, setGoogleLoading] = useState(false)

  const selectedCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0]
  const fullPhone = dialCode + localNum.replace(/^\s*0+/, '').replace(/\D/g, '')

  const reset = () => {
    setStep(initialStep)
    setDialCode('+62'); setLocalNum(''); setOtp('')
    setConfirmation(null); setName('')
    setPhotoFile(null); setPhotoPreview(null)
    setLoading(false); setError(null)
  }

  const handleClose = () => { reset(); onClose() }

  // ── Phone: send OTP ──
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await sendPhoneOTP(fullPhone)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      setError(err.message ?? 'Could not send code. Check the number.')
    }
    setLoading(false)
  }

  // ── OTP: verify ──
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyOTP(confirmation, otp)
      setStep('profile')
    } catch {
      setError('Invalid code. Please try again.')
    }
    setLoading(false)
  }

  // ── Profile: save name + photo ──
  const handleProfileSave = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const uid = user?.id ?? user?.uid
      if (uid) {
        if (photoFile) await uploadAvatar(uid, photoFile)
        await saveProfile({ userId: uid, displayName: name.trim() })
      }
      handleClose()
    } catch (err) {
      setError(err.message ?? 'Could not save profile.')
    }
    setLoading(false)
  }

  // ── Google sign-in (sign-in tab) ──
  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      setStep('profile')
    } catch {
      setError('Google sign-in failed. Try again.')
      setGoogleLoading(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  if (!open) return null

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className={styles.sheet}>
        <div className={styles.handle} onClick={handleClose} />

        {/* ── STEP: phone number ── */}
        {step === 'phone' && (
          <div className={styles.content}>
            <div className={styles.emoji}>📱</div>
            <h2 className={styles.title}>{t('join.phone.title')}</h2>
            <p className={styles.sub}>{t('join.phone.sub')}</p>

            {error && <p className={styles.error}>{error}</p>}

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
                  placeholder={t('join.phone.placeholder')}
                  value={localNum}
                  onChange={e => setLocalNum(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={loading || localNum.trim().length < 6}
              >
                {loading ? t('join.phone.sending') : t('join.phone.send')}
              </button>
            </form>

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>{t('common.or')}</span>
              <span className={styles.dividerLine} />
            </div>

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
              {googleLoading ? t('join.google.loading') : t('join.google')}
            </button>
          </div>
        )}

        {/* ── STEP: OTP ── */}
        {step === 'otp' && (
          <div className={styles.content}>
            <div className={styles.emoji}>🔐</div>
            <h2 className={styles.title}>{t('join.otp.title')}</h2>
            <p className={styles.sub}>{t('join.otp.sentTo')} {fullPhone}</p>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.form} onSubmit={handleVerifyOTP}>
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
                disabled={loading || otp.length < 4}
              >
                {loading ? t('join.otp.verifying') : t('join.otp.verify')}
              </button>
            </form>

            <button
              type="button"
              className={styles.skipBtn}
              onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
            >
              {t('join.otp.change')}
            </button>
          </div>
        )}

        {/* ── STEP: profile ── */}
        {step === 'profile' && (
          <div className={styles.content}>
            <div className={styles.emoji}>👤</div>
            <h2 className={styles.title}>{t('join.profile.title')}</h2>
            <p className={styles.sub}>{t('join.profile.sub')}</p>

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
                {photoPreview ? t('join.profile.changePhoto') : t('join.profile.addPhoto')}
              </button>
            </div>

            <input
              className={styles.input}
              type="text"
              placeholder={t('join.profile.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={24}
              autoFocus
            />

            <button
              className={styles.primaryBtn}
              onClick={handleProfileSave}
              disabled={!name.trim() || loading}
            >
              {loading ? t('join.profile.saving') : t('join.profile.save')}
            </button>

            <button className={styles.skipBtn} onClick={handleClose}>
              {t('join.profile.skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
