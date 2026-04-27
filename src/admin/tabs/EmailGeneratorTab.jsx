import { useState, useRef } from 'react'
import s from './EmailGeneratorTab.module.css'

// ── Country name pools — first names, last names, and business keywords ──────
const COUNTRY_DATA = {
  indonesia: {
    label: 'Indonesia', flag: '🇮🇩',
    first: ['andi','budi','citra','dewi','eka','fitri','galih','hadi','indah','joko','kartika','lina','maya','nanda','oki','putri','rini','sari','tika','udin','vina','wati','yanti','zahra','agus','bambang','dian','endah','fajar','gita','rizki','ayu','nurul','wahyu','ratna','ika','bayu','dwi','tri','mega','novi','rina','arif','deni','yudi','lia','eko','siti','ani','tono'],
    last: ['santoso','wijaya','pratama','putri','sari','hartono','setiawan','kurniawan','prasetyo','rahayu','lestari','hidayat','susanto','wibowo','nugroho','saputra','purnama','firmansyah','handoko','suryadi'],
    biz: ['usaha','toko','jual','dagang','bisnis','niaga','mandiri','sejahtera','makmur','prima','sukses','maju','jaya','sentosa','abadi','karya','cipta','mulia','berkah','utama'],
  },
  uk: {
    label: 'United Kingdom', flag: '🇬🇧',
    first: ['james','oliver','harry','jack','george','william','thomas','charlie','oscar','henry','emma','olivia','sophia','isabella','mia','charlotte','amelia','harper','emily','grace','noah','liam','jacob','mason','ethan','daniel','matthew','sarah','lucy','rachel','hannah','rebecca','kate','alice','jessica','laura','mark','david','ryan','adam'],
    last: ['smith','jones','williams','brown','taylor','davies','wilson','evans','thomas','johnson','roberts','walker','wright','robinson','thompson','white','edwards','green','hall','lewis'],
    biz: ['solutions','group','trading','services','partners','global','direct','wholesale','connect','supply','ventures','enterprise','systems','logistics','consulting','capital','digital','market','hub','agency'],
  },
  usa: {
    label: 'United States', flag: '🇺🇸',
    first: ['james','john','robert','michael','william','david','richard','joseph','thomas','charles','mary','patricia','jennifer','linda','elizabeth','barbara','susan','jessica','sarah','karen','brian','kevin','jason','jeffrey','ryan','jacob','nicholas','tyler','brandon','andrew'],
    last: ['smith','johnson','williams','brown','jones','garcia','miller','davis','rodriguez','martinez','hernandez','lopez','gonzalez','wilson','anderson','thomas','taylor','moore','jackson','martin'],
    biz: ['solutions','enterprises','global','direct','trading','supply','group','wholesale','partners','ventures','connect','digital','market','capital','services','systems','network','hub','logistics','agency'],
  },
  uae: {
    label: 'UAE', flag: '🇦🇪',
    first: ['ahmed','mohammed','ali','omar','hassan','khalid','saeed','rashid','fahad','sultan','fatima','aisha','mariam','noura','hessa','amna','latifa','moza','shamsa','reem','yousef','hamad','mansour','nasser','tariq','faisal','salim','jamal','waleed','majid'],
    last: ['almaktoum','alnuaimi','alsuwaidi','alnahyan','alfalasi','alali','alhashmi','almazrouei','aldhaheri','alkhoori','alshamsi','alblooshi','alkaabi','alremeithi','almheiri','altamimi','alshehhi','alketbi','alhammadi','almansoori'],
    biz: ['trading','group','global','international','enterprises','solutions','investment','holdings','commercial','logistics','supply','export','import','capital','ventures','markets','connect','direct','premier','royal'],
  },
  saudi: {
    label: 'Saudi Arabia', flag: '🇸🇦',
    first: ['mohammed','abdullah','abdulrahman','saleh','khalid','faisal','turki','sultan','saud','nasser','noura','sarah','lama','haya','reem','maha','alanoud','dalal','ghada','asma','ahmad','omar','fahad','hamad','yousef','ali','hassan','hussein','ibrahim','waleed'],
    last: ['alsubaie','aldossary','alghamdi','alotaibi','alharbi','alqahtani','alshehri','alzahrani','almutairi','alanazi','alsaud','alrajhi','alfaisal','alturki','alnasser','alkhalid','alfahad','alsultan','alomari','almalki'],
    biz: ['trading','group','investment','holdings','commercial','international','enterprises','export','supply','logistics','premier','global','capital','ventures','solutions','markets','direct','industries','development','partners'],
  },
  india: {
    label: 'India', flag: '🇮🇳',
    first: ['rahul','amit','priya','neha','vikram','anita','suresh','pooja','rajesh','deepika','arjun','kavita','sanjay','meera','anil','sunita','vivek','nisha','manoj','divya','rohan','anjali','kiran','ravi','lakshmi','ashok','geeta','vinod','rekha','sachin'],
    last: ['sharma','patel','singh','kumar','gupta','mehta','joshi','verma','reddy','nair','rao','das','shah','mishra','agarwal','pandey','saxena','iyer','kapoor','malhotra'],
    biz: ['solutions','enterprises','global','trading','services','industries','exports','ventures','systems','technologies','infra','logistics','digital','connect','supply','group','market','partners','hub','networks'],
  },
  malaysia: {
    label: 'Malaysia', flag: '🇲🇾',
    first: ['ahmad','ali','ismail','hassan','mohd','aziz','rahman','ibrahim','farid','hafiz','siti','nurul','nur','fatimah','aisyah','aminah','zainab','hajar','khadijah','maryam','tan','lee','wong','lim','chen','ong','ng','goh','chan','koh'],
    last: ['bin','binti','abdullah','rahman','ismail','hassan','ahmad','ibrahim','ali','omar','tan','lee','wong','lim','chen','ong','ng','goh','chan','yap'],
    biz: ['trading','enterprise','solutions','global','group','sdn','bhd','services','supply','logistics','export','import','ventures','connect','direct','premier','market','partners','hub','industries'],
  },
  singapore: {
    label: 'Singapore', flag: '🇸🇬',
    first: ['wei','jing','yan','xin','hui','min','ling','yi','jun','hao','tan','lee','wong','lim','chen','ong','ng','goh','chan','koh','jason','rachel','aaron','nicole','marcus','sarah','ryan','amanda','daniel','kelly'],
    last: ['tan','lee','wong','lim','chen','ong','ng','goh','chan','koh','teo','yeo','chua','sim','ho','low','tay','ang','chong','wee'],
    biz: ['trading','solutions','global','group','enterprises','pte','services','supply','logistics','ventures','connect','digital','capital','partners','hub','systems','market','direct','premier','networks'],
  },
  australia: {
    label: 'Australia', flag: '🇦🇺',
    first: ['jack','william','oliver','thomas','noah','james','charlie','ethan','lucas','liam','charlotte','olivia','emma','ava','mia','sophie','amelia','grace','isla','chloe','matthew','daniel','ryan','josh','ben','sam','luke','adam','chris','mark'],
    last: ['smith','jones','williams','brown','wilson','taylor','johnson','white','martin','anderson','thompson','nguyen','thomas','walker','harris','lee','ryan','robinson','kelly','king'],
    biz: ['solutions','group','trading','services','partners','global','direct','wholesale','connect','supply','ventures','enterprise','systems','logistics','consulting','capital','digital','market','hub','agency'],
  },
  netherlands: {
    label: 'Netherlands', flag: '🇳🇱',
    first: ['jan','pieter','willem','henk','kees','dirk','johan','michiel','bas','sander','anna','maria','sophie','eva','lisa','emma','julia','fleur','iris','lotte','tom','daan','sem','luuk','finn','jesse','bram','lars','max','thijs'],
    last: ['devries','jansen','vandenberg','bakker','visser','smit','meijer','dekoning','mulder','bos','vos','peters','hendriks','vanleeuwen','dekker','brouwer','dewit','dijkstra','smits','vanderwal'],
    biz: ['trading','solutions','group','global','services','partners','supply','logistics','ventures','direct','connect','enterprise','systems','wholesale','consulting','digital','market','hub','export','import'],
  },
}

