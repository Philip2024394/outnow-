import { useState } from 'react'
import styles from './AdminLogin.module.css'

const LOGO_URL = 'https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926'

const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin1240176'

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    if (password === ADMIN_PASS) {
      onLogin()
    } else {
      setError('Invalid password.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={LOGO_URL} alt="Indoo" className={styles.logo} />
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.sub}>Enter admin password to continue</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••"
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || !password}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className={styles.hint}>INDOO Admin Panel · Authorized access only</p>
      </div>
    </div>
  )
}
