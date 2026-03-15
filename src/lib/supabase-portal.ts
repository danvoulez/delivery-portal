import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ANON key + portalSessionToken — RLS applies via auth.jwt().
// Used by Client Components. The token is a Supabase-compatible JWT
// signed with the project JWT secret, scoped to one delivery session.
export function createPortalClient(portalSessionToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => portalSessionToken,
      realtime: {
        params: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      },
    },
  )
}
