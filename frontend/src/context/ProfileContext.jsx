import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getProfile } from '../api/user'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    return getProfile()
      .then((res) => { setProfile(res.data); return res.data })
      .catch(() => { setProfile(null); return null })
  }, [])

  useEffect(() => { refetch().finally(() => setLoading(false)) }, [refetch])

  return (
    <ProfileContext.Provider value={{ profile, setProfile, loading, refetch }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider')
  return ctx
}
