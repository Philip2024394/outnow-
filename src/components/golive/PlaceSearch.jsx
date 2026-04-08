import { useState, useRef, useCallback } from 'react'
import styles from './PlaceSearch.module.css'

const DEMO_PLACES = [
  { place_id: 'd1', name: 'The Slug & Lettuce',  vicinity: 'Soho',          types: ['bar'] },
  { place_id: 'd2', name: 'Flat White Coffee',   vicinity: 'Covent Garden', types: ['cafe'] },
  { place_id: 'd3', name: 'Five Guys',           vicinity: 'Oxford Street', types: ['restaurant'] },
  { place_id: 'd4', name: 'Dishoom',             vicinity: "King's Cross",  types: ['restaurant'] },
  { place_id: 'd5', name: 'The Alchemist',       vicinity: 'Bevis Marks',   types: ['bar'] },
]

const DEMO_AREAS = [
  { place_id: 'a1', name: 'Shoreditch', vicinity: 'Jakarta', types: ['neighborhood'] },
  { place_id: 'a2', name: 'Kemang',     vicinity: 'Jakarta', types: ['neighborhood'] },
  { place_id: 'a3', name: 'Seminyak',   vicinity: 'Bali',    types: ['neighborhood'] },
  { place_id: 'a4', name: 'Ubud',       vicinity: 'Bali',    types: ['neighborhood'] },
]

/**
 * Venue / area search input.
 * Uses local demo data — no external API required.
 * allowAreas   — includes area/district results
 * areasOnly    — only areas
 * cityContext  — shown in placeholder
 */
export default function PlaceSearch({ allowAreas = false, areasOnly = false, cityContext = null, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)

  const search = useCallback((value) => {
    if (!value.trim()) { setSuggestions([]); return }
    const pool = areasOnly ? DEMO_AREAS : allowAreas ? [...DEMO_PLACES, ...DEMO_AREAS] : DEMO_PLACES
    const q    = value.toLowerCase()
    const hits = pool.filter(p =>
      p.name.toLowerCase().includes(q) || p.vicinity.toLowerCase().includes(q)
    )
    setSuggestions(hits.length ? hits : pool.slice(0, 3))
  }, [allowAreas, areasOnly])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleSelect = useCallback((item) => {
    setQuery(item.name)
    setSuggestions([])
    onSelect({
      placeId:  item.place_id,
      name:     item.name,
      types:    item.types ?? ['establishment'],
      location: { lat: null, lng: null },
    })
  }, [onSelect])

  return (
    <div className={styles.wrapper}>
      <div className={styles.inputRow}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder={
            areasOnly    ? `Area or district${cityContext ? ` in ${cityContext}` : ''}…`
            : allowAreas ? 'Venue, bar, area or district…'
            : 'Search for a bar, café, restaurant…'
          }
          className={styles.input}
          autoComplete="off"
        />
      </div>

      {suggestions.length > 0 && (
        <ul className={styles.list}>
          {suggestions.map((s) => (
            <li key={s.place_id} className={styles.item} onClick={() => handleSelect(s)}>
              <span className={styles.itemIcon}>📍</span>
              <div className={styles.itemText}>
                <span className={styles.mainText}>{s.name}</span>
                <span className={styles.secondaryText}>{s.vicinity}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
