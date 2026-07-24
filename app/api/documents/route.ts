import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  if (!hasSupabase()) return NextResponse.json({ configured: false, documents: [] });
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const tipo = url.searchParams.get('tipo');
  const status = url.searchParams.get('status');
  try {
    let query = supabaseAdmin()
      .from('documents')
      .select('id,titulo,autor,curso_origem,modulo_aula,tipo,status,total_chunks,tema_principal,tags,created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (q) query = query.ilike('titulo', `%${q}%`);
    if (tipo) query = query.eq('tipo', tipo);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ configured: true, documents: data });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
