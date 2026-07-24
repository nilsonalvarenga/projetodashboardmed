import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

const TABLES: Record<string, string> = {
  medication: 'extracted_medications',
  supplement: 'extracted_supplements',
  conduct: 'extracted_conducts',
  protocol: 'extracted_protocols',
  chunk: 'document_chunks',
};

// Fila de revisão (pendentes)
export async function GET() {
  if (!hasSupabase())
    return NextResponse.json({ configured: false, medications: [], supplements: [], conducts: [], protocols: [] });
  const db = supabaseAdmin();
  const [meds, supps, conducts, protos] = await Promise.all([
    db.from('extracted_medications').select('*').eq('status', 'pendente').limit(50),
    db.from('extracted_supplements').select('*').eq('status', 'pendente').limit(50),
    db.from('extracted_conducts').select('*').eq('status', 'pendente').limit(50),
    db.from('extracted_protocols').select('*').eq('status', 'pendente').limit(50),
  ]);
  return NextResponse.json({
    medications: meds.data || [], supplements: supps.data || [],
    conducts: conducts.data || [], protocols: protos.data || [],
  });
}

// Aprovar/rejeitar/corrigir (com edição opcional via "patch"). Protocolo aprovado vira oficial.
export async function POST(req: NextRequest) {
  if (!hasSupabase()) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  try {
    const { entity_type, id, status, patch } = await req.json();
    const table = TABLES[entity_type];
    if (!table) return NextResponse.json({ error: 'entity_type inválido' }, { status: 400 });
    if (!['pendente', 'revisado', 'aprovado', 'rejeitado', 'precisa_corrigir'].includes(status))
      return NextResponse.json({ error: 'status inválido' }, { status: 400 });

    const upd: any = { status, ...(patch || {}) };
    if (['aprovado', 'rejeitado', 'revisado'].includes(status) && table !== 'document_chunks') {
      upd.revisado_em = new Date().toISOString();
    }
    if (entity_type === 'protocol' && status === 'aprovado') upd.oficial = true;

    const { error } = await supabaseAdmin().from(table).update(upd).eq('id', id);
    if (error) throw new Error(error.message);
    await supabaseAdmin().from('audit_logs').insert({ action: 'review:' + status, entity: entity_type, entity_id: id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
