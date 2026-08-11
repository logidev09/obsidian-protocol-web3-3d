import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True kalau env sudah diisi dengan kredensial nyata. */
export const supabaseReady = Boolean(
  url && key && !url.includes('YOUR-PROJECT-REF') && !key.includes('YOUR-')
)

export const supabase = supabaseReady
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null
