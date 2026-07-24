// RAG: monta a query a partir do caso, busca por similaridade (match_chunks) e
// devolve os trechos numerados [n] para citação.
import { supabaseAdmin } from './supabaseServer';
import { embedOne } from './ai';
import { toVector } from './chunk';
import type { ClinicalCategory } from './categories';
import type { RetrievedChunk, ClinicalCaseInput } from './prompts';

const MATCH_COUNT = Number(process.env.RAG_MATCH_COUNT || 8);
const THRESHOLD = Number(process.env.RAG_SIMILARITY_THRESHOLD || 0.2);

/** Concatena os campos do caso numa consulta semântica enxuta. */
export function caseToQuery(c: ClinicalCaseInput): string {
  return [
    c.queixa_principal, c.historia_clinica, c.doencas_previas,
    c.objetivo_consulta, c.exames_lab, c.medicacoes_uso,
  ].filter(Boolean).join(' \n ').slice(0, 4000) || (c.queixa_principal ?? '');
}

export interface RetrieveOpts {
  categories?: ClinicalCategory[];
  sourceId?: string;
  matchCount?: number;
  threshold?: number;
  onlyApproved?: boolean;
}

export async function retrieve(query: string, opts: RetrieveOpts = {}): Promise<RetrievedChunk[]> {
  const embedding = await embedOne(query);
  const { data, error } = await supabaseAdmin().rpc('match_chunks', {
    query_embedding: toVector(embedding),
    match_count: opts.matchCount ?? MATCH_COUNT,
    similarity_threshold: opts.threshold ?? THRESHOLD,
    filter_categories: opts.categories ?? null,
    filter_source: opts.sourceId ?? null,
    only_approved: opts.onlyApproved ?? false,
  });
  if (error) throw new Error('RAG match_chunks: ' + error.message);
  return (data ?? []).map((r: any, i: number): RetrievedChunk => ({
    n: i + 1,
    chunk_id: r.chunk_id,
    document_id: r.document_id,
    titulo: r.titulo,
    autor: r.autor,
    pagina: r.pagina,
    category: r.category,
    content: r.content,
    similarity: r.similarity,
  }));
}
