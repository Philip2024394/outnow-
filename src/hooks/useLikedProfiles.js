import { useState, useCallback } from 'react'

const KEY = 'imoutnow_liked_profiles'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

function save(profiles) {
  try { localStorage.setItem(KEY, JSON.stringify(profiles)) } catch {}
}

export function useLikedProfiles() {
  const [likedProfiles, setLikedProfiles] = useState(() => load())

  const saveLike = useCallback((session) => {
    setLikedProfiles(prev => {
      if (prev.some(p => p.id === session.id)) return prev
      const entry = {
        id:          session.id,
        userId:      session.userId,
        displayName: session.displayName ?? 'Someone',
        age:         session.age ?? null,
        photoURL:    session.photoURL ?? null,
        activityType:session.activityType ?? null,
        area:        session.area ?? null,
        city:        session.city ?? null,
        bio:         session.bio ?? null,
        lookingFor:  session.lookingFor ?? null,
        isVerified:  session.isVerified ?? false,
        likedAt:     Date.now(),
      }
      const next = [entry, ...prev]
      save(next)
      return next
    })
  }, [])

  const removeLike = useCallback((sessionId) => {
    setLikedProfiles(prev => {
      const next = prev.filter(p => p.id !== sessionId)
      save(next)
      return next
    })
  }, [])

  const isLiked = useCallback((sessionId) => {
    return likedProfiles.some(p => p.id === sessionId)
  }, [likedProfiles])

  return { likedProfiles, saveLike, removeLike, isLiked }
}
