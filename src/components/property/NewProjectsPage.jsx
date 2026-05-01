/**
 * NewProjectsPage — Full-screen page for browsing new developer projects.
 * Opened via toggle button on rental search.
 */
import { createPortal } from 'react-dom'
import NewProjectsSection from './NewProjectsSection'
import IndooFooter from '@/components/ui/IndooFooter'

const BG = 'https://ik.imagekit.io/nepgaxllc/ChatGPT%20Image%20Apr%2030,%202026,%2007_44_48%20PM.png'

export default function NewProjectsPage({ open, onClose }) {
  if (!open) return null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9400,
      background: `#0a0a0a url("${BG}") center/cover no-repeat`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '14px 16px 12px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>
          🏗️ <span style={{ color: '#FACC15' }}>New</span> Projects
        </h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontWeight: 600 }}>Pre-sale & under construction · Brochures · Floor plans</p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px' }}>
        <NewProjectsSection />
      </div>

      <IndooFooter label="New Projects" onBack={onClose} onHome={onClose} />
    </div>,
    document.body
  )
}
