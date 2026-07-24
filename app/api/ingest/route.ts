import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { ingestDocument } from '@/lib/ingest';
import { hasSupabase, hasEmbeddings } from '@/lib/env';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Upload + ingestão (multipart/form-data). Campo "file" + metadados.
export async function POST(req: NextRequest) {
  if (!hasSupabase() || !hasEmbeddings()) {
    return NextResponse.json(
      { error: 'Configure Supabase e OPENAI_API_KEY (embeddings) em .env.local antes de enviar documentos.' },
      { status: 503 },
    );
  }
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Arquivo ausente (campo "file").' }, { status: 400 });

    const s = (k: string) => (form.get(k) ? String(form.get(k)) : null);
    const meta: any = {
      titulo: s('titulo') || file.name,
      autor: s('autor'),
      curso_origem: s('curso_origem'),
      modulo_aula: s('modulo_aula'),
      tema_principal: s('tema_principal'),
      tipo: s('tipo') || 'outro',
      data_conteudo: s('data_conteudo'),
      tags: s('tags') ? String(s('tags')).split(',').map((x) => x.trim()).filter(Boolean) : [],
      observacoes: s('observacoes'),
      mime: file.type,
      tamanho_bytes: file.size,
      status: 'recebido',
    };

    const db = supabaseAdmin();
    const { data: doc, error } = await db.from('documents').insert(meta).select('id').single();
    if (error) throw new Error(error.message);

    const buf = Buffer.from(await file.arrayBuffer());
    const res = await ingestDocument(doc.id, buf, meta.tipo, file.name);
    await db.from('audit_logs').insert({ action: 'ingest', entity: 'document', entity_id: doc.id, meta: res });
    return NextResponse.json({ ok: true, document_id: doc.id, ...res });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
