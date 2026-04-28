import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ContactUsPage from '@/components/ui/ContactUsPage';
import LegalPage from '@/components/ui/LegalPage';
import IndooFooter from '@/components/ui/IndooFooter';

const DAY_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2007_28_51%20AM.png?updatedAt=1777249747241';
const NIGHT_BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2027,%202026,%2007_22_25%20AM.png?updatedAt=1777249363795';

const CITIES = [
  'Yogyakarta', 'Jakarta', 'Surabaya', 'Bandung', 'Semarang',
  'Medan', 'Makassar', 'Denpasar', 'Malang', 'Solo',
];

const LANGUAGES = ['English', 'Bahasa Indonesia', '中文', 'العربية'];

const GLASS = {
  borderRadius: 20,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.1)',
  padding: 20,
  marginBottom: 16,
};

const GREEN = '#8DC63F';

function getTimeBasedBg() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? DAY_BG : NIGHT_BG;
}

function loadProfile() {
  try {
    const raw = localStorage.getItem('indoo_demo_profile');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProfile(updates) {
  const current = loadProfile();
  const merged = { ...current, ...updates };
  localStorage.setItem('indoo_demo_profile', JSON.stringify(merged));
  return merged;
}

export default function SimpleProfileScreen({ onClose }) {
  const [profile, setProfile] = useState(loadProfile);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [notifications, setNotifications] = useState(profile.notifications !== false);
  const [email, setEmail] = useState(profile.email || '');
  const [city, setCity] = useState(profile.city || 'Yogyakarta');
  const [language, setLanguage] = useState(profile.language || 'English');

  // Saved locations
  const [locations, setLocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('indoo_saved_locations') || '{}') }
    catch { return {} }
  });
  const [editingLoc, setEditingLoc] = useState(null); // 'home'|'work'|'favourite'|null
  const [locInput, setLocInput] = useState('');
  const [locSuggestions, setLocSuggestions] = useState([]);

  const saveLocation = (key, address) => {
    const updated = { ...locations, [key]: { address, savedAt: new Date().toISOString() } };
    setLocations(updated);
    localStorage.setItem('indoo_saved_locations', JSON.stringify(updated));
    setEditingLoc(null);
    setLocInput('');
    setLocSuggestions([]);
  };

  const removeLocation = (key) => {
    const updated = { ...locations };
    delete updated[key];
    setLocations(updated);
    localStorage.setItem('indoo_saved_locations', JSON.stringify(updated));
  };

  // Simple address suggestions (Indonesian cities/areas)
  const SUGGESTIONS_DB = [
    'Jl. Malioboro, Yogyakarta', 'Jl. Kaliurang KM 5, Yogyakarta', 'Jl. Prawirotaman, Yogyakarta',
    'UGM Campus, Yogyakarta', 'Tugu Station, Yogyakarta', 'Ambarukmo Plaza, Yogyakarta',
    'Jl. Solo, Yogyakarta', 'Jl. Godean, Yogyakarta', 'Kotagede, Yogyakarta', 'Seturan, Yogyakarta',
    'Jl. Sudirman, Jakarta', 'Jl. Thamrin, Jakarta', 'Monas, Jakarta', 'Blok M, Jakarta',
    'Jl. Braga, Bandung', 'Jl. Dago, Bandung', 'Jl. Tunjungan, Surabaya',
  ];

  const handleLocInputChange = (val) => {
    setLocInput(val);
    if (val.length >= 2) {
      const filtered = SUGGESTIONS_DB.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
      setLocSuggestions(filtered);
    } else {
      setLocSuggestions([]);
    }
  };
  const scrollRef = useRef(null);
  const profileCardRef = useRef(null);

  useEffect(() => {
    saveProfile({ email, city, language, notifications });
  }, [email, city, language, notifications]);

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const photo = ev.target.result;
        const updated = saveProfile({ photo });
        setProfile(updated);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSignOut = () => {
    localStorage.removeItem('indoo_registered');
    localStorage.removeItem('indoo_demo_profile');
    window.location.reload();
  };

  const scrollToProfileCard = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      profileCardRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  if (showContact)
    return <ContactUsPage onClose={() => setShowContact(false)} />;
  if (showLegal)
    return <LegalPage onClose={() => setShowLegal(false)} />;

  const content = (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: '#080808',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${getTimeBasedBg()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.3,
        pointerEvents: 'none',
      }} />

      {/* Single scrollable area */}
      <div className="profileScroll" style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 2, scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
      <style>{`.profileScroll::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <img src="https://ik.imagekit.io/nepgaxllc/Bold%203D%20_INDOO_%20logo%20design.png?updatedAt=1776203769926" alt="INDOO" style={{ height: 112, objectFit: 'contain' }} />
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 34,
            cursor: 'pointer',
            padding: 8,
            minWidth: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Settings"
        >
          <span role="img" aria-label="settings">⚙️</span>
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '0 20px 100px 20px',
        }}
      >
        {/* Profile Card */}
        <div ref={profileCardRef} style={{ ...GLASS, textAlign: 'center', paddingTop: 28, paddingBottom: 24 }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: `3px solid ${GREEN}`,
            margin: '0 auto 12px',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 36, color: 'rgba(255,255,255,0.5)' }}>👤</span>
            )}
          </div>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>
            {profile.name || 'User'}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
            {profile.city || city}
          </div>
          <button
            onClick={handlePhotoUpload}
            style={{
              background: 'transparent',
              border: `1px solid ${GREEN}`,
              color: GREEN,
              borderRadius: 20,
              padding: '6px 18px',
              fontSize: 13,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Edit Photo
          </button>
        </div>

        {/* Personal Info */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>Personal Info</div>

          {/* Phone */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              Phone / WhatsApp
            </label>
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '10px 14px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}>
              {profile.phone || 'Not set'}
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                minHeight: 44,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* City */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              City
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                minHeight: 44,
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {CITIES.map((c) => (
                <option key={c} value={c} style={{ background: '#222', color: '#fff' }}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* My Locations */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>My Locations</div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 16 }}>Save locations for faster checkout</span>

          {[
            { key: 'home', icon: '🏠', label: 'Home', desc: 'Default pickup & delivery', required: true },
            { key: 'work', icon: '💼', label: 'Work', desc: 'Your workplace address', required: false },
            { key: 'favourite', icon: '⭐', label: 'Favourite', desc: 'Any spot you visit often', required: false },
          ].map(loc => (
            <div key={loc.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{loc.icon}</span>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', display: 'block' }}>{loc.label}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{loc.desc}</span>
                  </div>
                </div>
                {locations[loc.key] && (
                  <button onClick={() => removeLocation(loc.key)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 16, cursor: 'pointer', padding: 4 }}>✕</button>
                )}
              </div>

              {locations[loc.key] && editingLoc !== loc.key ? (
                <div onClick={() => { setEditingLoc(loc.key); setLocInput(locations[loc.key].address); }} style={{ background: 'rgba(141,198,63,0.08)', border: '1px solid rgba(141,198,63,0.2)', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>📍</span>
                  <span style={{ fontSize: 13, color: '#8DC63F', fontWeight: 600, flex: 1 }}>{locations[loc.key].address}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Edit</span>
                </div>
              ) : editingLoc === loc.key ? (
                <div>
                  <input
                    type="text"
                    value={locInput}
                    onChange={(e) => handleLocInputChange(e.target.value)}
                    placeholder="Type address or area..."
                    autoFocus
                    style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {/* Suggestions dropdown */}
                  {locSuggestions.length > 0 && (
                    <div style={{ marginTop: 4, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {locSuggestions.map((s, i) => (
                        <button key={i} onClick={() => saveLocation(loc.key, s)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(0,0,0,0.7)', border: 'none', borderBottom: i < locSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', color: '#fff', fontSize: 13, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#8DC63F' }}>📍</span> {s}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => { if (locInput.trim()) saveLocation(loc.key, locInput.trim()) }} style={{ flex: 1, padding: 10, borderRadius: 10, background: '#8DC63F', border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setEditingLoc(null); setLocInput(''); setLocSuggestions([]) }} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingLoc(loc.key)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                  <span>+</span> Add {loc.label.toLowerCase()} address
                </button>
              )}
            </div>
          ))}

          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', display: 'block', marginTop: 4 }}>💡 Saved locations appear as quick-select when booking rides or ordering food</span>
        </div>

        {/* Preferences */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>Preferences</div>

          {/* Language */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                minHeight: 44,
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} style={{ background: '#222', color: '#fff' }}>{l}</option>
              ))}
            </select>
          </div>

          {/* Notifications toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#fff' }}>Notifications</span>
            <button
              onClick={() => setNotifications((v) => !v)}
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                border: 'none',
                background: notifications ? GREEN : 'rgba(255,255,255,0.2)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                minWidth: 50,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              aria-label={`Notifications ${notifications ? 'on' : 'off'}`}
            >
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: notifications ? 25 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </div>

        {/* App Info */}
        <div style={GLASS}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 }}>App Info</div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>App Version</span>
            <span style={{ fontSize: 14, color: '#fff' }}>INDOO v1.0</span>
          </div>

          <button
            onClick={() => setShowLegal(true)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 10,
              textAlign: 'left',
              minHeight: 44,
            }}
          >
            View Legal & Policies
          </button>

          <button
            onClick={() => setShowContact(true)}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: 44,
            }}
          >
            Contact Support
          </button>
        </div>
      </div>

      </div>{/* end single scrollable area */}

      <IndooFooter label="Profile" onHome={onClose} onClose={onClose} />

      {/* Settings Drawer Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10001,
          }}
        />
      )}

      {/* Settings Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: drawerOpen ? 0 : -300,
        bottom: 0,
        width: 280,
        zIndex: 10002,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '3px solid rgba(141,198,63,0.3)',
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        overflow: 'hidden',
      }}>
        {/* Green running light on left edge */}
        <div style={{ position: 'absolute', top: 0, left: -3, width: 3, height: '100%', overflow: 'hidden', zIndex: 1 }}>
          <div style={{ position: 'absolute', width: '100%', height: 60, background: 'linear-gradient(180deg, transparent, #8DC63F, transparent)', animation: 'drawerEdgeLight 3s linear infinite' }} />
        </div>
        <style>{`@keyframes drawerEdgeLight { 0% { top: -60px; } 100% { top: 100%; } }`}</style>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 18, fontWeight: 'bold', color: '#fff' }}>Settings</span>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 22,
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {[
            { icon: '👤', label: 'Edit Profile', action: scrollToProfileCard },
            { icon: '🔒', label: 'Privacy Policy', action: () => { setDrawerOpen(false); setShowLegal(true) } },
            { icon: '📋', label: 'Terms of Service', action: () => { setDrawerOpen(false); setShowLegal(true) } },
            { icon: '💰', label: 'Refund Policy', action: () => { setDrawerOpen(false); setShowLegal(true) } },
            { icon: '📞', label: 'Contact Us', action: () => { setDrawerOpen(false); setShowContact(true); } },
            { icon: '🔴', label: 'Sign Out', action: handleSignOut },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: 'calc(100% - 24px)',
                margin: '0 12px 8px',
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{
                fontSize: 15,
                color: item.label === 'Sign Out' ? '#ff4444' : '#fff',
              }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
