import { useState } from 'react'
import { sendPhoneOTP, verifyOTP } from '@/services/authService'
import Button from '@/components/ui/Button'
import styles from './PhoneAuthScreen.module.css'

export default function PhoneAuthScreen({ onBack }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await sendPhoneOTP(phone)
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
            <p className={styles.sub}>We'll send a verification code</p>

            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={styles.input}
              autoFocus
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Send Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className={styles.form}>
            <h2 className={styles.heading}>Enter the code</h2>
            <p className={styles.sub}>Sent to {phone}</p>

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
