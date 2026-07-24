'use client';
import { createBrowserClient } from '@supabase/ssr';

// Cliente do navegador baseado em cookies (@supabase/ssr) — a sessão fica em
// cookies para ser lida pelo servidor (middleware + route handlers). Use este
// para login/logout e chamadas autenticadas no client.
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
