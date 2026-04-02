import styles from './Avatar.module.css'

export default function Avatar({ src, name, size = 48, live = false, mutual = false, scheduled = false, inviteOut = false }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div
      className={[
        styles.avatar,
        live ? styles.live : '',
        mutual ? styles.mutual : '',
        scheduled ? styles.scheduled : '',
        inviteOut ? styles.inviteOut : '',
      ].filter(Boolean).join(' ')}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {src ? (
        <img src={src} alt={name ?? 'User'} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
