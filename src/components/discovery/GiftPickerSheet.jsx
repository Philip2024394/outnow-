import styles from './GiftPickerSheet.module.css'

const GIFTS = [
  { id: 'drinks',  emoji: '🍺', label: 'Drinks',  sub: 'on me' },
  { id: 'meal',    emoji: '🍕', label: 'Meal',    sub: 'on me' },
  { id: 'cinema',  emoji: '🎬', label: 'Cinema',  sub: 'on me' },
  { id: 'coffee',  emoji: '☕', label: 'Coffee',  sub: 'on me' },
  { id: 'dessert', emoji: '🍰', label: 'Dessert', sub: 'on me' },
  { id: 'surprise',emoji: '🎁', label: 'Surprise',sub: ''       },
]

export default function GiftPickerSheet({ open, recipientName, onSend, onSkip }) {
  if (!open) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.backdrop} onClick={onSkip} />

      <div className={styles.sheet}>
        <div className={styles.handle} />

        <div className={styles.header}>
          <p className={styles.title}>Add a gift offer?</p>
          <p className={styles.sub}>
            Give {recipientName ?? 'them'} a reason to say yes
          </p>
        </div>

        <div className={styles.grid}>
          {GIFTS.map(g => (
            <button
              key={g.id}
              className={styles.card}
              onClick={() => onSend(g)}
            >
              <span className={styles.cardEmoji}>{g.emoji}</span>
              <span className={styles.cardLabel}>{g.label}</span>
              {g.sub && <span className={styles.cardSub}>{g.sub}</span>}
            </button>
          ))}
        </div>

        <p className={styles.disclaimer}>
          A friendly gesture — not a paid voucher
        </p>

        <button className={styles.skipBtn} onClick={() => onSkip()}>
          Skip — just send the invite
        </button>
      </div>
    </div>
  )
}
