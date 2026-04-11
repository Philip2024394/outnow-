import { useState, useRef, useEffect, useCallback } from 'react'
import { uploadImage } from '@/lib/uploadImage'
import s from './MarketingTab.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────
const CHANNELS = [
  { id:'instagram', label:'Instagram', icon:'📸', color:'#E1306C' },
  { id:'tiktok',    label:'TikTok',    icon:'🎵', color:'#69C9D0' },
  { id:'facebook',  label:'Facebook',  icon:'👍', color:'#1877F2' },
  { id:'whatsapp',  label:'WhatsApp',  icon:'💬', color:'#25D366' },
  { id:'inapp',     label:'In-App Chat',icon:'📲', color:'#00E5FF' },
]

const AUDIENCES = [
  { id:'all',       label:'All Users',         icon:'👥', count:4821 },
  { id:'dating',    label:'Dating Profiles',   icon:'💕', count:1840 },
  { id:'bike',      label:'Bike Drivers',      icon:'🏍', count:89  },
  { id:'taxi',      label:'Taxi / Car Drivers',icon:'🚕', count:54  },
  { id:'food',      label:'Restaurants',       icon:'🍽️', count:127 },
  { id:'market',    label:'Marketplace Sellers',icon:'🛍️',count:312 },
  { id:'public',    label:'Public Users',      icon:'👤', count:1199},
]

const TONES = ['Professional','Casual & Fun','Urgent','Inspirational','FOMO','Friendly','Bold']

const DEMO_REPORTS = [
  { id:'rp1', name:'Jakarta Dating Launch',   channels:['instagram','whatsapp'], audience:'dating', recipients:1840, delivered:1792, read:1234, date:'2026-04-10', status:'complete', type:'banner'  },
  { id:'rp2', name:'Bike Rider Promo',        channels:['whatsapp'],            audience:'bike',   recipients:89,   delivered:89,   read:78,   date:'2026-04-09', status:'complete', type:'text'    },
  { id:'rp3', name:'Restaurant Week',         channels:['facebook','instagram'],audience:'food',   recipients:127,  delivered:119,  read:88,   date:'2026-04-08', status:'complete', type:'banner'  },
  { id:'rp4', name:'Market Place Launch',     channels:['tiktok','instagram'],  audience:'market', recipients:312,  delivered:298,  read:201,  date:'2026-04-07', status:'complete', type:'video'   },
  { id:'rp5', name:'App Feature Blast',       channels:['inapp','whatsapp'],    audience:'all',    recipients:4821, delivered:4756, read:3201, date:'2026-04-06', status:'complete', type:'text'    },
]

