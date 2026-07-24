// Ciclo 4: extração estruturada (medicações/suplementos/condutas/protocolos).
// Roda sobre os chunks já classificados; tudo nasce 'pendente' para revisão humana.
import { supabaseAdmin } from './supabaseServer';
import { generate, parseJsonLoose } from './ai';
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt } from './prompts';

const KIND_TABLE = {
  medicacao: 'extracted_medications',
  suplemento: 'extracted_supplements',
  conduta: 'extracted_conducts',
  protocolo: 'extracted_protocols',
} as const;
type Kind = keyof typeof KIND_TABLE;

export async function extractStructured(documentId: string) {
  const db = supabaseAdmin();
  const { data: chunks } = await db
    .from('document_chunks')
    .select('id,content,category')
    .eq('document_id', documentId)
    .in('category', Object.keys(KIND_TABLE))
    .limit(80);

  let total = 0;
  for (const ch of chunks || []) {
    const kind = ch.category as Kind;
    const r = await generate(EXTRACTION_SYSTEM_PROMPT, buildExtractionPrompt(kind, ch.content), { json: true });
    const parsed = parseJsonLoose<{ itens: any[] }>(r.text);
    for (const it of parsed?.itens || []) {
      const row = { ...it, document_id: documentId, chunk_id: ch.id, status: 'pendente' };
      const { error } = await db.from(KIND_TABLE[kind]).insert(row);
      if (!error) total++;
    }
  }
  await db.from('audit_logs').insert({ action: 'extract', entity: 'document', entity_id: documentId, meta: { total } });
  return { extraidos: total };
}
