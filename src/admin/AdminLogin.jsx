import { useState } from 'react'
import styles from './AdminLogin.module.css'

const LOGO_URL = 'https://ik.imagekit.io/dateme/Logo%20with%20green%20map%20pin%20element.png'

// Set VITE_ADMIN_USER and VITE_ADMIN_PASSWORD in your .env file
const ADMIN_USER = import.meta.env.VITE_ADMIN_USER     ?? 'admin'
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD ?? '12345'

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600))
    if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
      onLogin()
    } else {
      setError('Invalid username or password.')
    }
    setLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img src={LOGO_URL} alt="Hangger" className={styles.logo} />
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.sub}>Sign in with your admin credentials</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="admin"
              required
            />
          </div>

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
            disabled={loading || !username || !password}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className={styles.hint}>
          Set credentials in <code>.env</code> via{' '}
          <code>VITE_ADMIN_USER</code> and <code>VITE_ADMIN_PASSWORD</code>
        </p>
      </div>
    </div>
  )
}
