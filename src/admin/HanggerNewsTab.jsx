import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './HanggerNewsTab.module.css'

const SECTIONS = [
  { value: 'weekly',       label: 'Weekly Recap',   emoji: '📰', color: '#8DC63F' },
  { value: 'marketplace',  label: 'Marketplace',    emoji: '🛍️', color: '#F59E0B' },
  { value: 'street',       label: 'Street Food',    emoji: '🍜', color: '#EF4444' },
  { value: 'dating',       label: 'Dating',         emoji: '💚', color: '#F472B6' },
  { value: 'announcement', label: 'Announcement',   emoji: '📣', color: '#A78BFA' },
]

const BLANK = {
  section:     'weekly',
  emoji:       '📰',
  title:       '',
  body:        '',
  stat_label:  '',
  stat_value:  '',
  highlight:   '',
  is_active:   true,
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export default function HanggerNewsTab() {
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)   // null = list view, {} = form
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hangger_news')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPosts(data ?? [])
    } catch {
      showToast('Could not load news posts', 'error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!editing.title?.trim() || !editing.body?.trim()) {
      showToast('Title and body are required', 'error'); return
    }
    setSaving(true)
    try {
      const payload = {
        section:    editing.section,
        emoji:      editing.emoji || SECTIONS.find(s => s.value === editing.section)?.emoji,
        title:      editing.title.trim(),
        body:       editing.body.trim(),
        stat_label: editing.stat_label?.trim() || null,
        stat_value: editing.stat_value?.trim() || null,
        highlight:  editing.highlight?.trim() || null,
        is_active:  editing.is_active ?? true,
        updated_at: new Date().toISOString(),
      }
      if (editing.id) {
        const { error } = await supabase.from('hangger_news').update(payload).eq('id', editing.id)
        if (error) throw error
        showToast('Post updated')
      } else {
        const { error } = await supabase.from('hangger_news').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
        showToast('Post published')
      }
      setEditing(null)
      load()
    } catch {
      showToast('Save failed', 'error')
    }
    setSaving(false)
  }

  const handleToggle = async (post) => {
    try {
      await supabase.from('hangger_news').update({ is_active: !post.is_active, updated_at: new Date().toISOString() }).eq('id', post.id)
      load()
    } catch { showToast('Update failed', 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return
    try {
      await supabase.from('hangger_news').delete().eq('id', id)
      load()
      showToast('Post deleted')
    } catch { showToast('Delete failed', 'error') }
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  if (editing !== null) {
    const sec = SECTIONS.find(s => s.value === editing.section) ?? SECTIONS[0]
    return (
      <div className={styles.formWrap}>
        <div className={styles.formHeader}>
          <button className={styles.backBtn} onClick={() => setEditing(null)}>← Back</button>
          <h2 className={styles.formTitle}>{editing.id ? 'Edit Post' : 'New Post'}</h2>
        </div>

        <div className={styles.form}>
          {/* Section */}
          <label className={styles.label}>Section</label>
          <div className={styles.sectionRow}>
            {SECTIONS.map(s => (
              <button
                key={s.value}
                className={`${styles.sectionPill} ${editing.section === s.value ? styles.sectionPillActive : ''}`}
                style={{ '--sc': s.color }}
                onClick={() => setEditing(e => ({ ...e, section: s.value, emoji: s.emoji }))}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>

          {/* Emoji override */}
          <label className={styles.label}>Emoji <span className={styles.optional}>(optional override)</span></label>
          <input
            className={styles.input}
            value={editing.emoji ?? sec.emoji}
            onChange={e => setEditing(ed => ({ ...ed, emoji: e.target.value }))}
            maxLength={4}
            placeholder={sec.emoji}
          />

          {/* Title */}
          <label className={styles.label}>Title *</label>
          <input
            className={styles.input}
            value={editing.title ?? ''}
            onChange={e => setEditing(ed => ({ ...ed, title: e.target.value }))}
            placeholder={`e.g. Marketplace had its biggest week yet`}
            maxLength={120}
          />

          {/* Body */}
          <label className={styles.label}>Body *</label>
          <textarea
            className={styles.textarea}
            value={editing.body ?? ''}
            onChange={e => setEditing(ed => ({ ...ed, body: e.target.value }))}
            placeholder="Write the full news story here. Keep it punchy — 2-4 sentences works best."
            rows={5}
          />

          {/* Stat */}
          <label className={styles.label}>Stat <span className={styles.optional}>(optional — shows as a big number)</span></label>
          <div className={styles.twoInputRow}>
            <input
              className={styles.input}
              value={editing.stat_label ?? ''}
              onChange={e => setEditing(ed => ({ ...ed, stat_label: e.target.value }))}
              placeholder="Label  e.g. Orders this week"
            />
            <input
              className={styles.input}
              value={editing.stat_value ?? ''}
              onChange={e => setEditing(ed => ({ ...ed, stat_value: e.target.value }))}
              placeholder="Value  e.g. 342"
            />
          </div>

          {/* Highlight callout */}
          <label className={styles.label}>Highlight callout <span className={styles.optional}>(optional — links profile / product)</span></label>
          <input
            className={styles.input}
            value={editing.highlight ?? ''}
            onChange={e => setEditing(ed => ({ ...ed, highlight: e.target.value }))}
            placeholder="e.g. Top Seller this week: Budi Batik · 38 orders"
            maxLength={160}
          />

          {/* Active */}
          <label className={styles.label}>Visibility</label>
          <div className={styles.toggleRow}>
            <button
              className={`${styles.toggleBtn} ${editing.is_active ? styles.toggleOn : ''}`}
              onClick={() => setEditing(ed => ({ ...ed, is_active: !ed.is_active }))}
            >
              {editing.is_active ? '● Published' : '○ Draft'}
            </button>
            <span className={styles.toggleHint}>
              {editing.is_active ? 'Visible to all users now' : 'Hidden — save as draft'}
            </span>
          </div>

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editing.id ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </div>

        {toast && <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`}>{toast.msg}</div>}
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <div className={styles.listHeader}>
        <div>
          <h2 className={styles.listTitle}>Hangger News Posts</h2>
          <p className={styles.listSub}>Update every few days — users see all active posts in the app</p>
        </div>
        <button className={styles.newBtn} onClick={() => setEditing({ ...BLANK })}>
          + New Post
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : posts.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📰</span>
          <p>No posts yet. Create your first Hangger News post.</p>
          <button className={styles.newBtn} onClick={() => setEditing({ ...BLANK })}>Create Post</button>
        </div>
      ) : (
        <div className={styles.list}>
          {posts.map(post => {
            const sec = SECTIONS.find(s => s.value === post.section) ?? SECTIONS[0]
            const age = daysSince(post.updated_at ?? post.created_at)
            return (
              <div key={post.id} className={`${styles.postRow} ${!post.is_active ? styles.postRowDraft : ''}`} style={{ '--sc': sec.color }}>
                <div className={styles.postLeft}>
                  <span className={styles.postEmoji}>{post.emoji ?? sec.emoji}</span>
                  <div>
                    <div className={styles.postTitle}>{post.title}</div>
                    <div className={styles.postMeta}>
                      <span className={styles.sectionTag} style={{ color: sec.color }}>{sec.label}</span>
                      <span className={styles.postAge}>Updated {age}</span>
                      {!post.is_active && <span className={styles.draftTag}>Draft</span>}
                    </div>
                  </div>
                </div>
                <div className={styles.postActions}>
                  <button className={styles.toggleActive} onClick={() => handleToggle(post)}>
                    {post.is_active ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className={styles.editBtn} onClick={() => setEditing({ ...post })}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(post.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  )
}
