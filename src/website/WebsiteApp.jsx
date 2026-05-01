/**
 * WebsiteApp — Main router for the INDOO Property Website.
 * Standalone module — does not import or render any mobile app components.
 * Shares data services + reusable property components with the app.
 */
import { useState } from 'react'
import '../website/styles/website.css'
import WebsiteNav from './components/WebsiteNav'
import WebsiteFooter from './components/WebsiteFooter'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import PropertyDetailPage from './pages/PropertyDetailPage'

const BG_IMG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20May%202,%202026,%2002_15_43%20AM.png'

export default function WebsiteApp() {
  const [page, setPage] = useState('home')
  const [selectedListing, setSelectedListing] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all') // all | sale | rent

  const navigate = (target) => {
    if (target === 'home') { setPage('home'); setSelectedListing(null) }
    else if (target === 'sale') { setPage('search'); setFilterMode('sale'); setSelectedListing(null) }
    else if (target === 'rent') { setPage('search'); setFilterMode('rent'); setSelectedListing(null) }
    else if (target === 'newprojects') { setPage('search'); setFilterMode('all'); setSelectedListing(null) }
    else if (target === 'agents') { setPage('search'); setSelectedListing(null) }
    else if (target === 'kpr') { setPage('search'); setSelectedListing(null) }
    else { setPage(target); setSelectedListing(null) }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setPage('search')
    setSelectedListing(null)
  }

  const handleSelectListing = (listing) => {
    setSelectedListing(listing)
    setPage('detail')
  }

  return (
    <div className="website-page" style={{
      position: 'relative',
      background: `url("${BG_IMG}") center center / 100% 100% no-repeat fixed`,
    }}>
      {/* Fixed background overlay for readability */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <WebsiteNav activePage={page} onNavigate={navigate} onSearch={handleSearch} />

        {page === 'home' && (
          <HomePage
            onSearch={handleSearch}
            onBrowseSale={() => { setFilterMode('sale'); setPage('search') }}
            onBrowseRent={() => { setFilterMode('rent'); setPage('search') }}
            onBrowseAll={() => { setFilterMode('all'); setPage('search') }}
            onSelectListing={handleSelectListing}
          />
        )}

        {page === 'search' && (
          <SearchPage
            initialSearch={searchQuery}
            initialMode={filterMode}
            onSelectListing={handleSelectListing}
            onBack={() => setPage('home')}
          />
        )}

        {page === 'detail' && selectedListing && (
          <PropertyDetailPage
            listing={selectedListing}
            onBack={() => setPage('search')}
            onSelectListing={handleSelectListing}
          />
        )}

        <WebsiteFooter />
      </div>
    </div>
  )
}
