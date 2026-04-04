import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './PlaceSearch.module.css'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const DEMO_PLACES = [
  { place_id: 'd1', name: 'The Slug & Lettuce', vicinity: 'Soho, London', types: ['bar'] },
  { place_id: 'd2', name: 'Flat White Coffee', vicinity: 'Covent Garden, London', types: ['cafe'] },
  { place_id: 'd3', name: 'Five Guys', vicinity: 'Oxford Street, London', types: ['restaurant'] },
  { place_id: 'd4', name: 'Dishoom', vicinity: 'King\'s Cross, London', types: ['restaurant'] },
  { place_id: 'd5', name: 'The Alchemist', vicinity: 'Bevis Marks, London', types: ['bar'] },
]

const DEMO_AREAS = [
  { place_id: 'a1', name: 'Shoreditch', vicinity: 'London', types: ['neighborhood'] },
  { place_id: 'a2', name: 'Soho',       vicinity: 'London', types: ['neighborhood'] },
  { place_id: 'a3', name: 'Brixton',    vicinity: 'London', types: ['neighborhood'] },
  { place_id: 'a4', name: 'Camden',     vicinity: 'London', types: ['neighborhood'] },
]

/**
 * Google Places Autocomplete.
 * allowAreas   — omits type filter so both venues and areas are returned.
 * areasOnly    — restricts to neighbourhoods / districts / sublocalities only.
 * cityContext  — city name prepended to the API query for city-biased area results.
 *                The visible input stays clean (only what the user typed).
 * Falls back to fake suggestions in demo mode.
 */
export default function PlaceSearch({ userCoords, allowAreas = false, areasOnly = false, cityContext = null, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const autocompleteRef = useRef(null)
  const placesRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!window.google) return
    autocompleteRef.current = new window.google.maps.places.AutocompleteService()
    // Temp map element for PlacesService
    const el = document.createElement('div')
    placesRef.current = new window.google.maps.places.PlacesService(el)
  }, [])

  const search = useCallback((value) => {
    if (!value.trim()) { setSuggestions([]); return }

    // Demo mode
    if (IS_DEMO) {
      const pool = areasOnly ? DEMO_AREAS : allowAreas ? [...DEMO_PLACES, ...DEMO_AREAS] : DEMO_PLACES
      const q    = value.toLowerCase()
      const hits = pool.filter(p =>
        p.name.toLowerCase().includes(q) || p.vicinity.toLowerCase().includes(q)
      )
      setSuggestions(hits.length ? hits : pool.slice(0, 3))
      return
    }

    if (!autocompleteRef.current) { setSuggestions([]); return }

    // Prepend city context so Google biases results to that city.
    // The visible input stays clean — only the API query is modified.
    const apiInput = cityContext ? `${value}, ${cityContext}` : value

    const request = { input: apiInput }
    if (areasOnly)       request.types = ['(regions)']
    else if (!allowAreas) request.types = ['establishment']

    if (userCoords) {
      request.location = new window.google.maps.LatLng(userCoords.lat, userCoords.lng)
      request.radius   = 10000
    }

    setLoading(true)
    autocompleteRef.current.getPlacePredictions(request, (predictions, status) => {
      setLoading(false)
      setSuggestions(status === 'OK' && predictions ? predictions : [])
    })
  }, [userCoords, allowAreas, areasOnly, cityContext])

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  const handleSelect = useCallback((prediction) => {
    // Demo places use .name directly; Google predictions use structured_formatting
    const displayName = prediction.name ?? prediction.structured_formatting?.main_text ?? ''
    setQuery(displayName)
    setSuggestions([])

    if (IS_DEMO) {
      onSelect({
        placeId: prediction.place_id,
        name: displayName,
        types: prediction.types ?? ['establishment'],
        location: { lat: 51.507 + (Math.random() - 0.5) * 0.01, lng: -0.127 + (Math.random() - 0.5) * 0.01 },
      })
      return
    }

    placesRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['place_id', 'name', 'types', 'geometry'] },
      (place, status) => {
        if (status !== 'OK' || !place) return
        onSelect({
          placeId: place.place_id,
          name: place.name,
          types: place.types ?? [],
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
        })
      }
    )
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
            areasOnly   ? `Area or district${cityContext ? ` in ${cityContext}` : ''}…`
            : allowAreas ? 'Venue, bar, area or district…'
            : 'Search for a bar, café, restaurant…'
          }
          className={styles.input}
          autoComplete="off"
        />
        {loading && <div className={styles.loader} />}
      </div>

      {suggestions.length > 0 && (
        <ul className={styles.list}>
          {suggestions.map((s) => (
            <li key={s.place_id} className={styles.item} onClick={() => handleSelect(s)}>
              <span className={styles.itemIcon}>📍</span>
              <div className={styles.itemText}>
                <span className={styles.mainText}>{s.name ?? s.structured_formatting?.main_text}</span>
                <span className={styles.secondaryText}>{s.vicinity ?? s.structured_formatting?.secondary_text}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
