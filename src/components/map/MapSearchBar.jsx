import { useRef } from 'react'
import styles from './MapSearchBar.module.css'

export default function MapSearchBar({ value, onChange, onFocus, onClear, onSubmit, filterFlag, onFilterTap }) {
  const inputRef = useRef(null)

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      inputRef.current?.blur()
      onSubmit?.()
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <svg className={styles.icon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search activity, product, service…"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        {value && (
          <button className={styles.clear} onClick={() => { onClear(); inputRef.current?.blur() }} aria-label="Clear">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        {/* Country filter button */}
        <button className={styles.filterBtn} onClick={onFilterTap} aria-label="Filter by country">
          {filterFlag
            ? <span className={styles.filterFlag}>{filterFlag}</span>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
          }
        </button>
      </div>

    </div>
  )
}
