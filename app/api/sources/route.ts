import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';
import { requireCapability } from '@/lib/auth';

export const runtime = 'nodejs';

// Fontes/origens (curso, professor) para normalizar a procedência dos documentos.
export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ configured: false, sources: [] });
  const { data, error } = await supabaseAdmin()
    .from('document_sources')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ configured: true, sources: data || [] });
}

export async function POST(req: NextRequest) {
  if (!hasSupabase()) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  const auth = await requireCapability('ingest');
  if (auth instanceof NextResponse) return auth;
  try {
    const { nome, autor, descricao } = await req.json();
    if (!nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 });
    const { data, error } = await supabaseAdmin()
      .from('document_sources')
      .insert({ nome, autor, descricao, created_by: auth.user.id })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
