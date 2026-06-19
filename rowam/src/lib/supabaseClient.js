import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // This will show clearly in the browser console if .env is missing,
  // rather than failing silently.
  console.error(
    'Missing Supabase environment variables. Did you create a .env file from .env.example?'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
