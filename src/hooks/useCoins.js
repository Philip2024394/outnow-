import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

const BALANCE_KEY      = 'hangger_coins'
const HISTORY_KEY      = 'hangger_coins_history'
const TRANSACTIONS_KEY = 'hangger_transactions'

export const COIN_REWARDS = {
  PROFILE_PHOTO:    { amount: 10, label: 'Added profile photo' },
  BIO_WRITTEN:      { amount: 5,  label: 'Wrote your bio' },
  ACTIVITIES_SET:   { amount: 5,  label: 'Set activity preferences' },
  SAFETY_CONTACT:   { amount: 15, label: 'Added safety contact' },
  FIRST_INVITE_OUT: { amount: 20, label: 'First Invite Out posted' },
  FIRST_CONNECT:    { amount: 10, label: 'First connection sent' },
}

// Repeatable rewards (no one-time guard)
export const REPEAT_REWARDS = {
  VIBE_CHECK_VOTE:     { amount: 2,  label: 'Vibe Check vote' },
  VIBE_CHECK_COMPLETE: { amount: 5,  label: 'Vibe Check completed' },
}

export const GIFT_COSTS = {
  coffee:  5,
  drinks:  10,
  food:    15,
  entry:   20,
  juice:   5,
  flowers: 15,
}

export const TOP_UP_PACKS = [
  { id: 'starter',  coins: 50,   price: '$1.99',  label: 'Starter' },
  { id: 'popular',  coins: 150,  price: '$4.99',  label: 'Popular',    badge: '⭐ Most Popular' },
  { id: 'value',    coins: 400,  price: '$9.99',  label: 'Best Value' },
  { id: 'bignight', coins: 1000, price: '$19.99', label: 'Big Night' },
]

// ── localStorage helpers ──────────────────────────────────

function initBalance() {
  try {
    const raw = localStorage.getItem(BALANCE_KEY)
    if (raw !== null) return Math.max(0, parseInt(raw, 10) || 0)
    // First ever run — seed with onboarding rewards total
    const starter = Object.values(COIN_REWARDS).reduce((s, r) => s + r.amount, 0)
    localStorage.setItem(BALANCE_KEY, String(starter))
    localStorage.setItem(HISTORY_KEY, JSON.stringify(Object.keys(COIN_REWARDS)))
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
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').includes(key) }
  catch { return false }
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

export function getEarnedKeys() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') }
  catch { return [] }
}

export function getTransactions() {
  try { return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]') }
  catch { return [] }
}

function addLocalTransaction(entry) {
  try {
    const txs = getTransactions()
    txs.unshift({ ...entry, ts: Date.now() })
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs.slice(0, 50)))
  } catch {}
}

// ── Supabase sync helpers ─────────────────────────────────

async function syncEarnToSupabase(amount, label, userId) {
  if (!supabase || !userId) return
  try {
    await supabase.rpc('adjust_coins', { p_delta: amount, p_label: label, p_type: 'earn' })
  } catch {}
}

async function syncSpendToSupabase(amount, label, userId) {
  if (!supabase || !userId) return
  try {
    await supabase.rpc('adjust_coins', { p_delta: -amount, p_label: label, p_type: 'spend' })
  } catch {}
}

async function syncTopUpToSupabase(amount, label, userId) {
  if (!supabase || !userId) return
  try {
    await supabase.rpc('adjust_coins', { p_delta: amount, p_label: label, p_type: 'topup' })
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────

export function useCoins() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(initBalance)

  // On mount with a real user: pull Supabase balance and reconcile with localStorage
  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from('profiles')
      .select('coins')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const remote = data.coins ?? 0
        const local = readBalance()
        // Trust whichever is higher (handles offline edits gracefully)
        const resolved = Math.max(remote, local)
        writeBalance(resolved)
        setBalance(resolved)
      })
  }, [user])

  const earn = useCallback((rewardKey) => {
    const reward = COIN_REWARDS[rewardKey]
    if (!reward || hasEarned(rewardKey)) return 0
    markEarned(rewardKey)
    const next = readBalance() + reward.amount
    writeBalance(next)
    addLocalTransaction({ type: 'earn', label: reward.label, amount: reward.amount })
    setBalance(next)
    syncEarnToSupabase(reward.amount, reward.label, user?.id)
    return reward.amount
  }, [user])

  // Repeatable earn — no one-time guard, for actions that recur (e.g. Vibe Check votes)
  const earnRepeat = useCallback((rewardKey) => {
    const reward = REPEAT_REWARDS[rewardKey]
    if (!reward) return 0
    const next = readBalance() + reward.amount
    writeBalance(next)
    addLocalTransaction({ type: 'earn', label: reward.label, amount: reward.amount })
    setBalance(next)
    syncEarnToSupabase(reward.amount, reward.label, user?.id)
    return reward.amount
  }, [user])

  const spend = useCallback((amount, label = 'Gift sent') => {
    const current = readBalance()
    if (current < amount) return false
    const next = current - amount
    writeBalance(next)
    addLocalTransaction({ type: 'spend', label, amount })
    setBalance(next)
    syncSpendToSupabase(amount, label, user?.id)
    return true
  }, [user])

  const topUp = useCallback((amount, label = 'Coin top-up') => {
    const next = readBalance() + amount
    writeBalance(next)
    addLocalTransaction({ type: 'topup', label, amount })
    setBalance(next)
    syncTopUpToSupabase(amount, label, user?.id)
  }, [user])

  const canAfford = useCallback((amount) => readBalance() >= amount, [])

  return { balance, earn, earnRepeat, spend, canAfford, topUp }
}
