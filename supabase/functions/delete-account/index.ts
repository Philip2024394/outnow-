import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    // Verify the caller is authenticated and the userId matches their JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // Use service-role client so we can delete auth users
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify the JWT and get the calling user's ID
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: callerUser }, error: authError } = await userClient.auth.getUser()
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid auth token' }),
        { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = await req.json()

    // Security: only allow deleting your own account
    if (userId !== callerUser.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden — can only delete your own account' }),
        { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }

    // Delete auth user — cascades to profile via DB FK (ON DELETE CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[delete-account]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )
  }
})
