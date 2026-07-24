// Pipeline de ingestão: extrair → limpar → chunk → embed → classificar → salvar.
import { supabaseAdmin } from './supabaseServer';
import { extractText } from './extract';
import { chunkText, cleanText, toVector } from './chunk';
import { classifyHeuristic } from './classify';
import { embed } from './ai';
import type { ContentType } from './types';

export async function ingestDocument(documentId: string, buf: Buffer, type: ContentType, filename: string) {
  const db = supabaseAdmin();
  await db.from('documents').update({ status: 'processando' }).eq('id', documentId);
  try {
    const text = cleanText(await extractText(buf, type, filename));
    if (text.length < 20) throw new Error('Texto vazio ou muito curto após extração.');

    const chunks = chunkText(text);
    const rows: any[] = [];
    // embeddings em lotes de 64
    for (let i = 0; i < chunks.length; i += 64) {
      const batch = chunks.slice(i, i + 64);
      const vecs = await embed(batch.map((c) => c.content));
      batch.forEach((c, j) => {
        const cl = classifyHeuristic(c.content);
        rows.push({
          document_id: documentId,
          chunk_index: c.index,
          content: c.content,
          token_count: Math.round(c.content.length / 4),
          category: cl.category,
          category_conf: cl.confidence,
          embedding: toVector(vecs[j]),
          status: 'pendente',
        });
      });
    }
    // grava em lotes de 200
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await db.from('document_chunks').insert(rows.slice(i, i + 200));
      if (error) throw new Error('insert chunks: ' + error.message);
    }
    await db.from('documents').update({ status: 'indexado', total_chunks: rows.length, erro_msg: null }).eq('id', documentId);
    return { chunks: rows.length };
  } catch (e: any) {
    await db.from('documents').update({ status: 'erro', erro_msg: String(e.message || e) }).eq('id', documentId);
    throw e;
  }
}