// ── Ad copy generator (deterministic) ────────────────────────────────────────
function generateAds(topic, tone, platform) {
  const hooks = {
    instagram: ['✨','🔥','💯','🚀','👀','❤️','🎯','💎','⚡','🌟'],
    tiktok:    ['POV:','Wait for it…','This changed everything →','No one talks about this:','Here\'s why 👇','You need to see this:','Real talk:','Okay but hear me out','Not me discovering','This is your sign'],
    facebook:  ['Have you tried','Did you know','Introducing','We\'re excited to share','Don\'t miss out on','Here\'s what people are saying about','Find out why thousands love','Join us for','Today only:','Limited time:'],
    whatsapp:  ['👋 Hey!','📢 Big news!','🎉 Exciting!','⚡ Quick update:','✅ Just launched:','🔔 Reminder:','💡 Did you know?','🎯 Special offer:','🌟 Featured:','🚨 Alert:'],
    inapp:     ['New on Hangger:','Just for you:','Featured today:','Hot right now:','Don\'t miss:','Trending:','Top pick:','Exclusive:','New update:','Check this out:'],
  }
  const suffix = {
    Professional:   'Learn more and get started today.',
    'Casual & Fun': 'Try it out — you\'ll love it! 🙌',
    Urgent:         'Act now — limited time only! ⏰',
    Inspirational:  'Your journey starts here. 💫',
    FOMO:           'Everyone\'s talking about it. Don\'t miss out!',
    Friendly:       'We think you\'ll really enjoy this 😊',
    Bold:           'This is a game-changer. Period.',
  }
  const platformHooks = hooks[platform] || hooks.instagram
  return platformHooks.map((hook, i) => {
    const mid = [
      `${topic} is here and it\'s better than ever.`,
      `Discover ${topic} on Hangger — Jakarta\'s #1 app.`,
      `${topic} just got a major upgrade. Here\'s what\'s new.`,
      `Thousands of users are already loving ${topic}.`,
      `Get the best ${topic} experience right on your phone.`,
      `${topic} available now — download Hangger free.`,
      `Your ${topic} experience is about to change forever.`,
      `We built ${topic} just for you. Here\'s why it matters.`,
      `${topic} on Hangger is now live. Don\'t miss it.`,
      `The future of ${topic} is here. Meet Hangger.`,
    ][i]
    const hashTags = platform === 'instagram' || platform === 'tiktok'
      ? `\n\n#${topic.replace(/\s/g,'')} #Hangger #Jakarta #Indonesia #${tone.replace(/\s/g,'')}` : ''
    return `${hook} ${mid} ${suffix[tone]}${hashTags}`
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BannerCanvas({ src, transform, setTransform, overlays, setOverlays, activeOverlay, setActiveOverlay }) {
  const containerRef = useRef(null)
  const dragState    = useRef(null)
  const ovDragState  = useRef(null)

  // Image pan
  const onMouseDown = (e) => {
    if (e.target.closest('[data-overlay]')) return
    e.preventDefault()
    dragState.current = { startX: e.clientX - transform.x, startY: e.clientY - transform.y }
  }
  useEffect(() => {
    const move = (e) => {
      if (!dragState.current) return
      setTransform(t => ({ ...t, x: e.clientX - dragState.current.startX, y: e.clientY - dragState.current.startY }))
    }
    const up = () => { dragState.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [setTransform])

  // Overlay drag
  const onOverlayMouseDown = (e, idx) => {
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    ovDragState.current = {
      idx,
      startX: e.clientX - (overlays[idx].x / 100 * rect.width),
      startY: e.clientY - (overlays[idx].y / 100 * rect.height),
    }
    setActiveOverlay(idx)
  }
  useEffect(() => {
    const move = (e) => {
      if (!ovDragState.current) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const { idx, startX, startY } = ovDragState.current
      const nx = ((e.clientX - startX) / rect.width)  * 100
      const ny = ((e.clientY - startY) / rect.height) * 100
      setOverlays(prev => prev.map((o, i) => i === idx ? { ...o, x: Math.max(0, Math.min(90, nx)), y: Math.max(0, Math.min(90, ny)) } : o))
    }
    const up = () => { ovDragState.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [overlays, setOverlays])

  const addOverlay = () => setOverlays(p => [...p, { id: Date.now(), text: 'Your text here', x: 10, y: 10, fontSize: 24, color: '#ffffff', fontWeight: '800', shadow: true }])
  const removeOverlay = (idx) => { setOverlays(p => p.filter((_, i) => i !== idx)); setActiveOverlay(null) }

  return (
    <div className={s.bannerSection}>
      <div className={s.bannerCanvasWrap}
        ref={containerRef}
        onMouseDown={onMouseDown}
        style={{ cursor: dragState.current ? 'grabbing' : 'grab' }}>
        {src
          ? <img src={src} className={s.bannerImg} alt="banner"
              style={{ transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})` }} />
          : <div className={s.bannerPlaceholder}>
              <span style={{ fontSize:40 }}>🖼️</span>
              <span>Upload or paste image URL below</span>
            </div>
        }
        {overlays.map((o, i) => (
          <div key={o.id} data-overlay="1"
            className={`${s.textOverlay} ${activeOverlay === i ? s.textOverlayActive : ''}`}
            style={{ left:`${o.x}%`, top:`${o.y}%`, fontSize:o.fontSize, color:o.color, fontWeight:o.fontWeight, textShadow: o.shadow ? '0 2px 8px rgba(0,0,0,0.8)' : 'none' }}
            onMouseDown={(e) => onOverlayMouseDown(e, i)}
            onClick={() => setActiveOverlay(i)}>
            {o.text}
            <button className={s.overlayDelete} onClick={(e) => { e.stopPropagation(); removeOverlay(i) }}>✕</button>
          </div>
        ))}
      </div>

      {/* Controls row */}
      <div className={s.bannerControls}>
        <div className={s.controlGroup}>
          <label className={s.controlLabel}>🔍 Zoom</label>
          <input type="range" min="0.3" max="3" step="0.05" value={transform.scale}
            onChange={e => setTransform(t => ({ ...t, scale: parseFloat(e.target.value) }))} className={s.slider} />
          <span className={s.controlVal}>{(transform.scale * 100).toFixed(0)}%</span>
        </div>
        <div className={s.controlGroup}>
          <label className={s.controlLabel}>◀▶ X</label>
          <input type="range" min="-400" max="400" step="1" value={transform.x}
            onChange={e => setTransform(t => ({ ...t, x: parseInt(e.target.value) }))} className={s.slider} />
        </div>
        <div className={s.controlGroup}>
          <label className={s.controlLabel}>▲▼ Y</label>
          <input type="range" min="-400" max="400" step="1" value={transform.y}
            onChange={e => setTransform(t => ({ ...t, y: parseInt(e.target.value) }))} className={s.slider} />
        </div>
        <button className={s.ctrlBtn} onClick={() => setTransform({ x:0, y:0, scale:1 })}>↺ Reset</button>
        <button className={s.ctrlBtn} style={{ color:'#00FF9D', borderColor:'rgba(0,255,157,0.3)' }} onClick={addOverlay}>+ Text</button>
      </div>

      {/* Active overlay editor */}
      {activeOverlay !== null && overlays[activeOverlay] && (
        <div className={s.overlayEditor}>
          <span className={s.overlayEditorTitle}>✏️ Text Layer {activeOverlay + 1}</span>
          <input className={s.overlayTextInput} value={overlays[activeOverlay].text}
            onChange={e => setOverlays(p => p.map((o, i) => i === activeOverlay ? { ...o, text: e.target.value } : o))} />
          <div className={s.overlayEditorRow}>
            <label className={s.controlLabel}>Size</label>
            <input type="range" min="10" max="80" value={overlays[activeOverlay].fontSize}
              onChange={e => setOverlays(p => p.map((o,i) => i === activeOverlay ? { ...o, fontSize: parseInt(e.target.value) } : o))} className={s.sliderSm} />
            <span className={s.controlVal}>{overlays[activeOverlay].fontSize}px</span>
            <label className={s.controlLabel} style={{ marginLeft:12 }}>Color</label>
            <input type="color" value={overlays[activeOverlay].color}
              onChange={e => setOverlays(p => p.map((o,i) => i === activeOverlay ? { ...o, color: e.target.value } : o))}
              className={s.colorPicker} />
            <button className={`${s.ctrlBtn} ${overlays[activeOverlay].fontWeight === '800' ? s.ctrlBtnActive : ''}`}
              onClick={() => setOverlays(p => p.map((o,i) => i === activeOverlay ? { ...o, fontWeight: o.fontWeight === '800' ? '400' : '800' } : o))}>
              <b>B</b>
            </button>
            <button className={`${s.ctrlBtn} ${overlays[activeOverlay].shadow ? s.ctrlBtnActive : ''}`}
              onClick={() => setOverlays(p => p.map((o,i) => i === activeOverlay ? { ...o, shadow: !o.shadow } : o))}>
              Shadow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PreviewModal({ show, onClose, postType, bannerSrc, overlays, transform, richText, videoMeta, channels, audience, sendMode, scheduledAt, onConfirm, sending, sent }) {
  const [tab, setTab] = useState('whatsapp')
  if (!show) return null

  const audienceInfo = AUDIENCES.find(a => a.id === audience)
  const recipients   = audienceInfo?.count ?? 0

  const BannerPreview = () => (
    <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', overflow:'hidden', background:'#000', borderRadius:8 }}>
      {bannerSrc && <img src={bannerSrc} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:`translate(${transform.x*0.3}px,${transform.y*0.3}px) scale(${transform.scale})`, transformOrigin:'center' }} alt="" />}
      {overlays.map(o => (
        <div key={o.id} style={{ position:'absolute', left:`${o.x}%`, top:`${o.y}%`, fontSize:o.fontSize*0.4, color:o.color, fontWeight:o.fontWeight, textShadow: o.shadow ? '0 1px 4px rgba(0,0,0,0.8)' : 'none', userSelect:'none', pointerEvents:'none' }}>{o.text}</div>
      ))}
    </div>
  )

  return (
    <div className={s.previewBackdrop} onClick={onClose}>
      <div className={s.previewModal} onClick={e => e.stopPropagation()}>
        <div className={s.previewHeader}>
          <span className={s.previewTitle}>👁️ Preview & Confirm</span>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={s.previewBody}>
          {/* Phone mockup */}
          <div className={s.previewLeft}>
            <div className={s.phoneTabs}>
              {channels.has('whatsapp') && <button className={`${s.phoneTab} ${tab==='whatsapp'?s.phoneTabActive:''}`} onClick={() => setTab('whatsapp')}>💬 WhatsApp</button>}
              {(channels.has('instagram') || channels.has('facebook') || channels.has('tiktok')) && <button className={`${s.phoneTab} ${tab==='social'?s.phoneTabActive:''}`} onClick={() => setTab('social')}>📱 Social</button>}
              {channels.has('inapp') && <button className={`${s.phoneTab} ${tab==='inapp'?s.phoneTabActive:''}`} onClick={() => setTab('inapp')}>📲 In-App</button>}
            </div>
            <div className={s.phoneMockup}>
              <div className={s.phoneNotch} />
              <div className={s.phoneScreen}>
                {tab === 'whatsapp' && (
                  <div className={s.waPreview}>
                    <div className={s.waHeader}><div className={s.waAvatar}>H</div><div><div className={s.waName}>Hangger Admin</div><div className={s.waStatus}>online</div></div></div>
                    <div className={s.waMessages}>
                      <div className={s.waBubble}>
                        {postType === 'banner' && bannerSrc && <BannerPreview />}
                        {postType === 'video'  && <div className={s.videoPreviewThumb}>🎬 {videoMeta.title || 'Video'}</div>}
                        <div className={s.waBubbleText}>{postType === 'text' ? richText : (videoMeta.desc || overlays[0]?.text || 'Check out Hangger! 🚀')}</div>
                        {videoMeta.link && <div className={s.waLink}>🔗 {videoMeta.link}</div>}
                        <div className={s.waBubbleTime}>now ✓✓</div>
                      </div>
                    </div>
                  </div>
                )}
                {tab === 'social' && (
                  <div className={s.instaPreview}>
                    <div className={s.instaHeader}><div className={s.instaAvatar}>H</div><span className={s.instaUser}>hangger.official</span></div>
                    {postType === 'banner' && <BannerPreview />}
                    {postType === 'video'  && <div className={s.videoPreviewThumb} style={{ aspectRatio:'1', borderRadius:0 }}>🎬 {videoMeta.title}</div>}
                    <div className={s.instaActions}>❤️ 💬 📤</div>
                    <div className={s.instaCaption}><b>hangger.official</b> {postType === 'text' ? richText : (overlays[0]?.text || videoMeta.desc || 'New on Hangger 🚀')}</div>
                  </div>
                )}
                {tab === 'inapp' && (
                  <div className={s.inappPreview}>
                    <div className={s.inappBubble}>
                      <span className={s.inappBadge}>📢 Hangger</span>
                      {postType === 'banner' && bannerSrc && <BannerPreview />}
                      {postType === 'video'  && <div className={s.videoPreviewThumb}>🎬 {videoMeta.title}</div>}
                      <div className={s.inappText}>{postType === 'text' ? richText : (overlays[0]?.text || videoMeta.desc || 'New message from Hangger!')}</div>
                      {videoMeta.link && <div className={s.waLink}>🔗 Open App</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send panel */}
          <div className={s.previewRight}>
            <div className={s.sendSummary}>
              <h4 className={s.sendSummaryTitle}>Send Summary</h4>
              <div className={s.sendRow}><span>Post type</span><span className={s.sendVal}>{postType}</span></div>
              <div className={s.sendRow}>
                <span>Channels</span>
                <span className={s.sendVal}>{[...channels].map(c => CHANNELS.find(x=>x.id===c)?.label).join(', ') || '—'}</span>
              </div>
              <div className={s.sendRow}><span>Audience</span><span className={s.sendVal}>{audienceInfo?.label ?? '—'}</span></div>
              <div className={s.sendRow}><span>Recipients</span><span className={s.sendVal} style={{ color:'#00E5FF', fontWeight:800 }}>{recipients.toLocaleString()}</span></div>
              <div className={s.sendRow}><span>Schedule</span><span className={s.sendVal}>{sendMode === 'now' ? '⚡ Send Now' : `🗓 ${scheduledAt}`}</span></div>
            </div>

            {sent ? (
              <div className={s.sentConfirm}>
                <div className={s.sentIcon}>✅</div>
                <div className={s.sentTitle}>Campaign Sent!</div>
                <div className={s.sentSub}>Delivered to {recipients.toLocaleString()} recipients</div>
                <button className={s.closeAfterSendBtn} onClick={onClose}>Close</button>
              </div>
            ) : (
              <button className={s.confirmSendBtn} onClick={onConfirm} disabled={sending}>
                {sending ? (
                  <span className={s.sendingSpinner} />
                ) : (
                  `📢 Confirm & Send to ${recipients.toLocaleString()}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BulkAdGenerator({ onUse }) {
  const [topic,      setTopic]      = useState('')
  const [tone,       setTone]       = useState('Casual & Fun')
  const [platform,   setPlatform]   = useState('instagram')
  const [variations, setVariations] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [copied,     setCopied]     = useState(null)

  const generate = () => {
    if (!topic.trim()) return
    setLoading(true)
    setTimeout(() => {
      setVariations(generateAds(topic.trim(), tone, platform))
      setLoading(false)
    }, 900)
  }

  const copy = (text, i) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(i); setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={s.genSection}>
      <div className={s.genHeader}>
        <span className={s.genTitle}>🤖 Bulk Ad Generator</span>
        <span className={s.genSub}>Generate 10 ad variations at once</span>
      </div>
      <div className={s.genForm}>
        <div className={s.genField}>
          <label className={s.fieldLabel}>Topic / Product</label>
          <input className={s.genInput} value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Bike rides, Dating feature, Market listings…"
            onKeyDown={e => e.key === 'Enter' && generate()} />
        </div>
        <div className={s.genField}>
          <label className={s.fieldLabel}>Tone</label>
          <select className={s.genSelect} value={tone} onChange={e => setTone(e.target.value)}>
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className={s.genField}>
          <label className={s.fieldLabel}>Platform</label>
          <select className={s.genSelect} value={platform} onChange={e => setPlatform(e.target.value)}>
            {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>
        <button className={s.generateBtn} onClick={generate} disabled={loading || !topic.trim()}>
          {loading ? <><span className={s.genSpinner} /> Generating 10 ads…</> : '⚡ Generate 10 Ads'}
        </button>
      </div>
      {variations.length > 0 && (
        <div className={s.variationGrid}>
          {variations.map((v, i) => (
            <div key={i} className={s.variationCard}>
              <div className={s.variationNum}>#{i+1}</div>
              <pre className={s.variationText}>{v}</pre>
              <div className={s.variationActions}>
                <button className={s.varBtn} onClick={() => copy(v, i)}>{copied === i ? '✓ Copied' : '📋 Copy'}</button>
                <button className={s.varBtnPrimary} onClick={() => onUse(v)}>✓ Use This</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DeliveryReports() {
  const [expanded, setExpanded] = useState(null)

  const pct = (a, b) => b > 0 ? Math.round((a/b)*100) : 0

  return (
    <div className={s.reportsSection}>
      <div className={s.reportsHeader}>
        <span className={s.reportsTitle}>📊 Delivery Reports</span>
        <span className={s.reportsSub}>{DEMO_REPORTS.length} campaigns</span>
      </div>

      {/* Summary stats */}
      <div className={s.reportStats}>
        {[
          { label:'Campaigns Sent', value: DEMO_REPORTS.length, color:'#00E5FF' },
          { label:'Total Delivered', value: DEMO_REPORTS.reduce((s,r) => s+r.delivered, 0).toLocaleString(), color:'#00FF9D' },
          { label:'Avg. Read Rate', value: Math.round(DEMO_REPORTS.reduce((s,r) => s+pct(r.read,r.delivered), 0)/DEMO_REPORTS.length)+'%', color:'#F472B6' },
          { label:'Total Recipients', value: DEMO_REPORTS.reduce((s,r) => s+r.recipients, 0).toLocaleString(), color:'#FFB800' },
        ].map(st => (
          <div key={st.label} className={s.reportStat} style={{ '--c': st.color }}>
            <span className={s.reportStatVal}>{st.value}</span>
            <span className={s.reportStatLbl}>{st.label}</span>
          </div>
        ))}
      </div>

      <div className={s.reportTable}>
        <div className={s.reportTableHead}>
          {['Campaign','Type','Channels','Audience','Recipients','Delivered','Read','Date',''].map(h => (
            <div key={h} className={s.reportTh}>{h}</div>
          ))}
        </div>
        {DEMO_REPORTS.map(r => (
          <div key={r.id}>
            <div className={s.reportRow} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className={s.reportName}>{r.name}</div>
              <div><span className={s.typeBadge}>{r.type}</span></div>
              <div className={s.channelIcons}>{r.channels.map(c => <span key={c}>{CHANNELS.find(x=>x.id===c)?.icon}</span>)}</div>
              <div className={s.reportDim}>{AUDIENCES.find(a=>a.id===r.audience)?.label}</div>
              <div className={s.reportMono}>{r.recipients.toLocaleString()}</div>
              <div>
                <div className={s.barWrap}>
                  <div className={s.barFill} style={{ width:`${pct(r.delivered,r.recipients)}%`, background:'#00FF9D' }} />
                </div>
                <span className={s.barLabel} style={{ color:'#00FF9D' }}>{pct(r.delivered,r.recipients)}%</span>
              </div>
              <div>
                <div className={s.barWrap}>
                  <div className={s.barFill} style={{ width:`${pct(r.read,r.delivered)}%`, background:'#F472B6' }} />
                </div>
                <span className={s.barLabel} style={{ color:'#F472B6' }}>{pct(r.read,r.delivered)}%</span>
              </div>
              <div className={s.reportDim}>{r.date}</div>
              <div className={s.expandChev}>{expanded === r.id ? '▲' : '▼'}</div>
            </div>
            {expanded === r.id && (
              <div className={s.reportExpanded}>
                {r.channels.map(c => {
                  const ch = CHANNELS.find(x => x.id === c)
                  const deliv = Math.floor(r.delivered / r.channels.length)
                  const rd    = Math.floor(r.read / r.channels.length)
                  return (
                    <div key={c} className={s.channelBreakdown}>
                      <span style={{ fontSize:18 }}>{ch?.icon}</span>
                      <span className={s.channelBreakdownName} style={{ color: ch?.color }}>{ch?.label}</span>
                      <div className={s.breakdownBars}>
                        <div className={s.breakdownBar}>
                          <span className={s.reportDim}>Delivered</span>
                          <div className={s.barWrap} style={{ flex:1 }}><div className={s.barFill} style={{ width:`${pct(deliv,r.recipients)}%`, background: ch?.color }} /></div>
                          <span style={{ fontSize:11, color:ch?.color, fontFamily:'monospace', minWidth:36 }}>{deliv.toLocaleString()}</span>
                        </div>
                        <div className={s.breakdownBar}>
                          <span className={s.reportDim}>Read</span>
                          <div className={s.barWrap} style={{ flex:1 }}><div className={s.barFill} style={{ width:`${pct(rd,deliv)}%`, background: ch?.color, opacity:0.6 }} /></div>
                          <span style={{ fontSize:11, color:ch?.color, fontFamily:'monospace', opacity:0.7, minWidth:36 }}>{rd.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MarketingTab() {
  const [section,     setSection]     = useState('create')  // 'create' | 'generate' | 'reports'
  const [postType,    setPostType]    = useState('banner')  // 'banner' | 'video' | 'text'

  // Banner
  const [bannerSrc,   setBannerSrc]   = useState('')
  const [bannerUrl,   setBannerUrl]   = useState('')
  const [transform,   setTransform]   = useState({ x:0, y:0, scale:1 })
  const [overlays,    setOverlays]    = useState([])
  const [activeOv,    setActiveOv]    = useState(null)
  const bannerInputRef = useRef(null)

  // Video
  const [videoSrc,    setVideoSrc]    = useState(null)
  const [videoMeta,   setVideoMeta]   = useState({ title:'', desc:'', link:'' })

  // Text
  const [richText,    setRichText]    = useState('')

  // Channels + Audience
  const [channels,    setChannels]    = useState(new Set(['whatsapp','inapp']))
  const [audience,    setAudience]    = useState('all')

  // Schedule
  const [sendMode,    setSendMode]    = useState('now')
  const [scheduledAt, setScheduledAt] = useState('')

  // Preview / Send
  const [showPreview, setShowPreview] = useState(false)
  const [sending,     setSending]     = useState(false)
  const [sent,        setSent]        = useState(false)

  // Toast
  const [toast,       setToast]       = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const handleBannerFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Show instant local preview while uploading
    setBannerSrc(URL.createObjectURL(file))
    try {
      const url = await uploadImage(file, 'marketing-banners')
      setBannerSrc(url)
      setBannerUrl(url)
    } catch {
      // keep local preview on error
    }
  }

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoSrc(URL.createObjectURL(file))
  }

  const toggleChannel = (id) => setChannels(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleConfirmSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSent(true)
      const audienceInfo = AUDIENCES.find(a => a.id === audience)
      showToast(`✅ Campaign sent to ${audienceInfo?.count.toLocaleString()} recipients across ${channels.size} channel${channels.size>1?'s':''}`)
    }, 2200)
  }

  const handleUseVariation = (text) => {
    setRichText(text)
    setPostType('text')
    setSection('create')
    showToast('✅ Ad copy applied — switch to Text post type')
  }

  const canPreview = channels.size > 0 && (
    (postType === 'banner' && (bannerSrc || bannerUrl)) ||
    (postType === 'video'  && (videoSrc  || videoMeta.title)) ||
    (postType === 'text'   && richText.trim())
  )

  const effectiveBannerSrc = bannerSrc || bannerUrl

  return (
    <div className={s.page}>
      {toast && <div className={`${s.toast} ${s[toast.type]}`}>{toast.msg}</div>}

      <PreviewModal
        show={showPreview}
        onClose={() => { setShowPreview(false); if (!sending) setSent(false) }}
        postType={postType}
        bannerSrc={effectiveBannerSrc}
        overlays={overlays}
        transform={transform}
        richText={richText}
        videoMeta={videoMeta}
        channels={channels}
        audience={audience}
        sendMode={sendMode}
        scheduledAt={scheduledAt}
        onConfirm={handleConfirmSend}
        sending={sending}
        sent={sent}
      />

      {/* ── Section nav ── */}
      <div className={s.sectionNav}>
        {[
          { id:'create',   icon:'🎨', label:'Create Post'     },
          { id:'generate', icon:'🤖', label:'Ad Generator'    },
          { id:'reports',  icon:'📊', label:'Delivery Reports'},
        ].map(sec => (
          <button key={sec.id}
            className={`${s.secBtn} ${section === sec.id ? s.secBtnActive : ''}`}
            onClick={() => setSection(sec.id)}>
            <span>{sec.icon}</span>
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {section === 'generate' && <BulkAdGenerator onUse={handleUseVariation} />}
      {section === 'reports'  && <DeliveryReports />}

      {section === 'create' && (
        <div className={s.createLayout}>
          {/* ── Left: Creative Builder ── */}
          <div className={s.builderCol}>

            {/* Post type tabs */}
            <div className={s.typeTabs}>
              {[['banner','🖼️','Banner / Image'],['video','🎬','Video Post'],['text','✍️','Text Only']].map(([id,icon,label]) => (
                <button key={id} className={`${s.typeTab} ${postType===id?s.typeTabActive:''}`} onClick={() => setPostType(id)}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Banner builder */}
            {postType === 'banner' && (
              <>
                <div className={s.imageInputRow}>
                  <input className={s.urlInput} placeholder="Paste image URL…" value={bannerUrl}
                    onChange={e => { setBannerUrl(e.target.value); if (e.target.value) setBannerSrc('') }} />
                  <span className={s.orLabel}>or</span>
                  <button className={s.uploadBtn} onClick={() => bannerInputRef.current?.click()}>📁 Upload</button>
                  <input ref={bannerInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleBannerFile} />
                </div>
                <BannerCanvas
                  src={effectiveBannerSrc}
                  transform={transform}
                  setTransform={setTransform}
                  overlays={overlays}
                  setOverlays={setOverlays}
                  activeOverlay={activeOv}
                  setActiveOverlay={setActiveOv}
                />
              </>
            )}

            {/* Video builder */}
            {postType === 'video' && (
              <div className={s.videoSection}>
                {videoSrc
                  ? <video src={videoSrc} className={s.videoPreview} controls />
                  : <label className={s.videoUploadZone}>
                      <input type="file" accept="video/*" style={{ display:'none' }} onChange={handleVideoFile} />
                      <span style={{ fontSize:48 }}>🎬</span>
                      <span>Click to upload video</span>
                      <span className={s.videoUploadSub}>MP4, MOV, AVI — max 500MB</span>
                    </label>
                }
                <div className={s.videoMeta}>
                  <div className={s.field}><label className={s.fieldLabel}>Title</label><input className={s.metaInput} value={videoMeta.title} onChange={e => setVideoMeta(m => ({ ...m, title: e.target.value }))} placeholder="Video title…" /></div>
                  <div className={s.field}><label className={s.fieldLabel}>Description</label><textarea className={s.metaTextarea} value={videoMeta.desc} onChange={e => setVideoMeta(m => ({ ...m, desc: e.target.value }))} rows={3} placeholder="Add a description…" /></div>
                  <div className={s.field}><label className={s.fieldLabel}>🔗 App Link (push traffic)</label><input className={s.metaInput} value={videoMeta.link} onChange={e => setVideoMeta(m => ({ ...m, link: e.target.value }))} placeholder="https://hangger.app/feature/…" /></div>
                </div>
              </div>
            )}

            {/* Text only */}
            {postType === 'text' && (
              <div className={s.textSection}>
                <textarea
                  className={s.richTextarea}
                  value={richText}
                  onChange={e => setRichText(e.target.value)}
                  placeholder="Write your message or ad copy here…&#10;&#10;Use #hashtags for Instagram/TikTok&#10;Add emojis 🎯🚀✨ for engagement"
                  rows={8}
                />
                <div className={s.textFooter}>
                  <span className={s.charCount}>{richText.length} chars</span>
                  <div className={s.emojiQuick}>
                    {['🔥','💕','🚗','🛍️','🍽️','⚡','🎯','✨','🚀','💎'].map(e => (
                      <button key={e} className={s.emojiBtn} onClick={() => setRichText(t => t + e)}>{e}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Settings ── */}
          <div className={s.settingsCol}>

            {/* Channels */}
            <div className={s.settingsCard}>
              <div className={s.settingsCardTitle}>📡 Channels</div>
              <div className={s.channelList}>
                {CHANNELS.map(c => (
                  <label key={c.id} className={`${s.channelItem} ${channels.has(c.id) ? s.channelItemOn : ''}`}
                    style={channels.has(c.id) ? { borderColor: c.color+'50', background: c.color+'10' } : {}}>
                    <input type="checkbox" checked={channels.has(c.id)} onChange={() => toggleChannel(c.id)} className={s.hiddenCheck} />
                    <span className={s.channelIcon}>{c.icon}</span>
                    <span className={s.channelLabel} style={channels.has(c.id) ? { color: c.color } : {}}>{c.label}</span>
                    {channels.has(c.id) && <span className={s.channelCheck} style={{ color: c.color }}>✓</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Audience */}
            <div className={s.settingsCard}>
              <div className={s.settingsCardTitle}>👥 Audience</div>
              <div className={s.audienceList}>
                {AUDIENCES.map(a => (
                  <label key={a.id} className={`${s.audienceItem} ${audience === a.id ? s.audienceItemOn : ''}`}>
                    <input type="radio" name="audience" value={a.id} checked={audience === a.id} onChange={() => setAudience(a.id)} className={s.hiddenCheck} />
                    <span>{a.icon}</span>
                    <span className={s.audienceLabel}>{a.label}</span>
                    <span className={s.audienceCount}>{a.count.toLocaleString()}</span>
                    {audience === a.id && <span className={s.audienceCheck}>✓</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Auto-post / Schedule */}
            <div className={s.settingsCard}>
              <div className={s.settingsCardTitle}>⏰ Schedule</div>
              <div className={s.scheduleRow}>
                <button className={`${s.scheduleBtn} ${sendMode==='now'?s.scheduleBtnActive:''}`} onClick={() => setSendMode('now')}>⚡ Send Now</button>
                <button className={`${s.scheduleBtn} ${sendMode==='scheduled'?s.scheduleBtnActive:''}`} onClick={() => setSendMode('scheduled')}>🗓 Schedule</button>
              </div>
              {sendMode === 'scheduled' && (
                <input type="datetime-local" className={s.datetimeInput} value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              )}
              <label className={s.autoLabel}>
                <input type="checkbox" className={s.hiddenCheck} />
                <span className={s.autoToggle} />
                <span className={s.autoText}>Auto-post recurring campaign</span>
              </label>
            </div>

            {/* Preview & Send */}
            <button
              className={`${s.previewSendBtn} ${!canPreview ? s.previewSendBtnDisabled : ''}`}
              disabled={!canPreview}
              onClick={() => { setSent(false); setShowPreview(true) }}>
              👁️ Preview &amp; Send
            </button>
            {!canPreview && (
              <p className={s.previewHint}>Add {postType === 'banner' ? 'an image' : postType === 'video' ? 'a video or title' : 'message text'} and select at least one channel</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
