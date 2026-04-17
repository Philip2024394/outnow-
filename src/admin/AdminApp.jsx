import { useState, useEffect } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

const ADMIN_KEY = 'indoo_admin_v1'

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ADMIN_KEY))

  // Only runs when AdminApp actually mounts (i.e. on /admin route only)
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]')
    const original = meta?.getAttribute('content') ?? ''
    if (meta) meta.setAttribute('content', 'width=1280')
    document.documentElement.classList.add('admin-mode')
    document.body.classList.add('admin-mode')

    return () => {
      if (meta) meta.setAttribute('content', original)
      document.documentElement.classList.remove('admin-mode')
      document.body.classList.remove('admin-mode')
    }
  }, [])

  const handleLogin  = () => { sessionStorage.setItem(ADMIN_KEY, '1'); setAuthed(true)  }
  const handleLogout = () => { sessionStorage.removeItem(ADMIN_KEY);   setAuthed(false) }

  if (!authed) return <AdminLogin onLogin={handleLogin} />
  return <AdminDashboard onLogout={handleLogout} />
}
