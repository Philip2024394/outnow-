import styles from './MomentsBar.module.css'

export default function MomentsBar({ moments = [], isLive, onAdd, onView }) {
  if (moments.length === 0 && !isLive) return null

  return (
    <div className={styles.bar}>
      <div className={styles.scroll}>
        {/* Add moment — only shown when live */}
        {isLive && (
          <button className={styles.addBubble} onClick={onAdd} aria-label="Add moment">
            <span className={styles.addIcon}>+</span>
            <span className={styles.bubbleLabel}>Add</span>
          </button>
        )}

        {/* Moment bubbles */}
        {moments.map((moment, i) => (
          <button
            key={moment.id}
            className={styles.bubble}
            onClick={() => onView(i)}
            aria-label={`${moment.displayName}'s moment`}
          >
            <div
              className={styles.bubbleInner}
              style={moment.photoURL
                ? { backgroundImage: `url(${moment.photoURL})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: moment.gradient }
              }
            >
              {!moment.photoURL && <span className={styles.bubbleEmoji}>{moment.emoji}</span>}
            </div>
            <span className={styles.bubbleLabel}>{moment.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
