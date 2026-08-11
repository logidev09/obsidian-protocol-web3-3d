import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True kalau env sudah diisi — kalau tidak, app jalan di preview mode (tanpa backend). */
export const isSupabaseConfigured = Boolean(url && key && !url.includes('YOUR-PROJECT-REF'))

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null
