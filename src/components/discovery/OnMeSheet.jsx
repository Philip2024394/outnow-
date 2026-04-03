import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import CoinBadge from '@/components/ui/CoinBadge'
import { useCoins, GIFT_COSTS } from '@/hooks/useCoins'
import ActivityIcon from '@/components/ui/ActivityIcon'
import styles from './OnMeSheet.module.css'

const BG_URL = 'https://ik.imagekit.io/dateme/UntitledDFSDFASDFDFGSDFGsfdfasdsadas.png?updatedAt=1775081066476'

const GIFTS = [
  { id: 'coffee',  emoji: '☕',  img: 'https://ik.imagekit.io/dateme/Untitledsdff-removebg-preview.png',          label: 'Coffee'  },
  { id: 'drinks',  emoji: '🍺',  img: 'https://ik.imagekit.io/dateme/Untitleddsdddd-removebg-preview%20(1).png', label: 'Drinks'  },
  { id: 'food',    emoji: '🍕',  img: 'https://ik.imagekit.io/dateme/Untitledvv-removebg-preview.png',           label: 'Food'    },
  { id: 'entry',   emoji: '🎟️', label: 'Entry'   },
  { id: 'juice',   emoji: '🧃',  label: 'Juice'   },
  { id: 'flowers', emoji: '💐',  label: 'Flowers' },
]

export default function OnMeSheet({ session, onSend, onSkip, onWave, onClose }) {
  const [gift,    setGift]    = useState(null)
  const [message, setMessage] = useState('')
  const [earned,  setEarned]  = useState(false)
  const [waved,   setWaved]   = useState(false)
  const { balance, spend, earn, canAfford } = useCoins()

  if (!session) return null

  function handleSend() {
    if (gift) {
      const cost = GIFT_COSTS[gift]
      if (!spend(cost)) return
      const rewarded = earn('FIRST_CONNECT')
      if (rewarded > 0) setEarned(true)
    }
    onSend?.({
      session,
      gift: gift ?? null,
      message: message.trim() || null,
    })
  }

  function handleWave() {
    setWaved(true)
    onWave?.({ session })
  }

  const selectedGift = GIFTS.find(g => g.id === gift)
  const giftCost     = gift ? GIFT_COSTS[gift] : 0
  const canSendGift  = !gift || canAfford(giftCost)

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.sheet}>
        <img src={BG_URL} alt="" className={styles.bgImage} />
        <div className={styles.strip} />
        <div className={styles.handle} onClick={onClose} />

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

          {/* On Me header */}
          <div className={styles.onMeHeader}>
            <span className={styles.onMeTitle}>First Date On Me</span>
            <span className={styles.onMeSubtitle}>Offering a treat gets 70% more replies</span>
          </div>

          {/* Gift cards — always visible */}
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
                  <ActivityIcon activity={g} size={24} className={styles.giftEmoji} />
                  <span className={styles.giftLabel}>{g.label}</span>
                  <span className={`${styles.giftCost} ${broke ? styles.giftCostBroke : ''}`}>
                    🪙 {cost}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Insufficient coins warning */}
          {gift && !canAfford(giftCost) && (
            <div className={styles.brokeWarning}>
              Not enough coins — earn more by completing your profile
            </div>
          )}

          {/* Optional message */}
          <div className={styles.msgWrap}>
            <textarea
              className={styles.msgInput}
              placeholder="Add a message… (optional)"
              maxLength={350}
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
              {selectedGift
                ? `${selectedGift.emoji} ${selectedGift.label} On Me — Send`
                : '💛 Send & Connect'}
            </button>

            {/* Free Wave */}
            <button
              className={`${styles.waveBtn} ${waved ? styles.waveBtnSent : ''}`}
              onClick={handleWave}
              disabled={waved}
            >
              {waved ? '🌊 Wave Sent!' : '🌊 Free Wave'}
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
