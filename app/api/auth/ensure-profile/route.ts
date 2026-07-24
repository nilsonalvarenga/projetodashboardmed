import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

// Garante uma linha em `users` (perfil) para o usuário logado, sem sobrescrever
// dados existentes (role etc.). Chamado logo após o login.
export async function POST() {
  if (!hasSupabase()) return NextResponse.json({ ok: false, configured: false });
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  try {
    const nome = (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Usuário';
    await supabaseAdmin()
      .from('users')
      .upsert({ id: user.id, email: user.email, nome }, { onConflict: 'id', ignoreDuplicates: true });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
