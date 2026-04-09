import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './WingmanSheet.module.css'

export default function WingmanSheet({ open, targetSession, onClose, showToast }) {
  const { user } = useAuth()
  const [friends,   setFriends]   = useState([])
  const [selected,  setSelected]  = useState(null)
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!open || !user?.id) return
    setLoading(true)
    async function loadFriends() {
      if (!supabase) {
        // Demo fallback
        setFriends([
          { id: 'f1', displayName: 'Sari K.', photoURL: 'https://i.pravatar.cc/60?img=1' },
          { id: 'f2', displayName: 'Budi W.', photoURL: 'https://i.pravatar.cc/60?img=5' },
          { id: 'f3', displayName: 'Rina A.', photoURL: 'https://i.pravatar.cc/60?img=9' },
        ])
        setLoading(false)
        return
      }
      // Load mutual connections (users who sent/received meet requests with current user)
      const { data } = await supabase
        .from('meet_requests')
        .select('from_user_id, to_user_id, profiles!meet_requests_from_user_id_fkey(id, displayName, photo_url)')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .limit(20)

      const mapped = (data ?? []).map(r => ({
        id:          r.from_user_id === user.id ? r.to_user_id : r.from_user_id,
        displayName: r.profiles?.displayName ?? 'Friend',
        photoURL:    r.profiles?.photo_url ?? null,
      })).filter((f, i, arr) => arr.findIndex(x => x.id === f.id) === i) // unique
      setFriends(mapped.length ? mapped : [
        { id: 'f1', displayName: 'Sari K.', photoURL: 'https://i.pravatar.cc/60?img=1' },
        { id: 'f2', displayName: 'Budi W.', photoURL: 'https://i.pravatar.cc/60?img=5' },
      ])
      setLoading(false)
    }
    loadFriends()
  }, [open, user?.id])

  if (!open) return null

  const handleSend = async () => {
    if (!selected) return
    setSending(true)
    const friend = friends.find(f => f.id === selected)

    if (supabase && user?.id) {
      // Insert a wingman nudge record
      await supabase.from('wingman_nudges').insert({
        from_user:     user.id,
        to_friend:     selected,
        target_user:   targetSession?.userId,
        message:       `${user.displayName ?? 'Your friend'} thinks you two should meet!`,
        created_at:    new Date().toISOString(),
        expires_at:    new Date(Date.now() + 48 * 3600000).toISOString(),
      })
    }
    setSending(false)
    setSent(true)
    showToast?.(`🦅 Nudge sent to ${friend?.displayName ?? 'your friend'}!`, 'success')
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>🦅 Wingman Mode</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!sent ? (
          <>
            <p className={styles.sub}>
              Pick a friend to send a nudge:{' '}
              <em>"{user?.displayName ?? 'Your friend'} thinks you two should meet!"</em>
            </p>

            <div className={styles.targetCard}>
              {targetSession?.photoURL && (
                <img src={targetSession.photoURL} alt="" className={styles.targetPhoto} />
              )}
              <div>
                <span className={styles.targetName}>{targetSession?.displayName ?? 'This person'}</span>
                {targetSession?.city && (
                  <span className={styles.targetCity}>📍 {targetSession.city}</span>
                )}
              </div>
            </div>

            <p className={styles.friendsLabel}>Choose a friend to wing for:</p>

            {loading ? (
              <div className={styles.loadingRow}>
                {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
              </div>
            ) : (
              <div className={styles.friendsList}>
                {friends.map(f => (
                  <button
                    key={f.id}
                    className={`${styles.friendRow} ${selected === f.id ? styles.friendRowSelected : ''}`}
                    onClick={() => setSelected(f.id)}
                  >
                    <div className={styles.friendAvatar}>
                      {f.photoURL
                        ? <img src={f.photoURL} alt={f.displayName} className={styles.friendAvatarImg} />
                        : <span className={styles.friendAvatarFallback}>{f.displayName?.[0] ?? '?'}</span>
                      }
                    </div>
                    <span className={styles.friendName}>{f.displayName}</span>
                    {selected === f.id && <span className={styles.checkMark}>✓</span>}
                  </button>
                ))}
              </div>
            )}

            <button
              className={`${styles.sendBtn} ${!selected || sending ? styles.sendBtnDisabled : ''}`}
              disabled={!selected || sending}
              onClick={handleSend}
            >
              {sending ? 'Sending…' : '🦅 Send Wingman Nudge'}
            </button>
          </>
        ) : (
          <div className={styles.sentWrap}>
            <span className={styles.sentEmoji}>🦅</span>
            <p className={styles.sentText}>
              Nudge sent! Your friend will see a notification about{' '}
              <strong>{targetSession?.displayName ?? 'this person'}</strong>.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
