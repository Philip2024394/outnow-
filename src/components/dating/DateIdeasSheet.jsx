import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { DATE_IDEAS, SECTION_LABELS, sendDateInvite, suggestDateIdea } from '@/services/dateInviteService'
import styles from './DateIdeasSheet.module.css'

const SECTION_ORDER = ['culture', 'outdoor', 'social', 'dining']

export default function DateIdeasSheet({ targetSession, onClose }) {
  const { user } = useAuth()
  const [view,         setView]         = useState('grid')
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedTime, setProposedTime] = useState('')
  const [sending,      setSending]      = useState(false)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [suggestTitle, setSuggestTitle] = useState('')
  const [suggestDesc,  setSuggestDesc]  = useState('')
  const [suggestSent,  setSuggestSent]  = useState(false)
  const [suggesting,   setSuggesting]   = useState(false)

  const query = searchQuery.trim().toLowerCase()

  // ── Grid ──────────────────────────────────────────────────────────────────
  const renderGrid = () => (
    <div className={styles.body}>
      {/* Search bar */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search ideas from library…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className={styles.searchClear} onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* Sections */}
      {SECTION_ORDER.map(sec => {
        const ideas = DATE_IDEAS.filter(d =>
          d.section === sec && (!query || d.title.toLowerCase().includes(query))
        )
        if (!ideas.length) return null
        return (
          <div key={sec}>
            <div className={styles.sectionHeader}>{SECTION_LABELS[sec]}</div>
            <div className={styles.grid}>
              {ideas.map(idea => (
                <div key={idea.id} className={styles.ideaCard}>
                  <div className={styles.ideaImgWrap}>
                    <img src={idea.image_url} alt={idea.title} className={styles.ideaImg} />
                    <span className={styles.ideaName}>{idea.title}</span>
                    <span className={styles.ideaStars}>
                      {'★'.repeat(3 + (idea.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 3))}
                    </span>
                  </div>
                  <button
                    className={styles.viewBtn}
                    onClick={() => { setSelectedIdea(idea); setView('detail') }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Suggest button */}
      <button className={styles.suggestIdeasBtn} onClick={() => setView('suggest')}>
        💡 Suggest a Date Idea
      </button>
    </div>
  )

  // ── Detail ────────────────────────────────────────────────────────────────
  const renderDetail = () => {
    if (!selectedIdea) return null
    return (
      <div className={styles.detailWrap}>
        <button className={styles.detailBack} onClick={() => setView('grid')}>← Back</button>
        <div className={styles.detailImgWrap}>
          <img src={selectedIdea.image_url} alt={selectedIdea.title} className={styles.detailImg} />
          <div className={styles.popularityBadge}>🔥 {selectedIdea.popularity} dates</div>
        </div>
        <div className={styles.detailBody}>
          <div className={styles.detailMeta}>
            <span className={styles.detailCat}>{SECTION_LABELS[selectedIdea.section]}</span>
          </div>
          <h3 className={styles.detailTitle}>{selectedIdea.title}</h3>
          <p className={styles.detailDesc}>{selectedIdea.description}</p>
          {targetSession && (
            <div className={styles.inviteTarget}>
              <div className={styles.inviteTargetAvatar}>
                {targetSession.photoURL
                  ? <img src={targetSession.photoURL} alt={targetSession.displayName} className={styles.inviteTargetImg} />
                  : <span className={styles.inviteTargetInitial}>{(targetSession.displayName ?? '?')[0]}</span>
                }
              </div>
              <div>
                <span className={styles.inviteTargetLabel}>Inviting</span>
                <span className={styles.inviteTargetName}>{targetSession.displayName ?? 'this person'}</span>
              </div>
            </div>
          )}
          <button className={styles.inviteBtn} onClick={() => setView('datetime')}>
            💕 Invite to Date
          </button>
        </div>
      </div>
    )
  }

  // ── Date + time picker ────────────────────────────────────────────────────
  const renderDatetime = () => (
    <div className={styles.datetimeWrap}>
      <button className={styles.detailBack} onClick={() => setView('detail')}>← Back</button>
      <div className={styles.datetimeThumb}>
        <img src={selectedIdea?.image_url} alt={selectedIdea?.title} className={styles.datetimeThumbImg} />
        <div className={styles.datetimeThumbOverlay}>
          <span className={styles.datetimeThumbTitle}>{selectedIdea?.title}</span>
        </div>
      </div>
      <div className={styles.datetimeBody}>
        <h3 className={styles.datetimeTitle}>Suggest a time</h3>
        <p className={styles.datetimeSub}>
          When would you like to go on this date with {targetSession?.displayName ?? 'them'}?
          <br /><span className={styles.datetimeOptional}>(Optional — you can suggest it in chat instead)</span>
        </p>
        <label className={styles.dtLabel}>Date</label>
        <input
          type="date"
          className={styles.dtInput}
          value={proposedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setProposedDate(e.target.value)}
        />
        <label className={styles.dtLabel}>Time</label>
        <input
          type="time"
          className={styles.dtInput}
          value={proposedTime}
          onChange={e => setProposedTime(e.target.value)}
        />
        <button className={styles.sendInviteBtn} disabled={sending} onClick={handleSendInvite}>
          {sending ? 'Sending…' : '💌 Send Date Invite'}
        </button>
        <button className={styles.skipTimeBtn} disabled={sending} onClick={handleSendInvite}>
          Skip — suggest time in chat
        </button>
      </div>
    </div>
  )

  // ── Sent confirmation ─────────────────────────────────────────────────────
  const renderSent = () => (
    <div className={styles.sentWrap}>
      <span className={styles.sentIcon}>💌</span>
      <h3 className={styles.sentTitle}>Invite Sent!</h3>
      <p className={styles.sentSub}>
        Your date invite for <strong>{selectedIdea?.title}</strong> has been sent to{' '}
        <strong>{targetSession?.displayName ?? 'them'}</strong>.
      </p>
      {(proposedDate || proposedTime) && (
        <div className={styles.sentDateTime}>
          {proposedDate && <span>📅 {new Date(proposedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
          {proposedTime && <span>🕐 {proposedTime}</span>}
        </div>
      )}
      <p className={styles.sentNote}>
        You'll be notified when they accept. If they're offline the invite goes to their notifications. The invite expires in 24 hours.
      </p>
      <button className={styles.sentCloseBtn} onClick={onClose}>Done</button>
    </div>
  )

  // ── Suggest a date idea ───────────────────────────────────────────────────
  const renderSuggest = () => (
    <div className={styles.datetimeWrap}>
      <button className={styles.detailBack} onClick={() => { setView('grid'); setSuggestSent(false); setSuggestTitle(''); setSuggestDesc('') }}>
        ← Back
      </button>
      {suggestSent ? (
        <div className={styles.sentWrap}>
          <span className={styles.sentIcon}>💡</span>
          <h3 className={styles.sentTitle}>Idea Submitted!</h3>
          <p className={styles.sentSub}>Thanks! If accepted, your idea will be live and ready for you to use within 48 hours.</p>
          <button className={styles.sentCloseBtn} onClick={() => { setView('grid'); setSuggestSent(false); setSuggestTitle(''); setSuggestDesc('') }}>
            Done
          </button>
        </div>
      ) : (
        <div className={styles.datetimeBody}>
          <h3 className={styles.datetimeTitle}>Suggest a Date Idea</h3>
          <p className={styles.datetimeSub}>Have a great idea for a first date? Submit it and if accepted it'll be live within 48 hours.</p>
          <label className={styles.dtLabel}>Title *</label>
          <input
            type="text"
            className={styles.dtInput}
            placeholder="e.g. Sunrise Hike"
            value={suggestTitle}
            onChange={e => setSuggestTitle(e.target.value)}
            maxLength={50}
          />
          <label className={styles.dtLabel}>Description <span className={styles.datetimeOptional}>(optional)</span></label>
          <textarea
            className={`${styles.dtInput} ${styles.dtTextarea}`}
            placeholder="Describe why it makes a great date…"
            value={suggestDesc}
            onChange={e => setSuggestDesc(e.target.value)}
            maxLength={300}
            rows={4}
          />
          <button
            className={styles.sendInviteBtn}
            disabled={!suggestTitle.trim() || suggesting}
            onClick={handleSuggest}
          >
            {suggesting ? 'Submitting…' : '💡 Submit Idea'}
          </button>
        </div>
      )}
    </div>
  )

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSendInvite = async () => {
    if (sending) return
    setSending(true)
    await sendDateInvite({
      fromUserId:   user?.id ?? user?.uid ?? 'demo',
      fromName:     user?.displayName ?? 'Someone',
      toUserId:     targetSession?.userId ?? targetSession?.id ?? 'unknown',
      ideaId:       selectedIdea?.id,
      proposedDate: proposedDate || null,
      proposedTime: proposedTime || null,
    })
    setSending(false)
    setView('sent')
  }

  const handleSuggest = async () => {
    if (suggesting || !suggestTitle.trim()) return
    setSuggesting(true)
    await suggestDateIdea({
      userId:      user?.id ?? user?.uid ?? 'demo',
      title:       suggestTitle.trim(),
      description: suggestDesc.trim(),
    })
    setSuggesting(false)
    setSuggestSent(true)
  }

  return (
    <div className={styles.sheet}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.headerBack} onClick={view === 'grid' ? onClose : () => setView('grid')}>
          {view === 'grid' ? '✕' : '←'}
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>Date Ideas</span>
          {targetSession && (
            <span className={styles.headerSub}>for {targetSession.displayName}</span>
          )}
        </div>
        <div style={{ width: 32 }} />
      </div>

      {view === 'grid'     && renderGrid()}
      {view === 'detail'   && renderDetail()}
      {view === 'datetime' && renderDatetime()}
      {view === 'sent'     && renderSent()}
      {view === 'suggest'  && renderSuggest()}
    </div>
  )
}
