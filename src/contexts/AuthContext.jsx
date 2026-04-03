import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, mapAuthUser } from '@/lib/supabase'
import { DEMO_USER } from '@/demo/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)        // undefined = loading
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (!supabase) {
      // Demo mode — no Supabase configured
      setUser(DEMO_USER)
      setUserProfile({ displayName: DEMO_USER.displayName, photoURL: null })
      return
    }

    // Hydrate from existing session (page reload)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const mapped = mapAuthUser(session.user)
        setUser(mapped)
        loadProfile(mapped)
      } else {
        setUser(null)
      }
    })

    // Real-time auth state changes (sign-in / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const mapped = mapAuthUser(session.user)
        setUser(mapped)
        loadProfile(mapped)
      } else {
        setUser(null)
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(authUser) {
    try {
      // Ensure row exists (first login creates it via DB trigger, but upsert is safe)
      await supabase.from('profiles').upsert({
        id: authUser.id,
        phone: authUser.phoneNumber,
        display_name: authUser.displayName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id', ignoreDuplicates: true })

      const { data } = await supabase
        .from('profiles')
        .select('display_name, photo_url, age, bio, city, activities, looking_for, coins, tier')
        .eq('id', authUser.id)
        .single()

      if (data) {
        setUserProfile({
          displayName: data.display_name ?? authUser.displayName,
          photoURL: data.photo_url ?? null,
          age: data.age ?? null,
          bio: data.bio ?? '',
          city: data.city ?? '',
          activities: data.activities ?? [],
          lookingFor: data.looking_for ?? '',
          coins: data.coins ?? 0,
          tier: data.tier ?? null,
        })
      }
    } catch {
      setUserProfile({
        displayName: authUser.displayName,
        photoURL: null,
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
