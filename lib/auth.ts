// Helpers de autenticação para route handlers.
import { getSupabaseServer } from './supabaseServerClient';
import { hasSupabase } from './env';

/** Usuário autenticado (ou null). Em modo demo (sem Supabase) retorna null. */
export async function getUser() {
  if (!hasSupabase()) return null;
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
