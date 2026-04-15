/**
 * SearchAutocomplete — dropdown below search bar with:
 * - Recent searches (localStorage)
 * - Trending searches
 * - Product name suggestions matching query
 */
import { useState, useEffect } from 'react'
import styles from './SearchAutocomplete.module.css'

const RECENT_KEY = 'indoo_recent_searches'
const MAX_RECENT = 8

const TRENDING = [
  'Leather bag', 'Earbuds', 'Wallet', 'Handmade', 'Electronics',
  'Fashion', 'Skincare', 'Phone case', 'Organic food', 'Custom order',
]

export function saveRecentSearch(q) {
  if (!q?.trim()) return
  try {
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    const filtered = recent.filter(s => s.toLowerCase() !== q.toLowerCase())
    filtered.unshift(q.trim())
    if (filtered.length > MAX_RECENT) filtered.length = MAX_RECENT
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered))
  } catch {}
}

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY)
}

export default function SearchAutocomplete({ query, products, onSelect, visible }) {
  const [recent, setRecent] = useState([])

  useEffect(() => {
    if (visible) setRecent(getRecentSearches())
  }, [visible])

  if (!visible) return null

  const q = query.toLowerCase().trim()

  // Product suggestions matching query
  const suggestions = q.length >= 2
    ? (products ?? [])
        .filter(p => p.name?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(p => p.name)
    : []

  // Remove duplicates
  const uniqueSuggestions = [...new Set(suggestions)]

  return (
    <div className={styles.dropdown}>
      {/* Product suggestions */}
      {uniqueSuggestions.length > 0 && (
        <div className={styles.section}>
          {uniqueSuggestions.map((s, i) => (
            <button key={`s-${i}`} className={styles.item} onClick={() => onSelect(s)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className={styles.itemText} dangerouslySetInnerHTML={{
                __html: s.replace(new RegExp(`(${q})`, 'gi'), '<strong>$1</strong>')
              }} />
            </button>
          ))}
        </div>
      )}

      {/* Recent searches */}
      {!q && recent.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Recent</span>
            <button className={styles.clearBtn} onClick={() => { clearRecentSearches(); setRecent([]) }}>Clear</button>
          </div>
          {recent.map((s, i) => (
            <button key={`r-${i}`} className={styles.item} onClick={() => onSelect(s)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className={styles.itemText}>{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending */}
      {!q && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Trending</span>
          </div>
          <div className={styles.trendingChips}>
            {TRENDING.map((t, i) => (
              <button key={i} className={styles.trendingChip} onClick={() => onSelect(t)}>
                🔥 {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
