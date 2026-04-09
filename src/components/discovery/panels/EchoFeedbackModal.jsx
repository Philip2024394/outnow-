import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import styles from './EchoFeedbackModal.module.css'

const OPTIONS = [
  { value: 'yes',   emoji: '😊', label: 'Yes, definitely!', color: '#8DC63F' },
  { value: 'maybe', emoji: '🤔', label: 'Maybe, with time',  color: '#F5C518' },
  { value: 'no',    emoji: '👋', label: 'Not for me',        color: 'rgba(255,255,255,0.25)' },
]

export default function EchoFeedbackModal({ open, targetSession, chatId, onClose, showToast }) {
  const { user } = useAuth()
  const [choice,    setChoice]    = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result,    setResult]    = useState(null) // 'power_match' | 'no_change' | 'soft_block'

  if (!open) return null

  const handleSubmit = async () => {
    if (!choice) return
    setSubmitted(true)

    if (supabase && user?.id && targetSession?.userId) {
      // Save our answer
      await supabase.from('echo_feedback').upsert({
        chat_id:          chatId ?? `${user.id}_${targetSession.userId}`,
        user_id:          user.id,
        target_user_id:   targetSession.userId,
        would_introduce:  choice,
        created_at:       new Date().toISOString(),
      }, { onConflict: 'chat_id,user_id' })

      // Check if other user also answered
      const { data: theirAnswer } = await supabase
        .from('echo_feedback')
        .select('would_introduce')
        .eq('chat_id', chatId ?? `${user.id}_${targetSession.userId}`)
        .eq('user_id', targetSession.userId)
        .maybeSingle()

      if (theirAnswer) {
        const mine   = choice
        const theirs = theirAnswer.would_introduce
        if (mine === 'yes' && theirs === 'yes') {
          setResult('power_match')
          // Award Power Match badge to both users
          await Promise.all([
            supabase.from('profiles').update({ power_match_count: supabase.rpc('increment', { x: 1 }) }).eq('id', user.id),
            supabase.from('profiles').update({ power_match_count: supabase.rpc('increment', { x: 1 }) }).eq('id', targetSession.userId),
          ])
        } else if (mine === 'no' && theirs === 'no') {
          setResult('soft_block')
          // Soft-block both ways
          await supabase.from('soft_blocks').upsert([
            { user_a: user.id, user_b: targetSession.userId },
            { user_a: targetSession.userId, user_b: user.id },
          ])
        } else {
          setResult('no_change')
        }
      } else {
        setResult('pending')
      }
    } else {
      // Demo
      setResult(choice === 'yes' ? 'power_match' : choice === 'no' ? 'soft_block' : 'no_change')
    }
  }

  const RESULTS = {
    pending:     { emoji: '⏳', title: 'Waiting for their answer', text: "We'll let you know when they respond.", color: 'rgba(255,255,255,0.3)' },
    power_match: { emoji: '⚡', title: 'Power Match!', text: "You both said yes! A Power Match badge has been added to both your profiles.", color: '#F5C518' },
    no_change:   { emoji: '👌', title: 'Thanks for your feedback', text: "Your answer has been noted anonymously.", color: 'rgba(255,255,255,0.4)' },
    soft_block:  { emoji: '🙏', title: 'Noted', text: "You won't see each other again. No hard feelings.", color: 'rgba(255,255,255,0.3)' },
  }

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.iconWrap}>
          <span className={styles.icon}>🔄</span>
        </div>
        <h3 className={styles.heading}>Echo Check</h3>
        <p className={styles.question}>
          Would you meet{' '}
          <strong className={styles.name}>{targetSession?.displayName ?? 'them'}</strong>{' '}
          again?
        </p>

        {!submitted ? (
          <>
            <div className={styles.options}>
              {OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`${styles.optBtn} ${choice === opt.value ? styles.optBtnSelected : ''}`}
                  style={choice === opt.value ? { borderColor: opt.color, background: `${opt.color}18` } : {}}
                  onClick={() => setChoice(opt.value)}
                >
                  <span className={styles.optEmoji}>{opt.emoji}</span>
                  <span className={styles.optLabel}>{opt.label}</span>
                </button>
              ))}
            </div>
            <div className={styles.footer}>
              <button className={styles.skipBtn} onClick={onClose}>Skip</button>
              <button
                className={`${styles.submitBtn} ${!choice ? styles.submitBtnDisabled : ''}`}
                disabled={!choice}
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
            <p className={styles.disclaimer}>Your answer is anonymous — they never see what you picked.</p>
          </>
        ) : result ? (
          <div className={styles.resultWrap}>
            <span className={styles.resultEmoji}>{RESULTS[result]?.emoji}</span>
            <p className={styles.resultTitle} style={{ color: RESULTS[result]?.color }}>
              {RESULTS[result]?.title}
            </p>
            <p className={styles.resultText}>{RESULTS[result]?.text}</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
