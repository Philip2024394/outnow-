import { useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

const ADMIN_KEY = 'imoutnow_admin_v1'

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_KEY))

  const handleLogin = () => {
    sessionStorage.setItem(ADMIN_KEY, '1')
    setAuthed(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY)
    setAuthed(false)
  }

  if (!authed) return <AdminLogin onLogin={handleLogin} />
  return <AdminDashboard onLogout={handleLogout} />
}
