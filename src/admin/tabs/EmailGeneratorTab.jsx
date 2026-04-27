import { useState } from 'react'
import s from './EmailGeneratorTab.module.css'

// ── Name pools ──────────────────────────────────────────────────────────────
const INDONESIAN_NAMES = [
  'andi','budi','citra','dewi','eka','fitri','galih','hadi','indah','joko',
  'kartika','lina','maya','nanda','oki','putri','rini','sari','tika','udin',
  'vina','wati','yanti','zahra','agus','bambang','dian','endah','fajar','gita',
]
const INTERNATIONAL_NAMES = [
  'alex','ben','chris','diana','emma','frank','grace','henry','isla','james',
  'kate','leo','maria','nick','olivia','paul','quinn','rose','sam','tom',
]
const ALL_NAMES = [...INDONESIAN_NAMES, ...INTERNATIONAL_NAMES]

const DEFAULT_DOMAINS = [
  'gmail.com','yahoo.com','yahoo.co.id','hotmail.com','outlook.com',
  'icloud.com','mail.com','protonmail.com','ymail.com','aol.com',
]

const SEPARATOR_MAP = {
  comma: ', ',
  semicolon: '; ',
  newline: '\n',
  commaNoSpace: ',',
}
const SEPARATOR_LABELS = {
  comma: 'Comma + Space',
  semicolon: 'Semicolon',
  newline: 'Newline',
  commaNoSpace: 'Comma',
}

const NAME_SEP_MAP = { none: '', dot: '.', underscore: '_', dash: '-' }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ── Quick templates ─────────────────────────────────────────────────────────
const TEMPLATES = [
  { label: '500 Gmail', prefix: 'user', start: 1, end: 500, domains: ['gmail.com'], sep: 'none' },
  { label: '1000 Mixed', prefix: 'indoo', start: 1, end: 1000, domains: ['gmail.com','yahoo.com','hotmail.com'], sep: 'none' },
  { label: 'Indonesian Pack', prefix: 'pengguna', start: 1, end: 200, domains: ['gmail.com','yahoo.co.id'], sep: 'none' },
  { label: 'Business Pack', prefix: 'marketing', start: 1, end: 300, domains: ['outlook.com','gmail.com'], sep: 'none' },
]

