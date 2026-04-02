import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import CoinBadge from '@/components/ui/CoinBadge'
import { useCoins, GIFT_COSTS } from '@/hooks/useCoins'
import styles from './OnMeSheet.module.css'

const GIFTS = [
  { id: 'coffee', emoji: '☕', label: 'Coffee',  sub: 'A hot one on me' },
  { id: 'drinks', emoji: '🍺', label: 'Drinks',  sub: 'First round on me' },
  { id: 'food',   emoji: '🍕', label: 'Food',    sub: 'I\'ve got the food' },
  { id: 'entry',  emoji: '🎟️', label: 'Entry',   sub: 'I\'ll cover the door' },
]

export default function OnMeSheet({ session, onSend, onSkip, onClose }) {
  const [onMe,    setOnMe]    = useState(false)
  const [gift,    setGift]    = useState(null)
  const [message, setMessage] = useState('')
  const [earned,  setEarned]  = useState(false)
  const { balance, spend, earn, canAfford } = useCoins()

  if (!session) return null

  function handleSend() {
    if (onMe && gift) {
      const cost = GIFT_COSTS[gift]
      if (!spend(cost)) return          // guard — shouldn't reach here if UI is correct
      // First connect reward (one-time)
      const rewarded = earn('FIRST_CONNECT')
      if (rewarded > 0) setEarned(true)
    }
    onSend?.({
      session,
      onMe,
      gift: onMe ? gift : null,
      message: message.trim() || null,
    })
  }

  function toggleOnMe() {
    setOnMe(v => !v)
    setGift(null)
  }

  const selectedGift  = GIFTS.find(g => g.id === gift)
  const giftCost      = gift ? GIFT_COSTS[gift] : 0
  const canSendGift   = !onMe || !gift || canAfford(giftCost)

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.sheet}>
        <div className={styles.strip} />
        <div className={styles.handle} />

        <div className={styles.body}>

          {/* Person row + coin balance */}
          <div className={styles.topRow}>
            <div className={styles.personRow}>
              <Avatar src={session.photoURL} name={session.displayName} size={50} inviteOut />
              <div className={styles.personInfo}>
                <span className={styles.personName}>
                  {session.displayName ?? 'Someone'}
                  {session.age && <span className={styles.personAge}> {session.age}</span>}
                </span>
                <span className={styles.personSub}>wants to go out — invite them</span>
              </div>
            </div>
            <CoinBadge balance={balance} size="sm" flash={earned} />
          </div>

          {/* On Me toggle */}
          <button
            className={`${styles.onMeToggle} ${onMe ? styles.onMeToggleOn : ''}`}
            onClick={toggleOnMe}
          >
            <span className={styles.onMeIcon}>🤝</span>
            <div className={styles.onMeText}>
              <span className={styles.onMeLabel}>On Me</span>
              <span className={styles.onMeDesc}>offer to treat them — costs coins</span>
            </div>
            <span className={`${styles.onMePill} ${onMe ? styles.onMePillOn : ''}`}>
              {onMe ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Gift cards — visible when On Me is on */}
          {onMe && (
            <div className={styles.giftGrid}>
              {GIFTS.map(g => {
                const cost     = GIFT_COSTS[g.id]
                const selected = gift === g.id
                const broke    = !canAfford(cost)
                return (
                  <button
                    key={g.id}
                    className={[
                      styles.giftCard,
                      selected ? styles.giftCardSel : '',
                      broke    ? styles.giftCardBroke : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => !broke && setGift(gift === g.id ? null : g.id)}
                    disabled={broke}
                  >
                    <span className={styles.giftEmoji}>{g.emoji}</span>
                    <span className={styles.giftLabel}>{g.label}</span>
                    <span className={styles.giftSub}>{g.sub}</span>
                    <span className={`${styles.giftCost} ${broke ? styles.giftCostBroke : ''}`}>
                      🪙 {cost}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Insufficient coins warning */}
          {onMe && gift && !canAfford(giftCost) && (
            <div className={styles.brokeWarning}>
              Not enough coins — earn more by completing your profile
            </div>
          )}

          {/* Optional message */}
          <div className={styles.msgWrap}>
            <textarea
              className={styles.msgInput}
              placeholder="Add a message… (optional)"
              maxLength={160}
              rows={2}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            {message.length > 0 && (
              <span className={styles.charCount}>{message.length}/160</span>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={`${styles.sendBtn} ${!canSendGift ? styles.sendBtnDisabled : ''}`}
              onClick={handleSend}
              disabled={!canSendGift}
            >
              {onMe && selectedGift
                ? `${selectedGift.emoji} ${selectedGift.label} On Me — Send`
                : '💛 Send & Connect'}
            </button>
            <button className={styles.skipBtn} onClick={() => onSkip?.(session)}>
              Just view profile →
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
