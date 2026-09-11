import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Loader2 } from 'lucide-react'

const AuthContext = createContext({})

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  const refreshProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!data) {
      const { data: sessionData } = await supabase.auth.getUser()
      const email = sessionData?.user?.email
      await supabase.from('profiles').upsert({
        id: userId,
        email,
        display_name: email?.split('@')[0] || 'user',
      })
      const { data: created } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      setProfile(created)
      return created
    }

    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        refreshProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'SIGNED_OUT') setIsRecovery(false)
      setUser(session?.user ?? null)
      if (session?.user) {
        refreshProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [refreshProfile])

  const value = {
    user,
    profile,
    loading,
    isRecovery,
    refreshProfile,
    setIsRecovery,
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
