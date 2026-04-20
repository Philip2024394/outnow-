import { forwardRef } from 'react'
import styles from './QAFeedScreen.module.css'

export const STICKER_ROWS = [
  {
    label: 'Vibes',
    items: [
      { id: 'fire',    emoji: '🔥', label: 'Fire'    },
      { id: 'star',    emoji: '⭐', label: 'Star'    },
      { id: 'heart',   emoji: '❤️', label: 'Love'    },
      { id: 'cool',    emoji: '😎', label: 'Cool'    },
      { id: 'laugh',   emoji: '😂', label: 'LOL'     },
      { id: 'wow',     emoji: '🤩', label: 'Wow'     },
      { id: 'peace',   emoji: '✌️', label: 'Peace'   },
      { id: 'wave',    emoji: '👋', label: 'Hey'     },
    ],
  },
  {
    label: 'Places',
    items: [
      { id: 'beach',   emoji: '🏖️', label: 'Beach'   },
      { id: 'food',    emoji: '🍜', label: 'Food'    },
      { id: 'coffee',  emoji: '☕', label: 'Coffee'  },
      { id: 'night',   emoji: '🌙', label: 'Night'   },
      { id: 'sunset',  emoji: '🌅', label: 'Sunset'  },
      { id: 'party',   emoji: '🎉', label: 'Party'   },
      { id: 'market',  emoji: '🛍️', label: 'Market'  },
      { id: 'music',   emoji: '🎵', label: 'Music'   },
    ],
  },
  {
    label: 'Ask',
    items: [
      { id: 'q',       emoji: '❓', label: 'Ask'     },
      { id: 'idea',    emoji: '💡', label: 'Idea'    },
      { id: 'tip',     emoji: '📍', label: 'Tip'     },
      { id: 'review',  emoji: '⭐', label: 'Review'  },
      { id: 'photo',   emoji: '📸', label: 'Photo'   },
      { id: 'deal',    emoji: '🤝', label: 'Deal'    },
      { id: 'news',    emoji: '📰', label: 'News'    },
      { id: 'sport',   emoji: '⚽', label: 'Sport'   },
    ],
  },
]

const QAFeedInputBar = forwardRef(function QAFeedInputBar({
  isLiveMode,
  askOpen,
  inputText,
  setInputText,
  sending,
  handleSend,
  stickerOpen,
  setStickerOpen,
  selectedSticker,
  setSelectedSticker,
  flashMode,
  setFlashMode,
  setAskOpen,
  myPhoto,
  myName,
}, ref) {
  if (!isLiveMode && !askOpen) return null

  return (
    <div className={`${styles.askBar} ${isLiveMode ? styles.askBarLive : ''}`}>

      {/* Sticker drawer — slides above the input bar in live mode */}
      {isLiveMode && stickerOpen && (
        <div className={styles.stickerDrawer}>
          {STICKER_ROWS.map(row => (
            <div key={row.label} className={styles.stickerRow}>
              <span className={styles.stickerRowLabel}>{row.label}</span>
              <div className={styles.stickerRowItems}>
                {row.items.map(s => (
                  <button
                    key={s.id}
                    className={`${styles.stickerItem} ${selectedSticker?.id === s.id ? styles.stickerItemActive : ''}`}
                    onClick={() => { setSelectedSticker(prev => prev?.id === s.id ? null : s); setStickerOpen(false) }}
                    aria-label={s.label}
                  >
                    <span className={styles.stickerEmoji}>{s.emoji}</span>
                    <span className={styles.stickerLabel}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.askBarInner}>
        {/* Left: Flash (live) | Avatar (profile) */}
        {isLiveMode ? (
          <button
            className={`${styles.footerSideBtn} ${flashMode ? styles.footerSideBtnFlash : ''}`}
            onClick={() => setFlashMode(p => !p)}
            aria-label="Flash post"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill={flashMode ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </button>
        ) : (myPhoto
          ? <img src={myPhoto} alt="me" className={styles.askAvatar} />
          : <div className={styles.askAvatarFallback}>{(myName[0] ?? 'M').toUpperCase()}</div>
        )}

        {/* Input wrapper — sticker/image button lives inside */}
        <div className={styles.askInputWrap}>
          {isLiveMode && (
            <button
              className={`${styles.stickerPickerBtn} ${stickerOpen ? styles.stickerPickerBtnOpen : ''} ${selectedSticker ? styles.stickerPickerBtnSelected : ''}`}
              onClick={() => setStickerOpen(p => !p)}
              aria-label="Add sticker or image"
            >
              {selectedSticker ? (
                <span className={styles.stickerPickerBtnEmoji}>{selectedSticker.emoji}</span>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              )}
            </button>
          )}
          <input
            ref={ref}
            className={styles.askInput}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={isLiveMode ? 'Post to the live feed…' : 'Ask a question or share a tip…'}
            maxLength={280}
          />
        </div>

        {/* Right: Send */}
        <button
          className={`${styles.footerSideBtn} ${(!inputText.trim() && !selectedSticker) || sending ? styles.footerSideBtnDim : styles.footerSideBtnSend}`}
          onClick={handleSend}
          disabled={(!inputText.trim() && !selectedSticker) || sending}
          aria-label="Send"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>

        {/* Profile mode: close */}
        {!isLiveMode && (
          <button className={styles.askClose} onClick={() => { setAskOpen(false); setInputText('') }} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
      {!isLiveMode && <p className={styles.askHint}>Post a question and wait for the answer</p>}
    </div>
  )
})

export default QAFeedInputBar
