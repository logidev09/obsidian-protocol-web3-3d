import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase opsional by design.
 * Kalau env belum diisi, seluruh situs tetap berfungsi (preview mode) —
 * auth jatuh ke sesi lokal, waitlist disimpan di localStorage.
 */
export const isSupabaseReady = Boolean(url && key && !url.includes('YOUR-PROJECT-REF'))

export const supabase = isSupabaseReady
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null
