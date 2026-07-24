import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { retrieve, caseToQuery } from '@/lib/rag';
import { generate, parseJsonLoose } from '@/lib/ai';
import { CLINICAL_SYSTEM_PROMPT, buildClinicalUserPrompt } from '@/lib/prompts';
import { hasSupabase, hasEmbeddings, hasLLM } from '@/lib/env';
import { requireCapability } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 120;

// Chat clínico RAG: salva o caso → recupera trechos → gera resposta (12 seções) → cita/loga.
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  if (!hasSupabase() || !hasEmbeddings() || !hasLLM()) {
    return NextResponse.json(
      { error: 'Configure Supabase, OpenAI (embeddings) e o LLM em .env.local antes de usar o chat clínico.' },
      { status: 503 },
    );
  }
  const auth = await requireCapability('chat');
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const caso = body.caso || {};
    const db = supabaseAdmin();

    let caseId: string | undefined = body.case_id;
    if (!caseId) {
      const { data, error } = await db
        .from('clinical_cases')
        .insert({ ...caso, titulo: (caso.queixa_principal || 'Caso clínico').slice(0, 80), created_by: auth.user.id })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      caseId = data.id;
    }

    const query = caseToQuery(caso);
    const chunks = await retrieve(query, { categories: body.categories || undefined });

    const out = await generate(CLINICAL_SYSTEM_PROMPT, buildClinicalUserPrompt(caso, chunks), { json: true });
    const structured = parseJsonLoose(out.text);

    const { data: msg } = await db
      .from('clinical_chat_messages')
      .insert({
        case_id: caseId, role: 'assistant', content: out.text, structured,
        model: out.model, tokens_prompt: out.tokensPrompt, tokens_completion: out.tokensCompletion,
      })
      .select('id')
      .single();

    if (msg && chunks.length) {
      await db.from('citations').insert(
        chunks.map((k) => ({
          message_id: msg.id, chunk_id: k.chunk_id, document_id: k.document_id,
          trecho: k.content.slice(0, 240), pagina: k.pagina, score: k.similarity,
        })),
      );
      await db.from('rag_retrieval_logs').insert({
        message_id: msg.id, case_id: caseId, query,
        filtros: { categories: body.categories || null },
        retrieved: chunks.map((k) => ({ chunk_id: k.chunk_id, document_id: k.document_id, score: k.similarity, category: k.category })),
        model_embed: process.env.EMBEDDING_MODEL, match_count: chunks.length, latency_ms: Date.now() - t0,
      });
    }
    await db.from('audit_logs').insert({ action: 'chat', entity: 'case', entity_id: caseId, user_id: auth.user.id, meta: { model: out.model, chunks: chunks.length } });

    return NextResponse.json({ case_id: caseId, structured, sources: chunks, raw: structured ? undefined : out.text });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
