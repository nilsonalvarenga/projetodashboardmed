import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

// Detalhe do documento: metadados + amostra de chunks + contagem de extrações.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!hasSupabase()) return NextResponse.json({ configured: false });
  try {
    const db = supabaseAdmin();
    const { data: doc, error } = await db.from('documents').select('*').eq('id', params.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    const { data: chunks } = await db
      .from('document_chunks')
      .select('id,chunk_index,content,category,category_conf,pagina,status')
      .eq('document_id', params.id)
      .order('chunk_index', { ascending: true })
      .limit(60);

    const tableFor = ['extracted_medications', 'extracted_supplements', 'extracted_conducts', 'extracted_protocols'];
    const counts = await Promise.all(
      tableFor.map((t) =>
        db.from(t).select('*', { count: 'exact', head: true }).eq('document_id', params.id).then((r: any) => r.count || 0),
      ),
    );

    return NextResponse.json({
      configured: true,
      document: doc,
      chunks: chunks || [],
      extractions: { medications: counts[0], supplements: counts[1], conducts: counts[2], protocols: counts[3] },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}

// Excluir documento (cascade remove chunks/extrações).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!hasSupabase()) return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
  try {
    const { error } = await supabaseAdmin().from('documents').delete().eq('id', params.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin().from('audit_logs').insert({ action: 'document:delete', entity: 'document', entity_id: params.id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
