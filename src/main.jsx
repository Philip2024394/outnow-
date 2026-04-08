import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import 'leaflet/dist/leaflet.css'
import App from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { OverlayProvider } from '@/contexts/OverlayContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <OverlayProvider>
        <App />
      </OverlayProvider>
    </AuthProvider>
  </StrictMode>
)