// ── Email domain options ─────────────────────────────────────────────────────
const EMAIL_PROVIDERS = [
  { id: 'gmail.com', label: 'Gmail', icon: '📧' },
  { id: 'yahoo.com', label: 'Yahoo', icon: '📨' },
  { id: 'yahoo.co.id', label: 'Yahoo ID', icon: '📨' },
  { id: 'hotmail.com', label: 'Hotmail', icon: '📩' },
  { id: 'outlook.com', label: 'Outlook', icon: '📬' },
  { id: 'icloud.com', label: 'iCloud', icon: '☁️' },
  { id: 'mail.com', label: 'Mail.com', icon: '✉️' },
  { id: 'protonmail.com', label: 'ProtonMail', icon: '🔒' },
  { id: 'ymail.com', label: 'Ymail', icon: '📨' },
  { id: 'aol.com', label: 'AOL', icon: '📮' },
  { id: 'zoho.com', label: 'Zoho', icon: '📋' },
  { id: 'live.com', label: 'Live', icon: '📬' },
]

// ── Subject-to-keyword mapping ───────────────────────────────────────────────
function subjectToKeywords(subject) {
  const s = subject.toLowerCase()
  const keywords = []
  // Extract meaningful words (3+ chars, not common words)
  const stopWords = new Set(['the','and','for','with','from','that','this','are','was','were','been','have','has','had','not','but','what','all','can','her','his','how','its','may','our','out','who','will','your','about','into','more','some','than','them','then','these','would','make','like','just','over','such','take','year','also','back','come','could','good','most','need','very','when','each','much','many','well','only','other','time','been','long','great','little','own','old','right','big','high','small','large','next','early','young','important','few','same','last'])
  s.split(/[\s,.\-_/]+/).forEach(w => {
    const clean = w.replace(/[^a-z0-9]/g, '')
    if (clean.length >= 3 && !stopWords.has(clean)) keywords.push(clean)
  })
  // Also generate compound keywords
  const words = s.split(/\s+/).filter(w => w.length >= 3)
  if (words.length >= 2) {
    for (let i = 0; i < words.length - 1; i++) {
      const a = words[i].replace(/[^a-z0-9]/g, '')
      const b = words[i+1].replace(/[^a-z0-9]/g, '')
      if (a.length >= 3 && b.length >= 3 && !stopWords.has(a) && !stopWords.has(b)) {
        keywords.push(a + b)
        keywords.push(a + '_' + b)
        keywords.push(a + '.' + b)
      }
    }
  }
  return keywords.length > 0 ? keywords : ['contact', 'info', 'hello']
}

