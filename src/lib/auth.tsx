import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
})

async function checkIsAdmin(user: User | null | undefined): Promise<boolean> {
  if (!user) return false

  // The database is the single source of truth: is_admin() backs every RLS
  // policy, so anything other than an explicit `true` must deny access.
  try {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) {
      console.error('is_admin check failed:', error.message)
      return false
    }
    return data === true
  } catch (error) {
    console.error('is_admin check crashed:', error)
    return false
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const admin = await checkIsAdmin(session?.user)
      if (!mounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setIsAdmin(admin)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      ;(async () => {
        const admin = await checkIsAdmin(session?.user)
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        setIsAdmin(admin)
        setLoading(false)
      })()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
