import styles from './CoinBadge.module.css'

export default function CoinBadge({ balance, size = 'md', flash = false }) {
  return (
    <span className={`${styles.badge} ${styles[size]} ${flash ? styles.flash : ''}`}>
      <span className={styles.icon}>🪙</span>
      <span className={styles.amount}>{balance}</span>
    </span>
  )
}
