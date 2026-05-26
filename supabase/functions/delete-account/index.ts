import { createClient } from 'jsr:@supabase/supabase-js@^2.46.0';

const ALLOWED_ORIGINS = [
  'https://moodtrip.app',
  'https://moodtripv2.vercel.app',
  'http://localhost:5173',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : '';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '86400',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ code: 'METHOD_NOT_ALLOWED' }), {
      status: 405,
      headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
    });
  }

  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ code: 'UNAUTHENTICATED' }), {
      status: 401,
      headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
    });
  }
  const userJwt = auth.slice('Bearer '.length).trim();

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ code: 'SERVER_MISCONFIGURED' }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
    });
  }

  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { authorization: `Bearer ${userJwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ code: 'UNAUTHENTICATED' }), {
      status: 401,
      headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
    });
  }
  const userId = userData.user.id;

  const admin = createClient(supabaseUrl, serviceRoleKey);

  await admin
    .from('audit_log')
    .insert({ actor_id: userId, action: 'account_deletion_requested', resource_type: 'user', resource_id: userId });

  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    return new Response(JSON.stringify({ code: 'DELETE_FAILED', error: deleteErr.message }), {
      status: 500,
      headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, userId }), {
    status: 200,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
  });
});
