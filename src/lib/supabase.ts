import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const MISSING_CONFIG_MESSAGE =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).'

function missingConfigError() {
  return new Error(MISSING_CONFIG_MESSAGE)
}

type FallbackResult = { data: null; error: Error; count: null }

function fallbackResult(): FallbackResult {
  return { data: null, error: missingConfigError(), count: null }
}

/**
 * Stand-in query builder used when Supabase credentials are missing. Every
 * terminal operation resolves with an error so callers surface the
 * misconfiguration instead of silently reporting success.
 */
function createFallbackBuilder() {
  const builder = {
    select: () => createFallbackBuilder(),
    insert: () => createFallbackBuilder(),
    update: () => createFallbackBuilder(),
    delete: () => createFallbackBuilder(),
    upsert: () => createFallbackBuilder(),
    eq: () => createFallbackBuilder(),
    order: () => createFallbackBuilder(),
    gte: () => createFallbackBuilder(),
    lt: () => createFallbackBuilder(),
    in: () => createFallbackBuilder(),
    maybeSingle: async () => fallbackResult(),
    single: async () => fallbackResult(),
    then: <TResult1 = FallbackResult>(
      onfulfilled?: ((value: FallbackResult) => TResult1 | PromiseLike<TResult1>) | null
    ) => Promise.resolve(fallbackResult()).then(onfulfilled),
    catch: (onrejected?: ((reason: unknown) => unknown) | null) =>
      Promise.resolve(fallbackResult()).catch(onrejected),
  }
  return builder
}

function createFallbackSupabaseClient() {
  return {
    from: () => createFallbackBuilder(),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: missingConfigError() }),
        remove: async () => ({ data: null, error: missingConfigError() }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: missingConfigError() }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: missingConfigError(),
      }),
      signOut: async () => ({ error: null }),
    },
    rpc: async () => fallbackResult(),
  } as unknown as SupabaseClient
}

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

if (!hasSupabaseConfig) {
  console.error(MISSING_CONFIG_MESSAGE)
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createFallbackSupabaseClient()
