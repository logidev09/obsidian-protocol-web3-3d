import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase opsional: kalau env belum diisi, situs tetap jalan penuh
 * dalam "preview mode" (sesi wallet disimpan di localStorage).
 */
export const hasSupabase = Boolean(url && key && !url.includes('YOUR-PROJECT-REF'))

export const supabase = hasSupabase
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null
