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

  try {
    const { data, error } = await supabase.rpc('is_admin')
    if (!error && typeof data === 'boolean') {
      if (data) return true
    }
  } catch (error) {
    console.error('is_admin RPC check error:', error)
  }

  // Fallback check for admin email or admin identifier
  const email = user.email?.toLowerCase() ?? ''
  return (
    email === 'admin@core64.pp.ua' ||
    email === 'core64records@gmail.com' ||
    email === 'anovyk@gmail.com' ||
    email.includes('admin') ||
    email.includes('core64') ||
    user.id.includes('admin')
  )
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: error as Error }
    }

    if (data.session && data.user) {
      const admin = await checkIsAdmin(data.user)
      if (!admin) {
        await supabase.auth.signOut()
        return { error: new Error('Access denied: User is not an administrator') }
      }
      setSession(data.session)
      setUser(data.user)
      setIsAdmin(true)
      setLoading(false)
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
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
