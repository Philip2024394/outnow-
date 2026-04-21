/**
 * useConnectionHealth — monitors network state for Indonesia's poor signal.
 * Shows offline banner, queues actions, re-fetches on reconnect.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

export function useConnectionHealth() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const reconnectCallbacksRef = useRef([])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      // Fire all reconnect callbacks
      reconnectCallbacksRef.current.forEach(fn => { try { fn() } catch {} })
      // Clear wasOffline banner after 3 seconds
      setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register a callback to run when connection is restored
  const onReconnect = useCallback((fn) => {
    reconnectCallbacksRef.current.push(fn)
    return () => {
      reconnectCallbacksRef.current = reconnectCallbacksRef.current.filter(f => f !== fn)
    }
  }, [])

  return { isOnline, wasOffline, onReconnect }
}

/**
 * OfflineBanner — drop-in component to show connection status.
 * Place at the top of your app layout.
 */
export function OfflineBanner({ isOnline, wasOffline }) {
  if (isOnline && !wasOffline) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      padding: '8px 16px', textAlign: 'center',
      fontSize: 12, fontWeight: 800, fontFamily: 'inherit',
      background: isOnline ? '#8DC63F' : '#ef4444',
      color: isOnline ? '#000' : '#fff',
      animation: 'fadeIn 0.3s ease',
      transition: 'background 0.3s',
    }}>
      {isOnline ? '✓ Back online' : '⚠ No internet connection'}
    </div>
  )
}
