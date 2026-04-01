import { useEffect, useRef } from 'react'
import styles from './Toast.module.css'

export default function Toast({ message, type = 'info', onDismiss, duration = 3000 }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!message) return
    timerRef.current = setTimeout(onDismiss, duration)
    return () => clearTimeout(timerRef.current)
  }, [message, duration, onDismiss])

  if (!message) return null

  return (
    <div className={[styles.toast, styles[type]].join(' ')}>
      {message}
    </div>
  )
}
