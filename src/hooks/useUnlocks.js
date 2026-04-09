import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  getChatSession, markChatUnlocked,
  getUnlockBalance, consumeUnlockCredit,
  getSellerPlan, getActiveSubscription,
  PLAN_LIMITS,
} from '@/services/unlockService'

const FREE_WINDOW_MS  = 20 * 60 * 1000   // 20 minutes
const WARN_THRESHOLD  =  5 * 60 * 1000   //  5 minutes left → show unlock prompt
const TICK_MS         = 1000

/**
 * useUnlocks(conversationId)
 *
 * Returns:
 *   timeLeftMs      — ms remaining in free window (null if unlocked/subscribed)
 *   isUnlocked      — true if this chat has been unlocked
 *   showUnlockPrompt — true when ≤5 min left (or time expired)
 *   unlockBalance   — number of credits remaining
 *   sellerPlan      — 'free' | 'standard' | 'premium'
 *   planLimits      — PLAN_LIMITS[sellerPlan]
 *   unlockWithCredit() — consume a credit to unlock this chat
 *   loading
 */
export function useUnlocks(conversationId) {
  const { user } = useAuth()
  const userId   = user?.uid ?? user?.id ?? null

  const [sellerPlan,      setSellerPlan]      = useState('free')
  const [unlockBalance,   setUnlockBalance]   = useState(0)
  const [isUnlocked,      setIsUnlocked]      = useState(false)
  const [timeLeftMs,      setTimeLeftMs]      = useState(FREE_WINDOW_MS)
  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false)
  const [loading,         setLoading]         = useState(true)

  const startedAtRef  = useRef(null)
  const timerRef      = useRef(null)
  const promptedRef   = useRef(false)

  // ── Load plan + session on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!userId || !conversationId) { setLoading(false); return }

    let cancelled = false

    ;(async () => {
      try {
        const [plan, sub, session, balance] = await Promise.all([
          getSellerPlan(userId),
          getActiveSubscription(userId),
          getChatSession(conversationId, userId),
          getUnlockBalance(userId),
        ])

        if (cancelled) return

        // Resolve effective plan (subscription may be newer than profile column)
        const effectivePlan = sub?.plan ?? plan ?? 'free'
        setSellerPlan(effectivePlan)
        setUnlockBalance(balance)

        const limits = PLAN_LIMITS[effectivePlan]

        // Subscribed users get unlimited chat — skip timer entirely
        if (limits.unlimitedChat || session.unlockedAt) {
          setIsUnlocked(true)
          setTimeLeftMs(null)
          setShowUnlockPrompt(false)
          setLoading(false)
          return
        }

        // Free window: start countdown from session start
        startedAtRef.current = session.startedAt
        const elapsed  = Date.now() - session.startedAt
        const remaining = Math.max(0, FREE_WINDOW_MS - elapsed)
        setTimeLeftMs(remaining)
        if (remaining <= WARN_THRESHOLD) setShowUnlockPrompt(true)
        if (remaining === 0) setIsUnlocked(false)

      } catch (e) {
        console.warn('useUnlocks load error', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [userId, conversationId])

  // ── Countdown tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isUnlocked || timeLeftMs === null || loading) return

    timerRef.current = setInterval(() => {
      if (!startedAtRef.current) return
      const elapsed   = Date.now() - startedAtRef.current
      const remaining = Math.max(0, FREE_WINDOW_MS - elapsed)
      setTimeLeftMs(remaining)

      if (remaining <= WARN_THRESHOLD && !promptedRef.current) {
        promptedRef.current = true
        setShowUnlockPrompt(true)
      }
    }, TICK_MS)

    return () => clearInterval(timerRef.current)
  }, [isUnlocked, timeLeftMs, loading])

  // ── Unlock with credit ────────────────────────────────────────────────────
  const unlockWithCredit = useCallback(async () => {
    if (!userId || !conversationId) return false
    const ok = await consumeUnlockCredit(userId)
    if (!ok) return false
    await markChatUnlocked(conversationId, userId, 'credit')
    setIsUnlocked(true)
    setTimeLeftMs(null)
    setShowUnlockPrompt(false)
    setUnlockBalance(b => Math.max(0, b - 1))
    clearInterval(timerRef.current)
    return true
  }, [userId, conversationId])

  // ── Unlock after subscription purchase ───────────────────────────────────
  const unlockWithSubscription = useCallback(async (plan) => {
    if (!userId || !conversationId) return
    setSellerPlan(plan)
    await markChatUnlocked(conversationId, userId, 'subscription')
    setIsUnlocked(true)
    setTimeLeftMs(null)
    setShowUnlockPrompt(false)
    clearInterval(timerRef.current)
  }, [userId, conversationId])

  return {
    sellerPlan,
    planLimits:       PLAN_LIMITS[sellerPlan],
    unlockBalance,
    isUnlocked,
    timeLeftMs,
    showUnlockPrompt,
    loading,
    unlockWithCredit,
    unlockWithSubscription,
    dismissPrompt: () => setShowUnlockPrompt(false),
  }
}
