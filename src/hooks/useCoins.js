const BALANCE_KEY = 'imoutnow_coins'
const HISTORY_KEY = 'imoutnow_coins_history'

export const COIN_REWARDS = {
  PROFILE_PHOTO:    { amount: 10, label: 'Added profile photo' },
  BIO_WRITTEN:      { amount: 5,  label: 'Wrote your bio' },
  ACTIVITIES_SET:   { amount: 5,  label: 'Set activity preferences' },
  SAFETY_CONTACT:   { amount: 15, label: 'Added safety contact' },
  FIRST_INVITE_OUT: { amount: 20, label: 'First Invite Out posted' },
  FIRST_CONNECT:    { amount: 10, label: 'First connection sent' },
}

export const GIFT_COSTS = {
  coffee:  5,
  drinks:  10,
  food:    15,
  entry:   20,
  juice:   5,
  flowers: 15,
}

// On first ever load award all onboarding coins (demo — represents completed account)
function initBalance() {
  try {
    const raw = localStorage.getItem(BALANCE_KEY)
    if (raw !== null) return Math.max(0, parseInt(raw, 10) || 0)
    const starter = Object.values(COIN_REWARDS).reduce((s, r) => s + r.amount, 0)
    localStorage.setItem(BALANCE_KEY, String(starter))
    // Mark all rewards as already earned so they don't double-award later
    const keys = Object.keys(COIN_REWARDS)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(keys))
    return starter
  } catch { return 0 }
}

function readBalance() {
  try { return Math.max(0, parseInt(localStorage.getItem(BALANCE_KEY) || '0', 10)) }
  catch { return 0 }
}

function writeBalance(n) {
  try { localStorage.setItem(BALANCE_KEY, String(Math.max(0, n))) } catch {}
}

function hasEarned(key) {
  try {
    const earned = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return earned.includes(key)
  } catch { return false }
}

function markEarned(key) {
  try {
    const earned = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    if (!earned.includes(key)) {
      earned.push(key)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(earned))
    }
  } catch {}
}

import { useState, useCallback } from 'react'

export function useCoins() {
  const [balance, setBalance] = useState(initBalance)

  /**
   * Award coins for a one-time onboarding milestone.
   * Returns the amount awarded (0 if already earned).
   */
  const earn = useCallback((rewardKey) => {
    const reward = COIN_REWARDS[rewardKey]
    if (!reward || hasEarned(rewardKey)) return 0
    markEarned(rewardKey)
    const next = readBalance() + reward.amount
    writeBalance(next)
    setBalance(next)
    return reward.amount
  }, [])

  /**
   * Spend coins. Returns true if successful, false if insufficient balance.
   */
  const spend = useCallback((amount) => {
    const current = readBalance()
    if (current < amount) return false
    const next = current - amount
    writeBalance(next)
    setBalance(next)
    return true
  }, [])

  const canAfford = useCallback((amount) => readBalance() >= amount, [])

  return { balance, earn, spend, canAfford }
}
