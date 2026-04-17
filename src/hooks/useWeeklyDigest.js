import { useState, useEffect } from 'react'
import { usePushNotifications } from './usePushNotifications'
import { DEMO_LIKED_USERS } from '@/demo/mockData'

const DIGEST_SEEN_KEY = 'indoo_digest_seen_week'

function getWeekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

function isFridayEvening() {
  const d = new Date()
  return d.getDay() === 5 && d.getHours() >= 18
}

export function useWeeklyDigest(likedUsers = []) {
  const { notify, permission } = usePushNotifications()
  const [showDigest, setShowDigest] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Use demo data if no real likes yet
  const digest = likedUsers.length > 0 ? likedUsers : DEMO_LIKED_USERS

  useEffect(() => {
    const weekKey = getWeekKey()
    const seenKey = localStorage.getItem(DIGEST_SEEN_KEY)
    if (seenKey === weekKey || dismissed) return

    // Always show in demo mode; otherwise only on Friday evening
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'
    if (isDemoMode || isFridayEvening()) {
      setShowDigest(true)

      // Fire push notification if permission granted
      if (permission === 'granted') {
        notify('Your weekend starts tonight 🟢', {
          body: `${digest.length} people liked you this week — check who's going out tonight.`,
          tag: 'weekly-digest',
          vibrate: [300, 100, 300],
        })
      }
    }
  }, [dismissed, permission]) // eslint-disable-line

  const dismissDigest = () => {
    localStorage.setItem(DIGEST_SEEN_KEY, getWeekKey())
    setDismissed(true)
    setShowDigest(false)
  }

  return { showDigest, digest, dismissDigest }
}
