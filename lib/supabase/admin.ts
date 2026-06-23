import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let adminClient: any = null

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured')
  }

  if (serviceRoleKey.startsWith('tu-')) {
    throw new Error('Supabase service role key is still using the placeholder value')
  }

  if (!adminClient) {
    adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClient
}
