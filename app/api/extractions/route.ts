import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

const TABLES: Record<string, { table: string; nameCol: string }> = {
  medication: { table: 'extracted_medications', nameCol: 'nome' },
  supplement: { table: 'extracted_supplements', nameCol: 'nome' },
  conduct:    { table: 'extracted_conducts', nameCol: 'problema_clinico' },
  protocol:   { table: 'extracted_protocols', nameCol: 'titulo' },
};

// Listagem de extrações estruturadas por tipo, com filtros de status e busca por nome.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') || 'medication';
  const status = url.searchParams.get('status'); // pendente|revisado|aprovado|rejeitado|precisa_corrigir
  const q = url.searchParams.get('q');
  const cfg = TABLES[kind];
  if (!cfg) return NextResponse.json({ error: 'kind inválido' }, { status: 400 });
  if (!hasSupabase()) return NextResponse.json({ configured: false, kind, items: [] });

  try {
    let query = supabaseAdmin()
      .from(cfg.table)
      .select('*, documents(titulo,autor,modulo_aula)')
      .order('created_at', { ascending: false })
      .limit(300);
    if (status) query = query.eq('status', status);
    if (q) query = query.ilike(cfg.nameCol, `%${q}%`);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ configured: true, kind, items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
