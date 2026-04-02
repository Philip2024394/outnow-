import { createContext, useContext, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import JoinSheet from '@/screens/onboarding/JoinSheet'

const GuestGateContext = createContext({ triggerGate: () => {} })

export function GuestGateProvider({ children }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const triggerGate = () => {
    if (!user) setOpen(true)
  }

  return (
    <GuestGateContext.Provider value={{ triggerGate }}>
      {children}
      <JoinSheet open={open} onClose={() => setOpen(false)} />
    </GuestGateContext.Provider>
  )
}

export const useGuestGate = () => useContext(GuestGateContext)
