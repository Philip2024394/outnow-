import { useState } from 'react'
import { sendPhoneOTP, verifyOTP } from '@/services/authService'
import Button from '@/components/ui/Button'
import styles from './PhoneAuthScreen.module.css'

const COUNTRIES = [
  { flag: '🇬🇧', name: 'United Kingdom', dial: '+44' },
  { flag: '🇺🇸', name: 'United States',  dial: '+1'  },
  { flag: '🇨🇦', name: 'Canada',          dial: '+1'  },
  { flag: '🇦🇺', name: 'Australia',       dial: '+61' },
  { flag: '🇮🇪', name: 'Ireland',         dial: '+353'},
  { flag: '🇿🇦', name: 'South Africa',    dial: '+27' },
  { flag: '🇳🇬', name: 'Nigeria',         dial: '+234'},
  { flag: '🇬🇭', name: 'Ghana',           dial: '+233'},
  { flag: '🇰🇪', name: 'Kenya',           dial: '+254'},
  { flag: '🇺🇬', name: 'Uganda',          dial: '+256'},
  { flag: '🇹🇿', name: 'Tanzania',        dial: '+255'},
  { flag: '🇩🇪', name: 'Germany',         dial: '+49' },
  { flag: '🇫🇷', name: 'France',          dial: '+33' },
  { flag: '🇪🇸', name: 'Spain',           dial: '+34' },
  { flag: '🇮🇹', name: 'Italy',           dial: '+39' },
  { flag: '🇳🇱', name: 'Netherlands',     dial: '+31' },
  { flag: '🇸🇪', name: 'Sweden',          dial: '+46' },
  { flag: '🇳🇴', name: 'Norway',          dial: '+47' },
  { flag: '🇩🇰', name: 'Denmark',         dial: '+45' },
  { flag: '🇵🇱', name: 'Poland',          dial: '+48' },
  { flag: '🇵🇹', name: 'Portugal',        dial: '+351'},
  { flag: '🇧🇷', name: 'Brazil',          dial: '+55' },
  { flag: '🇲🇽', name: 'Mexico',          dial: '+52' },
  { flag: '🇮🇳', name: 'India',           dial: '+91' },
  { flag: '🇵🇰', name: 'Pakistan',        dial: '+92' },
  { flag: '🇧🇩', name: 'Bangladesh',      dial: '+880'},
  { flag: '🇵🇭', name: 'Philippines',     dial: '+63' },
  { flag: '🇸🇬', name: 'Singapore',       dial: '+65' },
  { flag: '🇲🇾', name: 'Malaysia',        dial: '+60' },
  { flag: '🇦🇪', name: 'UAE',             dial: '+971'},
  { flag: '🇸🇦', name: 'Saudi Arabia',    dial: '+966'},
  { flag: '🇯🇵', name: 'Japan',           dial: '+81' },
  { flag: '🇰🇷', name: 'South Korea',     dial: '+82' },
  { flag: '🇨🇳', name: 'China',           dial: '+86' },
  { flag: '🇳🇿', name: 'New Zealand',     dial: '+64' },
]

export default function PhoneAuthScreen({ onBack }) {
  const [dialCode, setDialCode]   = useState('+44')
  const [localNum, setLocalNum]   = useState('')
  const [otp, setOtp]             = useState('')
  const [step, setStep]           = useState('phone') // 'phone' | 'otp'
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  // Build E.164: strip leading zero from local number, prepend dial code
  const fullPhone = dialCode + localNum.replace(/^\s*0+/, '').replace(/\D/g, '')
  const selectedCountry = COUNTRIES.find(c => c.dial === dialCode) ?? COUNTRIES[0]

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await sendPhoneOTP(fullPhone)
      setConfirmation(result)
      setStep('otp')
    } catch (err) {
      setError(err.message ?? 'Failed to send OTP. Check your number.')
    }
    setLoading(false)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyOTP(confirmation, otp)
      // Auth state change handled by AuthContext
    } catch {
      setError('Invalid code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <button className={styles.back} onClick={onBack}>← Back</button>

      <div className={styles.content}>
        <div className={styles.logo}>IMOUTNOW</div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className={styles.form}>
            <h2 className={styles.heading}>Your phone number</h2>
            <p className={styles.sub}>We'll send a verification code by SMS</p>

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
                type="tel"
                placeholder="7700 900000"
                value={localNum}
                onChange={e => setLocalNum(e.target.value)}
                className={styles.phoneInput}
                autoFocus
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Send Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            <h2 className={styles.heading}>Enter the code</h2>
            <p className={styles.sub}>Sent to {fullPhone}</p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className={[styles.input, styles.otpInput].join(' ')}
              autoFocus
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Verify
            </Button>

            <button
              type="button"
              className={styles.resend}
              onClick={() => setStep('phone')}
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
