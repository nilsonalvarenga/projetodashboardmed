// Cliente Supabase para o servidor (Server Components / Route Handlers / Middleware)
// baseado em cookies (sessão do usuário logado). Usa a ANON key + RLS.
// Para operações de backend que ignoram RLS, continue usando supabaseAdmin() (service_role).
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from './env';

/** Cliente ligado aos cookies da requisição (App Router). */
export function getSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component (não pode setar cookie) — ok,
          // o middleware cuida da renovação da sessão.
        }
      },
    },
  });
}
