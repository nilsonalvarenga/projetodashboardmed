// Helpers de autenticação e autorização para route handlers (Node runtime).
import { NextResponse } from 'next/server';
import { getSupabaseServer } from './supabaseServerClient';
import { supabaseAdmin } from './supabaseServer';
import { hasSupabase } from './env';
import { can, type Capability, type UserRole } from './roles';

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

/** Usuário + papel (lido de public.users; default 'medico' se ainda sem perfil). */
export async function getUserWithRole(): Promise<{ user: any | null; role: UserRole | null }> {
  const user = await getUser();
  if (!user) return { user: null, role: null };
  let role: UserRole = 'medico';
  try {
    const { data } = await supabaseAdmin().from('users').select('role').eq('id', user.id).single();
    if (data?.role) role = data.role as UserRole;
  } catch {
    // perfil ainda não criado — mantém default
  }
  return { user, role };
}

/**
 * Exige capacidade. Retorna { user, role } se ok, ou uma NextResponse (401/403)
 * para early-return na rota. Só faz sentido depois do guard de configuração.
 */
export async function requireCapability(
  cap: Capability,
): Promise<{ user: any; role: UserRole } | NextResponse> {
  const { user, role } = await getUserWithRole();
  if (!user || !role) return NextResponse.json({ error: 'Não autenticado. Faça login.' }, { status: 401 });
  if (!can(role, cap)) {
    return NextResponse.json(
      { error: `Sem permissão para esta ação (seu papel: ${role}).` },
      { status: 403 },
    );
  }
  return { user, role };
}
