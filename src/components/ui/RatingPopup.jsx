import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const SERVICE_LABELS = {
  ride_bike: 'Ojek Ride',
  ride_car: 'Car Ride',
  food_delivery: 'Food Delivery',
};

const FEEDBACK_OPTIONS = {
  ride_bike: ['Safe driving', 'Clean vehicle', 'Good route', 'Friendly', 'On time'],
  ride_car: ['Safe driving', 'Clean vehicle', 'Good route', 'Friendly', 'On time'],
  food_delivery: ['Fast delivery', 'Food intact', 'Friendly driver', 'Good packaging', 'On time'],
};

const TIP_OPTIONS = [
  { label: 'Rp 2.000', value: 2000 },
  { label: 'Rp 5.000', value: 5000 },
  { label: 'Rp 10.000', value: 10000 },
];

const STAR_EMPTY = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const STAR_FILLED = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#FACC15" stroke="#FACC15" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function RatingPopup({
  driverName,
  driverPhoto,
  serviceType,
  orderId,
  onSubmit,
  onSkip,
}) {
  const [stars, setStars] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);
  const [visible, setVisible] = useState(false);
  const [thankYou, setThankYou] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    // trigger slide-up on mount
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const feedbackOptions = FEEDBACK_OPTIONS[serviceType] || FEEDBACK_OPTIONS.ride_bike;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    const rating = {
      orderId,
      driverName,
      stars,
      comment: comment.trim(),
      tip,
      feedbackTags: selectedTags,
      serviceType,
      date: new Date().toISOString(),
    };

    // persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('indoo_ratings') || '[]');
      existing.push(rating);
      localStorage.setItem('indoo_ratings', JSON.stringify(existing));
    } catch {
      // silent
    }

    setThankYou(true);
    setTimeout(() => {
      onSubmit?.({ stars, comment: comment.trim(), tip });
    }, 1200);
  };

  const handleSkip = () => {
    setVisible(false);
    setTimeout(() => onSkip?.(), 300);
  };

  // -- styles --
  const overlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 10020,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    transition: 'opacity 0.3s',
    opacity: visible ? 1 : 0,
  };

  const card = {
    width: '92%',
    maxWidth: 340,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '28px 22px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    transform: visible ? 'translateY(0)' : 'translateY(60px)',
    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.35s',
    opacity: visible ? 1 : 0,
  };

  const photoStyle = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(255,255,255,0.15)',
  };

  const nameStyle = {
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    margin: '4px 0 0',
    textAlign: 'center',
  };

  const serviceLabel = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    margin: 0,
  };

  const questionStyle = {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: 500,
    margin: 0,
  };

  const starsRow = {
    display: 'flex',
    gap: 8,
    margin: '4px 0',
  };

  const starBtn = {
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    minWidth: 44,
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const pillsWrap = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  };

  const pillBase = {
    fontSize: 12,
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.15)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
  };

  const pillInactive = {
    ...pillBase,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.7)',
  };

  const pillActive = {
    ...pillBase,
    background: 'rgba(34,197,94,0.2)',
    color: '#22C55E',
    borderColor: '#22C55E',
  };

  const textareaStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    padding: '10px 12px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const tipLabel = {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    margin: 0,
  };

  const tipBtnBase = {
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
    minHeight: 44,
    border: '1px solid rgba(255,255,255,0.15)',
  };

  const tipBtnInactive = {
    ...tipBtnBase,
    background: 'rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.7)',
  };

  const tipBtnActive = {
    ...tipBtnBase,
    background: 'rgba(34,197,94,0.2)',
    color: '#22C55E',
    borderColor: '#22C55E',
  };

  const submitBtn = {
    width: '100%',
    padding: '14px 0',
    borderRadius: 14,
    border: 'none',
    background: stars > 0 ? '#22C55E' : 'rgba(255,255,255,0.1)',
    color: stars > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
    fontSize: 15,
    fontWeight: 700,
    cursor: stars > 0 ? 'pointer' : 'default',
    minHeight: 44,
    transition: 'background 0.2s, color 0.2s',
  };

  const skipBtn = {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    cursor: 'pointer',
    padding: '8px 16px',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const thankYouStyle = {
    color: '#22C55E',
    fontSize: 22,
    fontWeight: 700,
    textAlign: 'center',
    padding: '48px 0',
  };

  // -- render --
  const content = (
    <div style={overlay} role="dialog" aria-modal="true" aria-label="Rate your experience">
      <div style={card} ref={cardRef}>
        {thankYou ? (
          <p style={thankYouStyle}>Thank you!</p>
        ) : (
          <>
            {/* Driver info */}
            <img
              src={driverPhoto}
              alt={driverName}
              style={photoStyle}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div style={{ textAlign: 'center' }}>
              <p style={nameStyle}>{driverName}</p>
              <p style={serviceLabel}>{SERVICE_LABELS[serviceType] || serviceType}</p>
            </div>

            {/* Question */}
            <p style={questionStyle}>How was your experience?</p>

            {/* Stars */}
            <div style={starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  style={starBtn}
                  onClick={() => setStars(n)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  {n <= stars ? STAR_FILLED : STAR_EMPTY}
                </button>
              ))}
            </div>

            {/* Feedback pills */}
            {stars > 0 && (
              <div style={pillsWrap}>
                {feedbackOptions.map((tag) => (
                  <button
                    key={tag}
                    style={selectedTags.includes(tag) ? pillActive : pillInactive}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* Comment */}
            <textarea
              rows={2}
              style={textareaStyle}
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {/* Tip */}
            <div style={{ width: '100%', textAlign: 'center' }}>
              <p style={tipLabel}>Leave a tip?</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {TIP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    style={tip === opt.value ? tipBtnActive : tipBtnInactive}
                    onClick={() => setTip(tip === opt.value ? 0 : opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              style={submitBtn}
              disabled={stars === 0}
              onClick={handleSubmit}
            >
              Submit
            </button>

            {/* Skip */}
            <button style={skipBtn} onClick={handleSkip}>
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
