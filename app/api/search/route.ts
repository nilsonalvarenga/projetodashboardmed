import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase, hasEmbeddings } from '@/lib/env';
import { retrieve } from '@/lib/rag';
import type { ClinicalCategory } from '@/lib/categories';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Busca combinada: similaridade semântica (pgvector) + palavra-chave (ILIKE/trigram).
export async function POST(req: NextRequest) {
  if (!hasSupabase()) return NextResponse.json({ configured: false, semantic: [], keyword: [] });
  try {
    const body = await req.json();
    const q: string = (body.q || '').trim();
    const mode: string = body.mode || 'both';
    const categories: ClinicalCategory[] | undefined = body.categories?.length ? body.categories : undefined;
    const limit = Math.min(Number(body.limit) || 12, 40);
    if (!q) return NextResponse.json({ configured: true, semantic: [], keyword: [] });

    const db = supabaseAdmin();

    // ---- Palavra-chave (não exige OpenAI) ----
    let keyword: any[] = [];
    if (mode === 'keyword' || mode === 'both') {
      let kq = db
        .from('document_chunks')
        .select('id,content,category,pagina,document_id,documents(titulo,autor,tipo)')
        .ilike('content', `%${q}%`)
        .neq('status', 'rejeitado')
        .limit(limit);
      if (categories) kq = kq.in('category', categories);
      const { data } = await kq;
      keyword = (data || []).map((r: any) => ({
        chunk_id: r.id, document_id: r.document_id, content: r.content,
        category: r.category, pagina: r.pagina,
        titulo: r.documents?.titulo, autor: r.documents?.autor, tipo: r.documents?.tipo,
      }));
    }

    // ---- Semântica (exige embeddings) ----
    let semantic: any[] = [];
    let semanticAvailable = hasEmbeddings();
    if ((mode === 'semantic' || mode === 'both') && semanticAvailable) {
      try {
        semantic = await retrieve(q, { categories, matchCount: limit });
      } catch {
        semanticAvailable = false;
      }
    }

    return NextResponse.json({ configured: true, semanticAvailable, semantic, keyword });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
