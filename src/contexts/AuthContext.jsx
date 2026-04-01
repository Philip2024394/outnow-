import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import { COLLECTIONS } from '@/firebase/collections'
import { DEMO_USER } from '@/demo/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    // Demo / no Firebase key → use fake user
    if (!auth) {
      setUser(DEMO_USER)
      setUserProfile({ displayName: DEMO_USER.displayName, photoURL: null })
      return
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profileData = {
          displayName: firebaseUser.displayName ?? firebaseUser.phoneNumber ?? 'User',
          photoURL: firebaseUser.photoURL ?? null,
          phoneNumber: firebaseUser.phoneNumber ?? null,
          lastSeen: serverTimestamp(),
        }
        if (db) {
          try {
            await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), profileData, { merge: true })
          } catch {}
        }
        setUserProfile(profileData)
        setUser(firebaseUser)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, userProfile, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
