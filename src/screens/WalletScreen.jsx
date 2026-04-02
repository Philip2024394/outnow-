import { useState, useEffect } from 'react'
import { useCoins, COIN_REWARDS, TOP_UP_PACKS, getTransactions, getEarnedKeys } from '@/hooks/useCoins'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import styles from './WalletScreen.module.css'

function timeAgo(ts) {
  const diff = Date.now() - (typeof ts === 'string' ? new Date(ts).getTime() : ts)
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function txTypeIcon(type) {
  if (type === 'earn')   return '🎁'
  if (type === 'topup')  return '🪙'
  return '💸'
}

export default function WalletScreen({ onClose }) {
  const { user } = useAuth()
  const { balance, topUp } = useCoins()
  const [toppingUp, setToppingUp] = useState(null)
  const [flashPack, setFlashPack] = useState(null)

  // Merge Supabase transactions (source of truth) with localStorage fallback
  const [transactions, setTransactions] = useState(getTransactions)
  const earnedKeys = getEarnedKeys()

  useEffect(() => {
    if (!supabase || !user) return
    supabase
      .from('coin_transactions')
      .select('id, type, label, amount, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data?.length) return
        // Map Supabase rows to the same shape localStorage uses
        setTransactions(data.map(row => ({
          type:   row.type,
          label:  row.label,
          amount: row.amount,
          ts:     new Date(row.created_at).getTime(),
        })))
      })
  }, [user])

  function handleTopUp(pack) {
    setToppingUp(pack.id)
    setTimeout(() => {
      topUp(pack.coins, `${pack.label} pack (${pack.coins} coins)`)
      setToppingUp(null)
      setFlashPack(pack.id)
      setTimeout(() => setFlashPack(null), 1200)
      // Refresh transactions from Supabase after top-up
      if (supabase && user) {
        supabase
          .from('coin_transactions')
          .select('id, type, label, amount, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            if (data?.length) {
              setTransactions(data.map(row => ({
                type: row.type, label: row.label, amount: row.amount,
                ts: new Date(row.created_at).getTime(),
              })))
            }
          })
      }
    }, 900)
  }

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className={styles.headerTitle}>Coin Wallet</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={styles.scroll}>

        {/* Balance hero */}
        <div className={styles.balanceCard}>
          <span className={styles.balanceIcon}>🪙</span>
          <span className={styles.balanceNum}>{balance}</span>
          <span className={styles.balanceLabel}>coins available</span>
          <span className={styles.balanceSub}>Use coins to send treats & gifts on first dates</span>
        </div>

        {/* Top-up packs */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Top Up</span>
          <div className={styles.packsGrid}>
            {TOP_UP_PACKS.map(pack => (
              <button
                key={pack.id}
                className={[
                  styles.packCard,
                  pack.badge       ? styles.packCardFeatured : '',
                  flashPack === pack.id ? styles.packCardFlash : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleTopUp(pack)}
                disabled={!!toppingUp}
              >
                {pack.badge && <span className={styles.packBadge}>{pack.badge}</span>}
                <span className={styles.packCoins}>🪙 {pack.coins.toLocaleString()}</span>
                <span className={styles.packLabel}>{pack.label}</span>
                <span className={styles.packPrice}>
                  {toppingUp === pack.id ? '…' : pack.price}
                </span>
              </button>
            ))}
          </div>
          <p className={styles.packNote}>Payments processed securely. Coins are non-refundable.</p>
        </div>

        {/* Earn for free */}
        <div className={styles.section}>
          <span className={styles.sectionTitle}>Earn for Free</span>
          <div className={styles.earnList}>
            {Object.entries(COIN_REWARDS).map(([key, reward]) => {
              const done = earnedKeys.includes(key)
              return (
                <div key={key} className={`${styles.earnRow} ${done ? styles.earnRowDone : ''}`}>
                  <span className={styles.earnCheck}>{done ? '✓' : '○'}</span>
                  <div className={styles.earnInfo}>
                    <span className={styles.earnLabel}>{reward.label}</span>
                  </div>
                  <span className={`${styles.earnAmount} ${done ? styles.earnAmountDone : ''}`}>
                    +{reward.amount} 🪙
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent activity */}
        {transactions.length > 0 ? (
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Recent Activity</span>
            <div className={styles.txList}>
              {transactions.map((tx, i) => (
                <div key={i} className={styles.txRow}>
                  <span className={styles.txIcon}>{txTypeIcon(tx.type)}</span>
                  <div className={styles.txInfo}>
                    <span className={styles.txLabel}>{tx.label}</span>
                    <span className={styles.txTime}>{timeAgo(tx.ts ?? tx.created_at)}</span>
                  </div>
                  <span className={`${styles.txAmount} ${tx.type === 'spend' ? styles.txAmountSpend : styles.txAmountEarn}`}>
                    {tx.type === 'spend' ? '-' : '+'}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.emptyTx}>
            <span className={styles.emptyIcon}>🪙</span>
            <span className={styles.emptyText}>No transactions yet</span>
            <span className={styles.emptySub}>Complete your profile to earn free coins</span>
          </div>
        )}

      </div>
    </div>
  )
}
