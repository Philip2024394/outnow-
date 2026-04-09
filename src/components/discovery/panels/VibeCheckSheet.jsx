import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './VibeCheckSheet.module.css'

const QUESTIONS = [
  {
    id: 'q1',
    text: 'Ideal hangout spot?',
    a: { emoji: '🍜', label: 'Street warung' },
    b: { emoji: '🍽️', label: 'Nice restaurant' },
  },
  {
    id: 'q2',
    text: 'What time are you?',
    a: { emoji: '🌅', label: 'Early bird' },
    b: { emoji: '🌙', label: 'Night owl' },
  },
  {
    id: 'q3',
    text: 'Vibe preference?',
    a: { emoji: '🧠', label: 'Deep talk' },
    b: { emoji: '😂', label: 'Pure banter' },
  },
]

export default function VibeCheckSheet({ open, targetSession, onClose, showToast }) {
  const { user } = useAuth()
  const [answers, setAnswers]   = useState({}) // { q1: 'a', q2: 'b', ... }
  const [submitted, setSubmitted] = useState(false)
  const [matched,   setMatched]   = useState(null) // null | number (0-3)
  const [recording, setRecording] = useState(false)
  const [recDone,   setRecDone]   = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  if (!open) return null

  const allAnswered = QUESTIONS.every(q => answers[q.id])

  const handleSubmit = async () => {
    if (!allAnswered) return
    setSubmitted(true)

    // Save our answers to Supabase (anonymous — other user sees results, not who sent them)
    if (supabase && user?.id && targetSession?.userId) {
      await supabase.from('vibe_checks').upsert({
        from_user: user.id,
        to_user:   targetSession.userId,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        created_at: new Date().toISOString(),
      }, { onConflict: 'from_user,to_user' })

      // Check if they also answered (for match calculation)
      const { data } = await supabase
        .from('vibe_checks')
        .select('q1,q2,q3')
        .eq('from_user', targetSession.userId)
        .eq('to_user', user.id)
        .maybeSingle()

      if (data) {
        const matchCount = QUESTIONS.filter(q => answers[q.id] === data[q.id]).length
        setMatched(matchCount)
      } else {
        // They haven't answered yet — show pending
        setMatched(-1)
      }
    } else {
      // Demo: random result
      setMatched(Math.random() > 0.4 ? 2 : 1)
    }
  }

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices) { showToast?.('Microphone not supported', 'error'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        // Upload to Supabase Storage
        if (supabase && user?.id) {
          const path = `voice-intros/${user.id}.webm`
          await supabase.storage.from('user-media').upload(path, blob, { upsert: true })
          const { data: urlData } = supabase.storage.from('user-media').getPublicUrl(path)
          await supabase.from('profiles').update({ voice_intro_url: urlData.publicUrl }).eq('id', user.id)
        }
        setRecDone(true)
        showToast?.('🎤 Voice note saved!', 'success')
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      // Auto-stop after 60s
      setTimeout(() => { if (mr.state === 'recording') mr.stop() }, 60000)
    } catch {
      showToast?.('Could not access microphone', 'error')
    }
  }

  const handleStopRecording = () => {
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
    setRecording(false)
  }

  const matchUnlocked = matched !== null && matched !== -1 && matched >= 2

  return (
    <div className={styles.overlay}>
      <div className={styles.sheet}>
        <div className={styles.header}>
          <span className={styles.title}>🎭 Vibe Check</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p className={styles.sub}>
          Answer anonymously — if you match 2/3 you both unlock a voice note
        </p>

        {!submitted ? (
          <>
            {QUESTIONS.map(q => (
              <div key={q.id} className={styles.question}>
                <p className={styles.qText}>{q.text}</p>
                <div className={styles.options}>
                  <button
                    className={`${styles.optBtn} ${answers[q.id] === 'a' ? styles.optSelected : ''}`}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: 'a' }))}
                  >
                    <span className={styles.optEmoji}>{q.a.emoji}</span>
                    <span className={styles.optLabel}>{q.a.label}</span>
                  </button>
                  <button
                    className={`${styles.optBtn} ${answers[q.id] === 'b' ? styles.optSelected : ''}`}
                    onClick={() => setAnswers(prev => ({ ...prev, [q.id]: 'b' }))}
                  >
                    <span className={styles.optEmoji}>{q.b.emoji}</span>
                    <span className={styles.optLabel}>{q.b.label}</span>
                  </button>
                </div>
              </div>
            ))}

            <button
              className={`${styles.submitBtn} ${!allAnswered ? styles.submitBtnDisabled : ''}`}
              disabled={!allAnswered}
              onClick={handleSubmit}
            >
              Send Vibe Check
            </button>
          </>
        ) : matched === -1 ? (
          <div className={styles.pendingWrap}>
            <span className={styles.pendingEmoji}>⏳</span>
            <p className={styles.pendingText}>
              Vibe check sent! If {targetSession?.displayName ?? 'they'} answers, you'll both see if you match.
            </p>
          </div>
        ) : matchUnlocked ? (
          <div className={styles.matchWrap}>
            <div className={styles.matchBadge}>
              <span className={styles.matchEmoji}>🔥</span>
              <span className={styles.matchScore}>{matched}/3 matched!</span>
            </div>
            <p className={styles.matchText}>
              You both vibe the same. Record a 60-second voice note — no text, just your voice.
            </p>
            {!recDone ? (
              <button
                className={`${styles.recBtn} ${recording ? styles.recBtnActive : ''}`}
                onClick={recording ? handleStopRecording : handleStartRecording}
              >
                {recording ? '⏹ Stop Recording' : '🎙 Record Voice Note'}
              </button>
            ) : (
              <div className={styles.recDone}>
                ✅ Voice note saved — they can play it on your profile
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noMatchWrap}>
            <span className={styles.noMatchEmoji}>🤔</span>
            <p className={styles.noMatchText}>
              {matched}/3 matched. Not enough overlap this time — but you can still connect!
            </p>
            <button className={styles.tryAgainBtn} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