// ── Generate unique emails based on subject + country + domains ──────────────
function generateEmails(subject, country, domains, count) {
  const data = COUNTRY_DATA[country]
  if (!data || domains.length === 0 || count < 1) return []

  const keywords = subjectToKeywords(subject)
  const emails = new Set()
  const separators = ['.', '_', '', '-']

  let attempts = 0
  const maxAttempts = count * 20 // prevent infinite loop

  while (emails.size < count && attempts < maxAttempts) {
    attempts++
    const domain = domains[Math.floor(Math.random() * domains.length)]
    const pattern = Math.floor(Math.random() * 12)
    const first = data.first[Math.floor(Math.random() * data.first.length)]
    const last = data.last[Math.floor(Math.random() * data.last.length)]
    const biz = data.biz[Math.floor(Math.random() * data.biz.length)]
    const kw = keywords[Math.floor(Math.random() * keywords.length)]
    const sep = separators[Math.floor(Math.random() * separators.length)]
    const num = Math.floor(Math.random() * 999) + 1
    const yr = Math.floor(Math.random() * 10) + 88 // 88-97

    let local = ''
    switch (pattern) {
      case 0:  local = `${first}${sep}${kw}`; break                        // andi.spices
      case 1:  local = `${kw}${sep}${first}${num}`; break                  // spices.andi42
      case 2:  local = `${first}${sep}${last}${sep}${kw}`; break           // andi.santoso.spices
      case 3:  local = `${kw}${sep}${biz}${num}`; break                    // spices.usaha123
      case 4:  local = `${first}${num}${sep}${kw}`; break                  // andi42.spices
      case 5:  local = `${kw}${sep}${first}${sep}${last}`; break           // spices.andi.santoso
      case 6:  local = `${first}${sep}${kw}${yr}`; break                   // andi.spices92
      case 7:  local = `${biz}${sep}${kw}${sep}${first}`; break            // usaha.spices.andi
      case 8:  local = `${kw}${num}${sep}${biz}`; break                    // spices42.usaha
      case 9:  local = `${first}${last.slice(0,3)}${sep}${kw}`; break      // andisan.spices
      case 10: local = `${kw}${sep}${last}${sep}${biz.slice(0,4)}`; break  // spices.santoso.usah
      case 11: local = `${first}${sep}${biz}${sep}${kw}${num}`; break      // andi.usaha.spices99
    }

    local = local.toLowerCase().replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '')
    if (local.length >= 5 && local.length <= 40) {
      emails.add(`${local}@${domain}`)
    }
  }

  return [...emails]
}

