import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';
import { requireCapability } from '@/lib/auth';

export const runtime = 'nodejs';

// Lista casos clínicos.
export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ configured: false, cases: [] });
  try {
    const { data, error } = await supabaseAdmin()
      .from('clinical_cases')
      .select('id,titulo,idade,sexo,queixa_principal,objetivo_consulta,status,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ configured: true, cases: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// Cria/salva um caso clínico (sem rodar o chat). Útil para a tela /cases/new.
export async function POST(req: NextRequest) {
  if (!hasSupabase()) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const auth = await requireCapability('chat');
  if (auth instanceof NextResponse) return auth;
  try {
    const caso = await req.json();
    const row = { ...caso, titulo: (caso.titulo || caso.queixa_principal || 'Caso clínico').slice(0, 80), created_by: auth.user.id };
    const { data, error } = await supabaseAdmin().from('clinical_cases').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    await supabaseAdmin().from('audit_logs').insert({ action: 'case:create', entity: 'case', entity_id: data.id, user_id: auth.user.id });
    return NextResponse.json({ ok: true, case_id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
