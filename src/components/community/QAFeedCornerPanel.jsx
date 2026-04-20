import styles from './QAFeedScreen.module.css'

export default function QAFeedCornerPanel({
  cornerPanel,
  setCornerPanel,
  shopSellers,
  galleryPhotos,
  peopleProfiles,
  hotPosts,
  items,
  scrollToSlide,
  setCornerSeller,
}) {
  if (!cornerPanel) return null

  return (
    <div className={styles.cornerOverlay} onClick={e => e.target === e.currentTarget && setCornerPanel(null)}>
      <div className={styles.cornerSheet}>
        <div className={styles.cornerSheetHandle} />

        {/* ── Tab bar ── */}
        <div className={styles.cornerTabs}>
          {[
            { id: 'people',  label: '👥 People'  },
            { id: 'gallery', label: '🖼️ Photos'  },
            { id: 'shop',    label: '🛍️ Shop'    },
            { id: 'hot',     label: '🔥 Hot'     },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.cornerTab} ${cornerPanel === t.id ? styles.cornerTabActive : ''}`}
              onClick={() => setCornerPanel(t.id)}
            >
              {t.label}
            </button>
          ))}
          <button className={styles.cornerSheetClose} onClick={() => setCornerPanel(null)}>✕</button>
        </div>

        {/* ── SHOP panel ── */}
        {cornerPanel === 'shop' && (
          <>{shopSellers.length === 0 ? (
              <p className={styles.cornerEmpty}>No shop sellers in the live feed yet.</p>
            ) : (
              <div className={styles.shopGrid}>
                {shopSellers.map(s => (
                  <button
                    key={s.userId}
                    className={styles.shopCard}
                    onClick={() => {
                      setCornerPanel(null)
                      setCornerSeller({ id: s.userId, displayName: s.displayName, photoURL: s.photoURL, city: s.city, area: s.area })
                    }}
                  >
                    {s.photoURL
                      ? <img src={s.photoURL} alt={s.displayName} className={styles.shopCardPhoto} />
                      : <div className={styles.shopCardInitial}>{(s.displayName ?? '?')[0].toUpperCase()}</div>
                    }
                    <span className={styles.shopCardName}>{s.displayName}</span>
                    <span className={styles.shopCardBadge}>🛍️ Shop</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── GALLERY panel ── */}
        {cornerPanel === 'gallery' && (
          <>{galleryPhotos.length === 0 ? (
              <p className={styles.cornerEmpty}>No photos posted to the live feed yet.</p>
            ) : (
              <div className={styles.galleryGrid}>
                {galleryPhotos.map(p => {
                  const slideIdx = items.findIndex(it => it.type === 'post' && it.post?.id === p.id)
                  return (
                    <button
                      key={p.id}
                      className={styles.galleryCell}
                      onClick={() => scrollToSlide(slideIdx >= 0 ? slideIdx : 0)}
                      aria-label={`Photo by ${p.displayName}`}
                    >
                      <img src={p.photoURL} alt={p.displayName} className={styles.galleryCellImg} />
                      <div className={styles.galleryCellFooter}>
                        <span className={styles.galleryCellName}>{p.displayName}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── PEOPLE panel ── */}
        {cornerPanel === 'people' && (
          <>{peopleProfiles.length === 0 ? (
              <p className={styles.cornerEmpty}>No profiles yet.</p>
            ) : (
              <div className={styles.peopleList}>
                {peopleProfiles.map(p => {
                  const slideIdx = items.findIndex(it => it.type === 'profile' && it.profile?.userId === p.userId)
                  return (
                    <button
                      key={p.userId}
                      className={styles.personCard}
                      onClick={() => scrollToSlide(slideIdx >= 0 ? slideIdx : 0)}
                    >
                      {p.photoURL
                        ? <img src={p.photoURL} alt={p.displayName} className={styles.personPhoto} />
                        : <div className={styles.personInitial}>{(p.displayName ?? '?')[0].toUpperCase()}</div>
                      }
                      <div className={styles.personInfo}>
                        <span className={styles.personName}>{p.displayName}</span>
                        {(p.city ?? p.area) && <span className={styles.personMeta}>📍 {p.city ?? p.area}</span>}
                      </div>
                      <span className={styles.personArrow}>→</span>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── HOT / TRENDING panel ── */}
        {cornerPanel === 'hot' && (
          <>{hotPosts.length === 0 ? (
              <p className={styles.cornerEmpty}>Nothing trending yet — be the first to post!</p>
            ) : (
              <div className={styles.hotList}>
                {hotPosts.map((p, rank) => {
                  const slideIdx = items.findIndex(it => it.type === 'post' && it.post?.id === p.id)
                  return (
                    <button
                      key={p.id}
                      className={styles.hotItem}
                      onClick={() => scrollToSlide(slideIdx >= 0 ? slideIdx : 0)}
                    >
                      <span className={styles.hotRank}>{rank + 1}</span>
                      {p.photoURL
                        ? <img src={p.photoURL} alt={p.displayName} className={styles.hotThumb} />
                        : <div className={styles.hotThumbFallback}>{(p.displayName ?? '?')[0].toUpperCase()}</div>
                      }
                      <div className={styles.hotInfo}>
                        <span className={styles.hotName}>{p.displayName}</span>
                        <span className={styles.hotText}>{p.text?.slice(0, 60)}{(p.text?.length ?? 0) > 60 ? '…' : ''}</span>
                      </div>
                      <div className={styles.hotStats}>
                        <span>❤️ {p.likes}</span>
                        <span>🔥 {p.hereCount}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