// ── Separator options ────────────────────────────────────────────────────────
const SEP_OPTIONS = [
  { id: 'newline', label: 'Newline', sep: '\n' },
  { id: 'comma', label: 'Comma', sep: ', ' },
  { id: 'semicolon', label: 'Semicolon', sep: '; ' },
  { id: 'commaOnly', label: 'Comma (no space)', sep: ',' },
]

// ═════════════════════════════════════════════════════════════════════════════
export default function EmailGeneratorTab() {
  const [toast, setToast] = useState(null)
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── Generator state ──
  const [subject, setSubject] = useState('')
  const [country, setCountry] = useState('indonesia')
  const [selectedDomains, setSelectedDomains] = useState(['gmail.com'])
  const [emailCount, setEmailCount] = useState(100)
  const [emails, setEmails] = useState([])
  const [outputSep, setOutputSep] = useState('newline')
  const [generating, setGenerating] = useState(false)

  // ── Saved lists ──
  const [savedLists, setSavedLists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('indoo_email_lists') || '[]') } catch { return [] }
  })

  // ── History (last 10 generations) ──
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('indoo_email_history') || '[]') } catch { return [] }
  })

  const toggleDomain = (d) => {
    setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const handleGenerate = () => {
    if (!subject.trim()) { flash('⚠️ Enter a subject first'); return }
    if (selectedDomains.length === 0) { flash('⚠️ Select at least one email provider'); return }
    if (emailCount < 1 || emailCount > 500) { flash('⚠️ Enter between 1 and 500'); return }

    setGenerating(true)
    // Small delay for UX
    setTimeout(() => {
      const result = generateEmails(subject, country, selectedDomains, emailCount)
      setEmails(result)
      setGenerating(false)
      flash(`✅ Generated ${result.length} unique emails`)

      // Save to history
      const entry = { id: Date.now(), subject, country, domains: selectedDomains, count: result.length, date: new Date().toISOString() }
      const updated = [entry, ...history].slice(0, 10)
      setHistory(updated)
      localStorage.setItem('indoo_email_history', JSON.stringify(updated))
    }, 300)
  }

  const sepChar = SEP_OPTIONS.find(s => s.id === outputSep)?.sep ?? '\n'
  const outputText = emails.join(sepChar)

  const copyAll = () => {
    if (emails.length === 0) return
    navigator.clipboard.writeText(outputText).then(() => flash(`✓ Copied ${emails.length} emails`)).catch(() => flash('Copy failed'))
  }

  const downloadExcel = () => {
    if (emails.length === 0) return
    // Generate CSV with headers for Excel compatibility
    const rows = [['Email', 'Domain', 'Subject', 'Country', 'Generated']]
    const now = new Date().toISOString().split('T')[0]
    emails.forEach(e => {
      const domain = e.split('@')[1]
      rows.push([e, domain, subject, COUNTRY_DATA[country]?.label ?? country, now])
    })
    const csvContent = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    // BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `indoo_emails_${subject.replace(/\s+/g, '_').slice(0, 20)}_${emails.length}.csv`
    a.click()
    URL.revokeObjectURL(url)
    flash(`📥 Downloaded ${emails.length} emails as Excel CSV`)
  }

  const saveList = () => {
    if (emails.length === 0) return
    const entry = { id: Date.now(), subject, country, domains: selectedDomains, emails: [...emails], date: new Date().toISOString() }
    const updated = [entry, ...savedLists].slice(0, 20)
    setSavedLists(updated)
    localStorage.setItem('indoo_email_lists', JSON.stringify(updated))
    flash(`💾 Saved list: ${emails.length} emails`)
  }

  const loadList = (list) => {
    setEmails(list.emails)
    setSubject(list.subject)
    setCountry(list.country)
    setSelectedDomains(list.domains)
    flash(`📂 Loaded: ${list.emails.length} emails`)
  }

  const deleteList = (id) => {
    const updated = savedLists.filter(l => l.id !== id)
    setSavedLists(updated)
    localStorage.setItem('indoo_email_lists', JSON.stringify(updated))
  }

  return (
    <div className={s.page}>
      {/* Toast */}
      {toast && <div className={s.toast}>{toast}</div>}

      {/* Header */}
      <div className={s.topBar}>
        <span className={s.topTitle}>📧 Email Generator</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Subject-targeted email generation · No duplicates · Excel export</span>
        {emails.length > 0 && <span className={s.countBadge}>{emails.length} emails</span>}
      </div>

      <div className={s.mainLayout}>
        {/* ── Left: Generator controls ── */}
        <div className={s.controls}>

          {/* Subject */}
          <div className={s.section}>
            <label className={s.label}>Subject / Topic</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Indonesian spices export, UK property rental, food delivery Yogyakarta..."
              className={s.input}
            />
            <span className={s.hint}>Emails will contain words related to this subject</span>
          </div>

          {/* Country */}
          <div className={s.section}>
            <label className={s.label}>Target Country</label>
            <div className={s.countryGrid}>
              {Object.entries(COUNTRY_DATA).map(([key, val]) => (
                <button
                  key={key}
                  className={`${s.countryBtn} ${country === key ? s.countryBtnActive : ''}`}
                  onClick={() => setCountry(key)}
                >
                  <span style={{ fontSize: 18 }}>{val.flag}</span>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email providers */}
          <div className={s.section}>
            <label className={s.label}>Email Providers</label>
            <div className={s.domainGrid}>
              {EMAIL_PROVIDERS.map(p => (
                <button
                  key={p.id}
                  className={`${s.domainBtn} ${selectedDomains.includes(p.id) ? s.domainBtnActive : ''}`}
                  onClick={() => toggleDomain(p.id)}
                >
                  <span>{p.icon}</span>
                  <span style={{ fontSize: 11 }}>{p.label}</span>
                </button>
              ))}
              <button
                className={`${s.domainBtn} ${selectedDomains.length === EMAIL_PROVIDERS.length ? s.domainBtnActive : ''}`}
                onClick={() => setSelectedDomains(selectedDomains.length === EMAIL_PROVIDERS.length ? ['gmail.com'] : EMAIL_PROVIDERS.map(p => p.id))}
                style={{ gridColumn: 'span 2' }}
              >
                <span>✅</span>
                <span style={{ fontSize: 11 }}>Select All</span>
              </button>
            </div>
          </div>

          {/* Count */}
          <div className={s.section}>
            <label className={s.label}>Number of Emails (1–500)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min={1}
                max={500}
                value={emailCount}
                onChange={e => setEmailCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                className={s.input}
                style={{ width: 100 }}
              />
              <input
                type="range"
                min={1}
                max={500}
                value={emailCount}
                onChange={e => setEmailCount(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: '#8DC63F' }}
              />
            </div>
            {/* Quick count buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[10, 50, 100, 200, 300, 500].map(n => (
                <button key={n} onClick={() => setEmailCount(n)} className={s.quickBtn} style={emailCount === n ? { background: 'rgba(141,198,63,0.15)', borderColor: 'rgba(141,198,63,0.3)', color: '#8DC63F' } : {}}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={handleGenerate} className={s.generateBtn} disabled={generating}>
            {generating ? '⏳ Generating...' : `🚀 Generate ${emailCount} Emails`}
          </button>
        </div>

        {/* ── Right: Output ── */}
        <div className={s.output}>
          {/* Output toolbar */}
          <div className={s.outputToolbar}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className={s.label} style={{ margin: 0 }}>Separator:</span>
              {SEP_OPTIONS.map(o => (
                <button key={o.id} onClick={() => setOutputSep(o.id)} className={`${s.quickBtn} ${outputSep === o.id ? s.quickBtnActive : ''}`}>
                  {o.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copyAll} className={s.actionBtn} disabled={emails.length === 0}>
                📋 Copy All
              </button>
              <button onClick={downloadExcel} className={s.actionBtn} style={{ borderColor: 'rgba(0,229,255,0.3)', color: '#00E5FF' }} disabled={emails.length === 0}>
                📥 Excel CSV
              </button>
              <button onClick={saveList} className={s.actionBtn} style={{ borderColor: 'rgba(250,204,21,0.3)', color: '#FACC15' }} disabled={emails.length === 0}>
                💾 Save
              </button>
            </div>
          </div>

          {/* Email output */}
          <textarea
            readOnly
            value={emails.length > 0 ? outputText : 'Generated emails will appear here...\n\nEnter a subject, select country and providers, then click Generate.'}
            className={s.textarea}
          />

          {/* Stats bar */}
          {emails.length > 0 && (
            <div className={s.statsBar}>
              <span>📊 {emails.length} unique emails</span>
              <span>·</span>
              <span>🌍 {COUNTRY_DATA[country]?.label}</span>
              <span>·</span>
              <span>📧 {selectedDomains.length} provider{selectedDomains.length > 1 ? 's' : ''}</span>
              <span>·</span>
              <span>📝 "{subject}"</span>
            </div>
          )}

          {/* Saved lists */}
          {savedLists.length > 0 && (
            <div className={s.savedSection}>
              <span className={s.label}>💾 Saved Lists</span>
              <div className={s.savedList}>
                {savedLists.map(list => (
                  <div key={list.id} className={s.savedRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {list.subject}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {list.emails.length} emails · {COUNTRY_DATA[list.country]?.flag} · {new Date(list.date).toLocaleDateString()}
                      </span>
                    </div>
                    <button onClick={() => loadList(list)} className={s.quickBtn} style={{ color: '#8DC63F', borderColor: 'rgba(141,198,63,0.3)' }}>Load</button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(list.emails.join(sepChar)).then(() => flash(`✓ Copied ${list.emails.length} emails`))
                    }} className={s.quickBtn}>Copy</button>
                    <button onClick={() => deleteList(list.id)} className={s.quickBtn} style={{ color: '#FF4444', borderColor: 'rgba(255,68,68,0.3)' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generation history */}
          {history.length > 0 && (
            <div className={s.savedSection}>
              <span className={s.label}>🕐 Recent Generations</span>
              <div className={s.savedList}>
                {history.map(h => (
                  <div key={h.id} className={s.savedRow}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', width: 70, flexShrink: 0 }}>{new Date(h.date).toLocaleDateString()}</span>
                    <span style={{ fontSize: 12, color: '#fff', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.subject}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{COUNTRY_DATA[h.country]?.flag} {h.count} emails</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