// ═════════════════════════════════════════════════════════════════════════════
export default function EmailGeneratorTab() {
  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  // ── Generator state ───────────────────────────────────────────────────────
  const [prefix, setPrefix] = useState('user')
  const [rangeStart, setRangeStart] = useState(1)
  const [rangeEnd, setRangeEnd] = useState(100)
  const [nameSep, setNameSep] = useState('none')
  const [selectedDomains, setSelectedDomains] = useState(['gmail.com'])
  const [customDomain, setCustomDomain] = useState('')
  const [generated, setGenerated] = useState([])
  const [outputSep, setOutputSep] = useState('newline')

  // ── Random generator state ────────────────────────────────────────────────
  const [randomCount, setRandomCount] = useState(100)
  const [randomEmails, setRandomEmails] = useState([])
  const [randomSep, setRandomSep] = useState('newline')

  // ── Editor state ──────────────────────────────────────────────────────────
  const [editorText, setEditorText] = useState('')
  const [editorStats, setEditorStats] = useState({ valid: 0, total: 0 })

  // ── Domain helpers ────────────────────────────────────────────────────────
  const allDomains = customDomain.trim()
    ? [...selectedDomains, ...customDomain.split(',').map(d => d.trim()).filter(Boolean)]
    : selectedDomains

  const toggleDomain = (d) => {
    setSelectedDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    )
  }

  // ── Generate sequential emails ────────────────────────────────────────────
  const handleGenerate = () => {
    if (!prefix.trim() || allDomains.length === 0) return
    const sep = NAME_SEP_MAP[nameSep]
    const emails = []
    const start = Math.max(1, Number(rangeStart))
    const end = Math.max(start, Number(rangeEnd))
    for (let i = start; i <= end; i++) {
      for (const domain of allDomains) {
        emails.push(`${prefix.trim().toLowerCase()}${sep}${i}@${domain}`)
      }
    }
    setGenerated(emails)
  }

  // ── Generate random emails ────────────────────────────────────────────────
  const handleRandom = () => {
    if (allDomains.length === 0 || randomCount < 1) return
    const emails = []
    for (let i = 0; i < Number(randomCount); i++) {
      const name = rand(ALL_NAMES)
      const num = randInt(1, 9999)
      const domain = rand(allDomains)
      emails.push(`${name}${num}@${domain}`)
    }
    setRandomEmails(emails)
  }

  // ── Copy helper ───────────────────────────────────────────────────────────
  const copyEmails = (emails, sep) => {
    const text = emails.join(SEPARATOR_MAP[sep])
    navigator.clipboard.writeText(text).then(() => {
      flash(`\u2713 Copied ${emails.length.toLocaleString()} emails`)
    })
  }

  // ── Download CSV ──────────────────────────────────────────────────────────
  const downloadCSV = (emails, filename = 'emails.csv') => {
    const csv = 'email\n' + emails.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    flash(`\u2713 Downloaded ${filename}`)
  }

  // ── Editor: clean up ─────────────────────────────────────────────────────
  const handleCleanUp = () => {
    const lines = editorText
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)
    const unique = [...new Set(lines)]
    const valid = unique.filter(e => EMAIL_REGEX.test(e))
    const invalid = unique.length - valid.length
    setEditorText(valid.join('\n'))
    setEditorStats({ valid: valid.length, total: unique.length })
    flash(`\u2713 Cleaned: ${valid.length} valid, ${invalid} removed`)
  }

  // ── Editor: recount on text change ────────────────────────────────────────
  const handleEditorChange = (text) => {
    setEditorText(text)
    const lines = text.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
    const valid = lines.filter(e => EMAIL_REGEX.test(e))
    setEditorStats({ valid: valid.length, total: lines.length })
  }

  // ── Editor: merge generated + random into editor ──────────────────────────
  const handleMerge = () => {
    const existing = editorText.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean)
    const merged = [...new Set([...existing, ...generated, ...randomEmails])]
    setEditorText(merged.join('\n'))
    setEditorStats({ valid: merged.filter(e => EMAIL_REGEX.test(e)).length, total: merged.length })
    flash(`\u2713 Merged ${merged.length.toLocaleString()} total emails`)
  }

  // ── Editor: copy with separator ───────────────────────────────────────────
  const [editorSep, setEditorSep] = useState('newline')
  const handleEditorCopy = () => {
    const emails = editorText.split(/[\n,;]+/).map(e => e.trim()).filter(e => EMAIL_REGEX.test(e))
    if (emails.length === 0) return
    copyEmails(emails, editorSep)
  }

  // ── Apply template ────────────────────────────────────────────────────────
  const applyTemplate = (t) => {
    setPrefix(t.prefix)
    setRangeStart(t.start)
    setRangeEnd(t.end)
    setSelectedDomains(t.domains)
    setNameSep(t.sep)
  }

  // ── Separator toggle component ────────────────────────────────────────────
  const SepToggle = ({ value, onChange }) => (
    <div className={s.sepToggle}>
      {Object.entries(SEPARATOR_LABELS).map(([key, label]) => (
        <button
          key={key}
          className={value === key ? s.sepBtnActive : s.sepBtn}
          onClick={() => onChange(key)}
        >{label}</button>
      ))}
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className={s.page}>
      {toast && <div className={s.toast}>{toast}</div>}

      <h2 className={s.header}>Email Address Generator</h2>
      <p className={s.subtext}>Generate email lists for use in external mass email tools. No emails are sent from here.</p>

      {/* ── Quick Templates ─────────────────────────────────────────────── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Quick Templates</h3>
        <div className={s.templateGrid}>
          {TEMPLATES.map(t => (
            <button key={t.label} className={s.templateBtn} onClick={() => applyTemplate(t)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sequential Generator ────────────────────────────────────────── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Email Generator</h3>

        <div className={s.row}>
          <div className={s.field}>
            <label>Name Prefix</label>
            <input
              value={prefix}
              onChange={e => setPrefix(e.target.value)}
              placeholder="e.g. john"
              style={{ width: 160 }}
            />
          </div>
          <div className={s.field}>
            <label>Range Start</label>
            <input
              type="number" min={1}
              value={rangeStart}
              onChange={e => setRangeStart(e.target.value)}
              style={{ width: 100 }}
            />
          </div>
          <div className={s.field}>
            <label>Range End</label>
            <input
              type="number" min={1}
              value={rangeEnd}
              onChange={e => setRangeEnd(e.target.value)}
              style={{ width: 100 }}
            />
          </div>
          <div className={s.field}>
            <label>Name-Number Separator</label>
            <select value={nameSep} onChange={e => setNameSep(e.target.value)}>
              <option value="none">None (john1)</option>
              <option value="dot">Dot (john.1)</option>
              <option value="underscore">Underscore (john_1)</option>
              <option value="dash">Dash (john-1)</option>
            </select>
          </div>
        </div>

        <div className={s.field} style={{ marginBottom: 14 }}>
          <label>Domains</label>
        </div>
        <div className={s.checkboxGrid}>
          {DEFAULT_DOMAINS.map(d => (
            <label
              key={d}
              className={selectedDomains.includes(d) ? s.checkboxLabelActive : s.checkboxLabel}
            >
              <input
                type="checkbox"
                checked={selectedDomains.includes(d)}
                onChange={() => toggleDomain(d)}
              />
              {d}
            </label>
          ))}
        </div>

        <div className={s.row}>
          <div className={s.field}>
            <label>Custom Domain(s) — comma separated</label>
            <input
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="e.g. company.com, mymail.id"
              style={{ width: 300 }}
            />
          </div>
        </div>

        <div className={s.actions}>
          <button className={s.btnPrimary} onClick={handleGenerate} disabled={!prefix.trim() || allDomains.length === 0}>
            Generate Emails
          </button>
        </div>

        {generated.length > 0 && (
          <>
            <div className={s.actions} style={{ marginTop: 16 }}>
              <span className={s.badge}>{generated.length.toLocaleString()} emails</span>
              <SepToggle value={outputSep} onChange={setOutputSep} />
            </div>
            <textarea
              className={s.output}
              readOnly
              value={generated.join(SEPARATOR_MAP[outputSep])}
            />
            <div className={s.actions}>
              <button className={s.btnPrimary} onClick={() => copyEmails(generated, outputSep)}>Copy All</button>
              <button className={s.btnSecondary} onClick={() => downloadCSV(generated, 'generated-emails.csv')}>Download CSV</button>
            </div>
          </>
        )}
      </div>

      {/* ── Random Generator ────────────────────────────────────────────── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Random Email Generator</h3>

        <div className={s.row}>
          <div className={s.field}>
            <label>How Many</label>
            <input
              type="number" min={1} max={10000}
              value={randomCount}
              onChange={e => setRandomCount(e.target.value)}
              style={{ width: 120 }}
            />
          </div>
          <button className={s.btnPrimary} onClick={handleRandom} disabled={allDomains.length === 0}>
            Generate Random
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>
          Uses {ALL_NAMES.length} name pool (Indonesian + international) with random numbers. Domains from selection above.
        </p>

        {randomEmails.length > 0 && (
          <>
            <div className={s.actions}>
              <span className={s.badge}>{randomEmails.length.toLocaleString()} emails</span>
              <SepToggle value={randomSep} onChange={setRandomSep} />
            </div>
            <textarea
              className={s.output}
              readOnly
              value={randomEmails.join(SEPARATOR_MAP[randomSep])}
            />
            <div className={s.actions}>
              <button className={s.btnPrimary} onClick={() => copyEmails(randomEmails, randomSep)}>Copy All</button>
              <button className={s.btnSecondary} onClick={() => downloadCSV(randomEmails, 'random-emails.csv')}>Download CSV</button>
            </div>
          </>
        )}
      </div>

      {/* ── Email List Editor ───────────────────────────────────────────── */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Email List Editor</h3>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '0 0 10px' }}>
          Paste, edit, or merge emails below. Use Clean Up to remove duplicates and invalid entries.
        </p>

        <textarea
          className={s.output}
          style={{ minHeight: 200 }}
          value={editorText}
          onChange={e => handleEditorChange(e.target.value)}
          placeholder="Paste or type emails here — one per line, comma, or semicolon separated"
        />

        <div className={s.actions}>
          <span className={s.validInfo}>
            <span className={s.validCount}>{editorStats.valid}</span> valid
            {editorStats.total > editorStats.valid && (
              <> / <span className={s.invalidCount}>{editorStats.total - editorStats.valid}</span> invalid</>
            )}
            {editorStats.total > 0 && <> of {editorStats.total} total</>}
          </span>
        </div>

        <div className={s.actions}>
          <button className={s.btnPrimary} onClick={handleCleanUp}>Clean Up</button>
          <button className={s.btnSecondary} onClick={handleMerge} disabled={generated.length === 0 && randomEmails.length === 0}>
            Merge Generated Lists
          </button>
          <SepToggle value={editorSep} onChange={setEditorSep} />
          <button className={s.btnPrimary} onClick={handleEditorCopy} disabled={editorStats.valid === 0}>
            Copy Valid Emails
          </button>
          <button className={s.btnSecondary} onClick={() => {
            const emails = editorText.split(/[\n,;]+/).map(e => e.trim()).filter(e => EMAIL_REGEX.test(e))
            if (emails.length > 0) downloadCSV(emails, 'editor-emails.csv')
          }} disabled={editorStats.valid === 0}>
            Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}
