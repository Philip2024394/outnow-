import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ContactUsPage from '@/components/ui/ContactUsPage';

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
  const [notifications, setNotifications] = useState(profile.notifications !== false);
  const [email, setEmail] = useState(profile.email || '');
  const [city, setCity] = useState(profile.city || 'Yogyakarta');
  const [language, setLanguage] = useState(profile.language || 'English');
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

  if (showContact) {
    return <ContactUsPage onClose={() => setShowContact(false)} />;
  }

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

      {/* Header */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <span style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>My Profile</span>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
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

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          overflowY: 'auto',
          padding: '0 20px 100px 20px',
          WebkitOverflowScrolling: 'touch',
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
            onClick={() => window.open('/terms', '_blank')}
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

      {/* Footer nav */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 20px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>INDOO · Profile</span>
        <button
          onClick={onClose}
          style={{
            background: GREEN,
            border: 'none',
            borderRadius: 20,
            padding: '8px 24px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer',
            minHeight: 44,
            minWidth: 44,
          }}
        >
          Close
        </button>
      </div>

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
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        transition: 'right 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
      }}>
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
            { icon: '🔒', label: 'Privacy Policy', action: () => window.open('/privacy', '_blank') },
            { icon: '📋', label: 'Terms of Service', action: () => window.open('/terms', '_blank') },
            { icon: '💰', label: 'Refund Policy', action: () => window.open('/refund', '_blank') },
            { icon: '📞', label: 'Contact Us', action: () => { setDrawerOpen(false); setShowContact(true); } },
            { icon: '🔴', label: 'Sign Out', action: handleSignOut },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '14px 20px',
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
