import 'server-only'
import { createClient } from '@supabase/supabase-js'

// SERVICE ROLE — bypasses RLS entirely.
// Server-side only. NEVER import this in Client Components or browser code.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
)
