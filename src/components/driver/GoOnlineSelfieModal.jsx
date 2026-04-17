import { useState, useEffect, useRef } from 'react'
import { uploadGoOnlineSelfie } from '@/services/driverService'
import styles from './GoOnlineSelfieModal.module.css'

export default function GoOnlineSelfieModal({ userId, onSuccess, onCancel }) {
  const [phase,          setPhase]         = useState('capture') // capture | preview | uploading | error
  const [errorMsg,       setErrorMsg]      = useState('')
  const [capturedBlob,   setCapturedBlob]  = useState(null)
  const [capturedUrl,    setCapturedUrl]   = useState(null)
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, []) // eslint-disable-line

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setErrorMsg('Camera access denied. Please allow camera permission in your browser settings and try again.')
      setPhase('error')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  const capture = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const size = 480
    canvas.width  = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    // Un-mirror the capture (video is CSS-mirrored for natural selfie feel)
    ctx.save()
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, size, size)
    ctx.restore()
    canvas.toBlob(blob => {
      setCapturedBlob(blob)
      setCapturedUrl(canvas.toDataURL('image/jpeg', 0.88))
      setPhase('preview')
      stopCamera()
    }, 'image/jpeg', 0.88)
  }

  const retake = () => {
    setCapturedBlob(null)
    setCapturedUrl(null)
    setErrorMsg('')
    setPhase('capture')
    startCamera()
  }

  const confirm = async () => {
    if (!capturedBlob) return
    setPhase('uploading')
    try {
      const url = await uploadGoOnlineSelfie(userId, capturedBlob)
      onSuccess(url)
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed — please check your connection and try again.')
      setPhase('error')
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>🪪</span>
            <div>
              <p className={styles.headerTitle}>Identity Check</p>
              <p className={styles.headerSub}>Required every time you go online</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onCancel} aria-label="Cancel">✕</button>
        </div>

        {/* Viewfinder */}
        <div className={styles.viewfinderWrap}>
          <div className={styles.viewfinder}>
            {(phase === 'capture') && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.video}
              />
            )}
            {(phase === 'preview' || phase === 'uploading') && capturedUrl && (
              <img src={capturedUrl} alt="Selfie preview" className={styles.previewImg} />
            )}
            {phase === 'error' && (
              <div className={styles.errorFace}>
                <span>📷</span>
              </div>
            )}

            {/* Corner guides */}
            <div className={`${styles.corner} ${styles.cornerTL}`} />
            <div className={`${styles.corner} ${styles.cornerTR}`} />
            <div className={`${styles.corner} ${styles.cornerBL}`} />
            <div className={`${styles.corner} ${styles.cornerBR}`} />

            {/* Uploading overlay */}
            {phase === 'uploading' && (
              <div className={styles.uploadOverlay}>
                <span className={styles.spinner} />
                <span className={styles.uploadText}>Verifying…</span>
              </div>
            )}
          </div>

          {/* Face guide oval */}
          <div className={styles.faceOval} />
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className={styles.hiddenCanvas} />

        {/* Status text */}
        <div className={styles.statusArea}>
          {phase === 'capture' && (
            <p className={styles.instruction}>
              Position your face inside the oval. Ensure your face is clearly visible and well-lit.
            </p>
          )}
          {phase === 'preview' && (
            <p className={styles.instruction}>
              Make sure your face is clear and fully visible before going online.
            </p>
          )}
          {phase === 'error' && (
            <p className={styles.errorText}>{errorMsg}</p>
          )}
          {phase === 'uploading' && (
            <p className={styles.instruction}>Uploading your identity check…</p>
          )}
        </div>

        {/* Action buttons */}
        <div className={styles.actions}>
          {phase === 'capture' && (
            <>
              <button className={styles.captureBtn} onClick={capture}>
                <span className={styles.captureDot} />
                Take Selfie
              </button>
              <button className={styles.secondaryBtn} onClick={onCancel}>Cancel</button>
            </>
          )}
          {phase === 'preview' && (
            <>
              <button className={styles.confirmBtn} onClick={confirm}>Go Online</button>
              <button className={styles.secondaryBtn} onClick={retake}>↩ Retake</button>
            </>
          )}
          {phase === 'error' && (
            <>
              {errorMsg.includes('denied') ? null : (
                <button className={styles.confirmBtn} onClick={retake}>Try Again</button>
              )}
              <button className={styles.secondaryBtn} onClick={onCancel}>Cancel</button>
            </>
          )}
        </div>

        {/* Legal note */}
        <p className={styles.legalNote}>
          🔒 Securely stored by PT Hammerex Products Indonesia. By going online you confirm
          you are the registered driver for this Indoo account.
        </p>

      </div>
    </div>
  )
}
