// Clientes Supabase. O admin (service_role) roda só no servidor (API routes) e ignora RLS.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

let _admin: SupabaseClient | null = null;
/** Cliente de servidor com service_role — NUNCA importar em componentes client. */
export function supabaseAdmin(): SupabaseClient {
  if (!_admin) {
    _admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

/** Cliente público (anon) — leitura sujeita a RLS. */
export function supabaseAnon(): SupabaseClient {
  return createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
