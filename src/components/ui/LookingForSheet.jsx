import { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { LOOKING_FOR_GROUPS, LOOKING_FOR_OPTIONS } from '@/utils/lookingForLabels'
import styles from './LookingForSheet.module.css'

export default function LookingForSheet({ open, value, onChange, onClose }) {
  const sheetRef = useRef(null)
  const listRef  = useRef(null)
  const startYRef   = useRef(null)
  const currentYRef = useRef(0)

  // Scroll selected item into view when opening
  useEffect(() => {
    if (!open || !listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    if (selected) selected.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [open])

  // Swipe down to close
  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet || !open) return
    const onTouchStart = (e) => { startYRef.current = e.touches[0].clientY }
    const onTouchMove  = (e) => {
      if (startYRef.current === null) return
      const delta = e.touches[0].clientY - startYRef.current
      if (delta > 0) {
        currentYRef.current = delta
        sheet.style.transform = `translateY(${delta}px)`
        sheet.style.transition = 'none'
      }
    }
    const onTouchEnd = () => {
      sheet.style.transition = ''
      if (currentYRef.current > 80) onClose()
      else sheet.style.transform = ''
      startYRef.current = null
      currentYRef.current = 0
    }
    sheet.addEventListener('touchstart', onTouchStart, { passive: true })
    sheet.addEventListener('touchmove',  onTouchMove,  { passive: true })
    sheet.addEventListener('touchend',   onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchmove',  onTouchMove)
      sheet.removeEventListener('touchend',   onTouchEnd)
    }
  }, [open, onClose])

  if (!open) return null

  // First option overall (hint when nothing selected)
  const firstValue = LOOKING_FOR_OPTIONS[0].value

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />

      <div ref={sheetRef} className={styles.sheet}>
        {/* Drag handle */}
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.headerTitle}>I joined the app for</span>
            <span className={styles.headerSub}>Select one category from directory</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* One long list with group headers */}
        <div className={styles.list} ref={listRef}>
          {LOOKING_FOR_GROUPS.map(group => {
            const opts = LOOKING_FOR_OPTIONS.filter(o => o.group === group.key)
            return (
              <div key={group.key} className={styles.group}>
                {/* Section header */}
                <div className={styles.groupHeader}>
                  <span className={styles.groupLabel}>{group.label}</span>
                  <div className={styles.groupLine} />
                </div>

                {/* Options */}
                {opts.map(opt => {
                  const selected = opt.value === value
                  const isFirstHint = !value && opt.value === firstValue
                  return (
                    <button
                      key={opt.value}
                      data-selected={selected ? 'true' : 'false'}
                      className={`${styles.option} ${selected ? styles.optionSelected : ''} ${isFirstHint ? styles.optionHint : ''}`}
                      onClick={() => { onChange(opt.value); onClose() }}
                    >
                      <span className={styles.optionEmoji}>{opt.emoji}</span>
                      <span className={styles.optionLabel}>{opt.label}</span>
                      {(selected || isFirstHint) && (
                        <span className={`${styles.optionCheck} ${isFirstHint && !selected ? styles.optionCheckHint : ''}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={selected ? '#8DC63F' : 'rgba(141,198,63,0.4)'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
