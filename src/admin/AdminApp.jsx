import { useState, useEffect } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

const ADMIN_KEY = 'hangger_admin_v1'

// Force desktop viewport for the admin dashboard — overrides the phone-frame #root
function useDesktopViewport() {
  useEffect(() => {
    // Swap viewport meta to desktop width
    const meta = document.querySelector('meta[name="viewport"]')
    const originalMeta = meta?.getAttribute('content') ?? ''
    if (meta) meta.setAttribute('content', 'width=1280')

    // Override the phone-frame #root styles from global.css
    const root = document.getElementById('root')
    const originalStyles = root ? {
      maxWidth:  root.style.maxWidth,
      maxHeight: root.style.maxHeight,
      height:    root.style.height,
      borderRadius: root.style.borderRadius,
      boxShadow: root.style.boxShadow,
      overflow:  root.style.overflow,
    } : {}

    if (root) {
      root.style.maxWidth    = 'none'
      root.style.maxHeight   = 'none'
      root.style.height      = '100vh'
      root.style.borderRadius = '0'
      root.style.boxShadow   = 'none'
      root.style.overflow    = 'auto'
    }

    document.documentElement.style.minWidth = '1280px'
    document.body.style.minWidth = '1280px'
    document.body.style.background = '#080808'

    return () => {
      if (meta) meta.setAttribute('content', originalMeta)
      if (root) Object.assign(root.style, originalStyles)
      document.documentElement.style.minWidth = ''
      document.body.style.minWidth = ''
      document.body.style.background = ''
    }
  }, [])
}

export default function AdminApp() {
  useDesktopViewport()
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
